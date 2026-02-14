"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Calendar, Plus, Search, Filter, Clock, ChefHat, Star, Flame, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { addMealToNextWeek } from "@/lib/meal-selections";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Meal {
  id: string;
  name: string;
  source: {
    type: string;
    url: string;
    addedAt: string;
  };
  ingredients: Array<{
    item: string;
    quantity: number;
    unit: string;
    store: string;
  }>;
  instructions: string[];
  prepTime: number;
  cookTime: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'anytime';
  tags: string[];
  lastCooked: string | null;
  timesCooked: number;
  rating: number | null;
  notes: string;
}

export default function MealsPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('meals', 'Meal Collection', '#6366f1');
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [addingMealId, setAddingMealId] = useState<string | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    prepTime: 0,
    cookTime: 0,
    frequency: 'anytime' as 'weekly' | 'biweekly' | 'monthly' | 'anytime',
    tags: '',
    ingredients: '',
    instructions: '',
  });

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
      const mealsSnapshot = await getDocs(collection(db, "meals"));
      const mealsArray = mealsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().title || doc.data().name, // Support both field names
        source: doc.data().source || { type: doc.data().sourceType, url: doc.data().source, addedAt: doc.data().createdAt },
        ingredients: doc.data().ingredients || [],
        instructions: doc.data().instructions || [],
        prepTime: doc.data().prepTime || 0,
        cookTime: doc.data().cookTime || 0,
        frequency: doc.data().frequency || 'anytime',
        tags: doc.data().tags || [],
        lastCooked: doc.data().lastCooked || null,
        timesCooked: doc.data().timesCooked || 0,
        rating: doc.data().rating || null,
        notes: doc.data().notes || '',
      }));
      setMeals(mealsArray);
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeals = meals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = !filterTag || meal.tags.includes(filterTag);
    return matchesSearch && matchesFilter;
  });

  const allTags = Array.from(new Set(meals.flatMap(m => m.tags)));

  const getFrequencyLabel = (freq: string) => {
    switch(freq) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Every 2 Weeks';
      case 'monthly': return 'Monthly';
      default: return 'Anytime';
    }
  };

  const getFrequencyColor = (freq: string) => {
    switch(freq) {
      case 'weekly': return '#10b981';
      case 'biweekly': return '#3b82f6';
      case 'monthly': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const handleAddToNextWeek = async (e: React.MouseEvent, mealId: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    
    if (!user) return;
    
    setAddingMealId(mealId);
    const result = await addMealToNextWeek(user.uid, mealId);
    
    if (result.success) {
      // Redirect to meal plan next week tab to see the selection
      window.location.href = "/tools/meal-plan?tab=next-week";
    } else {
      alert(result.message);
      setAddingMealId(null);
    }
  };

  const handleDeleteRecipe = async (e: React.MouseEvent, mealId: string, mealName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`Delete "${mealName}" permanently? This cannot be undone.`)) {
      return;
    }
    
    setDeletingMealId(mealId);
    try {
      await deleteDoc(doc(db, "meals", mealId));
      await fetchMeals(); // Refresh the list
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert("Failed to delete recipe");
    } finally {
      setDeletingMealId(null);
    }
  };

  const handleAddRecipe = async () => {
    if (!newRecipe.name.trim()) {
      alert("Recipe name is required");
      return;
    }
    
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      
      const tagsArray = newRecipe.tags.split(',').map(t => t.trim()).filter(Boolean);
      const instructionsArray = newRecipe.instructions.split('\n').filter(Boolean);
      const ingredientsArray = newRecipe.ingredients.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        // Parse simple format: "2 cups flour (wholefoods)" or just "flour"
        const match = trimmed.match(/^(.+?)\s*\((\w+)\)$/);
        if (match) {
          return { item: match[1].trim(), store: match[2].toLowerCase(), quantity: 1, unit: '' };
        }
        return { item: trimmed, store: 'either', quantity: 1, unit: '' };
      }).filter(Boolean);
      
      await addDoc(collection(db, "meals"), {
        name: newRecipe.name,
        title: newRecipe.name,
        prepTime: newRecipe.prepTime,
        cookTime: newRecipe.cookTime,
        frequency: newRecipe.frequency,
        tags: tagsArray,
        ingredients: ingredientsArray,
        instructions: instructionsArray,
        source: { type: 'manual', url: '', addedAt: new Date().toISOString() },
        lastCooked: null,
        timesCooked: 0,
        rating: null,
        notes: '',
        createdAt: new Date().toISOString(),
      });
      
      setShowAddRecipeModal(false);
      setNewRecipe({
        name: '',
        prepTime: 0,
        cookTime: 0,
        frequency: 'anytime',
        tags: '',
        ingredients: '',
        instructions: '',
      });
      await fetchMeals();
    } catch (error) {
      console.error("Error adding recipe:", error);
      alert("Failed to add recipe");
    }
  };

  return (
    <ProtectedRoute requiredPermission="meals">
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="meals" />

      <main style={{
        paddingTop: isMobile ? "64px" : "136px",
        paddingBottom: isMobile ? "80px" : "96px",
        minHeight: `calc(100vh - ${isMobile ? "160px" : "232px"})`
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: isMobile ? "0 12px" : "0 24px"
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
                <ChefHat style={{ width: "28px", height: "28px", color: "#00aaff" }} />
                {toolCustom.name}
              </h1>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                {meals.length} recipes • Automated meal planning every week
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <button
                onClick={() => setShowAddRecipeModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.25)";
                }}
              >
                <Plus style={{ width: "16px", height: "16px" }} />
                Add Recipe
              </button>
              
              <a
                href="/tools/meal-plan"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #00aaff 0%, #0088cc 100%)",
                  border: "none",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(0, 170, 255, 0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 170, 255, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 170, 255, 0.25)";
                }}
              >
                <Calendar style={{ width: "16px", height: "16px" }} />
                View Meal Plan
              </a>
            </div>
          </div>

          {/* Search & Filter */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <div className="glass" style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px" }}>
              <Search style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "14px" }}
              />
            </div>

            <div className="glass" style={{ position: "relative", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
              <select
                value={filterTag || ""}
                onChange={(e) => setFilterTag(e.target.value || null)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Meals Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ color: "var(--foreground-muted)" }}>Loading recipes...</p>
            </div>
          ) : filteredMeals.length === 0 ? (
            <div className="glass" style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px" }}>
              <ChefHat style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                {searchQuery || filterTag ? "No recipes found" : "No recipes yet"}
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "16px" }}>
                {searchQuery || filterTag 
                  ? "Try adjusting your search or filter"
                  : "Send an email with subject 'meal plan' to add your first recipe"}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {filteredMeals.map((meal) => (
                <a
                  key={meal.id}
                  href={`/tools/meals/${meal.id}`}
                  className="glass"
                  style={{
                    padding: "20px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    transition: "all 0.2s",
                    display: "block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#00aaff";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Meal Name & Rating */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "4px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", flex: 1 }}>
                        {meal.name}
                      </h3>
                      {meal.rating && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Star style={{ width: "14px", height: "14px", fill: "#10b981", color: "#10b981" }} />
                          <span style={{ fontSize: "13px", color: "#10b981", fontWeight: 600 }}>{meal.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Frequency Badge */}
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: getFrequencyColor(meal.frequency),
                        backgroundColor: `${getFrequencyColor(meal.frequency)}20`,
                        border: `1px solid ${getFrequencyColor(meal.frequency)}40`,
                      }}
                    >
                      {getFrequencyLabel(meal.frequency)}
                    </span>
                  </div>

                  {/* Time Info */}
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                      <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                        Prep: {meal.prepTime}m
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Flame style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                      <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                        Cook: {meal.cookTime}m
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {meal.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                      {meal.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            color: "var(--foreground-muted)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {meal.tags.length > 3 && (
                        <span style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                          +{meal.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Last Cooked */}
                  {meal.lastCooked && (
                    <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "8px" }}>
                      Last cooked: {new Date(meal.lastCooked).toLocaleDateString()}
                    </p>
                  )}
                  {meal.timesCooked > 0 && (
                    <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                      Cooked {meal.timesCooked} {meal.timesCooked === 1 ? 'time' : 'times'}
                    </p>
                  )}

                  {/* Action Buttons */}
                  {user && (
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                      <button
                        onClick={(e) => handleAddToNextWeek(e, meal.id)}
                        disabled={addingMealId === meal.id}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid rgba(0, 170, 255, 0.3)",
                          backgroundColor: "rgba(0, 170, 255, 0.15)",
                          color: "#00aaff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: addingMealId === meal.id ? "not-allowed" : "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          opacity: addingMealId === meal.id ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (addingMealId !== meal.id) {
                            e.currentTarget.style.backgroundColor = "rgba(0, 170, 255, 0.25)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(0, 170, 255, 0.15)";
                        }}
                      >
                        <Calendar style={{ width: "14px", height: "14px" }} />
                        {addingMealId === meal.id ? "Adding..." : "Add to Week"}
                      </button>
                      
                      <button
                        onClick={(e) => handleDeleteRecipe(e, meal.id, meal.name)}
                        disabled={deletingMealId === meal.id}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: deletingMealId === meal.id ? "not-allowed" : "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: deletingMealId === meal.id ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (deletingMealId !== meal.id) {
                            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                        }}
                      >
                        <Trash2 style={{ width: "14px", height: "14px" }} />
                      </button>
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Recipe Modal */}
      {showAddRecipeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto",
          }}
          onClick={() => setShowAddRecipeModal(false)}
        >
          <div
            className="glass"
            style={{
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px",
              borderRadius: "16px",
              marginTop: "20px",
              marginBottom: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "8px" }}>
              Add New Recipe
            </h2>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
              Fill in the details below to add a recipe to your collection
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Recipe Name */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Recipe Name *
                </label>
                <input
                  type="text"
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                  placeholder="e.g., Chicken Stir Fry"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Times */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    value={newRecipe.prepTime}
                    onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: parseInt(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    Cook Time (min)
                  </label>
                  <input
                    type="number"
                    value={newRecipe.cookTime}
                    onChange={(e) => setNewRecipe({ ...newRecipe, cookTime: parseInt(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Frequency
                </label>
                <select
                  value={newRecipe.frequency}
                  onChange={(e) => setNewRecipe({ ...newRecipe, frequency: e.target.value as any })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                  }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="monthly">Monthly</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newRecipe.tags}
                  onChange={(e) => setNewRecipe({ ...newRecipe, tags: e.target.value })}
                  placeholder="e.g., chicken, asian, quick"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Ingredients */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Ingredients (one per line)
                </label>
                <textarea
                  value={newRecipe.ingredients}
                  onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}
                  placeholder={"2 cups rice (wholefoods)\n1 lb chicken\n2 tbsp soy sauce (traderjoes)"}
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    resize: "vertical",
                  }}
                />
                <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "6px" }}>
                  Optionally add (wholefoods) or (traderjoes) after ingredients
                </p>
              </div>

              {/* Instructions */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Instructions (one per line)
                </label>
                <textarea
                  value={newRecipe.instructions}
                  onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
                  placeholder={"Cook rice according to package\nCook chicken in skillet\nCombine and serve"}
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  onClick={() => setShowAddRecipeModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRecipe}
                  disabled={!newRecipe.name.trim()}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: newRecipe.name.trim() 
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "rgba(255, 255, 255, 0.1)",
                    color: newRecipe.name.trim() ? "white" : "var(--foreground-muted)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: newRecipe.name.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Add Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
