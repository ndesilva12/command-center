"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { 
  ShoppingBag, Plus, Search, Filter, X, 
  Star, Trash2, List, Share2, Link as LinkIcon,
  ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { db } from "@/lib/firebase";
import { 
  collection, getDocs, addDoc, deleteDoc, doc, 
  updateDoc, serverTimestamp 
} from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

interface ShoppingItem {
  id: string;
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  price?: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  tags: string[];
  createdAt: string;
}

interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  itemIds: string[];
  createdAt: string;
  sharedWith?: string[];
}

export default function ShoppingPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('shopping', 'Shopping', '#10b981');
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'items' | 'lists'>('items');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  
  const [newItem, setNewItem] = useState({
    url: '',
    title: '',
    description: '',
    imageUrl: '',
    price: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    category: '',
    tags: '',
  });
  
  const [newList, setNewList] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch items
      const itemsSnapshot = await getDocs(collection(db, "shopping_items"));
      const itemsData: ShoppingItem[] = [];
      itemsSnapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() } as ShoppingItem);
      });
      setItems(itemsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      // Fetch lists
      const listsSnapshot = await getDocs(collection(db, "shopping_lists"));
      const listsData: ShoppingList[] = [];
      listsSnapshot.forEach((doc) => {
        listsData.push({ id: doc.id, ...doc.data() } as ShoppingList);
      });
      setLists(listsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title.trim() || !user) {
      alert("Title is required");
      return;
    }
    
    try {
      const tagsArray = newItem.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      await addDoc(collection(db, "shopping_items"), {
        url: newItem.url,
        title: newItem.title,
        description: newItem.description,
        imageUrl: newItem.imageUrl,
        price: newItem.price,
        priority: newItem.priority,
        category: newItem.category,
        tags: tagsArray,
        createdAt: new Date().toISOString(),
        userId: user.uid,
      });
      
      setShowAddItemModal(false);
      setNewItem({
        url: '',
        title: '',
        description: '',
        imageUrl: '',
        price: '',
        priority: 'medium',
        category: '',
        tags: '',
      });
      await fetchData();
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Delete this item?")) return;
    
    try {
      await deleteDoc(doc(db, "shopping_items", itemId));
      await fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  const handleCreateList = async () => {
    if (!newList.name.trim() || !user) {
      alert("List name is required");
      return;
    }
    
    try {
      await addDoc(collection(db, "shopping_lists"), {
        name: newList.name,
        description: newList.description,
        itemIds: [],
        createdAt: new Date().toISOString(),
        userId: user.uid,
        sharedWith: [],
      });
      
      setShowCreateListModal(false);
      setNewList({ name: '', description: '' });
      await fetchData();
    } catch (error) {
      console.error("Error creating list:", error);
      alert("Failed to create list");
    }
  };

  const handleAddToList = async (listId: string, itemId: string) => {
    try {
      const list = lists.find(l => l.id === listId);
      if (!list) return;
      
      const updatedItemIds = [...list.itemIds, itemId];
      await updateDoc(doc(db, "shopping_lists", listId), {
        itemIds: updatedItemIds,
      });
      
      await fetchData();
    } catch (error) {
      console.error("Error adding to list:", error);
      alert("Failed to add to list");
    }
  };

  const handleRemoveFromList = async (listId: string, itemId: string) => {
    try {
      const list = lists.find(l => l.id === listId);
      if (!list) return;
      
      const updatedItemIds = list.itemIds.filter(id => id !== itemId);
      await updateDoc(doc(db, "shopping_lists", listId), {
        itemIds: updatedItemIds,
      });
      
      await fetchData();
    } catch (error) {
      console.error("Error removing from list:", error);
      alert("Failed to remove from list");
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Delete this list?")) return;
    
    try {
      await deleteDoc(doc(db, "shopping_lists", listId));
      await fetchData();
    } catch (error) {
      console.error("Error deleting list:", error);
      alert("Failed to delete list");
    }
  };

  const handleShareList = async (list: ShoppingList) => {
    const shareUrl = `${window.location.origin}/tools/shopping?list=${list.id}`;
    await navigator.clipboard.writeText(shareUrl);
    alert("Share link copied to clipboard!");
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesPriority = !filterPriority || item.priority === filterPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const allCategories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#6366f1';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch(priority) {
      case 'high': return 'High Priority';
      case 'medium': return 'Medium Priority';
      case 'low': return 'Low Priority';
      default: return 'Priority';
    }
  };

  return (
    <ProtectedRoute requiredPermission="shopping">
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="shopping" />

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
                <ShoppingBag style={{ width: isMobile ? "20px" : "28px", height: isMobile ? "20px" : "28px", color: "#10b981" }} />
                <span>{toolCustom.name}</span>
              </h1>
              {!isMobile && (
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  {items.length} items • {lists.length} lists
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <button
                onClick={() => activeTab === 'items' ? setShowAddItemModal(true) : setShowCreateListModal(true)}
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
                {activeTab === 'items' ? 'Add Item' : 'Create List'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: isMobile ? "4px" : "8px", marginBottom: isMobile ? "16px" : "32px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "0" }}>
            {[
              { id: 'items', label: 'All Items', icon: ShoppingBag },
              { id: 'lists', label: 'Lists', icon: List },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: isMobile ? "10px 12px" : "12px 20px",
                  borderRadius: "8px 8px 0 0",
                  border: "none",
                  background: activeTab === tab.id ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  color: activeTab === tab.id ? "#10b981" : "var(--foreground-muted)",
                  fontSize: isMobile ? "13px" : "14px",
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderBottom: activeTab === tab.id ? "2px solid #10b981" : "2px solid transparent",
                  whiteSpace: "nowrap",
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
                <tab.icon style={{ width: "16px", height: "16px" }} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'items' ? (
            /* ITEMS TAB */
            <div>
              {/* Search & Filters */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                <div className="glass" style={{ flex: 1, minWidth: "200px", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px" }}>
                  <Search style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "14px" }}
                  />
                </div>

                {allCategories.length > 0 && (
                  <div className="glass" style={{ padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Filter style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
                    <select
                      value={filterCategory || ""}
                      onChange={(e) => setFilterCategory(e.target.value || null)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--foreground)",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">All Categories</option>
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="glass" style={{ padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Star style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
                  <select
                    value={filterPriority || ""}
                    onChange={(e) => setFilterPriority(e.target.value || null)}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Items Grid */}
              {filteredItems.length === 0 ? (
                <div className="glass" style={{ padding: "60px 24px", borderRadius: "12px", textAlign: "center" }}>
                  <ShoppingBag style={{ width: "48px", height: "48px", color: "#10b981", margin: "0 auto 16px" }} />
                  <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    {searchQuery || filterCategory || filterPriority ? "No items found" : "No items yet"}
                  </h2>
                  <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                    {searchQuery || filterCategory || filterPriority 
                      ? "Try adjusting your search or filters"
                      : "Click 'Add Item' to add your first shopping item"}
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="glass"
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#10b981";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {item.imageUrl && (
                        <div style={{ 
                          width: "100%", 
                          height: "150px", 
                          borderRadius: "8px", 
                          overflow: "hidden", 
                          marginBottom: "12px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)"
                        }}>
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      )}
                      
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", flex: 1 }}>
                            {item.title}
                          </h3>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            style={{
                              padding: "4px",
                              borderRadius: "4px",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                              color: "#ef4444",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Trash2 style={{ width: "12px", height: "12px" }} />
                          </button>
                        </div>
                        
                        {item.description && (
                          <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "8px", lineHeight: 1.4 }}>
                            {item.description.substring(0, 100)}{item.description.length > 100 ? '...' : ''}
                          </p>
                        )}
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontWeight: 600,
                              color: getPriorityColor(item.priority),
                              backgroundColor: `${getPriorityColor(item.priority)}20`,
                              border: `1px solid ${getPriorityColor(item.priority)}40`,
                            }}
                          >
                            {getPriorityLabel(item.priority)}
                          </span>
                          
                          {item.category && (
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                backgroundColor: "rgba(16, 185, 129, 0.1)",
                                color: "#10b981",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                              }}
                            >
                              {item.category}
                            </span>
                          )}
                          
                          {item.price && (
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
                              {item.price}
                            </span>
                          )}
                        </div>
                        
                        {item.tags.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                            {item.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
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
                      
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              backgroundColor: "rgba(16, 185, 129, 0.1)",
                              color: "#10b981",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              textDecoration: "none",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.1)";
                            }}
                          >
                            <ExternalLink style={{ width: "12px", height: "12px" }} />
                            View
                          </a>
                        )}
                        
                        {lists.length > 0 && (
                          <div style={{ position: "relative" }}>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAddToList(e.target.value, item.id);
                                  e.target.value = "";
                                }
                              }}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid rgba(0, 170, 255, 0.3)",
                                backgroundColor: "rgba(0, 170, 255, 0.1)",
                                color: "#00aaff",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <option value="">Add to List</option>
                              {lists.map(list => (
                                <option key={list.id} value={list.id}>{list.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* LISTS TAB */
            <div>
              {lists.length === 0 ? (
                <div className="glass" style={{ padding: "60px 24px", borderRadius: "12px", textAlign: "center" }}>
                  <List style={{ width: "48px", height: "48px", color: "#10b981", margin: "0 auto 16px" }} />
                  <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    No lists yet
                  </h2>
                  <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                    Click 'Create List' to organize your shopping items
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {lists.map((list) => {
                    const listItems = items.filter(item => list.itemIds.includes(item.id));
                    const isExpanded = expandedList === list.id;
                    
                    return (
                      <div
                        key={list.id}
                        className="glass"
                        style={{
                          padding: "20px",
                          borderRadius: "12px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                              {list.name}
                            </h3>
                            {list.description && (
                              <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "8px" }}>
                                {list.description}
                              </p>
                            )}
                            <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                              {listItems.length} items
                            </p>
                          </div>
                          
                          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <button
                              onClick={() => handleShareList(list)}
                              style={{
                                padding: "8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(0, 170, 255, 0.3)",
                                backgroundColor: "rgba(0, 170, 255, 0.1)",
                                color: "#00aaff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Share2 style={{ width: "14px", height: "14px" }} />
                            </button>
                            
                            <button
                              onClick={() => setExpandedList(isExpanded ? null : list.id)}
                              style={{
                                padding: "8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                backgroundColor: "rgba(16, 185, 129, 0.1)",
                                color: "#10b981",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp style={{ width: "14px", height: "14px" }} />
                              ) : (
                                <ChevronDown style={{ width: "14px", height: "14px" }} />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteList(list.id)}
                              style={{
                                padding: "8px",
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
                              <Trash2 style={{ width: "14px", height: "14px" }} />
                            </button>
                          </div>
                        </div>
                        
                        {isExpanded && listItems.length > 0 && (
                          <div style={{ 
                            marginTop: "16px", 
                            paddingTop: "16px", 
                            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                            gap: "12px"
                          }}>
                            {listItems.map(item => (
                              <div
                                key={item.id}
                                style={{
                                  padding: "12px",
                                  borderRadius: "8px",
                                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                                  border: "1px solid rgba(255, 255, 255, 0.05)",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "8px" }}>
                                  <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                                      {item.title}
                                    </p>
                                    {item.price && (
                                      <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                                        {item.price}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleRemoveFromList(list.id, item.id)}
                                    style={{
                                      padding: "4px",
                                      borderRadius: "4px",
                                      border: "none",
                                      backgroundColor: "transparent",
                                      color: "var(--foreground-muted)",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <X style={{ width: "12px", height: "12px" }} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Item Modal */}
      {showAddItemModal && (
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
          onClick={() => setShowAddItemModal(false)}
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
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "8px" }}>
              Add Shopping Item
            </h2>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
              Add a new item to your shopping collection
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="e.g., Nike Air Max Sneakers"
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
                  URL
                </label>
                <input
                  type="url"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  placeholder="https://..."
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
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={newItem.imageUrl}
                    onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                    placeholder="https://..."
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
                    Price
                  </label>
                  <input
                    type="text"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="$99.99"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    placeholder="e.g., Shoes"
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
                    Priority
                  </label>
                  <select
                    value={newItem.priority}
                    onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as any })}
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
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newItem.tags}
                  onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                  placeholder="e.g., sneakers, athletic, running"
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

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  onClick={() => setShowAddItemModal(false)}
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
                  onClick={handleAddItem}
                  disabled={!newItem.title.trim()}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: newItem.title.trim() 
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "rgba(255, 255, 255, 0.1)",
                    color: newItem.title.trim() ? "white" : "var(--foreground-muted)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: newItem.title.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {showCreateListModal && (
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
          }}
          onClick={() => setShowCreateListModal(false)}
        >
          <div
            className="glass"
            style={{
              maxWidth: "500px",
              width: "100%",
              padding: "32px",
              borderRadius: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "8px" }}>
              Create New List
            </h2>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
              Organize your shopping items into lists
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  List Name *
                </label>
                <input
                  type="text"
                  value={newList.name}
                  onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  placeholder="e.g., Summer Wardrobe"
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
                  Description
                </label>
                <textarea
                  value={newList.description}
                  onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
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

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  onClick={() => setShowCreateListModal(false)}
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
                  onClick={handleCreateList}
                  disabled={!newList.name.trim()}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: newList.name.trim() 
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "rgba(255, 255, 255, 0.1)",
                    color: newList.name.trim() ? "white" : "var(--foreground-muted)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: newList.name.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Create List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
