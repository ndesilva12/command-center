"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ArrowLeft, Clock, Flame, Star, ExternalLink, Edit2, Save, Calendar } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { addMealToNextWeek } from "@/lib/meal-selections";

interface Meal {
  id: string;
  name?: string;
  title?: string;
  source?: {
    type?: string;
    url?: string;
    addedAt?: string;
  } | string;
  ingredients: string[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'anytime';
  tags?: string[];
  lastCooked?: string | null;
  timesCooked?: number;
  rating?: number | null;
  notes?: string;
  store?: string;
  servings?: string;
}

export default function MealDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedMeal, setEditedMeal] = useState<Meal | null>(null);
  const [addingToWeek, setAddingToWeek] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchMeal(params.id as string);
    }
  }, [params.id]);

  const fetchMeal = async (id: string) => {
    try {
      const mealDoc = await getDoc(doc(db, 'meals', id));
      if (mealDoc.exists()) {
        const data = mealDoc.data();
        setMeal({ id, ...data } as Meal);
        setEditedMeal({ id, ...data } as Meal);
      }
    } catch (error) {
      console.error("Error fetching meal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedMeal) return;

    try {
      const mealRef = doc(db, 'meals', editedMeal.id);
      await updateDoc(mealRef, {
        ...editedMeal,
        updatedAt: new Date().toISOString()
      });

      setMeal(editedMeal);
      setEditing(false);
    } catch (error) {
      console.error("Error saving meal:", error);
    }
  };

  const handleAddToNextWeek = async () => {
    if (!user || !meal) return;
    
    setAddingToWeek(true);
    const result = await addMealToNextWeek(user.uid, meal.id);
    
    alert(result.message);
    setAddingToWeek(false);
  };

  const getFrequencyLabel = (freq: string) => {
    switch(freq) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Every 2 Weeks';
      case 'monthly': return 'Monthly';
      default: return 'Anytime';
    }
  };

  if (loading) {
    return (
      <>
        <TopNav />
        <BottomNav />
        <ToolNav currentToolId="meals" />
        <main style={{ paddingTop: "136px", paddingBottom: "96px", minHeight: "100vh" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
            <p style={{ textAlign: "center", color: "var(--foreground-muted)" }}>Loading recipe...</p>
          </div>
        </main>
      </>
    );
  }

  if (!meal) {
    return (
      <>
        <TopNav />
        <BottomNav />
        <ToolNav currentToolId="meals" />
        <main style={{ paddingTop: "136px", paddingBottom: "96px", minHeight: "100vh" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
            <p style={{ textAlign: "center", color: "var(--foreground-muted)" }}>Recipe not found</p>
          </div>
        </main>
      </>
    );
  }

  const displayMeal = editing ? editedMeal : meal;

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="meals" />

      <main style={{ paddingTop: "136px", paddingBottom: "96px", minHeight: "100vh" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <button
              onClick={() => router.back()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--foreground-muted)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "#00aaff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
              Back
            </button>

            <div style={{ display: "flex", gap: "12px" }}>
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditedMeal(meal);
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: "linear-gradient(135deg, #00aaff 0%, #0088cc 100%)",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Save style={{ width: "16px", height: "16px" }} />
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  {user && (
                    <button
                      onClick={handleAddToNextWeek}
                      disabled={addingToWeek}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "#10b981",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: addingToWeek ? "not-allowed" : "pointer",
                        opacity: addingToWeek ? 0.6 : 1,
                      }}
                    >
                      <Calendar style={{ width: "16px", height: "16px" }} />
                      {addingToWeek ? "Adding..." : "Add to Next Week"}
                    </button>
                  )}
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(0, 170, 255, 0.15)",
                      border: "1px solid rgba(0, 170, 255, 0.3)",
                      color: "#00aaff",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Edit2 style={{ width: "16px", height: "16px" }} />
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Recipe Title */}
          <div style={{ marginBottom: "32px" }}>
            {editing ? (
              <input
                type="text"
                value={displayMeal?.name || displayMeal?.title || ''}
                onChange={(e) => setEditedMeal(prev => prev ? {...prev, name: e.target.value, title: e.target.value} : null)}
                style={{
                  width: "100%",
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "16px",
                }}
              />
            ) : (
              <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--foreground)", marginBottom: "16px" }}>
                {displayMeal?.name || displayMeal?.title}
              </h1>
            )}

            {/* Meta Info */}
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" }}>
              {displayMeal?.prepTime && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock style={{ width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
                  <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    Prep: {displayMeal.prepTime}m
                  </span>
                </div>
              )}
              {displayMeal?.cookTime && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Flame style={{ width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
                  <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    Cook: {displayMeal.cookTime}m
                  </span>
                </div>
              )}
              {displayMeal?.servings && (
                <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  Servings: {displayMeal.servings}
                </span>
              )}
              {displayMeal?.store && (
                <span
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#00aaff",
                    backgroundColor: "rgba(0, 170, 255, 0.15)",
                    border: "1px solid rgba(0, 170, 255, 0.3)",
                  }}
                >
                  {displayMeal.store}
                </span>
              )}
              {displayMeal?.rating && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Star style={{ width: "18px", height: "18px", fill: "#f59e0b", color: "#f59e0b" }} />
                  <span style={{ fontSize: "14px", color: "#f59e0b", fontWeight: 600 }}>
                    {displayMeal.rating}/5
                  </span>
                </div>
              )}
              {editing ? (
                <select
                  value={displayMeal?.frequency || 'anytime'}
                  onChange={(e) => setEditedMeal(prev => prev ? {...prev, frequency: e.target.value as any} : null)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "var(--foreground)",
                  }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="monthly">Monthly</option>
                  <option value="anytime">Anytime</option>
                </select>
              ) : (
                <span
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  {getFrequencyLabel(displayMeal?.frequency || 'anytime')}
                </span>
              )}
            </div>

            {/* Source */}
            {(typeof displayMeal?.source === 'string' ? displayMeal?.source : displayMeal?.source?.url) && displayMeal && (
              <a
                href={typeof displayMeal.source === 'string' ? displayMeal.source : (displayMeal.source as any).url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "12px",
                  fontSize: "13px",
                  color: "#00aaff",
                  textDecoration: "none",
                }}
              >
                View original source
                <ExternalLink style={{ width: "14px", height: "14px" }} />
              </a>
            )}
          </div>

          {/* Ingredients */}
          <div className="glass" style={{ padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
              Ingredients
            </h2>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {displayMeal?.ingredients.map((ing, idx) => {
                if (typeof ing === 'string') {
                  return <li key={idx} style={{ fontSize: "15px", color: "var(--foreground)" }}>{ing}</li>;
                }
                const ingredient = ing as { quantity: number; unit: string; item: string };
                return (
                  <li key={idx} style={{ fontSize: "15px", color: "var(--foreground)" }}>
                    {ingredient.quantity} {ingredient.unit} {ingredient.item}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Instructions */}
          <div className="glass" style={{ padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
              Instructions
            </h2>
            <ol style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayMeal?.instructions.map((step, idx) => (
                <li key={idx} style={{ fontSize: "15px", color: "var(--foreground)", lineHeight: "1.6" }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Tags */}
          {displayMeal?.tags && displayMeal.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
              {displayMeal.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          {(displayMeal?.lastCooked || (displayMeal?.timesCooked && displayMeal.timesCooked > 0)) && (
            <div className="glass" style={{ padding: "16px", borderRadius: "12px" }}>
              {displayMeal.lastCooked && (
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "8px" }}>
                  Last cooked: {new Date(displayMeal.lastCooked).toLocaleDateString()}
                </p>
              )}
              {displayMeal.timesCooked > 0 && (
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  Cooked {displayMeal.timesCooked} {displayMeal.timesCooked === 1 ? 'time' : 'times'}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
