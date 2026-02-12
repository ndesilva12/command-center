"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Calendar, ShoppingCart, RefreshCw, Check, ChefHat, X, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { syncManualSelectionsToWeeklyPlan } from "@/lib/meal-plan-sync";
import { moveMeal, removeMeal } from "@/lib/move-meal";

interface Meal {
  id: string;
  name: string;
  prepTime: number;
  cookTime: number;
  frequency: string;
  tags: string[];
  ingredients: any[];
  instructions: string[];
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
  proposedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

function MealPlanContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'this-week' | 'next-week' | 'shopping' | 'all-recipes'>(
    (tabParam === 'next-week' || tabParam === 'shopping') ? tabParam as any : 'this-week'
  );
  const [currentWeek, setCurrentWeek] = useState<WeeklyPlan | null>(null);
  const [nextWeek, setNextWeek] = useState<WeeklyPlan | null>(null);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [movingDay, setMovingDay] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // Calculate next week's Monday
  const getNextWeekMonday = () => {
    const now = new Date();
    const currentMonday = getMonday(now);
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return nextMonday.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Sync manual selections to weekly plan for next week
      if (user) {
        const nextWeekMonday = getNextWeekMonday();
        console.log('Syncing manual selections for', nextWeekMonday);
        const result = await syncManualSelectionsToWeeklyPlan(user.uid, nextWeekMonday);
        console.log('Sync result:', result);
      }
      
      // Fetch all plans from Firestore
      const plansSnapshot = await getDocs(collection(db, 'weekly_plans'));
      const plans: WeeklyPlan[] = [];
      plansSnapshot.forEach((doc) => {
        plans.push({ id: doc.id, ...doc.data() } as WeeklyPlan);
      });
      
      // Fetch all meals from Firestore
      const mealsSnapshot = await getDocs(collection(db, 'meals'));
      const meals: Meal[] = [];
      mealsSnapshot.forEach((doc) => {
        const data = doc.data();
        meals.push({
          id: doc.id,
          name: data.name || data.title,
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          frequency: data.frequency,
          tags: data.tags || [],
          ingredients: data.ingredients || [],
          instructions: data.instructions || []
        });
      });
      setAllMeals(meals);
      
      // Find current and next week
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

  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const handleChangeMeal = (day: string, weekType: 'current' | 'next') => {
    setSelectedDay(day);
    const week = weekType === 'current' ? currentWeek : nextWeek;
    const currentMealId = week?.meals[day as keyof typeof week.meals]?.mealId;
    setSelectedMealId(currentMealId || null);
    setShowMealSelector(true);
  };

  const handleSelectMeal = async (mealId: string, mealName: string) => {
    if (!selectedDay) return;
    
    const week = currentWeek; // For now, only editing current week
    if (!week) return;
    
    const updatedMeals = {
      ...week.meals,
      [selectedDay]: { mealId, mealName }
    };
    
    try {
      await fetch(`https://the-dashboard-50be1-default-rtdb.firebaseio.com/weekly_plans/${week.id}/meals.json`, {
        method: 'PUT',
        body: JSON.stringify(updatedMeals)
      });
      
      await fetch(`https://the-dashboard-50be1-default-rtdb.firebaseio.com/weekly_plans/${week.id}/updatedAt.json`, {
        method: 'PUT',
        body: JSON.stringify(new Date().toISOString())
      });
      
      fetchData();
      setShowMealSelector(false);
      setSelectedDay(null);
    } catch (error) {
      console.error("Error updating meal:", error);
    }
  };

  const handleApprovePlan = async () => {
    if (!nextWeek) return;
    
    try {
      await fetch(`https://the-dashboard-50be1-default-rtdb.firebaseio.com/weekly_plans/${nextWeek.id}/status.json`, {
        method: 'PUT',
        body: JSON.stringify('approved')
      });
      
      await fetch(`https://the-dashboard-50be1-default-rtdb.firebaseio.com/weekly_plans/${nextWeek.id}/approvedAt.json`, {
        method: 'PUT',
        body: JSON.stringify(new Date().toISOString())
      });
      
      fetchData();
    } catch (error) {
      console.error("Error approving plan:", error);
    }
  };

  const handleMoveMeal = async (fromDay: string, toDay: string) => {
    if (!nextWeek) return;
    const result = await moveMeal(nextWeek.weekOf, fromDay, toDay);
    if (result.success) {
      await fetchData();
      setMovingDay(null);
    } else {
      alert(result.message);
    }
  };

  const handleRemoveMeal = async (day: string) => {
    if (!nextWeek) return;
    if (!confirm("Remove this meal from the plan?")) return;
    const result = await removeMeal(nextWeek.weekOf, day);
    if (result.success) {
      await fetchData();
    } else {
      alert(result.message);
    }
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
  
  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'proposed': return '#3b82f6';
      case 'approved': return '#10b981';
      case 'current': return '#00aaff';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'proposed': return 'Proposed - Review & Approve';
      case 'approved': return 'Approved for Next Week';
      case 'current': return 'This Week';
      default: return status;
    }
  };

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

