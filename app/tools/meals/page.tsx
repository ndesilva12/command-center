"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Calendar, Plus, Search, Filter, Clock, ChefHat, Star, Flame } from "lucide-react";

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
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);

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

  return (
    <ProtectedRoute requiredPermission="meals">
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="meals" />

      <main style={{ paddingTop: "136px", paddingBottom: "96px", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
                <ChefHat style={{ width: "28px", height: "28px", color: "#00aaff" }} />
                Meal Collection
              </h1>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                {meals.length} recipes • Automated meal planning every week
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <a
                href="/tools/meal-plan"
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
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 170, 255, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 170, 255, 0.15)";
                }}
              >
                <Calendar style={{ width: "16px", height: "16px" }} />
                This Week's Plan
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
                          <Star style={{ width: "14px", height: "14px", fill: "#f59e0b", color: "#f59e0b" }} />
                          <span style={{ fontSize: "13px", color: "#f59e0b", fontWeight: 600 }}>{meal.rating}</span>
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
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
