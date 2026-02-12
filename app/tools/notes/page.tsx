"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Search, RefreshCw, ExternalLink, Calendar, Edit, Database, File, ChevronDown, ChevronRight, Save, X } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";


interface TreeNode {
  id: string;
  type: 'page' | 'database';
  title: string;
  icon?: any;
  url?: string;
  children?: TreeNode[];
  hasChildren: boolean;
}

interface NotionPage {
  id: string;
  object: string;
  properties?: any;
  icon?: any;
  cover?: any;
  url?: string;
  last_edited_time?: string;
  title?: any;
}

interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}

export default function NotesPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('notes', 'Notes', '#6366f1');
  const [rootTree, setRootTree] = useState<TreeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<NotionPage | null>(null);
  const [pageContent, setPageContent] = useState<NotionBlock[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchNotionTree();
  }, []);

  const fetchNotionTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notion/tree');
      if (!res.ok) {
        throw new Error('Failed to fetch Notion tree');
      }

      const tree = await res.json();
      setRootTree(tree);
      // Auto-expand root
      setExpandedNodes(new Set([tree.id]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Notion data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async (nodeId: string) => {
    setLoadingChildren(prev => new Set(prev).add(nodeId));
    try {
      const res = await fetch(`/api/notion/tree?pageId=${nodeId}`);
      if (!res.ok) throw new Error('Failed to fetch children');

      const node = await res.json();

      // Update the tree with children
      const updateNode = (n: TreeNode): TreeNode => {
        if (n.id === nodeId) {
          return { ...n, children: node.children };
        }
        if (n.children) {
          return { ...n, children: n.children.map(updateNode) };
        }
        return n;
      };

      if (rootTree) {
        setRootTree(updateNode(rootTree));
      }
    } catch (err) {
      console.error('Error fetching children:', err);
    } finally {
      setLoadingChildren(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  };

  const toggleNode = async (nodeId: string, hasChildren: boolean) => {
    const isExpanded = expandedNodes.has(nodeId);

    if (isExpanded) {
      // Collapse
      setExpandedNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    } else {
      // Expand
      setExpandedNodes(prev => new Set(prev).add(nodeId));

      // Fetch children if not already loaded
      if (hasChildren) {
        const node = findNode(rootTree, nodeId);
        if (node && !node.children) {
          await fetchChildren(nodeId);
        }
      }
    }
  };

  const findNode = (node: TreeNode | null, nodeId: string): TreeNode | null => {
    if (!node) return null;
    if (node.id === nodeId) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, nodeId);
        if (found) return found;
      }
    }
    return null;
  };

  const fetchPageContent = async (pageId: string) => {
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/notion/pages/${pageId}`);
      if (!res.ok) throw new Error('Failed to fetch page content');

      const data = await res.json();
      setPageContent(data.blocks || []);
      setSelectedItem(data.page);
      setEditedTitle(getPageTitle(data.page));
    } catch (err) {
      console.error('Error fetching page content:', err);
      setPageContent([]);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!selectedItem || !editedTitle) return;

    try {
      const res = await fetch(`/api/notion/pages/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: {
            title: {
              title: [
                {
                  text: {
                    content: editedTitle,
                  },
                },
              ],
            },
          },
        }),
      });

      if (res.ok) {
        setEditing(false);
        fetchNotionTree();
        fetchPageContent(selectedItem.id);
      }
    } catch (err) {
      console.error('Error updating title:', err);
    }
  };

  const getPageTitle = (page: NotionPage): string => {
    if (page.properties) {
      const titleProp = Object.values(page.properties).find((prop: any) => prop.type === 'title') as any;
      if (titleProp && titleProp.title && titleProp.title[0]) {
        return titleProp.title[0].plain_text;
      }
    }
    return 'Untitled';
  };

  const getPageIcon = (page: NotionPage | TreeNode): string => {
    if (page.icon) {
      if (page.icon.type === 'emoji') return page.icon.emoji;
      if (page.icon.type === 'external') return '🔗';
      if (page.icon.type === 'file') return '📄';
    }
    if ('type' in page) {
      return page.type === 'database' ? '🗂️' : '📝';
    }
    return (page as NotionPage).object === 'database' ? '🗂️' : '📝';
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const isLoading = loadingChildren.has(node.id);
    const isSelected = selectedItem?.id === node.id;

    return (
      <div key={node.id}>
        <button
          onClick={() => {
            fetchPageContent(node.id);
            if (node.hasChildren) {
              toggleNode(node.id, node.hasChildren);
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            paddingLeft: `${12 + depth * 20}px`,
            width: "100%",
            background: isSelected ? "rgba(167, 139, 250, 0.15)" : "transparent",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--foreground)",
            fontSize: "13px",
            textAlign: "left",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          {node.hasChildren && (
            <span style={{ width: "14px", height: "14px", flexShrink: 0 }}>
              {isLoading ? (
                <RefreshCw style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
              ) : isExpanded ? (
                <ChevronDown style={{ width: "14px", height: "14px" }} />
              ) : (
                <ChevronRight style={{ width: "14px", height: "14px" }} />
              )}
            </span>
          )}
          {!node.hasChildren && <span style={{ width: "14px" }} />}
          <span>{getPageIcon(node)}</span>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.title}
          </span>
        </button>
        {isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderBlockContent = (block: NotionBlock): React.ReactNode => {
    const type = block.type;
    const content = block[type];

    if (!content) return null;

    switch (type) {
      case 'paragraph':
        return content.rich_text?.map((text: any, i: number) => (
          <span key={i}>{text.plain_text}</span>
        ));
      case 'heading_1':
        return (
          <h1 style={{ fontSize: "24px", fontWeight: 700, marginTop: "16px", marginBottom: "8px" }}>
            {content.rich_text?.map((text: any, i: number) => (
              <span key={i}>{text.plain_text}</span>
            ))}
          </h1>
        );
      case 'heading_2':
        return (
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginTop: "12px", marginBottom: "6px" }}>
            {content.rich_text?.map((text: any, i: number) => (
              <span key={i}>{text.plain_text}</span>
            ))}
          </h2>
        );
      case 'heading_3':
        return (
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "10px", marginBottom: "4px" }}>
            {content.rich_text?.map((text: any, i: number) => (
              <span key={i}>{text.plain_text}</span>
            ))}
          </h3>
        );
      case 'bulleted_list_item':
        return (
          <li style={{ marginLeft: "20px" }}>
            {content.rich_text?.map((text: any, i: number) => (
              <span key={i}>{text.plain_text}</span>
            ))}
          </li>
        );
      case 'numbered_list_item':
        return (
          <li style={{ marginLeft: "20px" }}>
            {content.rich_text?.map((text: any, i: number) => (
              <span key={i}>{text.plain_text}</span>
            ))}
          </li>
        );
      case 'to_do':
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <input type="checkbox" checked={content.checked} readOnly />
            {content.rich_text?.map((text: any, i: number) => (
              <span key={i}>{text.plain_text}</span>
            ))}
          </div>
        );
      case 'code':
        return (
          <pre style={{
            background: "rgba(255, 255, 255, 0.05)",
            padding: "12px",
            borderRadius: "6px",
            overflow: "auto",
            fontSize: "13px",
            fontFamily: "monospace",
            marginTop: "8px",
          }}>
            <code>
              {content.rich_text?.map((text: any, i: number) => (
                <span key={i}>{text.plain_text}</span>
              ))}
            </code>
          </pre>
        );
      default:
        return null;
    }
  };

  const filterTree = (node: TreeNode | null, query: string): TreeNode | null => {
    if (!node) return null;
    if (!query) return node;

    const matches = node.title.toLowerCase().includes(query.toLowerCase());
    const filteredChildren = node.children
      ?.map(child => filterTree(child, query))
      .filter((child): child is TreeNode => child !== null) || [];

    if (matches || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    return null;
  };

  const displayTree = filterTree(rootTree, searchQuery);

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="notes" />

      <main style={{
        paddingTop: isMobile ? "80px" : "88px",
        paddingBottom: isMobile ? "88px" : "32px",
        minHeight: `calc(100vh - ${isMobile ? "160px" : "120px"})`,
        display: "flex",
        gap: "0",
      }}>
        {/* Sidebar */}
        <aside style={{
          width: "300px",
          flexShrink: 0,
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.02)",
          paddingTop: "48px",
          height: "calc(100vh - 88px)",
          position: "sticky",
          top: "88px",
          overflowY: "auto",
        }}>
          <div style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{toolCustom.name}</h2>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={fetchNotionTree}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    borderRadius: "4px",
                    background: "transparent",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    color: "var(--foreground-muted)",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
                </button>
                <a
                  href="https://notion.so"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    borderRadius: "4px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--foreground-muted)",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink style={{ width: "14px", height: "14px" }} />
                </a>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 32px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            {/* Tree Structure */}
            <div>
              {displayTree && renderTreeNode(displayTree)}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div style={{ flex: 1, padding: "48px 48px 32px 48px", maxWidth: "900px", margin: "0 auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", paddingTop: "120px" }}>
              <RefreshCw style={{ width: "32px", height: "32px", color: "#a78bfa", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "var(--foreground-muted)" }}>Loading Notion workspace...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", paddingTop: "120px" }}>
              <FileText style={{ width: "48px", height: "48px", color: "#f87171", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                {error}
              </h2>
              <button
                onClick={fetchNotionTree}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "var(--foreground)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          ) : !selectedItem ? (
            <div style={{ textAlign: "center", paddingTop: "120px" }}>
              <FileText style={{ width: "48px", height: "48px", color: "#a78bfa", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Select a page or database
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                Choose an item from the sidebar to view its content
              </p>
            </div>
          ) : (
            <div>
              {/* Page Header */}
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>{getPageIcon(selectedItem)}</div>
                {editing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: "32px",
                        fontWeight: 700,
                        color: "var(--foreground)",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={handleSaveTitle}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "8px 12px",
                        background: "rgba(167, 139, 250, 0.15)",
                        border: "1px solid rgba(167, 139, 250, 0.3)",
                        borderRadius: "6px",
                        color: "#a78bfa",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      <Save style={{ width: "14px", height: "14px" }} />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditedTitle(getPageTitle(selectedItem));
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "8px 12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        color: "var(--foreground-muted)",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      <X style={{ width: "14px", height: "14px" }} />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--foreground)" }}>
                      {getPageTitle(selectedItem)}
                    </h1>
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "6px",
                        background: "transparent",
                        border: "none",
                        borderRadius: "4px",
                        color: "var(--foreground-muted)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.color = "#a78bfa";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--foreground-muted)";
                      }}
                    >
                      <Edit style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                )}
                {selectedItem.url && (
                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "8px",
                      fontSize: "13px",
                      color: "var(--foreground-muted)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#a78bfa";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--foreground-muted)";
                    }}
                  >
                    <ExternalLink style={{ width: "12px", height: "12px" }} />
                    Open in Notion
                  </a>
                )}
              </div>

              {/* Page Content */}
              {loadingContent ? (
                <div style={{ textAlign: "center", paddingTop: "60px" }}>
                  <RefreshCw style={{ width: "24px", height: "24px", color: "#a78bfa", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
                  <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>Loading content...</p>
                </div>
              ) : pageContent.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: "60px" }}>
                  <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                    This page has no content
                  </p>
                </div>
              ) : (
                <div style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--foreground)" }}>
                  {pageContent.map((block) => (
                    <div key={block.id} style={{ marginBottom: "8px" }}>
                      {renderBlockContent(block)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
