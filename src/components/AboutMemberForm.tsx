'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AboutMemberFormProps {
  member?: {
    id: string;
    displayName: string;
    role: string;
    bio?: string;
    resumeUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    galleryImageId?: string;
    category: string;
    isPublished: boolean;
  };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

interface GalleryImageOption {
  id: string;
  fileUrl: string;
  thumbnailUrl?: string;
  title?: string;
  originalName?: string;
  folder?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export default function AboutMemberForm({ member, onSave, onCancel }: AboutMemberFormProps) {
  const isCreateMode = !member;
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: member?.displayName || '',
    role: member?.role || '',
    bio: member?.bio || '',
    resumeUrl: member?.resumeUrl || '',
    linkedinUrl: member?.linkedinUrl || '',
    githubUrl: member?.githubUrl || '',
    portfolioUrl: member?.portfolioUrl || '',
    galleryImageId: member?.galleryImageId || '',
    category: member?.category || 'LEADERSHIP',
    isPublished: member?.isPublished ?? true,
  });
  
  const [saving, setSaving] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImageOption[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedImage = galleryImages.find(
    (image) => image.id === formData.galleryImageId,
  );

  const loadGalleryImages = async () => {
    try {
      setLoadingGallery(true);

      const allImages: GalleryImageOption[] = [];
      const pageSize = 100;
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const params = new URLSearchParams({
          status: 'all',
          page: String(page),
          limit: String(pageSize),
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });

        const response = await fetch(`/api/gallery/images?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to load gallery images');
        }

        const payload = await response.json();
        const pageImages = (payload?.images || []) as GalleryImageOption[];
        allImages.push(...pageImages);
        totalPages = payload?.pagination?.pages || 1;
        page += 1;
      }

      setGalleryImages(allImages);
    } catch (error) {
      toast.error('Failed to load gallery images');
    } finally {
      setLoadingGallery(false);
    }
  };

  const togglePicker = async () => {
    const next = !pickerOpen;
    setPickerOpen(next);
    if (next && galleryImages.length === 0) {
      await loadGalleryImages();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.displayName.trim() || !formData.role.trim()) {
      toast.error('Name and role are required');
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Full Name *</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="e.g., John Doe"
          required
        />
      </div>

      {/* Login credentials for new About-only users */}
      {isCreateMode && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Login Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g., faculty.member@college.edu"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </div>
        </>
      )}

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Input
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          placeholder="e.g., President, Event Head"
          required
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Brief description..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Social Links</h4>
        
        <div className="space-y-2">
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <Input
            id="linkedinUrl"
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="githubUrl">GitHub URL</Label>
          <Input
            id="githubUrl"
            type="url"
            value={formData.githubUrl}
            onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
            placeholder="https://github.com/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="portfolioUrl">Portfolio URL</Label>
          <Input
            id="portfolioUrl"
            type="url"
            value={formData.portfolioUrl}
            onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
            placeholder="https://yourportfolio.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resumeUrl">Resume URL (PDF)</Label>
        <Input
          id="resumeUrl"
          type="url"
          value={formData.resumeUrl}
          onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
          placeholder="https://res.cloudinary.com/.../resume.pdf"
        />
      </div>

      {/* Profile Photo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Profile Photo (Gallery)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePicker}
            disabled={loadingGallery}
          >
            {loadingGallery && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pickerOpen ? 'Hide Gallery' : 'Choose From Gallery'}
          </Button>
        </div>

        {formData.galleryImageId ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-2">
            <div className="flex items-center gap-3">
              {selectedImage ? (
                <img
                  src={selectedImage.thumbnailUrl || selectedImage.fileUrl}
                  alt={selectedImage.title || selectedImage.originalName || 'Selected image'}
                  className="h-12 w-12 rounded object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (
                      selectedImage.fileUrl &&
                      target.src !== selectedImage.fileUrl
                    ) {
                      target.src = selectedImage.fileUrl;
                    }
                  }}
                />
              ) : (
                <div className="h-12 w-12 rounded bg-gray-100" />
              )}
              <p className="text-xs text-gray-600">
                {selectedImage
                  ? selectedImage.title || selectedImage.originalName || 'Selected image'
                  : 'Selected image'}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormData({ ...formData, galleryImageId: '' })}
            >
              Remove
            </Button>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No profile image selected</p>
        )}

        {pickerOpen && (
          <div className="rounded-lg border border-gray-200 p-2">
            {galleryImages.length === 0 ? (
              <p className="text-sm text-gray-500">No images available</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {galleryImages.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    className={`rounded border p-1 text-left ${
                      formData.galleryImageId === image.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200'
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, galleryImageId: image.id })
                    }
                  >
                    <img
                      src={image.thumbnailUrl || image.fileUrl}
                      alt={image.title || image.originalName || 'Gallery image'}
                      className="h-20 w-full rounded object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (image.fileUrl && target.src !== image.fileUrl) {
                          target.src = image.fileUrl;
                        }
                      }}
                    />
                    <p className="truncate px-1 pt-1 text-xs text-gray-600">
                      {image.title || image.originalName || 'Image'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LEADERSHIP">Leadership</SelectItem>
            <SelectItem value="DEPARTMENT">Department Head</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Published Status */}
      <div className="flex items-center gap-2">
        <input
          id="isPublished"
          type="checkbox"
          checked={formData.isPublished}
          onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="isPublished" className="font-normal">Publish immediately</Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
