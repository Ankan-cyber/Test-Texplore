'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Checkbox } from '@/components/ui/checkbox';
import { Users, Send, Target, Heart, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Zod schema for form validation
const joinClubSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits'),
  email: z.string().email('Please enter a valid email address'),
  branch: z.string().min(1, 'Please select your branch'),
  year: z.string().min(1, 'Please select your year of study'),
  departments: z
    .array(z.string())
    .min(1, 'Please select at least one department'),
  whyJoin: z
    .string()
    .min(20, 'Please provide a more detailed response (at least 20 characters)')
    .max(500, 'Response must be less than 500 characters'),
});

type JoinClubFormData = z.infer<typeof joinClubSchema>;

const JoinClub = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<JoinClubFormData>({
    resolver: zodResolver(joinClubSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
      branch: '',
      year: '',
      departments: [],
      whyJoin: '',
    },
  });

  const watchedDepartments = watch('departments');

  const branches = [
    'amity_school_engineering_technology_aset',
    'amity_institute_information_technology_aiit',
    'amity_school_business_administration',
    'amity_school_biological_sciences',
    'amity_school_social_sciences',
    'amity_school_architecture_planning',
    'amity_school_law',
    'other',
  ];

  const branchLabels: Record<string, string> = {
    amity_school_engineering_technology_aset:
      'Amity School of Engineering & Technology (ASET)',
    amity_institute_information_technology_aiit:
      'Amity Institute of Information Technology (AIIT)',
    amity_school_business_administration:
      'Amity School of Business Administration',
    amity_school_biological_sciences: 'Amity School of Biological Sciences',
    amity_school_social_sciences:
      'Amity School of Social Sciences — Arts, Humanities, Culture, Psychology, Economics',
    amity_school_architecture_planning:
      'Amity School of Architecture & Planning',
    amity_school_law: 'Amity School of Law',
    other: 'Others',
  };

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  const departments = [
    'Technology & Development Team',
    'Event Management Team',
    'Marketing Team',
    'Design & Creative Team',
    'Finance Team',
    'Human Resources Team',
  ];

  const handleDepartmentChange = (department: string, checked: boolean) => {
    const currentDepartments = watchedDepartments || [];
    if (checked) {
      setValue('departments', [...currentDepartments, department]);
    } else {
      setValue(
        'departments',
        currentDepartments.filter((d) => d !== department),
      );
    }
  };

  const onSubmit = async (data: JoinClubFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/join-club', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          'Thank you for your interest! We will get back to you soon.',
        );
        reset();
      } else {
        throw new Error(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'There was an error submitting your application. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-2">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row shadow-2xl rounded-3xl overflow-hidden border border-primary/10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
        {/* Left Panel: Club Information */}
        <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-primary text-white p-12 relative">
          <div className="absolute top-6 left-6 opacity-20 text-accent text-7xl select-none pointer-events-none">
            🚀
          </div>
          <div className="w-full max-w-xs mx-auto">
            <h2 className="text-3xl font-bold mb-4">Join Texplore Club</h2>
            <p className="text-lg mb-8 text-white/90">
              Be part of our tech entrepreneurship and innovation community
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-accent" />
                <span className="text-lg">Connect & Collaborate</span>
              </div>
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-accent" />
                <span className="text-lg">Create & Innovate</span>
              </div>
              <div className="flex items-center space-x-3">
                <Heart className="h-5 w-5 text-accent" />
                <span className="text-lg">Lead & Inspire</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-accent" />
                <span className="text-lg">Join 200+ Members</span>
              </div>
            </div>
            <div className="mt-8 text-center">
              <span className="inline-block px-4 py-2 rounded-full font-semibold text-sm bg-accent/20 text-accent">
                Applications Open
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Application Form */}
        <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 bg-white dark:bg-gray-900">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-0">
              Club Application
            </h1>
          </div>
          <div className="mb-6 text-muted-foreground text-base">
            Complete the form below to join our community
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className={`text-lg ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    className={`text-lg ${errors.phoneNumber ? 'border-red-500 focus:border-red-500' : ''}`}
                    {...register('phoneNumber')}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className={`text-lg ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                Academic Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch *</Label>
                  <Select onValueChange={(value) => setValue('branch', value)}>
                    <SelectTrigger
                      className={`w-full [&_span]:truncate [&_span]:text-ellipsis [&_span]:overflow-hidden ${
                        errors.branch
                          ? 'border-red-500 focus:border-red-500'
                          : ''
                      }`}
                    >
                      <SelectValue
                        placeholder="Select your branch"
                        className="truncate"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branchLabels[branch]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.branch && (
                    <p className="text-sm text-red-500">
                      {errors.branch.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year of Study *</Label>
                  <Select onValueChange={(value) => setValue('year', value)}>
                    <SelectTrigger
                      className={
                        errors.year ? 'border-red-500 focus:border-red-500' : ''
                      }
                    >
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.year && (
                    <p className="text-sm text-red-500">
                      {errors.year.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Department Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                Department Interests
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                {departments.map((department) => (
                  <div key={department} className="flex items-center space-x-2">
                    <Checkbox
                      id={department}
                      checked={
                        watchedDepartments?.includes(department) || false
                      }
                      onCheckedChange={(checked: boolean | 'indeterminate') =>
                        handleDepartmentChange(department, checked === true)
                      }
                    />
                    <Label
                      htmlFor={department}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {department}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.departments && (
                <p className="text-sm text-red-500">
                  {errors.departments.message}
                </p>
              )}
            </div>

            {/* Why Join */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Motivation</h3>
              <div className="space-y-2">
                <Label htmlFor="whyJoin">
                  What are your skills, and why do you want to join this club?
                </Label>
                <Textarea
                  id="whyJoin"
                  placeholder="Tell us about your skills, motivation, interests, and what you hope to achieve by joining our club..."
                  className={`min-h-[120px] resize-none text-lg ${errors.whyJoin ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register('whyJoin')}
                />
                {errors.whyJoin && (
                  <p className="text-sm text-red-500">
                    {errors.whyJoin.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full text-lg font-semibold tracking-wide bg-primary hover:bg-primary/90 transition-colors rounded-xl shadow-md py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-primary hover:text-accent transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinClub;
