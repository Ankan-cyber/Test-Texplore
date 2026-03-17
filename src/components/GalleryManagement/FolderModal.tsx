'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Folder,
  FolderPlus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Globe,
  Lock,
} from 'lucide-react';
import { GalleryFolder } from '@/types/common';
import toast from 'react-hot-toast';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  folder?: GalleryFolder;
  parentFolderId?: string;
  onSuccess: () => void;
}

interface FolderTreeItem extends GalleryFolder {
  children?: FolderTreeItem[];
  isExpanded?: boolean;
}

export default function FolderModal({
  isOpen,
  onClose,
  mode,
  folder,
  parentFolderId,
  onSuccess,
}: FolderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);

  // Load folders for parent selection
  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);

  // Initialize form when editing
  useEffect(() => {
    if (mode === 'edit' && folder) {
      setName(folder.name);
      setDescription(folder.description || '');
      setIsPublic(folder.isPublic);
      setSelectedParentId(folder.parentId || '');
    } else if (mode === 'create') {
      setName('');
      setDescription('');
      setIsPublic(false);
      setSelectedParentId(parentFolderId || '');
    }
  }, [mode, folder, parentFolderId]);

  const fetchFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const response = await fetch('/api/gallery/folders/tree');
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    setIsLoading(true);
    try {
      const folderData = {
        name: name.trim(),
        description: description.trim(),
        parentId: selectedParentId || undefined,
        isPublic: isPublic,
      };

      const url =
        mode === 'create'
          ? '/api/gallery/folders'
          : `/api/gallery/folders/${folder?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData),
      });

      if (response.ok) {
        toast.success(
          `Folder ${mode === 'create' ? 'created' : 'updated'} successfully`,
        );
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || `Failed to ${mode} folder`);
      }
    } catch (error) {
      console.error('Folder operation error:', error);
      toast.error(`Failed to ${mode} folder`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!folder) return;

    if (
      !confirm(
        'Are you sure you want to delete this folder? This action cannot be undone.',
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/gallery/folders/${folder.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Folder deleted successfully');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete folder');
    } finally {
      setIsLoading(false);
    }
  };

  // Render folder tree for parent selection
  const renderFolderTree = (
    folderList: FolderTreeItem[],
    level: number = 0,
    excludeId?: string,
  ) => {
    return folderList
      .filter((f) => f.id !== excludeId) // Exclude current folder when editing
      .map((folder) => (
        <div key={folder.id}>
          <div
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              selectedParentId === folder.id ? 'bg-primary/10 text-primary' : ''
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => setSelectedParentId(folder.id)}
          >
            {folder.children && folder.children.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFolders((prev) =>
                    prev.map((f) =>
                      f.id === folder.id
                        ? { ...f, isExpanded: !f.isExpanded }
                        : f,
                    ),
                  );
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {folder.isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            <Folder className="h-4 w-4 text-blue-500" />
            <span className="flex-1 truncate">{folder.name}</span>
            <Badge variant="secondary" className="text-xs">
              {folder.imageCount || 0}
            </Badge>
          </div>
          {folder.isExpanded && folder.children && (
            <div>{renderFolderTree(folder.children, level + 1, excludeId)}</div>
          )}
        </div>
      ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <FolderPlus className="h-5 w-5" />
                Create New Folder
              </>
            ) : (
              <>
                <Edit className="h-5 w-5" />
                Edit Folder
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new folder to organize your gallery images'
              : 'Update folder details and structure'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Folder Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter folder name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-medium flex items-center gap-2">
                  About the Event <span className="text-sm font-normal text-muted-foreground">(Will be displayed on the gallery details page)</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about this event or photo collection"
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <Label
                  htmlFor="isPublic"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {isPublic ? (
                    <Globe className="h-4 w-4 text-green-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                  Make this folder public
                </Label>
              </div>
              {isPublic && (
                <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span>
                      This folder will be visible on the public gallery page.
                      Only approved images in public folders will be shown to
                      visitors.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parent Folder Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Parent Folder</Label>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant={selectedParentId === '' ? 'default' : 'outline'}
                    onClick={() => setSelectedParentId('')}
                    className="mb-2"
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Root Level (No Parent)
                  </Button>
                </div>

                {isLoadingFolders ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading folders...</span>
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 max-h-48 overflow-y-auto">
                    {folders.length > 0 ? (
                      renderFolderTree(
                        folders,
                        0,
                        mode === 'edit' ? folder?.id : undefined,
                      )
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No folders available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Folder className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium">{name}</div>
                    {description && (
                      <div className="text-sm text-gray-500">{description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isPublic && (
                      <Badge variant="default" className="bg-green-600">
                        <Globe className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    )}
                    {selectedParentId && (
                      <Badge variant="outline">
                        {folders.find((f) => f.id === selectedParentId)?.name ||
                          'Parent Folder'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mode === 'edit' && folder && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Folder
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    {mode === 'create' ? (
                      <>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Create Folder
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Update Folder
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