  const WeekView = ({ week, title, canEdit, weekType }: { week: WeeklyPlan | null; title: string; canEdit: boolean; weekType: 'current' | 'next' }) => (
    <div>
      {week && week.status && (
        <div style={{ marginBottom: "24px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: getStatusColor(week.status),
              backgroundColor: `${getStatusColor(week.status)}20`,
              border: `1px solid ${getStatusColor(week.status)}40`,
            }}
          >
            {week.status === 'approved' && <Check style={{ width: "16px", height: "16px" }} />}
            {getStatusLabel(week.status)}
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {days.map(day => {
          const meal = week?.meals[day];
          const availableDays = days.filter(d => d !== day && !week?.meals[d]);
          
          return (
            <div
              key={day}
              className="glass"
              style={{
                padding: "20px",
                borderRadius: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: meal && weekType === 'next' ? "12px" : 0 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--foreground-muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    {getDayLabel(day)}
                  </div>
                  {meal ? (
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        display: "inline-flex",
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
              </div>
              
              {meal && weekType === 'next' && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {availableDays.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleMoveMeal(day, e.target.value);
                        }
                      }}
                      value=""
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(0, 170, 255, 0.3)",
                        background: "rgba(0, 170, 255, 0.1)",
                        color: "#00aaff",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <option value="">Move to...</option>
                      {availableDays.map(d => (
                        <option key={d} value={d}>{getDayLabel(d)}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => handleRemoveMeal(day)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <X style={{ width: "14px", height: "14px", display: "inline" }} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {week && week.status === 'proposed' && weekType === 'next' && (
        <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
          <button
            onClick={handleApprovePlan}
            style={{
              flex: 1,
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Check style={{ width: "16px", height: "16px", display: "inline", marginRight: "8px" }} />
            Approve Plan
          </button>
        </div>
      )}
    </div>
  );

  return (
    <ProtectedRoute requiredPermission="meal-plan">
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="meals" />

      <main style={{
        paddingTop: isMobile ? "80px" : "136px",
        paddingBottom: isMobile ? "80px" : "96px",
        minHeight: `calc(100vh - ${isMobile ? "160px" : "232px"})`
      }}>
        <div style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: isMobile ? "0 8px" : "0 24px"
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? "16px" : "24px", gap: "8px" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: isMobile ? "20px" : "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px", display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px" }}>
                <Calendar style={{ width: isMobile ? "20px" : "28px", height: isMobile ? "20px" : "28px", color: "#00aaff", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Meal Planning</span>
              </h1>
              {!isMobile && (
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  Weekly meal schedule and shopping list
                </p>
              )}
            </div>

            <a
              href="/tools/meals"
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "4px" : "8px",
                padding: isMobile ? "8px 12px" : "10px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--foreground-muted)",
                fontSize: isMobile ? "12px" : "14px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s",
                flexShrink: 0,
                whiteSpace: "nowrap",
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
              <ArrowLeft style={{ width: "14px", height: "14px", flexShrink: 0 }} />
              {isMobile ? "Recipes" : "All Recipes"}
            </a>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: isMobile ? "4px" : "8px", marginBottom: isMobile ? "16px" : "32px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "0", overflowX: "auto" }}>
            {[
              { id: 'this-week', label: isMobile ? "This Week" : "This Week's Meals" },
              { id: 'next-week', label: isMobile ? "Next Week" : "Next Week's Meals" },
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
          ) : activeTab === 'this-week' ? (
            currentWeek ? (
              <WeekView week={currentWeek} title="This Week" canEdit={true} weekType="current" />
            ) : (
              <div className="glass" style={{ textAlign: "center", padding: isMobile ? "40px 16px" : "60px 20px", borderRadius: "12px" }}>
                <Calendar style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>{toolCustom.name}</h2>
                <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                  A meal plan will be generated automatically
                </p>
              </div>
            )
          ) : activeTab === 'next-week' ? (
            nextWeek ? (
              <div>
                {!isMobile && (
                  <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(0, 170, 255, 0.1)", border: "1px solid rgba(0, 170, 255, 0.3)" }}>
                    <p style={{ fontSize: "13px", color: "var(--foreground)", margin: 0 }}>
                      💡 <strong>Tip:</strong> Add meals from the <a href="/tools/meals" style={{ color: "#00aaff", textDecoration: "underline" }}>All Recipes</a> page
                    </p>
                  </div>
                )}
                <WeekView week={nextWeek} title="Next Week" canEdit={nextWeek.status !== 'archived'} weekType="next" />
              </div>
            ) : (
              <div className="glass" style={{ textAlign: "center", padding: isMobile ? "40px 16px" : "60px 20px", borderRadius: "12px" }}>
                <Calendar style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Next week's plan coming soon
                </h2>
                <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "16px" }}>
                  Will be proposed Friday at 6pm ET
                </p>
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                  💡 You can add meals now from the <a href="/tools/meals" style={{ color: "#00aaff", textDecoration: "underline" }}>All Recipes</a> page
                </p>
              </div>
            )
          ) : (
            /* Shopping List Tab */
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
                    Shopping list will be generated with next week's meal plan
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Meal Selector Modal */}
      {showMealSelector && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setShowMealSelector(false)}
        >
          <div
            className="glass"
            style={{
              maxWidth: "800px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              borderRadius: "16px",
              padding: "32px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
                Select Meal for {selectedDay && getDayLabel(selectedDay)}
              </h2>
              <button
                onClick={() => setShowMealSelector(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--foreground-muted)",
                  cursor: "pointer",
                  padding: "8px",
                }}
              >
                <X style={{ width: "24px", height: "24px" }} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
              {allMeals.map(meal => (
                <div
                  key={meal.id}
                  onClick={() => handleSelectMeal(meal.id, meal.name)}
                  className="glass"
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: selectedMealId === meal.id ? "2px solid #00aaff" : "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#00aaff";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = selectedMealId === meal.id ? "#00aaff" : "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    {meal.name}
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                    {meal.prepTime + meal.cookTime} min total
                  </p>
                  {meal.tags.length > 0 && (
                    <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {meal.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            color: "var(--foreground-muted)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

export default function MealPlanPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('meal-plan', 'Meal Plan', '#6366f1');
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
