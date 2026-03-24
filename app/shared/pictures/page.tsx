'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Download, X, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';

interface Picture {
  id: string;
  title: string;
  url: string;
  uploadedAt: string;
  size?: number;
}

export default function PublicPicturesPage() {
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Picture | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPictures();
  }, []);

  const fetchPictures = async () => {
    try {
      const res = await fetch('/api/shared/pictures');
      const data = await res.json();
      setPictures(data.pictures || []);
    } catch (error) {
      console.error('Error fetching pictures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', uploadTitle || file.name);

      const res = await fetch('/api/shared/pictures', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPictures([data.picture, ...pictures]);
        setShowUpload(false);
        setUploadTitle('');
      } else {
        const error = await res.json();
        alert(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    
    try {
      const res = await fetch(`/api/shared/pictures?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPictures(pictures.filter(p => p.id !== id));
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDownload = async (picture: Picture) => {
    try {
      const response = await fetch(picture.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = picture.title || 'image';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Pictures</h1>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : pictures.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No pictures yet</p>
            <p className="text-gray-500 text-sm mt-1">Upload some images to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pictures.map((picture) => (
              <div
                key={picture.id}
                className="group relative aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
                onClick={() => setSelectedImage(picture)}
              >
                <img
                  src={picture.url}
                  alt={picture.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-medium truncate">{picture.title}</p>
                    <p className="text-xs text-gray-300">{formatDate(picture.uploadedAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Upload Image</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
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
                  placeholder="Enter image title..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer disabled:opacity-50"
                />
              </div>
              
              {uploading && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="w-full h-full object-contain rounded-lg"
            />
            
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => handleDownload(selectedImage)}
                className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(selectedImage.id)}
                className="p-2 bg-red-600/80 hover:bg-red-500 rounded-lg transition"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Info */}
            <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur px-4 py-2 rounded-lg">
              <p className="font-medium">{selectedImage.title}</p>
              <p className="text-sm text-gray-400">{formatDate(selectedImage.uploadedAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Build trigger Mon Mar 23 20:25:20 EDT 2026
