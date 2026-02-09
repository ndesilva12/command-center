import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

interface Person {
  id: string;
  name: string;
  nickname?: string;
  phone?: string;
  email?: string;
  birthday?: string;
  relationship?: string;
  relationshipDetail?: string;
  location?: string;
  originalLocation?: string;
  profession?: string;
  almaMater?: string;
  affiliations?: string;
  interests?: string;
  favoriteBrands?: string;
  giftIdeas?: string;
  pastGifts?: string;
  sizes?: string;
  notes?: string;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// GET - Fetch all people from Firestore
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sync = searchParams.get("sync") === "true";

  try {
    const userId = "norman"; // TODO: get from auth
    const snapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("people")
      .get();

    const people: Person[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Person));

    return NextResponse.json({ people, count: people.length, synced: sync });
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch people" },
      { status: 500 }
    );
  }
}

// POST - Create new person
export async function POST(request: Request) {
  try {
    const person: Partial<Person> = await request.json();

    if (!person.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const userId = "norman";
    const personId = `person_${Date.now()}`;
    const newPerson = {
      ...person,
      id: personId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb
      .collection("users")
      .doc(userId)
      .collection("people")
      .doc(personId)
      .set(newPerson);

    return NextResponse.json({ person: newPerson });
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create person" },
      { status: 500 }
    );
  }
}
