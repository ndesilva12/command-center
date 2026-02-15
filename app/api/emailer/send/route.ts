import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENCLAW_GATEWAY = "http://3.141.47.151:18789";
const OPENCLAW_TOKEN = "fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57";

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

    // Build the config JSON for the Python script
    const config = {
      sender,
      subject,
      body_text: body_text || "",
      body_html: body_html || `<p>${(body_text || "").replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br>")}</p>`,
      recipients,
      delay_seconds: 2,
      dry_run: dry_run || false,
    };

    // Escape the JSON for shell
    const configJson = JSON.stringify(config).replace(/'/g, "'\\''");

    // Spawn via OpenClaw gateway — runs on the server where Python + tokens exist
    const task = `Run the emailer script. Steps:

1. Refresh Google OAuth tokens:
exec: bash /home/ubuntu/openclaw/scripts/refresh_all_google_tokens.sh

2. Write config to temp file and run the emailer:
exec: echo '${configJson}' > /tmp/emailer_config.json && python3 /home/ubuntu/openclaw/skills/emailer/send_emails.py --config /tmp/emailer_config.json

3. Save results to Firestore:
exec: cd /home/ubuntu/command-center && node scripts/save-to-firestore.js emailer_history '{"sender":"${sender}","subject":"${subject.replace(/'/g, "\\'")}","recipientCount":${recipients.length},"dryRun":${dry_run || false},"timestamp":"${new Date().toISOString()}"}'

4. Clean up:
exec: rm -f /tmp/emailer_config.json

Report the output from step 2 — show which emails were sent and which failed.`;

    const response = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tool: "sessions_spawn",
        args: {
          task,
          label: `emailer-${Date.now()}`,
          cleanup: "keep",
          runTimeoutSeconds: 120,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const spawnResult = data?.result?.details || data?.result;

    if (spawnResult?.status === "accepted") {
      return new Response(
        JSON.stringify({
          success: true,
          runId: spawnResult.runId,
          message: `Sending ${recipients.length} emails via ${sender}. Check history for results.`,
          recipientCount: recipients.length,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Failed to start email send", details: data }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
