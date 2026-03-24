"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Download, X, Image as ImageIcon, Loader2, Trash2, RefreshCw, ChevronLeft, ChevronRight, CheckSquare, Square, DownloadCloud } from "lucide-react";

interface Picture {
  id: string;
  title: string;
  url: string;
  uploadedAt: string;
  size?: number;
}

async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No context")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No blob")), "image/jpeg", quality);
    };
    img.onerror = () => reject(new Error("Load failed"));
    img.src = URL.createObjectURL(file);
  });
}

export default function PicturesPage() {
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPictures(); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewerIndex === null) return;
      if (e.key === "ArrowLeft") navigateViewer(-1);
      else if (e.key === "ArrowRight") navigateViewer(1);
      else if (e.key === "Escape") setViewerIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewerIndex, pictures]);

  const fetchPictures = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pictures");
      const data = await res.json();
      setPictures(data.pictures || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadTitle("");
    setUploadProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress("Compressing...");
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Compressing ${i + 1}/${files.length}...`);
        try {
          const compressed = await compressImage(files[i], 1200, 0.7);
          formData.append("files", new File([compressed], files[i].name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }));
        } catch {
          if (files[i].size < 500000) formData.append("files", files[i]);
        }
      }
      if (uploadTitle) formData.append("title", uploadTitle);
      setUploadProgress("Uploading...");
      const res = await fetch("/api/pictures", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.pictures) {
        setPictures([...data.pictures, ...pictures]);
        closeUploadModal();
      } else {
        alert(data.error || "Upload failed");
        setUploading(false);
      }
    } catch {
      alert("Upload failed");
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      const res = await fetch(`/api/pictures?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPictures(pictures.filter(p => p.id !== id));
        if (viewerIndex !== null && pictures[viewerIndex]?.id === id) {
          setViewerIndex(null);
        }
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const downloadImage = (picture: Picture) => {
    const link = document.createElement("a");
    link.href = picture.url;
    link.download = `${picture.title}.jpg`;
    link.click();
  };

  const downloadSelected = () => {
    const toDownload = pictures.filter(p => selectedIds.has(p.id));
    toDownload.forEach((p, i) => {
      setTimeout(() => downloadImage(p), i * 300);
    });
  };

  const downloadAll = () => {
    pictures.forEach((p, i) => {
      setTimeout(() => downloadImage(p), i * 300);
    });
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === pictures.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pictures.map(p => p.id)));
    }
  };

  const navigateViewer = (dir: number) => {
    if (viewerIndex === null) return;
    const newIndex = viewerIndex + dir;
    if (newIndex >= 0 && newIndex < pictures.length) {
      setViewerIndex(newIndex);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const currentPicture = viewerIndex !== null ? pictures[viewerIndex] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Pictures</h1>
                <p className="text-xs text-gray-400">{pictures.length} images</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button onClick={fetchPictures} disabled={loading} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition" title="Refresh">
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
              
              {pictures.length > 0 && (
                <>
                  <button
                    onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${selectMode ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Select</span>
                  </button>
                  
                  <button onClick={downloadAll} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-gray-300">
                    <DownloadCloud className="w-4 h-4" />
                    <span className="hidden sm:inline">All</span>
                  </button>
                </>
              )}
              
              {selectMode && selectedIds.size > 0 && (
                <button onClick={downloadSelected} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition">
                  <Download className="w-4 h-4" />
                  <span>{selectedIds.size}</span>
                </button>
              )}
              
              <button onClick={openUploadModal} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition font-medium">
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>
          </div>
          
          {selectMode && (
            <div className="mt-3 flex items-center gap-4 text-sm">
              <button onClick={selectAll} className="text-purple-400 hover:text-purple-300">
                {selectedIds.size === pictures.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-gray-500">{selectedIds.size} selected</span>
            </div>
          )}
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : pictures.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-300 text-lg font-medium">No pictures yet</p>
            <p className="text-gray-500 text-sm mt-1 mb-6">Upload images to share</p>
            <button onClick={openUploadModal} className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl transition font-medium">
              <Upload className="w-4 h-4" />
              Upload Images
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {pictures.map((picture, index) => (
              <div
                key={picture.id}
                className={`relative aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectMode && selectedIds.has(picture.id) ? "ring-2 ring-purple-500" : "hover:ring-2 hover:ring-gray-600"
                }`}
                onClick={() => selectMode ? toggleSelect(picture.id) : setViewerIndex(index)}
              >
                <img src={picture.url} alt={picture.title} className="w-full h-full object-cover" loading="lazy" />
                
                {selectMode && (
                  <div className="absolute top-2 left-2">
                    {selectedIds.has(picture.id) ? (
                      <CheckSquare className="w-6 h-6 text-purple-400 bg-black/50 rounded" />
                    ) : (
                      <Square className="w-6 h-6 text-white/70 bg-black/50 rounded" />
                    )}
                  </div>
                )}
                
                {!selectMode && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                    <span className="text-xs bg-black/70 px-2 py-1 rounded">View</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeUploadModal}>
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Upload Images</h2>
              <button onClick={closeUploadModal} className="p-2 hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title (optional)</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="Image title..."
                  disabled={uploading}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select Images</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading}
                  className="w-full text-sm file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white file:font-medium hover:file:bg-purple-500 file:cursor-pointer disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-2">Auto-compressed for fast upload</p>
              </div>
              {uploading && (
                <div className="flex items-center gap-3 text-purple-400 bg-purple-500/10 rounded-xl p-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{uploadProgress}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Image Viewer */}
      {currentPicture && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between p-4 bg-black/80">
            <div>
              <p className="font-medium">{currentPicture.title}</p>
              <p className="text-sm text-gray-400">{formatDate(currentPicture.uploadedAt)} • {viewerIndex! + 1} of {pictures.length}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadImage(currentPicture)} className="p-2 hover:bg-gray-800 rounded-lg" title="Download">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(currentPicture.id)} className="p-2 hover:bg-red-600/50 rounded-lg text-red-400" title="Delete">
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={() => setViewerIndex(null)} className="p-2 hover:bg-gray-800 rounded-lg" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Image */}
          <div className="flex-1 flex items-center justify-center relative px-16">
            <img src={currentPicture.url} alt={currentPicture.title} className="max-w-full max-h-full object-contain" />
            
            {/* Nav arrows */}
            {viewerIndex! > 0 && (
              <button
                onClick={() => navigateViewer(-1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 rounded-full transition"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {viewerIndex! < pictures.length - 1 && (
              <button
                onClick={() => navigateViewer(1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 rounded-full transition"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
