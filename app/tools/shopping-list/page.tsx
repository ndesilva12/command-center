"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ShoppingCart, Check, Calendar } from "lucide-react";

interface ShoppingItem {
  item: string;
  quantity: number;
  unit: string;
  checked: boolean;
}

interface WeeklyPlan {
  shoppingList?: {
    wholefoods: ShoppingItem[];
    traderjoes: ShoppingItem[];
  };
}

export default function ShoppingListPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShoppingList();
  }, []);

  const fetchShoppingList = async () => {
    try {
      const response = await fetch('https://the-dashboard-50be1-default-rtdb.firebaseio.com/weekly_plans.json');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          const plans = Object.values(data) as WeeklyPlan[];
          plans.sort((a: any, b: any) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime());
          if (plans.length > 0) {
            setPlan(plans[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching shopping list:", error);
    } finally {
      setLoading(false);
    }
  };

  const wholeFoodsItems = plan?.shoppingList?.wholefoods || [];
  const traderJoesItems = plan?.shoppingList?.traderjoes || [];

  const toggleItem = (store: 'wholefoods' | 'traderjoes', index: number) => {
    // TODO: Implement toggle functionality
    console.log(`Toggle ${store} item ${index}`);
  };

  const StoreSection = ({ title, items, store }: { title: string; items: ShoppingItem[]; store: 'wholefoods' | 'traderjoes' }) => (
    <div className="glass" style={{ padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
        {title} ({items.filter(i => !i.checked).length} items)
      </h2>
      
      {items.length === 0 ? (
        <p style={{ color: "var(--foreground-muted)", fontSize: "14px", fontStyle: "italic" }}>
          No items for this store
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((item, index) => (
            <label
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: item.checked ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                cursor: "pointer",
                transition: "all 0.2s",
                textDecoration: item.checked ? "line-through" : "none",
                opacity: item.checked ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!item.checked) {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = item.checked ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(store, index)}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "#00aaff",
                  cursor: "pointer",
                }}
              />
              <span style={{ flex: 1, fontSize: "15px", color: "var(--foreground)" }}>
                {item.quantity} {item.unit} {item.item}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <ProtectedRoute requiredPermission="shopping-list">
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="meals" />

      <main style={{ paddingTop: "136px", paddingBottom: "96px", minHeight: "100vh" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
                <ShoppingCart style={{ width: "28px", height: "28px", color: "#00aaff" }} />
                Shopping List
              </h1>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Grocery list for this week's meals
              </p>
            </div>

            <a
              href="/tools/meal-plan"
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
                textDecoration: "none",
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
              <Calendar style={{ width: "16px", height: "16px" }} />
              Back to Meal Plan
            </a>
          </div>

          {loading ? (
            <div className="glass" style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px" }}>
              <p style={{ color: "var(--foreground-muted)" }}>Loading shopping list...</p>
            </div>
          ) : wholeFoodsItems.length === 0 && traderJoesItems.length === 0 ? (
            <div className="glass" style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px" }}>
              <ShoppingCart style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                No shopping list yet
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                Your shopping list will be generated automatically on Saturday morning at 9am ET
              </p>
            </div>
          ) : (
            <>
              <StoreSection title="Whole Foods" items={wholeFoodsItems} store="wholefoods" />
              <StoreSection title="Trader Joe's" items={traderJoesItems} store="traderjoes" />
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
