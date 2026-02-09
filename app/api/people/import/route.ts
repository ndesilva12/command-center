import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

interface NotionPerson {
  id: string;
  properties: {
    Name?: { title: Array<{ plain_text: string }> };
    Nickname?: { rich_text: Array<{ plain_text: string }> };
    Phone?: { phone_number: string | null };
    Email?: { email: string | null };
    Birthday?: { date: { start: string } | null };
    Relationship?: { select: { name: string } | null };
    "Relationship Detail"?: { rich_text: Array<{ plain_text: string }> };
    Location?: { rich_text: Array<{ plain_text: string }> };
    "Original Location"?: { rich_text: Array<{ plain_text: string }> };
    Profession?: { rich_text: Array<{ plain_text: string }> };
    "Alma Mater"?: { rich_text: Array<{ plain_text: string }> };
    Affiliations?: { rich_text: Array<{ plain_text: string }> };
    Interests?: { rich_text: Array<{ plain_text: string }> };
    "Favorite Brands"?: { rich_text: Array<{ plain_text: string }> };
    "Gift Ideas"?: { rich_text: Array<{ plain_text: string }> };
    "Past Gifts"?: { rich_text: Array<{ plain_text: string }> };
    Sizes?: { rich_text: Array<{ plain_text: string }> };
    Notes?: { rich_text: Array<{ plain_text: string }> };
  };
}

function extractText(property: any): string {
  if (!property) return "";
  if (property.title) return property.title.map((t: any) => t.plain_text).join("");
  if (property.rich_text) return property.rich_text.map((t: any) => t.plain_text).join("");
  if (property.phone_number) return property.phone_number || "";
  if (property.email) return property.email || "";
  if (property.select) return property.select?.name || "";
  if (property.date) return property.date?.start || "";
  return "";
}

export async function POST() {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_PEOPLE_DB_ID || "2fbbedd4-1419-81de-af93-da2dee6e098a";

    if (!notionApiKey) {
      return NextResponse.json({ error: "Notion API key not configured" }, { status: 500 });
    }

    // Query Notion database using REST API directly
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const userId = "norman"; // TODO: get from auth
    const batch = adminDb.batch();
    let importedCount = 0;

    // Import each person to Firestore
    for (const page of data.results as NotionPerson[]) {
      const props = page.properties;
      const name = extractText(props.Name);

      if (!name) continue; // Skip entries without names

      const personId = page.id.replace(/-/g, "_");
      const personRef = adminDb
        .collection("users")
        .doc(userId)
        .collection("people")
        .doc(personId);

      const personData = {
        id: personId,
        notionId: page.id,
        name,
        nickname: extractText(props.Nickname),
        phone: extractText(props.Phone),
        email: extractText(props.Email),
        birthday: extractText(props.Birthday),
        relationship: extractText(props.Relationship),
        relationshipDetail: extractText(props["Relationship Detail"]),
        location: extractText(props.Location),
        originalLocation: extractText(props["Original Location"]),
        profession: extractText(props.Profession),
        almaMater: extractText(props["Alma Mater"]),
        affiliations: extractText(props.Affiliations),
        interests: extractText(props.Interests),
        favoriteBrands: extractText(props["Favorite Brands"]),
        giftIdeas: extractText(props["Gift Ideas"]),
        pastGifts: extractText(props["Past Gifts"]),
        sizes: extractText(props.Sizes),
        notes: extractText(props.Notes),
        syncedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(personRef, personData, { merge: true });
      importedCount++;
    }

    // Commit batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      count: importedCount,
      total: data.results.length,
      message: `Imported ${importedCount} people from Notion`,
    });
  } catch (error) {
    console.error("Error importing people from Notion:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to import people",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
