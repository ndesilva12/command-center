import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes for analysis

export async function POST(request: NextRequest) {
  try {
    const { projectId, projectName, keywords, description, dateFrom } = await request.json();

    if (!projectId || !projectName) {
      return NextResponse.json(
        { error: "Missing projectId or projectName" },
        { status: 400 }
      );
    }

    // Call Jimmy (isolated session) to analyze Gmail/Calendar
    const response = await fetch(`${process.env.GATEWAY_URL || 'http://localhost:3939'}/api/sessions/spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GATEWAY_TOKEN || ''}`
      },
      body: JSON.stringify({
        agentId: 'main',
        label: `rel-discover-${projectId}`,
        task: `RELATIONSHIP INTELLIGENCE DISCOVERY

Project: ${projectName}
Project ID: ${projectId}
Keywords: ${keywords?.join(', ') || 'none specified'}
Description: ${description || 'none'}
Date Range: ${dateFrom ? `from ${dateFrom}` : 'all time'}

YOUR TASK:
1. Analyze Norman's Gmail and Google Calendar for all communications related to this project
2. Use keywords/description to identify relevant emails and calendar events
3. Extract all unique contacts (people) involved in this project
4. For EACH contact, provide:
   - Name (extracted from emails)
   - Email address
   - Organization/company (parsed from signatures or context)
   - Title/role (if identifiable)
   - All email thread IDs with this person
   - All calendar event IDs with this person
   - Last interaction date
   - First interaction date
   - Total interaction count
   - Follow-up status (did Norman respond to their last message? needs follow-up?)
   - Urgency score (1-10: recent unanswered = high, old/completed = low)
   - Relationship notes (brief synthesis of what this relationship is about)

5. Return results as JSON:
{
  "projectId": "${projectId}",
  "contacts": [
    {
      "email": "string",
      "name": "string",
      "company": "string",
      "title": "string",
      "emailThreads": [
        {
          "threadId": "string",
          "subject": "string",
          "snippet": "string",
          "date": "ISO date",
          "gmailLink": "https://mail.google.com/mail/u/0/#all/THREAD_ID"
        }
      ],
      "calendarEvents": [
        {
          "eventId": "string",
          "summary": "string",
          "start": "ISO date",
          "calendarLink": "https://calendar.google.com/calendar/event?eid=EVENT_ID"
        }
      ],
      "lastContact": "ISO date",
      "firstContact": "ISO date",
      "interactionCount": number,
      "needsFollowUp": boolean,
      "urgencyScore": number (1-10),
      "notes": "string"
    }
  ],
  "summary": {
    "totalContacts": number,
    "needsFollowUp": number,
    "avgUrgency": number
  }
}

IMPORTANT:
- Refresh Google tokens first: bash /home/ubuntu/openclaw/scripts/refresh_all_google_tokens.sh
- Use Gmail API to search emails
- Use Calendar API to search events
- Be thorough - this is Norman's relationship intelligence tool
- Include DIRECT LINKS to Gmail threads and Calendar events
- Prioritize contacts by urgency/recency

Save results to: /home/ubuntu/.openclaw/workspace/relationships/${projectId}.json

Then reply with ONLY the JSON (no markdown, no explanation).`,
        runTimeoutSeconds: 300,
        cleanup: 'delete'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Failed to start discovery: ${error}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      sessionKey: data.sessionKey,
      message: "Discovery started - results will be available shortly"
    });

  } catch (error: any) {
    console.error("Discovery error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start discovery" },
      { status: 500 }
    );
  }
}
