"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { 
  Calendar, ShoppingCart, ChefHat, X, Check, 
  Plus, Search, Filter, Clock, Star, Flame, Trash2 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { 
  collection, getDocs, doc, getDoc, setDoc, deleteDoc, addDoc 
} from "firebase/firestore";
import { ToolBackground } from "@/components/tools/ToolBackground";

interface Meal {
  id: string;
  name: string;
  prepTime: number;
  cookTime: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'anytime';
  tags: string[];
  ingredients: any[];
  instructions: string[];
  source?: any;
  lastCooked?: string | null;
  timesCooked?: number;
  rating?: number | null;
  notes?: string;
}

interface WeeklyPlan {
  id: string;
  weekOf: string;
  status: 'draft' | 'proposed' | 'approved' | 'current' | 'archived';
  meals: {
    monday?: { mealId: string; mealName: string };
    tuesday?: { mealId: string; mealName: string };
    wednesday?: { mealId: string; mealName: string };
    thursday?: { mealId: string; mealName: string };
    friday?: { mealId: string; mealName: string };
  };
  shoppingList?: {
    wholefoods?: string[];
    traderjoes?: string[];
    either?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

function MealPlanContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'all-recipes' | 'this-week' | 'next-week' | 'shopping'>(
    (tabParam as any) || 'all-recipes'
  );
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [currentWeek, setCurrentWeek] = useState<WeeklyPlan | null>(null);
  const [nextWeek, setNextWeek] = useState<WeeklyPlan | null>(null);
  const [manualSelections, setManualSelections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [addingMealId, setAddingMealId] = useState<string | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
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
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getNextWeekMonday = () => {
    const now = new Date();
    const currentMonday = getMonday(now);
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return nextMonday.toISOString().split('T')[0];
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all meals
      const mealsSnapshot = await getDocs(collection(db, "meals"));
      const meals: Meal[] = [];
      mealsSnapshot.forEach((doc) => {
        const data = doc.data();
        meals.push({
          id: doc.id,
          name: data.name || data.title,
          prepTime: data.prepTime || 0,
          cookTime: data.cookTime || 0,
          frequency: data.frequency || 'anytime',
          tags: data.tags || [],
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          source: data.source,
          lastCooked: data.lastCooked || null,
          timesCooked: data.timesCooked || 0,
          rating: data.rating || null,
          notes: data.notes || '',
        });
      });
      setAllMeals(meals);

      // Fetch manual selections for next week
      const nextWeekMonday = getNextWeekMonday();
      const selectionsDoc = await getDoc(
        doc(db, 'manual_meal_selections', `${user!.uid}_${nextWeekMonday}`)
      );
      if (selectionsDoc.exists()) {
        setManualSelections(selectionsDoc.data().mealIds || []);
      } else {
        setManualSelections([]);
      }

      // Fetch weekly plans
      const plansSnapshot = await getDocs(collection(db, 'weekly_plans'));
      const plans: WeeklyPlan[] = [];
      plansSnapshot.forEach((doc) => {
        plans.push({ id: doc.id, ...doc.data() } as WeeklyPlan);
      });

      const now = new Date();
      const currentWeekStart = getMonday(now);
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);

      const current = plans.find(p => 
        new Date(p.weekOf).toDateString() === currentWeekStart.toDateString()
      );
      const next = plans.find(p => 
        new Date(p.weekOf).toDateString() === nextWeekStart.toDateString()
      );

      setCurrentWeek(current || null);
      setNextWeek(next || null);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToNextWeek = async (e: React.MouseEvent, mealId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    setAddingMealId(mealId);
    try {
      const nextWeekMonday = getNextWeekMonday();
      const selectionsDocId = `${user.uid}_${nextWeekMonday}`;
      
      // Fetch current selections directly
      const selectionsDoc = await getDoc(doc(db, 'manual_meal_selections', selectionsDocId));
      let currentSelections: string[] = [];
      if (selectionsDoc.exists()) {
        currentSelections = selectionsDoc.data().mealIds || [];
      }
      
      // Check if already selected
      if (currentSelections.includes(mealId)) {
        alert("This recipe is already in next week's plan");
        setAddingMealId(null);
        return;
      }
      
      // Check limit
      if (currentSelections.length >= 5) {
        alert(`All 5 days (Mon-Fri) are filled! Remove a recipe from Next Week tab first.`);
        setAddingMealId(null);
        return;
      }
      
      // Add meal
      const newSelections = [...currentSelections, mealId];
      await setDoc(doc(db, 'manual_meal_selections', selectionsDocId), {
        userId: user.uid,
        weekOf: nextWeekMonday,
        mealIds: newSelections,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh data
      await fetchAllData();
      setActiveTab('next-week');
    } catch (error) {
      console.error("Error adding meal:", error);
      alert("Failed to add meal");
    } finally {
      setAddingMealId(null);
    }
  };

  const handleRemoveFromNextWeek = async (mealId: string) => {
    if (!user) return;
    
    try {
      const nextWeekMonday = getNextWeekMonday();
      const selectionsDocId = `${user.uid}_${nextWeekMonday}`;
      
      const newSelections = manualSelections.filter(id => id !== mealId);
      await setDoc(doc(db, 'manual_meal_selections', selectionsDocId), {
        userId: user.uid,
        weekOf: nextWeekMonday,
        mealIds: newSelections,
        updatedAt: new Date().toISOString()
      });
      
      await fetchAllData();
    } catch (error) {
      console.error("Error removing meal:", error);
      alert("Failed to remove meal");
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
      await fetchAllData();
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
      const tagsArray = newRecipe.tags.split(',').map(t => t.trim()).filter(Boolean);
      const instructionsArray = newRecipe.instructions.split('\n').filter(Boolean);
      const ingredientsArray = newRecipe.ingredients.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return null;
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
      await fetchAllData();
    } catch (error) {
      console.error("Error adding recipe:", error);
      alert("Failed to add recipe");
    }
  };

  const filteredMeals = allMeals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = !filterTag || meal.tags.includes(filterTag);
    return matchesSearch && matchesFilter;
  });

  const allTags = Array.from(new Set(allMeals.flatMap(m => m.tags)));

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

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
  
  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const selectedMeals = manualSelections
    .map(id => allMeals.find(m => m.id === id))
    .filter(Boolean) as Meal[];

  const toggleItem = (itemKey: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  const StoreSection = ({ title, items, keyPrefix }: { title: string; items: string[]; keyPrefix: string }) => {
    const uncheckedCount = items.filter(item => !checkedItems.has(`${keyPrefix}_${item}`)).length;
    
    return (
      <div className="glass" style={{ padding: isMobile ? "16px" : "24px", borderRadius: "12px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
          {title} ({uncheckedCount} items)
        </h2>
        
        {items.length === 0 ? (
          <p style={{ color: "var(--foreground-muted)", fontSize: "14px", fontStyle: "italic" }}>
            No items for this store
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map((item, index) => {
              const itemKey = `${keyPrefix}_${item}`;
              const isChecked = checkedItems.has(itemKey);
              
              return (
                <label
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: isChecked ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${isChecked ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleItem(itemKey)}
                    style={{
                      width: "20px",
                      height: "20px",
                      marginTop: "2px",
                      cursor: "pointer",
                      accentColor: "#10b981",
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: "15px",
                      color: isChecked ? "var(--foreground-muted)" : "var(--foreground)",
                      textDecoration: isChecked ? "line-through" : "none",
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute requiredPermission="meal-plan">
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="meals" />
      <ToolBackground color="#10b981" />

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? "16px" : "24px", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <h1 style={{ fontSize: isMobile ? "20px" : "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px", display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px" }}>
                <ChefHat style={{ width: isMobile ? "20px" : "28px", height: isMobile ? "20px" : "28px", color: "#00aaff" }} />
                <span>Meal Plan</span>
              </h1>
              {!isMobile && (
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  {allMeals.length} recipes • Weekly meal planning & shopping lists
                </p>
              )}
            </div>

            {activeTab === 'all-recipes' && (
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
                  flexShrink: 0,
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
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: isMobile ? "4px" : "8px", marginBottom: isMobile ? "16px" : "32px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "0", overflowX: "auto" }}>
            {[
              { id: 'all-recipes', label: isMobile ? "Recipes" : "All Recipes" },
              { id: 'next-week', label: isMobile ? "Next Week" : "Next Week" },
              { id: 'this-week', label: isMobile ? "This Week" : "This Week" },
              { id: 'shopping', label: isMobile ? "Shopping" : "Shopping List" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: isMobile ? "10px 12px" : "12px 20px",
                  borderRadius: "8px 8px 0 0",
                  border: "none",
                  background: activeTab === tab.id ? "rgba(0, 170, 255, 0.15)" : "transparent",
                  color: activeTab === tab.id ? "#00aaff" : "var(--foreground-muted)",
                  fontSize: isMobile ? "13px" : "14px",
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderBottom: activeTab === tab.id ? "2px solid #00aaff" : "2px solid transparent",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="glass" style={{ textAlign: "center", padding: isMobile ? "40px 16px" : "60px 20px", borderRadius: "12px" }}>
              <p style={{ color: "var(--foreground-muted)" }}>Loading...</p>
            </div>
          ) : activeTab === 'all-recipes' ? (
            /* ALL RECIPES TAB */
            <div>
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
              {filteredMeals.length === 0 ? (
                <div className="glass" style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px" }}>
                  <ChefHat style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
                  <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    {searchQuery || filterTag ? "No recipes found" : "No recipes yet"}
                  </h2>
                  <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "16px" }}>
                    {searchQuery || filterTag 
                      ? "Try adjusting your search or filter"
                      : "Click 'Add Recipe' to add your first recipe"}
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
                      {meal.timesCooked && meal.timesCooked > 0 && (
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
          ) : activeTab === 'next-week' ? (
            /* NEXT WEEK TAB */
            <div>
              {/* Manual Selections */}
              <div className="glass" style={{ padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                      Your Recipe Selections
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                      Pick recipes for Monday-Friday. Each selection fills one day.
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: manualSelections.length >= 5 ? "#6366f1" : "#10b981",
                        backgroundColor: manualSelections.length >= 5 ? "rgba(99, 102, 241, 0.15)" : "rgba(16, 185, 129, 0.15)",
                        border: manualSelections.length >= 5 ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      {manualSelections.length} / 5 days filled
                    </span>
                    {manualSelections.length >= 5 && (
                      <span style={{ fontSize: "11px", color: "var(--foreground-muted)", textAlign: "right" }}>
                        All days filled! Remove one to change.
                      </span>
                    )}
                  </div>
                </div>

                {selectedMeals.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {selectedMeals.map((meal, index) => {
                      const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                      const dayLabel = dayLabels[index];
                      
                      return (
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
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span style={{ 
                                fontSize: "11px", 
                                fontWeight: 700, 
                                textTransform: "uppercase", 
                                color: "#00aaff",
                                letterSpacing: "0.5px" 
                              }}>
                                {dayLabel}
                              </span>
                              <span style={{ 
                                fontSize: "14px", 
                                fontWeight: 600, 
                                color: "var(--foreground)" 
                              }}>
                                {meal.name}
                              </span>
                            </div>
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
                            onClick={() => handleRemoveFromNextWeek(meal.id)}
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
                              flexShrink: 0,
                              marginLeft: "12px",
                            }}
                          >
                            <X style={{ width: "16px", height: "16px" }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px", color: "var(--foreground-muted)" }}>
                    <p>No meals selected yet. Go to "All Recipes" tab to add meals.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'this-week' ? (
            /* THIS WEEK TAB */
            <div>
              {currentWeek ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {days.map(day => {
                    const meal = currentWeek.meals[day];
                    
                    return (
                      <div
                        key={day}
                        className="glass"
                        style={{
                          padding: "20px",
                          borderRadius: "12px",
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--foreground-muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>
                          {getDayLabel(day)}
                        </div>
                        {meal ? (
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 600,
                              color: "var(--foreground)",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <ChefHat style={{ width: "20px", height: "20px" }} />
                            {meal.mealName}
                          </div>
                        ) : (
                          <p style={{ fontSize: "16px", color: "var(--foreground-muted)", fontStyle: "italic" }}>
                            No meal planned
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass" style={{ textAlign: "center", padding: isMobile ? "40px 16px" : "60px 20px", borderRadius: "12px" }}>
                  <Calendar style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
                  <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    No plan for this week yet
                  </h2>
                  <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                    A meal plan will be generated automatically
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* SHOPPING LIST TAB */
            <div>
              {nextWeek?.shoppingList ? (
                <>
                  <div style={{ marginBottom: isMobile ? "12px" : "20px", padding: isMobile ? "10px 12px" : "12px 16px", borderRadius: "8px", backgroundColor: "rgba(0, 170, 255, 0.1)", border: "1px solid rgba(0, 170, 255, 0.3)" }}>
                    <p style={{ fontSize: "13px", color: "var(--foreground)", margin: 0 }}>
                      🛒 Shopping list for <strong>next week</strong> ({nextWeek.weekOf})
                    </p>
                  </div>
                  
                  <StoreSection 
                    title="Whole Foods" 
                    items={nextWeek.shoppingList.wholefoods || []} 
                    keyPrefix="wholefoods" 
                  />
                  
                  <StoreSection 
                    title="Trader Joe's" 
                    items={nextWeek.shoppingList.traderjoes || []} 
                    keyPrefix="traderjoes" 
                  />
                  
                  <StoreSection 
                    title="Either Store" 
                    items={nextWeek.shoppingList.either || []} 
                    keyPrefix="either" 
                  />
                </>
              ) : (
                <div className="glass" style={{ textAlign: "center", padding: isMobile ? "40px 16px" : "60px 20px", borderRadius: "12px" }}>
                  <ShoppingCart style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
                  <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    No shopping list yet
                  </h2>
                  <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                    Add meals to next week to generate a shopping list
                  </p>
                </div>
              )}
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

export default function MealPlanPage() {
  return (
    <Suspense fallback={
      <>
        <TopNav />
        <BottomNav />
        <ToolNav currentToolId="meals" />
        <main style={{ paddingTop: "80px", paddingBottom: "80px", minHeight: "calc(100vh - 160px)" }}>
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ color: "var(--foreground-muted)" }}>Loading...</p>
          </div>
        </main>
      </>
    }>
      <MealPlanContent />
    </Suspense>
  );
}
