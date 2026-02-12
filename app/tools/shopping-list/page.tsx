"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ShoppingCart, Package } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface WeeklyPlan {
  shoppingList?: {
    wholefoods?: string[];
    traderjoes?: string[];
    either?: string[];
  };
  weekOf: string;
}

interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
  expirationDate?: string;
  category?: string;
}

export default function ShoppingListPage() {
  const [activeTab, setActiveTab] = useState<'shopping' | 'inventory'>('shopping');
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get next Monday's date
      const now = new Date();
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      const nextWeekOf = nextMonday.toISOString().split('T')[0];
      
      // Fetch all plans and find next week
      const plansSnapshot = await getDocs(collection(db, 'weekly_plans'));
      
      plansSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.weekOf === nextWeekOf) {
          setPlan({ ...data, weekOf: data.weekOf } as WeeklyPlan);
        }
      });

      // TODO: Fetch inventory data from Firestore when implemented
      // For now, using placeholder data
      setInventory([]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const wholeFoodsItems = plan?.shoppingList?.wholefoods || [];
  const traderJoesItems = plan?.shoppingList?.traderjoes || [];
  const eitherItems = plan?.shoppingList?.either || [];

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
      <div className="glass" style={{ 
        padding: isMobile ? "16px 12px" : "20px", 
        borderRadius: "12px", 
        marginBottom: "12px" 
      }}>
        <h2 style={{ 
          fontSize: isMobile ? "16px" : "18px", 
          fontWeight: 600, 
          color: "var(--foreground)", 
          marginBottom: "12px" 
        }}>
          {title} <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>({uncheckedCount})</span>
        </h2>
        
        {items.length === 0 ? (
          <p style={{ 
            color: "var(--foreground-muted)", 
            fontSize: "14px", 
            fontStyle: "italic",
            margin: 0 
          }}>
            No items for this store
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                    padding: isMobile ? "12px" : "14px",
                    minHeight: "44px", // Thumb-friendly tap target
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
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: "15px",
                      color: isChecked ? "var(--foreground-muted)" : "var(--foreground)",
                      textDecoration: isChecked ? "line-through" : "none",
                      lineHeight: 1.5,
                      wordBreak: "break-word",
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

  const ShoppingListContent = () => (
    <div>
      {plan?.shoppingList ? (
        <>
          {!isMobile && (
            <div style={{ 
              marginBottom: "16px", 
              padding: "10px 12px", 
              borderRadius: "8px", 
              backgroundColor: "rgba(0, 170, 255, 0.1)", 
              border: "1px solid rgba(0, 170, 255, 0.3)" 
            }}>
              <p style={{ fontSize: "13px", color: "var(--foreground)", margin: 0 }}>
                🛒 Shopping list for <strong>next week</strong> ({plan.weekOf})
              </p>
            </div>
          )}
          
          <StoreSection 
            title="Whole Foods" 
            items={wholeFoodsItems} 
            keyPrefix="wholefoods" 
          />
          
          <StoreSection 
            title="Trader Joe's" 
            items={traderJoesItems} 
            keyPrefix="traderjoes" 
          />
          
          <StoreSection 
            title="Either Store" 
            items={eitherItems} 
            keyPrefix="either" 
          />
        </>
      ) : (
        <div className="glass" style={{ 
          textAlign: "center", 
          padding: isMobile ? "40px 16px" : "60px 20px", 
          borderRadius: "12px" 
        }}>
          <ShoppingCart style={{ 
            width: "48px", 
            height: "48px", 
            color: "#00aaff", 
            margin: "0 auto 16px" 
          }} />
          <h2 style={{ 
            fontSize: "18px", 
            fontWeight: 600, 
            color: "var(--foreground)", 
            marginBottom: "8px" 
          }}>
            No shopping list yet
          </h2>
          <p style={{ 
            color: "var(--foreground-muted)", 
            fontSize: "14px",
            margin: 0 
          }}>
            Your shopping list will be generated when you create a meal plan
          </p>
        </div>
      )}
    </div>
  );

  const InventoryContent = () => (
    <div>
      {inventory.length > 0 ? (
        <div className="glass" style={{ 
          padding: isMobile ? "16px 12px" : "20px", 
          borderRadius: "12px" 
        }}>
          {/* TODO: Display inventory items */}
          <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
            Inventory items will appear here
          </p>
        </div>
      ) : (
        <div className="glass" style={{ 
          textAlign: "center", 
          padding: isMobile ? "40px 16px" : "60px 20px", 
          borderRadius: "12px" 
        }}>
          <Package style={{ 
            width: "48px", 
            height: "48px", 
            color: "#00aaff", 
            margin: "0 auto 16px" 
          }} />
          <h2 style={{ 
            fontSize: "18px", 
            fontWeight: 600, 
            color: "var(--foreground)", 
            marginBottom: "8px" 
          }}>
            No inventory tracked yet
          </h2>
          <p style={{ 
            color: "var(--foreground-muted)", 
            fontSize: "14px",
            margin: 0 
          }}>
            Track your pantry items, expiration dates, and quantities
          </p>
        </div>
      )}
    </div>
  );

  return (
    <ProtectedRoute requiredPermission="shopping-list">
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="meals" />

      <main style={{
        paddingTop: isMobile ? "80px" : "136px",
        paddingBottom: isMobile ? "calc(80px + env(safe-area-inset-bottom))" : "96px",
        paddingLeft: isMobile ? "8px" : "0",
        paddingRight: isMobile ? "8px" : "0",
        minHeight: `calc(100vh - ${isMobile ? "160px" : "232px"})`
      }}>
        <div style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: isMobile ? "0 4px" : "0 24px"
        }}>
          {/* Header */}
          <div style={{ 
            marginBottom: isMobile ? "12px" : "16px"
          }}>
            <h1 style={{ 
              fontSize: isMobile ? "20px" : "28px", 
              fontWeight: 700, 
              color: "var(--foreground)", 
              marginBottom: "4px", 
              display: "flex", 
              alignItems: "center", 
              gap: isMobile ? "8px" : "12px" 
            }}>
              <ShoppingCart style={{ 
                width: isMobile ? "20px" : "28px", 
                height: isMobile ? "20px" : "28px", 
                color: "#00aaff",
                flexShrink: 0 
              }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Shopping & Inventory
              </span>
            </h1>
            {!isMobile && (
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Grocery list and pantry tracking
              </p>
            )}
          </div>

          {/* Tabs */}
          <div style={{ 
            display: "flex", 
            gap: isMobile ? "4px" : "8px", 
            marginBottom: isMobile ? "16px" : "24px", 
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)", 
            paddingBottom: "0", 
            overflowX: "auto",
            WebkitOverflowScrolling: "touch"
          }}>
            {[
              { id: 'shopping', label: isMobile ? "Shopping" : "Shopping List", icon: ShoppingCart },
              { id: 'inventory', label: "Inventory", icon: Package },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: isMobile ? "10px 16px" : "12px 20px",
                  minHeight: "44px", // Thumb-friendly
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
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
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
                <tab.icon style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="glass" style={{ 
              textAlign: "center", 
              padding: isMobile ? "40px 16px" : "60px 20px", 
              borderRadius: "12px" 
            }}>
              <p style={{ color: "var(--foreground-muted)" }}>Loading...</p>
            </div>
          ) : activeTab === 'shopping' ? (
            <ShoppingListContent />
          ) : (
            <InventoryContent />
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
