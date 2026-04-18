'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Upload,
  Loader2,
  FileText,
  ExternalLink,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import {
  getOrCreateAboutProfileFolder,
} from '@/lib/gallery-folder-helper';

interface AboutProfile {
  displayName: string;
  role: string;
  bio: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  imageCloudinaryUrl?: string;
  imageThumbnailUrl?: string;
  galleryImageId?: string;
  imageCloudinaryId?: string;
  isPublished?: boolean;
}

interface GalleryImageOption {
  id: string;
  fileUrl: string;
  thumbnailUrl?: string;
  cloudinaryId: string;
  title?: string;
  originalName?: string;
  folder?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

function getSafeImageSrc(image: {
  thumbnailUrl?: string;
  fileUrl?: string;
}) {
  return image.thumbnailUrl || image.fileUrl || '';
}

interface AboutProfileEditorProps {
  userId?: string;
}

export default function AboutProfileEditor({ userId }: AboutProfileEditorProps) {
  const [profile, setProfile] = useState<AboutProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImageOption[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to read file'));
          return;
        }
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/about/me');
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      const data = await response.json();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

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
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || 'Failed to load gallery images');
        }

        const payload = await response.json();
        const pageImages = (payload?.images || []) as GalleryImageOption[];
        allImages.push(...pageImages);
        totalPages = payload?.pagination?.pages || 1;
        page += 1;
      }

      setGalleryImages(allImages);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load gallery images',
      );
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleSelectFromGallery = (image: GalleryImageOption) => {
    if (!profile) {
      return;
    }

    setProfile({
      ...profile,
      galleryImageId: image.id,
      imageCloudinaryId: image.cloudinaryId,
      imageCloudinaryUrl: image.fileUrl,
      imageThumbnailUrl: image.thumbnailUrl,
    });
    setIsPickerOpen(false);
    toast.success('Profile image selected from gallery');
  };

  const handleSave = async (e: React  .FormEvent) => {
    e.preventDefault();

    if (!profile) {
      toast.error('No profile loaded');
      return;
    }

    if (!profile.displayName.trim() || !profile.role.trim()) {
      toast.error('Name and role are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/about/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profile.displayName,
          role: profile.role,
          bio: profile.bio,
          linkedinUrl: profile.linkedinUrl,
          githubUrl: profile.githubUrl,
          portfolioUrl: profile.portfolioUrl,
          resumeUrl: profile.resumeUrl,
          galleryImageId: profile.galleryImageId,
          imageCloudinaryId: profile.imageCloudinaryId,
          imageCloudinaryUrl: profile.imageCloudinaryUrl,
          isPublished: profile.isPublished,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save profile');
      }

      toast.success('Profile updated successfully');
      await fetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Get or create About Member Profiles folder
      const folderId = await getOrCreateAboutProfileFolder();
      if (!folderId) {
        throw new Error('Unable to access profile photo folder');
      }

      const fileBase64 = await fileToBase64(file);

      const uploadResponse = await fetch('/api/gallery/images/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: fileBase64,
          fileName: file.name,
          title: `${profile?.displayName || 'About Member'} Profile Photo`,
          description: 'About member profile photo',
          tags: ['about', 'profile'],
          altText: profile?.displayName || 'About member profile photo',
          folderId: folderId,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => null);
        throw new Error(errorData?.error || 'Upload failed');
      }

      const uploadedData = await uploadResponse.json();
      const image = uploadedData?.data;
      
      // Save to profile with proper URL handling
      if (profile && image) {
        setProfile({
          ...profile,
          galleryImageId: image.id,
          imageCloudinaryId: image.cloudinaryId,
          imageCloudinaryUrl: image.fileUrl || image.secure_url,
          imageThumbnailUrl: image.thumbnailUrl || image.fileUrl || image.secure_url,
        });
      }

      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume must be less than 5MB');
      e.target.value = '';
      return;
    }

    try {
      setUploadingResume(true);

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/about/resume/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => null);
        throw new Error(errorData?.error || 'Resume upload failed');
      }

      const data = await uploadResponse.json();
      if (profile && data?.url) {
        setProfile({
          ...profile,
          resumeUrl: data.url,
        });
      }

      toast.success('Resume uploaded successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Profile Image */}
      <div className="space-y-4">
        <div>
          <Label>Profile Image</Label>
          <p className="text-sm text-gray-600 mb-3">Upload a profile picture (JPG, PNG, or WebP)</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {profile.imageCloudinaryUrl && (
            <img
              src={getSafeImageSrc({
                thumbnailUrl: profile.imageThumbnailUrl,
                fileUrl: profile.imageCloudinaryUrl,
              })}
              alt={profile.displayName}
              className="h-24 w-24 rounded-lg object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (
                  profile.imageCloudinaryUrl &&
                  target.src !== profile.imageCloudinaryUrl
                ) {
                  target.src = profile.imageCloudinaryUrl;
                }
              }}
            />
          )}

          <div className="flex-1">
            <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-gray-400 transition">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Click to upload image</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {/* <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenPicker}
                disabled={uploading || loadingGallery}
              >
                {loadingGallery ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-2" />
                )}
                {isPickerOpen ? 'Hide Gallery' : 'Choose From Gallery'}
              </Button>
            </div> */}

            {isPickerOpen && (
              <div className="mt-4 rounded-lg border border-gray-200 p-3">
                {loadingGallery ? (
                  <div className="flex items-center text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading images...
                  </div>
                ) : galleryImages.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    No gallery images found. Upload an image first.
                  </p>
                ) : (
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {galleryImages.map((image) => {
                        const isActive = profile.galleryImageId === image.id;

                        return (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => handleSelectFromGallery(image)}
                            className={`rounded-md border p-1 text-left transition ${
                              isActive
                                ? 'border-primary ring-2 ring-primary/30'
                                : 'border-gray-200 hover:border-primary/50'
                            }`}
                            title={image.title || image.originalName || 'Gallery image'}
                          >
                            <img
                              src={getSafeImageSrc(image)}
                              alt={image.title || image.originalName || 'Gallery image'}
                              className="h-20 w-full rounded object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (image.fileUrl && target.src !== image.fileUrl) {
                                  target.src = image.fileUrl;
                                }
                              }}
                            />
                            <p className="mt-1 truncate px-1 text-xs text-gray-600">
                              {image.title || image.originalName || 'Image'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Full Name *</Label>
        <Input
          id="displayName"
          value={profile.displayName}
          onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
          placeholder="Your full name"
          required
        />
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Role/Position *</Label>
        <Input
          id="role"
          value={profile.role}
          onChange={(e) => setProfile({ ...profile, role: e.target.value })}
          placeholder="e.g., President, Event Head"
          required
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio / About You</Label>
        <Textarea
          id="bio"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Tell visitors about yourself, your interests, and achievements..."
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="font-medium">Social Links (Optional)</h3>

        <div className="space-y-2">
          <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
          <Input
            id="linkedinUrl"
            type="url"
            value={profile.linkedinUrl || ''}
            onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="githubUrl">GitHub Profile</Label>
          <Input
            id="githubUrl"
            type="url"
            value={profile.githubUrl || ''}
            onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
            placeholder="https://github.com/yourprofile"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="portfolioUrl">Portfolio Website</Label>
          <Input
            id="portfolioUrl"
            type="url"
            value={profile.portfolioUrl || ''}
            onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
            placeholder="https://yourportfolio.com"
          />
        </div>
      </div>

      {/* Resume */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <div>
          <Label>Resume (PDF)</Label>
          <p className="text-xs text-gray-600 mt-1">
            Upload your resume. Only PDF files up to 5MB are allowed.
          </p>
        </div>

        <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 cursor-pointer hover:border-gray-400 transition">
          {uploadingResume ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
          ) : (
            <>
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">Click to upload resume PDF</span>
            </>
          )}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleResumeUpload}
            disabled={uploadingResume}
            className="hidden"
          />
        </label>

        {profile.resumeUrl ? (
          <div className="flex items-center justify-between rounded-md border border-gray-200 p-2">
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View uploaded resume
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setProfile({ ...profile, resumeUrl: '' })}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No resume uploaded yet</p>
        )}
      </div>


      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={saving || uploading || uploadingResume}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
