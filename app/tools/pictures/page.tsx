'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Download, X, Image as ImageIcon, Loader2, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Picture {
  id: string;
  title: string;
  url: string;
  uploadedAt: string;
  size?: number;
}

// Compress image to target size
async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to compress image'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function PicturesPage() {
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedImage, setSelectedImage] = useState<Picture | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPictures();
  }, []);

  const fetchPictures = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pictures');
      const data = await res.json();
      setPictures(data.pictures || []);
    } catch (error) {
      console.error('Error fetching pictures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress('Compressing images...');
    
    try {
      const formData = new FormData();
      
      // Compress each image
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Compressing ${i + 1}/${files.length}...`);
        
        try {
          const compressed = await compressImage(file, 1200, 0.7);
          const compressedFile = new File([compressed], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: 'image/jpeg'
          });
          formData.append('files', compressedFile);
        } catch {
          // If compression fails, try original if small enough
          if (file.size < 500000) {
            formData.append('files', file);
          }
        }
      }
      
      if (uploadTitle) {
        formData.append('title', uploadTitle);
      }

      setUploadProgress('Uploading...');
      
      const res = await fetch('/api/pictures', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok && data.pictures) {
        setPictures([...data.pictures, ...pictures]);
        setShowUpload(false);
        setUploadTitle('');
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed - try smaller images');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    
    try {
      const res = await fetch(`/api/pictures?id=${id}`, { method: 'DELETE' });
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
      const link = document.createElement('a');
      link.href = picture.url;
      link.download = `${picture.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    <div className="min-h-screen bg-black text-white">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur border-b border-gray-800 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <span className="font-semibold">Pictures</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPictures}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition font-medium"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : pictures.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg">No pictures yet</p>
            <p className="text-gray-500 text-sm mt-1">Click Upload to add images</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pictures.map((picture) => (
              <div
                key={picture.id}
                className="group relative aspect-square bg-gray-900 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition"
                onClick={() => setSelectedImage(picture)}
              >
                <img
                  src={picture.url}
                  alt={picture.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Upload Images</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-white p-1">
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
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 transition"
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
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer disabled:opacity-50 file:font-medium"
                />
                <p className="text-xs text-gray-500 mt-2">Images auto-compressed for upload</p>
              </div>
              
              {uploading && (
                <div className="flex items-center gap-3 text-purple-400 bg-purple-500/10 rounded-xl p-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{uploadProgress || 'Processing...'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="w-full h-full object-contain rounded-xl"
            />
            
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => handleDownload(selectedImage)}
                className="p-3 bg-gray-800/90 hover:bg-gray-700 rounded-xl transition"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(selectedImage.id)}
                className="p-3 bg-red-600/90 hover:bg-red-500 rounded-xl transition"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-3 bg-gray-800/90 hover:bg-gray-700 rounded-xl transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur px-4 py-3 rounded-xl">
              <p className="font-medium">{selectedImage.title}</p>
              <p className="text-sm text-gray-400">{formatDate(selectedImage.uploadedAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
