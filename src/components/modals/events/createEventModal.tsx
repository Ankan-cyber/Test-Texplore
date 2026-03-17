'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BaseModal } from '../BaseModal';
import { useModal } from '@/providers/ModalContext';
import { Save, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventFormSchema, type EventFormData } from './schemas';

export function CreateEventModal() {
  const { state, closeModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      isOnline: false,
      links: [],
      maxCapacity: '',
      isRegistrationOpen: true,
      registrationDeadline: '',
      category: '',
      tags: [],
      imageUrl: '',
      isFeatured: false,
      status: 'DRAFT' as const,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: EventFormData) => {
    console.log('Form submitted with data:', data);
    setLoading(true);

    try {
      // Convert datetime-local format to ISO string
      const convertToISO = (dateTimeLocal: string | undefined) => {
        if (!dateTimeLocal) return undefined;
        // datetime-local format is "YYYY-MM-DDTHH:MM"
        // We need to convert it to ISO format "YYYY-MM-DDTHH:MM:SS.sssZ"
        const date = new Date(dateTimeLocal);
        return date.toISOString();
      };

      // Filter out undefined values to avoid sending them to the API
      const eventData = {
        ...data,
        startDate: convertToISO(data.startDate)!,
        endDate: convertToISO(data.endDate)!,
        maxCapacity: parseInt(data.maxCapacity),
        registrationDeadline: data.registrationDeadline
          ? convertToISO(data.registrationDeadline)
          : undefined,
        // Filter out empty links and validate format
        links:
          data.links?.filter((link) => {
            const [name, url] = link.split('|');
            return name?.trim() && url?.trim();
          }) || [],
      };

      // Remove undefined values
      Object.keys(eventData).forEach((key) => {
        if (eventData[key as keyof typeof eventData] === undefined) {
          delete eventData[key as keyof typeof eventData];
        }
      });

      console.log('Sending event data to API:', eventData);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });

      console.log('API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('API success response:', result);
        toast.success(result.message || 'Event created successfully!');
        closeModal();
        reset();
        // Trigger a page refresh or update the events list
        window.location.reload();
      } else {
        const error = await response.json();
        console.log('API error response:', error);
        toast.error(error.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/events/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setValue('imageUrl', data.url);
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !watchedValues.tags.includes(tagInput.trim())) {
      const newTags = [...watchedValues.tags, tagInput.trim()];
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = watchedValues.tags.filter((tag) => tag !== tagToRemove);
    setValue('tags', newTags);
  };

  if (state.type !== 'createEvent') return null;

  return (
    <BaseModal
      isOpen={state.isOpen}
      onClose={closeModal}
      title={state.title}
      size={state.size}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-event-form"
            disabled={isSubmitting || loading}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      }
    >
      <form
        id="create-event-form"
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log('Form validation errors:', errors);
        })}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...register('category')}
              placeholder="e.g., Workshop, Competition, Meetup"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="startDate">Start Date & Time *</Label>
            <Input
              id="startDate"
              type="datetime-local"
              {...register('startDate')}
              className={errors.startDate ? 'border-red-500' : ''}
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.startDate.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="endDate">End Date & Time *</Label>
            <Input
              id="endDate"
              type="datetime-local"
              {...register('endDate')}
              className={errors.endDate ? 'border-red-500' : ''}
            />
            {errors.endDate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.endDate.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Physical location"
            />
          </div>
          <div>
            <Label htmlFor="links">Links (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Add custom names for your links (e.g., &quot;Google
              Form|https://forms.google.com&quot;)
            </p>
            <div className="space-y-2">
              {watchedValues.links?.map((link, index) => {
                const [name, url] = link.split('|');
                return (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Link name (e.g., Google Form)"
                      value={name || ''}
                      onChange={(e) => {
                        const newLinks = [...(watchedValues.links || [])];
                        newLinks[index] = `${e.target.value}|${url || ''}`;
                        setValue('links', newLinks);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="URL (e.g., https://forms.google.com)"
                      value={url || ''}
                      onChange={(e) => {
                        const newLinks = [...(watchedValues.links || [])];
                        newLinks[index] = `${name || ''}|${e.target.value}`;
                        setValue('links', newLinks);
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newLinks = [...(watchedValues.links || [])];
                        newLinks.splice(index, 1);
                        setValue('links', newLinks);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newLinks = [...(watchedValues.links || []), ''];
                  setValue('links', newLinks);
                }}
              >
                Add Link
              </Button>
            </div>
            {errors.links && (
              <p className="text-red-500 text-sm mt-1">
                {errors.links.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="maxCapacity">Maximum Capacity *</Label>
            <Input
              id="maxCapacity"
              type="number"
              {...register('maxCapacity')}
              placeholder="Enter Capacity"
              className={errors.maxCapacity ? 'border-red-500' : ''}
            />
            {errors.maxCapacity && (
              <p className="text-red-500 text-sm mt-1">
                {errors.maxCapacity.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="registrationDeadline">Registration Deadline</Label>
            <Input
              id="registrationDeadline"
              type="datetime-local"
              {...register('registrationDeadline')}
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">Event Image</Label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                {...register('imageUrl')}
                placeholder="Image URL or upload a file"
                className={errors.imageUrl ? 'border-red-500' : ''}
              />
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            {errors.imageUrl && (
              <p className="text-red-500 text-sm mt-1">
                {errors.imageUrl.message}
              </p>
            )}
            {watchedValues.imageUrl && (
              <div className="mt-2">
                <img
                  src={watchedValues.imageUrl}
                  alt="Event"
                  className="h-24 rounded object-cover"
                />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addTag())
                }
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {watchedValues.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {watchedValues.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="!whitespace-normal !inline-flex items-start gap-1 max-w-full break-words"
                  >
                    <span className="break-words whitespace-normal word-break break-all">
                      {tag}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeTag(tag);
                      }}
                      className="ml-1 hover:bg-secondary/80 rounded-full p-0.5 transition-colors flex-shrink-0"
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="isOnline" {...register('isOnline')} />
            <Label htmlFor="isOnline">Online Event</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRegistrationOpen"
              {...register('isRegistrationOpen')}
            />
            <Label htmlFor="isRegistrationOpen">Registration Open</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isFeatured"
              {...register('isFeatured')}
            />
            <Label htmlFor="isFeatured">Featured Event</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={watchedValues.status || 'DRAFT'}
            onValueChange={(
              value:
                | 'DRAFT'
                | 'PUBLISHED'
                | 'CANCELLED'
                | 'COMPLETED'
                | 'ARCHIVED',
            ) => {
              setValue('status', value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
          )}
        </div>
      </form>
    </BaseModal>
  );
}
