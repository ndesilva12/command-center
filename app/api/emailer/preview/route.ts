import { NextRequest, NextResponse } from "next/server";

const SIGNATURE_HTML = `<div dir="ltr"><div dir="ltr"><p style="margin-top:0px;margin-bottom:0px"><span style="font-family:Aptos,Aptos_EmbeddedFont,Aptos_MSFontService,Calibri,Helvetica,sans-serif;font-size:12pt;color:black">Best,</span></p><p style="margin:0in"><span style="font-family:Aptos,Aptos_EmbeddedFont,Aptos_MSFontService,Calibri,Helvetica,sans-serif;font-size:12pt;color:black">Norm</span></p></div><div dir="ltr"><div><p style="font-size:small;margin-top:0px;margin-bottom:0px"><br></p><p style="font-size:medium;color:rgb(0,0,0);font-family:&quot;Segoe UI Web (West European)&quot;,&quot;Segoe UI&quot;,-apple-system,BlinkMacSystemFont,Roboto,&quot;Helvetica Neue&quot;,sans-serif;margin:0in 0px"><b style="color:rgb(36,36,36);font-family:Aptos,Aptos_EmbeddedFont,Aptos_MSFontService,Calibri,Helvetica,sans-serif;font-size:12pt;font-style:inherit">Norman C. deSilva</b></p><p style="font-size:medium;color:rgb(0,0,0);font-family:&quot;Segoe UI Web (West European)&quot;,&quot;Segoe UI&quot;,-apple-system,BlinkMacSystemFont,Roboto,&quot;Helvetica Neue&quot;,sans-serif;margin:0in 0px"><span style="font-size:16px;font-family:Aptos,Aptos_EmbeddedFont,Aptos_MSFontService,Calibri,Helvetica,sans-serif;color:rgb(36,36,36)">508.493.2857</span></p><p style="color:rgb(0,0,0);font-family:&quot;Segoe UI Web (West European)&quot;,&quot;Segoe UI&quot;,-apple-system,BlinkMacSystemFont,Roboto,&quot;Helvetica Neue&quot;,sans-serif;margin:0in 0px"><span style="color:rgb(81,167,249)"><a href="https://www.linkedin.com/in/normandesilva/" target="_blank">linkedin</a></span> | <a href="https://linktr.ee/normancdesilva" target="_blank">about me</a></p></div></div></div>`;

function personalize(text: string, recipient: { name: string; email: string }): string {
  const firstName = recipient.name ? recipient.name.split(" ")[0] : "";
  return text
    .replace(/\[first name\]/gi, firstName)
    .replace(/\[first_name\]/gi, firstName)
    .replace(/\[name\]/gi, recipient.name || "")
    .replace(/\[Name\]/g, recipient.name || "");
}

export async function POST(request: NextRequest) {
  try {
    const { subject, body_html, recipients } = await request.json();
    const recipient = recipients?.[0] || { name: "John Smith", email: "john@example.com" };

    const personalizedSubject = personalize(subject || "", recipient);
    const personalizedBody = personalize(body_html || "", recipient);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${personalizedSubject}</title></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">${personalizedBody}<br>${SIGNATURE_HTML}</body></html>`;

    return NextResponse.json({ html, subject: personalizedSubject });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
