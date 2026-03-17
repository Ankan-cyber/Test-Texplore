import { z } from 'zod';

// Zod schema for event form validation
export const eventFormSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Event title is required')
      .max(100, 'Title must be less than 100 characters'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must be less than 1000 characters'),
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine((val) => {
        // Validate that it's a valid datetime-local format
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, 'Invalid start date'),
    endDate: z
      .string()
      .min(1, 'End date is required')
      .refine((val) => {
        // Validate that it's a valid datetime-local format
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, 'Invalid end date'),
    location: z.string().optional(),
    isOnline: z.boolean(),
    links: z.array(z.string()).optional(),
    maxCapacity: z
      .string()
      .min(1, 'Capacity is required')
      .refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num > 0;
      }, 'Capacity must be a positive number'),
    isRegistrationOpen: z.boolean(),
    registrationDeadline: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true; // Optional field
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, 'Invalid registration deadline'),
    category: z.string().optional(),
    tags: z.array(z.string()),
    imageUrl: z.string().url().optional().or(z.literal('')),
    isFeatured: z.boolean(),
    status: z.enum([
      'DRAFT',
      'PUBLISHED',
      'CANCELLED',
      'COMPLETED',
      'ARCHIVED',
    ]),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  )
  .refine(
    (data) => {
      if (data.links && data.links.length > 0) {
        return data.links.every(link => {
          if (!link) return true; // Empty links are filtered out later
          
          const [name, url] = link.split('|');
          if (!name?.trim() || !url?.trim()) return true; // Will be filtered out later
          
          // Accept URLs with or without protocol
          const hasProtocol = url.startsWith('http://') || url.startsWith('https://');
          const isValidDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/.test(url) || hasProtocol;
          
          return isValidDomain;
        });
      }
      return true;
    },
    {
      message: 'Please enter valid URLs (e.g., youtube.com or https://youtube.com)',
      path: ['links'],
    },
  );

export type EventFormData = z.infer<typeof eventFormSchema>;

// Shared interfaces
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  isOnline: boolean;
  links?: string[];
  maxCapacity?: number;
  isRegistrationOpen: boolean;
  registrationDeadline?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' | 'ARCHIVED';
  isFeatured: boolean;
  imageUrl?: string;
  tags: string[];
  category?: string;
  departmentId?: string;
  _count?: {
    registrations: number;
    attendees: number;
  };
}

export interface Department {
  id: string;
  name: string;
  displayName: string;
}
