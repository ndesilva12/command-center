"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { Calendar, ShoppingCart, RefreshCw, Check, ChefHat } from "lucide-react";

interface WeeklyPlan {
  id: string;
  weekOf: string;
  status: 'draft' | 'proposed' | 'approved' | 'archived';
  meals: {
    monday?: { mealId: string; mealName: string };
    tuesday?: { mealId: string; mealName: string };
    wednesday?: { mealId: string; mealName: string };
    thursday?: { mealId: string; mealName: string };
    friday?: { mealId: string; mealName: string };
  };
  proposedAt?: string;
  approvedAt?: string;
}

export default function MealPlanPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      // Get current week's plan from Firebase
      const response = await fetch('https://the-dashboard-50be1-default-rtdb.firebaseio.com/weekly_plans.json');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          // Find current week's plan (most recent)
          const plans = Object.entries(data).map(([id, plan]: [string, any]) => ({
            id,
            ...plan,
          })) as WeeklyPlan[];
          
          // Sort by weekOf date descending
          plans.sort((a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime());
          
          if (plans.length > 0) {
            setPlan(plans[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching meal plan:", error);
    } finally {
      setLoading(false);
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
      case 'draft': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'proposed': return 'Proposed - Review & Approve';
      case 'approved': return 'Approved';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="meals" />

      <main style={{ paddingTop: "136px", paddingBottom: "96px", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
                <Calendar style={{ width: "28px", height: "28px", color: "#00aaff" }} />
                This Week's Meal Plan
              </h1>
              {plan && (
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  Week of {new Date(plan.weekOf).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <a
                href="/tools/shopping-list"
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
                <ShoppingCart style={{ width: "16px", height: "16px" }} />
                Shopping List
              </a>
            </div>
          </div>

          {loading ? (
            <div className="glass" style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px" }}>
              <p style={{ color: "var(--foreground-muted)" }}>Loading meal plan...</p>
            </div>
          ) : !plan ? (
            <div className="glass" style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px" }}>
              <Calendar style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                No meal plan yet
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                Your first meal plan will be generated automatically this Friday at 6pm ET
              </p>
            </div>
          ) : (
            <>
              {/* Status Badge */}
              {plan.status && (
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
                      color: getStatusColor(plan.status),
                      backgroundColor: `${getStatusColor(plan.status)}20`,
                      border: `1px solid ${getStatusColor(plan.status)}40`,
                    }}
                  >
                    {plan.status === 'approved' && <Check style={{ width: "16px", height: "16px" }} />}
                    {getStatusLabel(plan.status)}
                  </span>
                </div>
              )}

              {/* Weekly Schedule */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {days.map(day => {
                  const meal = plan.meals[day];
                  
                  return (
                    <div
                      key={day}
                      className="glass"
                      style={{
                        padding: "20px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--foreground-muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>
                          {getDayLabel(day)}
                        </div>
                        {meal ? (
                          <a
                            href={`/tools/meals/${meal.mealId}`}
                            style={{
                              fontSize: "18px",
                              fontWeight: 600,
                              color: "var(--foreground)",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#00aaff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--foreground)";
                            }}
                          >
                            <ChefHat style={{ width: "20px", height: "20px" }} />
                            {meal.mealName}
                          </a>
                        ) : (
                          <p style={{ fontSize: "16px", color: "var(--foreground-muted)", fontStyle: "italic" }}>
                            No meal planned
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              {plan.status === 'proposed' && (
                <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                  <button
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
                  
                  <button
                    style={{
                      padding: "12px 24px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    }}
                  >
                    <RefreshCw style={{ width: "16px", height: "16px", display: "inline", marginRight: "8px" }} />
                    Regenerate
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
