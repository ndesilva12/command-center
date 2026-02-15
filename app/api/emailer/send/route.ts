import { NextRequest } from "next/server";
import { spawn, execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sender, subject, body_text, body_html, recipients, dry_run } = body;

    if (!sender || !subject || !recipients?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Refresh tokens
    try {
      execSync("bash /home/ubuntu/openclaw/scripts/refresh_all_google_tokens.sh", {
        timeout: 30000,
        stdio: "pipe",
      });
    } catch (e) {
      console.error("Token refresh warning:", e);
    }

    // Write config
    const configPath = join(tmpdir(), `emailer-${randomUUID()}.json`);
    const config = {
      sender,
      subject,
      body_text: body_text || "",
      body_html: body_html || `<p>${(body_text || "").replace(/\n/g, "</p><p>")}</p>`,
      recipients,
      delay_seconds: 2,
      dry_run: dry_run || false,
    };
    writeFileSync(configPath, JSON.stringify(config));

    // Stream SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const proc = spawn("python3", [
          "/home/ubuntu/openclaw/skills/emailer/send_emails.py",
          "--config",
          configPath,
        ]);

        let buffer = "";

        proc.stdout.on("data", (data: Buffer) => {
          buffer += data.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.trim()) {
              controller.enqueue(encoder.encode(`data: ${line}\n\n`));
            }
          }
        });

        proc.stderr.on("data", (data: Buffer) => {
          console.error("emailer stderr:", data.toString());
        });

        proc.on("close", async (code) => {
          // Flush remaining buffer
          if (buffer.trim()) {
            controller.enqueue(encoder.encode(`data: ${buffer}\n\n`));
          }

          // Save to Firestore
          try {
            const admin = await import("firebase-admin");
            if (!admin.apps.length) {
              const serviceAccount = JSON.parse(
                require("fs").readFileSync("/home/ubuntu/.config/firebase/service-account.json", "utf8")
              );
              admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            }
            const db = admin.firestore();
            await db.collection("emailer_history").add({
              sender,
              subject,
              recipientCount: recipients.length,
              dryRun: dry_run || false,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: new Date().toISOString(),
            });
          } catch (err) {
            console.error("Failed to save emailer history:", err);
          }

          // Cleanup
          try { unlinkSync(configPath); } catch {}

          controller.enqueue(encoder.encode(`data: {"done": true, "exitCode": ${code}}\n\n`));
          controller.close();
        });

        proc.on("error", (err) => {
          controller.enqueue(
            encoder.encode(`data: {"error": "${err.message}"}\n\n`)
          );
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
