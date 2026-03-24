"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Download, X, Image as ImageIcon, Loader2, Trash2, RefreshCw, ZoomIn } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";

interface Picture {
  id: string;
  title: string;
  url: string;
  uploadedAt: string;
  size?: number;
}

// Compress image to target size
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
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to compress image"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function PicturesPage() {
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [selectedImage, setSelectedImage] = useState<Picture | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchPictures();
  }, []);

  const fetchPictures = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pictures");
      const data = await res.json();
      setPictures(data.pictures || []);
    } catch (error) {
      console.error("Error fetching pictures:", error);
    } finally {
      setLoading(false);
    }
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadTitle("");
    setUploadProgress("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadTitle("");
    setUploadProgress("");
    setUploading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress("Compressing images...");
    
    try {
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Compressing ${i + 1}/${files.length}...`);
        
        try {
          const compressed = await compressImage(file, 1200, 0.7);
          const compressedFile = new File([compressed], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: "image/jpeg"
          });
          formData.append("files", compressedFile);
        } catch {
          if (file.size < 500000) {
            formData.append("files", file);
          }
        }
      }
      
      if (uploadTitle) {
        formData.append("title", uploadTitle);
      }

      setUploadProgress("Uploading...");
      
      const res = await fetch("/api/pictures", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok && data.pictures) {
        setPictures([...data.pictures, ...pictures]);
        closeUploadModal();
      } else {
        alert(data.error || "Upload failed");
        setUploading(false);
        setUploadProgress("");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed - try smaller images");
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Delete this image?")) return;
    
    try {
      const res = await fetch(`/api/pictures?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPictures(pictures.filter(p => p.id !== id));
        if (selectedImage?.id === id) {
          setSelectedImage(null);
        }
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleDownload = (picture: Picture, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = document.createElement("a");
    link.href = picture.url;
    link.download = `${picture.title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />
      
      <div className="flex">
        {!isMobile && <Sidebar />}
        
        <main className={`flex-1 pt-16 ${isMobile ? "pb-20" : "pb-8"} ${!isMobile ? "ml-48" : ""}`}>
          {/* Header */}
          <div className="px-4 md:px-6 py-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Pictures</h1>
                  <p className="text-sm text-gray-400">Public image gallery</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchPictures}
                  disabled={loading}
                  className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={openUploadModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl transition font-medium"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div className="px-4 md:px-6 py-6">
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
                <p className="text-gray-500 text-sm mt-1 mb-6">Upload some images to get started</p>
                <button
                  onClick={openUploadModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl transition font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload Images
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {pictures.map((picture) => (
                  <div
                    key={picture.id}
                    className="group relative aspect-square bg-gray-900 rounded-xl overflow-hidden cursor-pointer ring-1 ring-gray-800 hover:ring-2 hover:ring-purple-500 transition-all"
                    onClick={() => setSelectedImage(picture)}
                  >
                    <img
                      src={picture.url}
                      alt={picture.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute top-2 right-2">
                        <ZoomIn className="w-5 h-5 text-white/80" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-sm font-medium truncate">{picture.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(picture.uploadedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {isMobile && <BottomNav />}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeUploadModal}>
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Upload Images</h2>
              <button onClick={closeUploadModal} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter title for images..."
                  disabled={uploading}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Images
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white file:font-medium hover:file:bg-purple-500 file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2">Images are automatically compressed</p>
              </div>
              
              {uploading && (
                <div className="flex items-center gap-3 text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                  <span>{uploadProgress || "Processing..."}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Image Viewer */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close button - top right */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-3 bg-gray-800/80 hover:bg-gray-700 rounded-xl transition z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Image container */}
          <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
          
          {/* Bottom info bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">{selectedImage.title}</p>
                <p className="text-sm text-gray-400">{formatDate(selectedImage.uploadedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDownload(selectedImage, e)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={(e) => handleDelete(selectedImage.id, e)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600/80 hover:bg-red-500 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
