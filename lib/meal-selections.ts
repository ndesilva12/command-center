import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function getNextMonday(): string {
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0];
}

export async function addMealToNextWeek(
  userId: string, 
  mealId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const weekOf = getNextMonday();
    const docId = `${userId}_${weekOf}`;
    
    // Fetch existing selections
    const docRef = doc(db, 'manual_meal_selections', docId);
    const docSnap = await getDoc(docRef);
    
    let currentSelections: string[] = [];
    if (docSnap.exists()) {
      currentSelections = docSnap.data().mealIds || [];
    }
    
    // Check if already selected
    if (currentSelections.includes(mealId)) {
      return { success: false, message: "Already added to next week" };
    }
    
    // Check limit
    if (currentSelections.length >= 5) {
      return { success: false, message: "Maximum 5 recipes allowed" };
    }
    
    // Add meal
    const newSelections = [...currentSelections, mealId];
    await setDoc(docRef, {
      userId,
      weekOf,
      mealIds: newSelections,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true, message: "Added to next week!" };
  } catch (error) {
    console.error("Error adding meal to next week:", error);
    return { success: false, message: "Failed to add" };
  }
}
