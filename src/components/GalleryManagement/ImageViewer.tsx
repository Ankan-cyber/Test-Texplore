'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Share2,
  Star,
  StarOff,
  Trash2,
  Edit,
  Eye,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { GalleryImage } from '@/types/common';
import { useUser } from '@/contexts/UserContext';
import { canManageGallery } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  image: GalleryImage | null;
  images: GalleryImage[];
  onImageChange?: (image: GalleryImage) => void;
  onImageUpdate?: () => void;
}

export default function ImageViewer({
  isOpen,
  onClose,
  image,
  images,
  onImageChange,
  onImageUpdate,
}: ImageViewerProps) {
  const { user } = useUser();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const canManage = user && canManageGallery(user.permissions);

  // Update current image index when image prop changes
  useEffect(() => {
    if (image && images.length > 0) {
      const index = images.findIndex((img) => img.id === image.id);
      setCurrentImageIndex(index >= 0 ? index : 0);
    }
  }, [image, images]);

  // Reset zoom and rotation when image changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [currentImageIndex]);

  const currentImage = images[currentImageIndex] || image;

  const handlePrevious = () => {
    if (images.length > 1) {
      const newIndex =
        currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
      setCurrentImageIndex(newIndex);
      onImageChange?.(images[newIndex]);
    }
  };

  const handleNext = () => {
    if (images.length > 1) {
      const newIndex =
        currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
      setCurrentImageIndex(newIndex);
      onImageChange?.(images[newIndex]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        onClose();
        break;
      case 'f':
        setIsFullscreen(!isFullscreen);
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentImageIndex, images.length]);

  const handleImageApproval = async (approved: boolean) => {
    if (!currentImage || !canManage) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/gallery/images/${currentImage.id}/approve`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved }),
        },
      );

      if (response.ok) {
        toast.success(`Image ${approved ? 'approved' : 'rejected'}`);
        onImageUpdate?.();
      } else {
        toast.error('Failed to update image status');
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to update image status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!currentImage || !canManage) return;

    if (
      !confirm(
        'Are you sure you want to delete this image? This action cannot be undone.',
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/gallery/images/${currentImage.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Image deleted successfully');
        onImageUpdate?.();
        onClose();
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!currentImage?.fileUrl) return;

    const link = document.createElement('a');
    link.href = currentImage.fileUrl;
    link.download = currentImage.title || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (!currentImage?.fileUrl) return;

    if (navigator.share) {
      navigator.share({
        title: currentImage.title,
        text: currentImage.description,
        url: currentImage.fileUrl,
      });
    } else {
      navigator.clipboard.writeText(currentImage.fileUrl);
      toast.success('Image URL copied to clipboard');
    }
  };

  if (!currentImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {currentImage.title}
            </DialogTitle>

            <div className="flex items-center gap-2">
              {/* Navigation */}
              {images.length > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={isLoading}
                    title="Previous image (←)"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-500 px-2">
                    {currentImageIndex + 1} of {images.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={isLoading}
                    title="Next image (→)"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Image Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(rotation + 90)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen (F)`}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                {canManage && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleImageApproval(!currentImage.isApproved)
                      }
                      disabled={isLoading}
                    >
                      {currentImage.isApproved ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        /* Handle edit */
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleImageDelete}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Image Display */}
          <div className="flex-1 flex items-center justify-center bg-black p-4 overflow-auto">
            <div
              className="relative"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
              }}
            >
              {currentImage.fileUrl ? (
                <img
                  src={currentImage.fileUrl}
                  alt={currentImage.title}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    maxWidth: isFullscreen ? '100vw' : 'calc(100vw - 400px)',
                    maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 200px)',
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-96 h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Image not available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image Details Sidebar */}
          {!isFullscreen && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentImage.isApproved ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Approval
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Image Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Image Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Title
                      </label>
                      <p className="text-sm font-medium">
                        {currentImage.title}
                      </p>
                    </div>

                    {currentImage.description && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Description
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {currentImage.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          File Size
                        </label>
                        <p className="text-sm">
                          {currentImage.fileSize
                            ? `${(currentImage.fileSize / 1024 / 1024).toFixed(1)} MB`
                            : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          File Type
                        </label>
                        <p className="text-sm">
                          {currentImage.mimeType || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Metadata */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        Uploaded{' '}
                        {new Date(currentImage.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>By {currentImage.uploader?.name || 'Unknown'}</span>
                    </div>

                    {currentImage.folder && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>In {currentImage.folder.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tags */}
                {currentImage.tags && currentImage.tags.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {currentImage.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
