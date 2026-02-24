import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY || "http://localhost:18789";
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

    const config = {
      sender,
      subject,
      body_text: body_text || "",
      body_html: body_html || `<p>${(body_text || "").replace(/\n/g, "</p><p>")}</p>`,
      recipients,
      delay_seconds: 2,
      dry_run: dry_run || false,
    };

    // Write config to a temp file on the server via the task
    const configB64 = Buffer.from(JSON.stringify(config)).toString("base64");
    const subjectSafe = subject.replace(/['"\\]/g, "");

    const task = `Send emails using the emailer script. Run these commands in order:

1. Refresh tokens:
bash /home/ubuntu/openclaw/scripts/refresh_all_google_tokens.sh

2. Write config and run emailer:
echo '${configB64}' | base64 -d > /tmp/emailer_config.json
python3 /home/ubuntu/openclaw/skills/emailer/send_emails.py --config /tmp/emailer_config.json > /tmp/emailer_output.json 2>&1
cat /tmp/emailer_output.json

3. Save results to Firestore with full recipient data:
cd /home/ubuntu/command-center && node scripts/save-emailer-results.js "${sender}" "${subjectSafe}" "${dry_run || false}" /tmp/emailer_output.json

4. Clean up:
rm -f /tmp/emailer_config.json /tmp/emailer_output.json

Show the output from step 2 so the user can see send results.`;

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
