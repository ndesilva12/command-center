"use client";

import { useState, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  getDoc,
  query,
  orderBy 
} from "firebase/firestore";

interface Meal {
  id: string;
  name: string;
  prepTime: number;
  cookTime: number;
  tags: string[];
}

interface ManualMealSelectorProps {
  userId: string;
  weekOf: string; // ISO date string for the Monday of the week
  onSelectionsChange?: (selections: string[]) => void;
}

export function ManualMealSelector({ userId, weekOf, onSelectionsChange }: ManualMealSelectorProps) {
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId, weekOf]);

  const fetchData = async () => {
    try {
      // Fetch all meals
      const mealsSnapshot = await getDocs(
        query(collection(db, "meals"), orderBy("name"))
      );
      const meals: Meal[] = [];
      mealsSnapshot.forEach((doc) => {
        meals.push({ id: doc.id, ...doc.data() } as Meal);
      });
      setAllMeals(meals);

      // Fetch existing selections for this week
      const selectionDoc = await getDoc(
        doc(db, `manual_meal_selections/${userId}_${weekOf}`)
      );
      if (selectionDoc.exists()) {
        const data = selectionDoc.data();
        setSelectedMealIds(data.mealIds || []);
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSelections = async (newSelections: string[]) => {
    try {
      await setDoc(doc(db, `manual_meal_selections/${userId}_${weekOf}`), {
        userId,
        weekOf,
        mealIds: newSelections,
        updatedAt: new Date().toISOString(),
      });
      onSelectionsChange?.(newSelections);
    } catch (error) {
      console.error("Error saving selections:", error);
    }
  };

  const addMeal = (mealId: string) => {
    if (selectedMealIds.length >= 5) return;
    const newSelections = [...selectedMealIds, mealId];
    setSelectedMealIds(newSelections);
    saveSelections(newSelections);
    setShowPicker(false);
  };

  const removeMeal = (mealId: string) => {
    const newSelections = selectedMealIds.filter((id) => id !== mealId);
    setSelectedMealIds(newSelections);
    saveSelections(newSelections);
  };

  const selectedMeals = selectedMealIds
    .map((id) => allMeals.find((m) => m.id === id))
    .filter(Boolean) as Meal[];

  const availableMeals = allMeals.filter(
    (m) => !selectedMealIds.includes(m.id)
  );

  if (loading) {
    return <div style={{ padding: "16px", color: "var(--foreground-muted)" }}>Loading...</div>;
  }

  return (
    <div className="glass" style={{ padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
            Manual Recipe Selection
          </h3>
          <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
            Select up to 5 recipes for this week. Jimmy will fill remaining slots automatically.
          </p>
        </div>
        <span
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            color: selectedMealIds.length >= 5 ? "#f59e0b" : "#10b981",
            backgroundColor: selectedMealIds.length >= 5 ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
            border: selectedMealIds.length >= 5 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
          }}
        >
          {selectedMealIds.length} / 5 selected
        </span>
      </div>

      {/* Selected Meals */}
      {selectedMeals.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          {selectedMeals.map((meal) => (
            <div
              key={meal.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 170, 255, 0.1)",
                border: "1px solid rgba(0, 170, 255, 0.3)",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                  {meal.name}
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {meal.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "11px",
                        color: "var(--foreground-muted)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => removeMeal(meal.id)}
                style={{
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Button */}
      {selectedMealIds.length < 5 && (
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid rgba(0, 170, 255, 0.3)",
            backgroundColor: "rgba(0, 170, 255, 0.15)",
            color: "#00aaff",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Plus style={{ width: "16px", height: "16px" }} />
          Add Recipe
        </button>
      )}

      {/* Meal Picker Modal */}
      {showPicker && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setShowPicker(false)}
        >
          <div
            className="glass"
            style={{
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: "24px",
              borderRadius: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>Select a Recipe</h3>
              <button
                onClick={() => setShowPicker(false)}
                style={{
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground-muted)",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {availableMeals.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => addMeal(meal.id)}
                  style={{
                    textAlign: "left",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0, 170, 255, 0.1)";
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{meal.name}</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {meal.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: "11px",
                          color: "var(--foreground-muted)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}

              {availableMeals.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--foreground-muted)", padding: "24px" }}>
                  No more recipes available
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
