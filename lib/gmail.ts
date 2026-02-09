// Gmail API utilities

export interface EmailPreview {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  hasAttachments?: boolean;
}

export interface FullEmail extends EmailPreview {
  to: string[];
  cc?: string[];
  body: string;
  htmlBody?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyToMessageId?: string;
  threadId?: string;
}

// Get email list from Gmail API
export async function getRecentEmails(
  accessToken: string,
  maxResults: number = 50,
  query?: string
): Promise<EmailPreview[]> {
  const baseQuery = query || "in:inbox";
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    q: baseQuery,
  });

  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store'
    }
  );

  if (!listResponse.ok) {
    throw new Error(`Failed to fetch emails: ${listResponse.statusText}`);
  }

  const listData = await listResponse.json();
  const messages = listData.messages || [];

  if (messages.length === 0) return [];

  // Fetch details for each message
  const emailPromises = messages.map(async (msg: { id: string }) => {
    const detailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store'
      }
    );

    if (!detailResponse.ok) return null;

    const detail = await detailResponse.json();
    const headers = detail.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    return {
      id: detail.id,
      threadId: detail.threadId,
      subject: getHeader("Subject") || "(No subject)",
      from: getHeader("From"),
      snippet: detail.snippet,
      date: detail.internalDate,
      isUnread: detail.labelIds?.includes("UNREAD") || false,
      hasAttachments: detail.payload?.parts?.some((part: any) => part.filename) || false,
    };
  });

  const emails = await Promise.all(emailPromises);
  return emails.filter((e): e is EmailPreview => e !== null);
}

// Get full email content
export async function getFullEmail(accessToken: string, messageId: string): Promise<FullEmail> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch email: ${response.statusText}`);
  }

  const data = await response.json();
  const headers = data.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  // Parse body
  let body = "";
  let htmlBody = "";
  const attachments: EmailAttachment[] = [];

  function extractBody(part: any) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      body = Buffer.from(part.body.data, "base64").toString("utf-8");
    } else if (part.mimeType === "text/html" && part.body?.data) {
      htmlBody = Buffer.from(part.body.data, "base64").toString("utf-8");
    } else if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size,
        attachmentId: part.body.attachmentId,
      });
    }

    if (part.parts) {
      part.parts.forEach(extractBody);
    }
  }

  extractBody(data.payload);

  return {
    id: data.id,
    threadId: data.threadId,
    subject: getHeader("Subject") || "(No subject)",
    from: getHeader("From"),
    to: getHeader("To").split(",").map((t: string) => t.trim()),
    cc: getHeader("Cc") ? getHeader("Cc").split(",").map((c: string) => c.trim()) : undefined,
    snippet: data.snippet,
    date: data.internalDate,
    isUnread: data.labelIds?.includes("UNREAD") || false,
    body: body || htmlBody.replace(/<[^>]*>/g, ""), // Fallback: strip HTML if no plain text
    htmlBody: htmlBody || undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}

// Send email
export async function sendEmail(
  accessToken: string,
  params: SendEmailParams,
  fromEmail: string
): Promise<{ id: string; threadId: string }> {
  const { to, subject, body, cc, bcc, replyToMessageId, threadId } = params;

  // Build email message
  const messageParts = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    cc && `Cc: ${cc}`,
    bcc && `Bcc: ${bcc}`,
    `Subject: ${subject}`,
    replyToMessageId && `In-Reply-To: ${replyToMessageId}`,
    replyToMessageId && `References: ${replyToMessageId}`,
    "",
    body,
  ].filter(Boolean);

  const rawMessage = messageParts.join("\r\n");
  const encodedMessage = Buffer.from(rawMessage).toString("base64url");

  const requestBody: any = { raw: encodedMessage };
  if (threadId) requestBody.threadId = threadId;

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }

  return response.json();
}

// Email actions
export async function markEmailAsRead(accessToken: string, messageId: string): Promise<void> {
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
}

export async function markEmailAsUnread(accessToken: string, messageId: string): Promise<void> {
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ addLabelIds: ["UNREAD"] }),
  });
}

export async function archiveEmail(accessToken: string, messageId: string): Promise<void> {
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ removeLabelIds: ["INBOX"] }),
  });
}

export async function trashEmail(accessToken: string, messageId: string): Promise<void> {
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function starEmail(accessToken: string, messageId: string, star: boolean): Promise<void> {
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      [star ? "addLabelIds" : "removeLabelIds"]: ["STARRED"],
    }),
  });
}
