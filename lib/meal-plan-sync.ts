import { db } from "./firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { getAdminDb } from "./firebase-admin";

/**
 * Syncs manual meal selections to the weekly plan
 * Creates or updates the weekly_plans document with selected meals
 */
export async function syncManualSelectionsToWeeklyPlan(
  userId: string,
  weekOf: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Get manual selections
    const selectionsRef = doc(db, 'manual_meal_selections', `${userId}_${weekOf}`);
    const selectionsSnap = await getDoc(selectionsRef);
    
    if (!selectionsSnap.exists()) {
      return { success: true, message: "No manual selections to sync" };
    }
    
    const mealIds: string[] = selectionsSnap.data().mealIds || [];
    
    if (mealIds.length === 0) {
      return { success: true, message: "No meals selected" };
    }
    
    // 2. Fetch meal details with ingredients
    const mealsRef = collection(db, 'meals');
    const mealDetails: Array<{ id: string; name: string; ingredients: any[] }> = [];
    
    for (const mealId of mealIds) {
      const mealSnap = await getDoc(doc(mealsRef, mealId));
      if (mealSnap.exists()) {
        const data = mealSnap.data();
        mealDetails.push({
          id: mealId,
          name: data.name || data.title,
          ingredients: data.ingredients || []
        });
      }
    }
    
    // 3. Check if weekly plan exists
    const plansQuery = query(
      collection(db, 'weekly_plans'),
      where('weekOf', '==', weekOf)
    );
    const plansSnap = await getDocs(plansQuery);
    
    // 4. Build meals object (assign to days)
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const mealsObj: any = {};
    
    mealDetails.forEach((meal, index) => {
      if (index < days.length) {
        mealsObj[days[index]] = {
          mealId: meal.id,
          mealName: meal.name
        };
      }
    });
    
    // 5. Generate shopping list from ingredients
    const wholeFoodsItems: string[] = [];
    const traderJoesItems: string[] = [];
    const eitherItems: string[] = [];
    
    mealDetails.forEach(meal => {
      meal.ingredients.forEach((ing: any) => {
        if (typeof ing === 'string') {
          eitherItems.push(ing);
        } else if (typeof ing === 'object') {
          const store = (ing.store || 'either').toLowerCase();
          const itemText = `${ing.quantity || ''} ${ing.unit || ''} ${ing.item || ''}`.trim();
          
          if (store === 'wholefoods') {
            wholeFoodsItems.push(itemText);
          } else if (store === 'traderjoes') {
            traderJoesItems.push(itemText);
          } else {
            eitherItems.push(itemText);
          }
        }
      });
    });
    
    // 6. Create or update weekly plan
    const planData = {
      weekOf,
      status: 'draft',
      meals: mealsObj,
      shoppingList: {
        wholefoods: wholeFoodsItems,
        traderjoes: traderJoesItems,
        either: eitherItems
      },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    if (plansSnap.empty) {
      // Create new plan
      const newDocRef = doc(collection(db, 'weekly_plans'));
      await setDoc(newDocRef, planData);
    } else {
      // Update existing plan's meals and shopping list
      const existingDoc = plansSnap.docs[0];
      const existingData = existingDoc.data();
      await setDoc(doc(db, 'weekly_plans', existingDoc.id), {
        ...existingData,
        meals: mealsObj,
        shoppingList: planData.shoppingList,
        updatedAt: new Date().toISOString()
      });
    }
    
    return { success: true, message: `Synced ${mealDetails.length} meals to weekly plan` };
  } catch (error) {
    console.error("Error syncing manual selections:", error);
    return { success: false, message: "Failed to sync selections" };
  }
}
