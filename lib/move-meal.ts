import { db } from "./firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

export async function moveMeal(
  weekOf: string,
  fromDay: string,
  toDay: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Find the weekly plan
    const plansQuery = query(
      collection(db, 'weekly_plans'),
      where('weekOf', '==', weekOf)
    );
    const plansSnap = await getDocs(plansQuery);
    
    if (plansSnap.empty) {
      return { success: false, message: "Weekly plan not found" };
    }
    
    const planDoc = plansSnap.docs[0];
    const planData = planDoc.data();
    const meals = planData.meals || {};
    
    // Get the meal from fromDay
    const mealToMove = meals[fromDay];
    if (!mealToMove) {
      return { success: false, message: "No meal on that day" };
    }
    
    // Move meal
    const updatedMeals = { ...meals };
    updatedMeals[toDay] = mealToMove;
    delete updatedMeals[fromDay];
    
    // Update Firestore
    await updateDoc(doc(db, 'weekly_plans', planDoc.id), {
      meals: updatedMeals,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true, message: `Moved to ${toDay}` };
  } catch (error) {
    console.error("Error moving meal:", error);
    return { success: false, message: "Failed to move meal" };
  }
}

export async function removeMeal(
  weekOf: string,
  day: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Find the weekly plan
    const plansQuery = query(
      collection(db, 'weekly_plans'),
      where('weekOf', '==', weekOf)
    );
    const plansSnap = await getDocs(plansQuery);
    
    if (plansSnap.empty) {
      return { success: false, message: "Weekly plan not found" };
    }
    
    const planDoc = plansSnap.docs[0];
    const planData = planDoc.data();
    const meals = planData.meals || {};
    
    // Remove meal from day
    const updatedMeals = { ...meals };
    delete updatedMeals[day];
    
    // Update Firestore
    await updateDoc(doc(db, 'weekly_plans', planDoc.id), {
      meals: updatedMeals,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true, message: "Meal removed" };
  } catch (error) {
    console.error("Error removing meal:", error);
    return { success: false, message: "Failed to remove meal" };
  }
}
