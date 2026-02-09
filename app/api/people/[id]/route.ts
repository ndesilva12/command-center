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

// GET - Fetch single person
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = "norman";
    const personDoc = await adminDb
      .collection("users")
      .doc(userId)
      .collection("people")
      .doc(id)
      .get();

    if (!personDoc.exists) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const person = { id: personDoc.id, ...personDoc.data() } as Person;
    return NextResponse.json({ person });
  } catch (error) {
    console.error("Error fetching person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch person" },
      { status: 500 }
    );
  }
}

// PATCH - Update person
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates: Partial<Person> = await request.json();

    const userId = "norman";
    const personRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("people")
      .doc(id);
    
    await personRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const personSnap = await personRef.get();
    const person = { id: personSnap.id, ...personSnap.data() } as Person;

    return NextResponse.json({ person });
  } catch (error) {
    console.error("Error updating person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update person" },
      { status: 500 }
    );
  }
}

// DELETE - Delete person
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = "norman";
    await adminDb
      .collection("users")
      .doc(userId)
      .collection("people")
      .doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete person" },
      { status: 500 }
    );
  }
}
