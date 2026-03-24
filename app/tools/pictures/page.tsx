"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Download, X, Image as ImageIcon, Loader2, Trash2, RefreshCw, ChevronLeft, ChevronRight, Check, DownloadCloud, Plus, Sparkles } from "lucide-react";

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
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, status: "" });
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
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

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    
    setUploading(true);
    setUploadProgress({ current: 0, total: fileArray.length, status: "Preparing..." });
    
    try {
      const formData = new FormData();
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress({ current: i + 1, total: fileArray.length, status: `Compressing ${file.name.slice(0, 20)}...` });
        
        try {
          const compressed = await compressImage(file, 1200, 0.7);
          formData.append("files", new File([compressed], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }));
        } catch {
          // If compression fails and file is small enough, use original
          if (file.size < 500000) {
            formData.append("files", file);
          }
        }
      }
      
      setUploadProgress({ current: fileArray.length, total: fileArray.length, status: "Uploading to cloud..." });
      
      const res = await fetch("/api/pictures", { method: "POST", body: formData });
      const data = await res.json();
      
      if (res.ok && data.pictures) {
        setPictures(prev => [...data.pictures, ...prev]);
        setUploadProgress({ current: 0, total: 0, status: "" });
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed - please try again");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
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
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 bg-purple-600/20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 border-2 border-dashed border-purple-400 rounded-3xl p-12 text-center">
            <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-2xl font-semibold text-white">Drop images here</p>
            <p className="text-slate-400 mt-2">Release to upload</p>
          </div>
        </div>
      )}

      {/* Upload progress overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-700"></div>
                <div 
                  className="absolute inset-0 w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"
                ></div>
                <Sparkles className="absolute inset-0 w-6 h-6 m-auto text-purple-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-white mb-1">Uploading...</p>
              <p className="text-slate-400 text-sm">{uploadProgress.status}</p>
              {uploadProgress.total > 0 && (
                <div className="mt-4">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{uploadProgress.current} of {uploadProgress.total}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Pictures</h1>
                <p className="text-sm text-slate-500">{pictures.length} {pictures.length === 1 ? 'image' : 'images'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={fetchPictures} 
                disabled={loading} 
                className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-200" 
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
              
              {pictures.length > 0 && (
                <>
                  <button
                    onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                    className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                      selectMode 
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                        : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    Select
                  </button>
                  
                  <button 
                    onClick={downloadAll} 
                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-all duration-200 text-slate-300 font-medium"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    All
                  </button>
                </>
              )}
              
              {selectMode && selectedIds.size > 0 && (
                <button 
                  onClick={downloadSelected} 
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-xl transition-all duration-200 font-medium"
                >
                  <Download className="w-4 h-4" />
                  {selectedIds.size}
                </button>
              )}
              
              <button 
                onClick={triggerFileSelect}
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-purple-500/25 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Upload</span>
              </button>
            </div>
          </div>
          
          {selectMode && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <button onClick={selectAll} className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                {selectedIds.size === pictures.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-slate-500">{selectedIds.size} selected</span>
            </div>
          )}
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-4" />
            <p className="text-slate-400">Loading gallery...</p>
          </div>
        ) : pictures.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-6 border border-slate-700/50">
              <ImageIcon className="w-12 h-12 text-slate-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No pictures yet</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">Upload your first images to get started. Drag and drop or click the button below.</p>
            <button 
              onClick={triggerFileSelect}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-2xl transition-all duration-200 font-semibold shadow-xl shadow-purple-500/30 text-lg"
            >
              <Upload className="w-6 h-6" />
              Upload Images
            </button>
            <p className="text-slate-500 text-sm mt-4">or drag files anywhere on this page</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {pictures.map((picture, index) => (
              <div
                key={picture.id}
                className={`group relative aspect-square bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectMode && selectedIds.has(picture.id) 
                    ? "ring-3 ring-purple-500 ring-offset-2 ring-offset-slate-950 scale-[0.98]" 
                    : "hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10"
                }`}
                onClick={() => selectMode ? toggleSelect(picture.id) : setViewerIndex(index)}
              >
                <img 
                  src={picture.url} 
                  alt={picture.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  loading="lazy" 
                />
                
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
                  selectMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`} />
                
                {selectMode && (
                  <div className="absolute top-3 left-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      selectedIds.has(picture.id) 
                        ? "bg-purple-500 shadow-lg shadow-purple-500/50" 
                        : "bg-black/40 backdrop-blur-sm border border-white/20"
                    }`}>
                      {selectedIds.has(picture.id) && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                )}
                
                {!selectMode && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium truncate">{picture.title}</p>
                    <p className="text-slate-300 text-xs">{formatDate(picture.uploadedAt)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Full Image Viewer */}
      {currentPicture && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div>
              <p className="font-semibold text-lg text-white">{currentPicture.title}</p>
              <p className="text-sm text-slate-400">{formatDate(currentPicture.uploadedAt)} • {viewerIndex! + 1} of {pictures.length}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => downloadImage(currentPicture)} 
                className="p-3 hover:bg-slate-800 rounded-xl transition-colors" 
                title="Download"
              >
                <Download className="w-5 h-5 text-slate-300" />
              </button>
              <button 
                onClick={() => handleDelete(currentPicture.id)} 
                className="p-3 hover:bg-red-600/20 rounded-xl text-red-400 transition-colors" 
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewerIndex(null)} 
                className="p-3 hover:bg-slate-800 rounded-xl transition-colors ml-2" 
                title="Close"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
          
          {/* Image */}
          <div className="flex-1 flex items-center justify-center relative px-4 sm:px-20">
            <img 
              src={currentPicture.url} 
              alt={currentPicture.title} 
              className="max-w-full max-h-full object-contain rounded-lg" 
            />
            
            {/* Nav arrows */}
            {viewerIndex! > 0 && (
              <button
                onClick={() => navigateViewer(-1)}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-slate-900/80 hover:bg-slate-800 rounded-full transition-all backdrop-blur-sm border border-slate-700/50"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </button>
            )}
            {viewerIndex! < pictures.length - 1 && (
              <button
                onClick={() => navigateViewer(1)}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-slate-900/80 hover:bg-slate-800 rounded-full transition-all backdrop-blur-sm border border-slate-700/50"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </button>
            )}
          </div>
          
          {/* Thumbnail strip */}
          <div className="p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
              {pictures.slice(Math.max(0, viewerIndex! - 4), Math.min(pictures.length, viewerIndex! + 5)).map((pic, i) => {
                const actualIndex = Math.max(0, viewerIndex! - 4) + i;
                return (
                  <button
                    key={pic.id}
                    onClick={() => setViewerIndex(actualIndex)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all ${
                      actualIndex === viewerIndex 
                        ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-950" 
                        : "opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={pic.url} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
