"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ScanSearch, Upload, Link2, ExternalLink, Loader2, X, Search, Image as ImageIcon } from "lucide-react";

interface ImageAnalysis {
  description: string;
  type: string;
  elements: string[];
  contextClues: string[];
  potentialSources: string[];
  searchKeywords: string[];
}

export default function ImageLookupPage() {
  return (
    <ProtectedRoute>
      <ImageLookupContent />
    </ProtectedRoute>
  );
}

function ImageLookupContent() {
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [webContext, setWebContext] = useState<string | null>(null);
  const [searchUrls, setSearchUrls] = useState<{ google: string | null; bing: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setImageUrl("");
      setAnalysis(null);
      setWebContext(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setImageUrl("");
    setAnalysis(null);
    setWebContext(null);
    setSearchUrls(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!imageUrl && !uploadedImage) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setWebContext(null);

    try {
      const response = await fetch("/api/image-lookup/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrl || undefined,
          imageBase64: uploadedImage || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Analysis failed");
      }

      setAnalysis(data.analysis);
      setWebContext(data.webContext);
      setSearchUrls(data.searchUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = (imageUrl.trim() !== "") || (uploadedImage !== null);

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="image-lookup" />
      <main
        style={{
          paddingTop: isMobile ? "80px" : "136px",
          paddingBottom: isMobile ? "80px" : "32px",
          paddingLeft: isMobile ? "12px" : "24px",
          paddingRight: isMobile ? "12px" : "24px",
          minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <ScanSearch style={{ width: "32px", height: "32px", color: "#a855f7" }} />
            <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              Image Lookup
            </h1>
          </div>
          <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
            Reverse image search and AI-powered image analysis
          </p>
        </div>

        {/* Input Methods */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          {/* URL Input */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              <Link2 style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value) {
                  setUploadedImage(null);
                  setUploadedFile(null);
                  setAnalysis(null);
                  setWebContext(null);
                }
              }}
              placeholder="https://example.com/image.jpg"
              disabled={!!uploadedImage}
              style={{
                width: "100%",
                padding: "12px",
                background: uploadedImage ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: uploadedImage ? "var(--foreground-muted)" : "var(--foreground)",
                fontSize: "14px",
              }}
            />
          </div>

          {/* OR Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
            <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
          </div>

          {/* Upload Area */}
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              <Upload style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
              Upload Image
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "#a855f7" : "rgba(255, 255, 255, 0.2)"}`,
                borderRadius: "8px",
                padding: "48px 24px",
                textAlign: "center",
                background: isDragging ? "rgba(168, 85, 247, 0.1)" : "rgba(255, 255, 255, 0.02)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <ImageIcon style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
              <p style={{ fontSize: "14px", color: "var(--foreground)", marginBottom: "8px" }}>
                Drop an image here or click to browse
              </p>
              <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                Supports: JPG, PNG, GIF, WebP
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Preview */}
          {(uploadedImage || imageUrl) && (
            <div style={{ marginTop: "24px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>Preview</span>
                <button
                  onClick={clearImage}
                  style={{
                    padding: "6px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "6px",
                    color: "#ef4444",
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: "14px", height: "14px" }} />
                </button>
              </div>
              <img
                src={uploadedImage || imageUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              />
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || isAnalyzing}
            style={{
              width: "100%",
              marginTop: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px",
              background: !canAnalyze || isAnalyzing
                ? "rgba(168, 85, 247, 0.3)"
                : "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
              border: "none",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: !canAnalyze || isAnalyzing ? "not-allowed" : "pointer",
            }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                Analyzing...
              </>
            ) : (
              <>
                <Search style={{ width: "18px", height: "18px" }} />
                Analyze Image
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "16px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#ef4444",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div>
            {/* Description */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                Image Description
              </h2>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>
                {analysis.description}
              </p>
              <div style={{ marginTop: "12px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                    background: "rgba(168, 85, 247, 0.1)",
                    color: "#a855f7",
                    borderRadius: "6px",
                  }}
                >
                  {analysis.type}
                </span>
              </div>
            </div>

            {/* Elements & Context */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              {/* Notable Elements */}
              {analysis.elements.length > 0 && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "24px",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                    Notable Elements
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {analysis.elements.map((element, idx) => (
                      <li key={idx} style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "6px" }}>
                        {element}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Context Clues */}
              {analysis.contextClues.length > 0 && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "24px",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                    Context Clues
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {analysis.contextClues.map((clue, idx) => (
                      <li key={idx} style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "6px" }}>
                        {clue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Search Keywords */}
            {analysis.searchKeywords.length > 0 && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                  Search Keywords
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {analysis.searchKeywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "13px",
                        padding: "6px 12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        color: "var(--foreground-muted)",
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Web Context */}
            {webContext && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                  Web Context
                </h3>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {webContext}
                </p>
              </div>
            )}

            {/* External Search Links */}
            {searchUrls && (searchUrls.google || searchUrls.bing) && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
                  Continue Search on External Platforms
                </h3>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {searchUrls.google && (
                    <a
                      href={searchUrls.google}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 20px",
                        background: "rgba(66, 133, 244, 0.1)",
                        border: "1px solid rgba(66, 133, 244, 0.3)",
                        borderRadius: "8px",
                        color: "#4285f4",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      <Search style={{ width: "16px", height: "16px" }} />
                      Google Lens
                      <ExternalLink style={{ width: "14px", height: "14px" }} />
                    </a>
                  )}
                  {searchUrls.bing && (
                    <a
                      href={searchUrls.bing}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 20px",
                        background: "rgba(0, 103, 184, 0.1)",
                        border: "1px solid rgba(0, 103, 184, 0.3)",
                        borderRadius: "8px",
                        color: "#0067b8",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      <Search style={{ width: "16px", height: "16px" }} />
                      Bing Visual Search
                      <ExternalLink style={{ width: "14px", height: "14px" }} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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
