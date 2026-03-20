'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Folder,
  Image as ImageIcon,
  Upload,
  Search,
  Eye,
  Trash2,
  Star,
  StarOff,
  Grid3X3,
  List,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  RefreshCw,
  CheckCircle,
  Clock,
  Edit,
} from 'lucide-react';
import { canUploadPhotos, canManageGallery } from '@/lib/permissions';
import { GalleryFolder, GalleryImage } from '@/types/common';
import toast from 'react-hot-toast';
import FolderModal from './FolderModal';
import ImageViewer from './ImageViewer';
import UploadPreviewCard, { UploadFile } from './UploadPreviewCard';
import {
  uploadFileWithProgress,
  createFilePreview,
  validateImageFile,
} from '@/lib/upload-utils';
import { User } from '@/lib/auth';

interface GalleryManagerProps {
  initialFolderId?: string;
  user: User;
}

interface FolderTreeItem extends GalleryFolder {
  children?: FolderTreeItem[];
  isExpanded?: boolean;
}

interface ImageItem extends GalleryImage {
  isSelected?: boolean;
}

export default function GalleryManager({
  initialFolderId,
  user,
}: GalleryManagerProps) {
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(
    initialFolderId || null,
  );
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'approved' | 'pending'
  >('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isFolderPanelOpen, setIsFolderPanelOpen] = useState(false);

  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);

  // Folder modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'edit'>(
    'create',
  );
  const [selectedFolder, setSelectedFolder] = useState<
    GalleryFolder | undefined
  >();

  // Image viewer state
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Permissions
  const canUpload = user && canUploadPhotos(user.permissions);
  const canManage = user && canManageGallery(user.permissions);

  // Fetch folders tree
  const fetchFolders = useCallback(async () => {
    try {
      setIsLoadingFolders(true);
      const response = await fetch('/api/gallery/folders/tree');
      if (response.ok) {
        const data = await response.json();
        console.log('Folders response:', data);

        // Process folders to add isExpanded property
        const processFolders = (folderList: any[]): FolderTreeItem[] => {
          return folderList.map((folder) => ({
            ...folder,
            isExpanded: false, // Default to collapsed
            children: folder.children ? processFolders(folder.children) : [],
            imageCount: folder._count?.images || 0,
          }));
        };

        const processedFolders = processFolders(data.folders || []);
        setFolders(processedFolders);
      } else {
        console.error('Failed to fetch folders:', response.status);
        toast.error('Failed to load folders');
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setIsLoadingFolders(false);
    }
  }, []);

  // Fetch images in current folder
  const fetchImages = useCallback(async () => {
    if (!currentFolder) {
      setImages([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('folderId', currentFolder);
      params.set('status', filterStatus);

      const trimmedSearch = searchQuery.trim();
      if (trimmedSearch.length > 0) {
        params.set('search', trimmedSearch);
      }

      const response = await fetch(`/api/gallery/images?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Images response:', data);
        setImages(data.images || []);
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Failed to fetch images:', response.status, errorData);
        if (errorData?.error) {
          toast.error(errorData.error);
        }
        setImages([]);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder, filterStatus, searchQuery]);

  // Load initial data
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Helper function to find the first available folder (including nested ones)
  const findFirstAvailableFolder = (
    folderList: FolderTreeItem[],
  ): string | null => {
    for (const folder of folderList) {
      return folder.id; // Return the first folder we find
    }
    return null;
  };

  // Recursive function to find any folder in the tree
  const findAnyFolderInTree = (folderList: FolderTreeItem[]): string | null => {
    for (const folder of folderList) {
      // Check if this folder has children
      if (folder.children && folder.children.length > 0) {
        // Recursively search in children
        const childResult = findAnyFolderInTree(folder.children);
        if (childResult) {
          return childResult;
        }
      }
      // If no children or no result from children, return this folder
      return folder.id;
    }
    return null;
  };

  // Recursive function to find a specific folder by ID in the tree
  const findFolderById = (
    folderList: FolderTreeItem[],
    targetId: string,
  ): boolean => {
    for (const folder of folderList) {
      if (folder.id === targetId) {
        return true;
      }
      if (folder.children && folder.children.length > 0) {
        if (findFolderById(folder.children, targetId)) {
          return true;
        }
      }
    }
    return false;
  };

  // Auto-select first folder if no folder is selected and folders exist
  useEffect(() => {
    if (!currentFolder && folders.length > 0 && !isLoadingFolders) {
      // If we have an initialFolderId, try to find it in the folders (including nested ones)
      if (initialFolderId) {
        const folderExists = findFolderById(folders, initialFolderId);
        if (folderExists) {
          setCurrentFolder(initialFolderId);
          return;
        }
      }

      // Otherwise, select the first available folder (including nested ones)
      const firstFolderId = findAnyFolderInTree(folders);
      if (firstFolderId) {
        setCurrentFolder(firstFolderId);
      }
    }
  }, [folders, currentFolder, initialFolderId, isLoadingFolders]);

  // Handle folder selection
  const handleFolderSelect = (folderId: string) => {
    setCurrentFolder(folderId);
    setSelectedItems([]);

    // Close folder panel after selecting on smaller screens.
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsFolderPanelOpen(false);
    }

    // Auto-expand parent folders to show the selected folder
    const expandParentFolders = (
      folderList: FolderTreeItem[],
      targetId: string,
    ): FolderTreeItem[] => {
      return folderList.map((folder) => {
        if (folder.id === targetId) {
          return folder; // Found the target folder
        }
        if (folder.children && folder.children.length > 0) {
          const updatedChildren = expandParentFolders(
            folder.children,
            targetId,
          );
          if (
            updatedChildren.some(
              (child) => child.id === targetId || child.isExpanded,
            )
          ) {
            // If target is in children or any child is expanded, expand this folder
            return { ...folder, isExpanded: true, children: updatedChildren };
          }
        }
        return folder;
      });
    };

    setFolders((prev) => expandParentFolders(prev, folderId));
  };

  // Handle create folder
  const handleCreateFolder = () => {
    setFolderModalMode('create');
    setSelectedFolder(undefined);
    setIsFolderModalOpen(true);
  };

  // Handle edit folder
  const handleEditFolder = (folder: GalleryFolder) => {
    setFolderModalMode('edit');
    setSelectedFolder(folder);
    setIsFolderModalOpen(true);
  };

  // Handle folder modal success
  const handleFolderModalSuccess = () => {
    fetchFolders();
    if (selectedFolder && folderModalMode === 'edit') {
      // If we're editing the current folder, refresh images too
      fetchImages();
    } else if (folderModalMode === 'create' && !currentFolder) {
      // If we're creating a new folder and no folder is currently selected,
      // the auto-select effect will handle selecting the new folder
    }
  };

  // Handle folder deletion
  const deleteFolderById = async (folderId: string) => {
    try {
      console.log('Attempting to delete folder:', folderId);

      const response = await fetch(`/api/gallery/folders/${folderId}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);
      const responseText = await response.text();
      console.log('Delete response text:', responseText);

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.log('Failed to parse response as JSON');
      }

      if (response.ok) {
        toast.success('Folder deleted successfully');

        // If the deleted folder is the current folder, reset current folder
        if (currentFolder === folderId) {
          setCurrentFolder(null);
        }

        // Refresh folders list
        fetchFolders();
      } else {
        if (errorData?.details?.children > 0) {
          toast.error(
            'Cannot delete folder with subfolders. Please delete subfolders first.',
          );
        } else {
          toast.error(errorData?.error || 'Failed to delete folder');
        }
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  // Handle image selection
  const handleImageSelect = (
    imageId: string,
    isMultiSelect: boolean = false,
  ) => {
    if (isMultiSelect) {
      setSelectedItems((prev) =>
        prev.includes(imageId)
          ? prev.filter((id) => id !== imageId)
          : [...prev, imageId],
      );
    } else {
      setSelectedItems([imageId]);
    }
  };

  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectedItems.length === images.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(images.map((img) => img.id));
    }
  };

  // Helper function to create file preview
  const createFilePreviewLocal = (file: File): Promise<string> => {
    return createFilePreview(file);
  };

  // Helper function to add upload files
  const addUploadFiles = async (files: FileList) => {
    const newUploadFiles: UploadFile[] = [];

    for (const file of Array.from(files)) {
      // Validate file first
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      const preview = await createFilePreviewLocal(file);
      const uploadId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}_${file.name}`;
      const uploadFile: UploadFile = {
        id: uploadId,
        file,
        preview,
        progress: 0,
        status: 'uploading',
      };
      newUploadFiles.push(uploadFile);
    }

    setUploadFiles((prev) => [...prev, ...newUploadFiles]);
    return newUploadFiles;
  };

  // Helper function to update upload file progress
  const updateUploadFileProgress = (
    id: string,
    progress: number,
    status?: 'uploading' | 'success' | 'error',
    error?: string,
  ) => {
    setUploadFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? {
              ...file,
              progress,
              ...(status && { status }),
              ...(error && { error }),
            }
          : file,
      ),
    );
  };

  // Helper function to remove upload file
  const removeUploadFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((file) => file.id !== id));
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!canUpload || !currentFolder) {
      toast.error('Upload permission required or no folder selected');
      return;
    }

    // Add files to upload preview immediately
    const uploadFiles = await addUploadFiles(files);

    // Upload each file individually with progress tracking
    for (const uploadFile of uploadFiles) {
      try {
        const formData = new FormData();
        formData.append('folderId', currentFolder);
        formData.append('images', uploadFile.file);

        // Use real progress tracking
        const result = await uploadFileWithProgress(
          '/api/gallery/upload',
          formData,
          (progress) => {
            updateUploadFileProgress(uploadFile.id, progress);
          },
        );

        if (result.success) {
          updateUploadFileProgress(uploadFile.id, 100, 'success');

          // Remove the upload file after a delay to show success state
          setTimeout(() => {
            removeUploadFile(uploadFile.id);
          }, 2000);

          toast.success(`Successfully uploaded ${uploadFile.file.name}`);
        } else {
          updateUploadFileProgress(
            uploadFile.id,
            0,
            'error',
            result.error || 'Upload failed',
          );
          toast.error(
            `Failed to upload ${uploadFile.file.name}: ${result.error}`,
          );
        }
      } catch (error) {
        console.error('Upload error:', error);
        updateUploadFileProgress(uploadFile.id, 0, 'error', 'Upload failed');
        toast.error(`Failed to upload ${uploadFile.file.name}`);
      }
    }

    // Refresh images after all uploads are complete
    setTimeout(() => {
      fetchImages();
    }, 2500);
  };

  // Handle upload file cancel
  const handleUploadCancel = (id: string) => {
    removeUploadFile(id);
  };

  // Handle upload file retry
  const handleUploadRetry = async (id: string) => {
    const uploadFile = uploadFiles.find((file) => file.id === id);
    if (!uploadFile) return;

    // Reset to uploading state
    updateUploadFileProgress(id, 0, 'uploading');

    // Retry the upload
    const formData = new FormData();
    formData.append('folderId', currentFolder!);
    formData.append('images', uploadFile.file);

    try {
      const result = await uploadFileWithProgress(
        '/api/gallery/upload',
        formData,
        (progress) => {
          updateUploadFileProgress(id, progress);
        },
      );

      if (result.success) {
        updateUploadFileProgress(id, 100, 'success');
        setTimeout(() => {
          removeUploadFile(id);
        }, 2000);
        toast.success(`Successfully uploaded ${uploadFile.file.name}`);
      } else {
        updateUploadFileProgress(
          id,
          0,
          'error',
          result.error || 'Upload failed',
        );
        toast.error(
          `Failed to upload ${uploadFile.file.name}: ${result.error}`,
        );
      }
    } catch (error) {
      console.error('Retry upload error:', error);
      updateUploadFileProgress(id, 0, 'error', 'Upload failed');
      toast.error(`Failed to upload ${uploadFile.file.name}`);
    }
  };

  // Handle image approval
  const handleImageApproval = async (imageId: string, approved: boolean) => {
    if (!canManage) {
      toast.error('Management permission required');
      return;
    }

    try {
      const response = await fetch(`/api/gallery/images/${imageId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });

      if (response.ok) {
        toast.success(`Image ${approved ? 'approved' : 'rejected'}`);
        fetchImages(); // Refresh images
      } else {
        toast.error('Failed to update image status');
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to update image status');
    }
  };

  // Handle image deletion
  const handleImageDelete = async (imageId: string) => {
    if (!canManage) {
      toast.error('Management permission required');
      return;
    }

    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/gallery/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Image deleted successfully');
        fetchImages(); // Refresh images
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  // Handle image viewer
  const handleImagePreview = (image: GalleryImage) => {
    setSelectedImage(image);
    setIsImageViewerOpen(true);
  };

  // Handle image viewer close
  const handleImageViewerClose = () => {
    setIsImageViewerOpen(false);
    setSelectedImage(null);
  };

  // Handle image viewer update
  const handleImageViewerUpdate = () => {
    fetchImages(); // Refresh images after any changes
  };

  // Render folder tree
  const renderFolderTree = (
    folderList: FolderTreeItem[],
    level: number = 0,
  ) => {
    return folderList.map((folder) => (
      <div key={folder.id} className="space-y-1">
        <div
          className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
            currentFolder === folder.id
              ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-sm'
              : 'hover:border-l-2 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          style={{
            marginLeft: level > 0 ? '8px' : '0',
            borderLeftWidth: currentFolder === folder.id ? '2px' : '0px',
          }}
          onClick={() => handleFolderSelect(folder.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            if (canManage) {
              handleEditFolder(folder);
            }
          }}
        >
          {/* Expand/Collapse Button */}
          {folder.children && folder.children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFolders((prev) => {
                  const updateFolderExpanded = (
                    folderList: FolderTreeItem[],
                    targetId: string,
                  ): FolderTreeItem[] => {
                    return folderList.map((f) => {
                      if (f.id === targetId) {
                        return { ...f, isExpanded: !f.isExpanded };
                      }
                      if (f.children && f.children.length > 0) {
                        return {
                          ...f,
                          children: updateFolderExpanded(f.children, targetId),
                        };
                      }
                      return f;
                    });
                  };
                  return updateFolderExpanded(prev, folder.id);
                });
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {folder.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 h-4 flex items-center justify-center">
              {/* Empty space for alignment when no children */}
            </div>
          )}

          {/* Folder Icon */}
          <Folder
            className={`h-4 w-4 ${
              currentFolder === folder.id
                ? 'text-primary'
                : 'text-blue-500 group-hover:text-blue-600'
            }`}
          />

          {/* Folder Name */}
          <span className="flex-1 truncate text-sm font-medium">
            {folder.name}
          </span>

          {/* Image Count Badge */}
          <Badge
            variant="secondary"
            className={`text-xs ${
              currentFolder === folder.id
                ? 'bg-primary/20 text-primary'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            {folder.imageCount || 0}
          </Badge>

          {/* Action Buttons - Only visible on hover or when folder is selected */}
          {canManage && (
            <div
              className={`flex items-center gap-1 ${currentFolder === folder.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditFolder(folder);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                title="Edit folder"
              >
                <Edit className="h-3.5 w-3.5 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    confirm(
                      (folder.imageCount || 0) > 0
                        ? `Are you sure you want to delete this folder and all ${folder.imageCount || 0} images inside it? This action cannot be undone.`
                        : 'Are you sure you want to delete this folder?',
                    )
                  ) {
                    deleteFolderById(folder.id);
                  }
                }}
                className="p-1 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 rounded-full"
                title={
                  (folder.imageCount || 0) > 0
                    ? `Delete folder and ${folder.imageCount || 0} images`
                    : 'Delete folder'
                }
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* Nested Folders */}
        {folder.isExpanded && folder.children && folder.children.length > 0 && (
          <div className="border-l border-gray-200 dark:border-gray-700 pl-2 ml-2">
            {renderFolderTree(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Render image grid
  const renderImageGrid = () => {
    if (isLoadingFolders) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading folders...</span>
        </div>
      );
    }

    if (!currentFolder) {
      return (
        <div className="text-center py-12">
          <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {folders.length > 0 ? 'Select a folder' : 'No folders available'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {folders.length > 0
              ? 'Choose a folder from the sidebar to view its images'
              : 'Create your first folder to start organizing images'}
          </p>
          {canUpload && (
            <Button onClick={handleCreateFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              {folders.length > 0 ? 'Create New Folder' : 'Create First Folder'}
            </Button>
          )}
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading images...</span>
        </div>
      );
    }

    if (images.length === 0 && uploadFiles.length === 0) {
      return (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No images found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This folder is empty
          </p>
          {canUpload && (
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </Button>
          )}
        </div>
      );
    }

    // Show upload files even when no images exist
    if (images.length === 0 && uploadFiles.length > 0) {
      return (
        <div>
          <div className="mb-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Uploading Images
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your images are being uploaded. They will appear here once
              complete.
            </p>
          </div>
          <div
            className={`grid gap-4 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                : 'grid-cols-1'
            }`}
          >
            {uploadFiles.map((uploadFile) => (
              <UploadPreviewCard
                key={uploadFile.id}
                uploadFile={uploadFile}
                onCancel={handleUploadCancel}
                onRetry={handleUploadRetry}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`grid gap-4 ${
          viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
            : 'grid-cols-1'
        }`}
      >
        {/* Upload Preview Cards */}
        {uploadFiles.map((uploadFile) => (
          <UploadPreviewCard
            key={uploadFile.id}
            uploadFile={uploadFile}
            onCancel={handleUploadCancel}
            onRetry={handleUploadRetry}
          />
        ))}

        {/* Existing Images */}
        {images.map((image) => (
          <div
            key={image.id}
            className={`group relative bg-white dark:bg-gray-800 rounded-lg border-2 transition-all cursor-pointer ${
              selectedItems.includes(image.id)
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
            }`}
            onClick={() => handleImageSelect(image.id, true)}
            onDoubleClick={() => handleImagePreview(image)}
          >
            {/* Image Preview */}
            <div
              className="aspect-square bg-gray-100 dark:bg-gray-900 rounded-t-lg overflow-hidden"
              title="Double-click to view fullscreen"
            >
              {image.fileUrl ? (
                <img
                  src={image.fileUrl}
                  alt={image.title || image.originalName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                {image.isApproved ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImagePreview(image);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageApproval(image.id, !image.isApproved);
                        }}
                      >
                        {image.isApproved ? (
                          <StarOff className="h-3 w-3" />
                        ) : (
                          <Star className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageDelete(image.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Image Info */}
            <div className="p-3">
              <h3 className="font-medium text-sm truncate">{image.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {image.description}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                <span>
                  {image.fileSize
                    ? `${(image.fileSize / 1024 / 1024).toFixed(1)}MB`
                    : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Sidebar - Folder Tree */}
      <div
        className={`${isFolderPanelOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-col`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
              Folders
            </h2>
            {canUpload && (
              <Button size="sm" variant="outline" onClick={handleCreateFolder}>
                <FolderPlus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {isLoadingFolders ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Loading folders...
                </span>
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  No folders yet
                </p>
                {canUpload && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCreateFolder}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Folder
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1">{renderFolderTree(folders)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                {isLoadingFolders
                  ? 'Loading...'
                  : currentFolder
                    ? folders.find((f) => f.id === currentFolder)?.name ||
                      'Gallery'
                    : folders.length > 0
                      ? 'Select a folder'
                      : 'Gallery'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {isLoadingFolders
                  ? 'Loading folders...'
                  : currentFolder
                    ? `${images.length} images`
                    : folders.length > 0
                      ? 'Choose a folder to view images'
                      : 'No folders available'}{' '}
                • {selectedItems.length} selected
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsFolderPanelOpen((prev) => !prev)}
              >
                <Folder className="h-4 w-4 mr-2" />
                {isFolderPanelOpen ? 'Hide Folders' : 'Show Folders'}
              </Button>

              {canUpload && currentFolder && (
                <Button
                  onClick={() =>
                    document.getElementById('file-upload')?.click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === 'grid' ? 'list' : 'grid')
                }
              >
                {viewMode === 'grid' ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid3X3 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          {currentFolder && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="all">All Images</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedItems.length === images.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>

              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Handle bulk approval
                    selectedItems.forEach((id) =>
                      handleImageApproval(id, true),
                    );
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">{renderImageGrid()}</div>
      </div>

      {/* Hidden file input */}
      <input
        id="file-upload"
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />

      {/* Folder Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        mode={folderModalMode}
        folder={selectedFolder}
        onSuccess={handleFolderModalSuccess}
      />

      {/* Image Viewer */}
      <ImageViewer
        isOpen={isImageViewerOpen}
        onClose={handleImageViewerClose}
        image={selectedImage}
        images={images}
        onImageChange={setSelectedImage}
        onImageUpdate={handleImageViewerUpdate}
      />
    </div>
  );
}
