'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface RegisterProps {
  eventId?: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventCapacity?: number;
  registeredCount?: number;
  registrationDeadline?: string;
  isRegistrationOpen?: boolean;
}

const Register = ({
  eventId,
  eventTitle = 'AI/ML Workshop',
  eventDate = 'January 1, 2024',
  eventTime = '10:00 AM',
  eventLocation = 'Room 543, 5th Floor, Building 1',
  eventCapacity = 20,
  registeredCount = 10,
  registrationDeadline,
  isRegistrationOpen = true,
}: RegisterProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    emailId: '',
    college: '',
    department: '',
    phoneNumber: '',
    year: '',
    registrationType: '',
    enrollmentNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare registration data
      const registrationData = {
        fullName: formData.fullName,
        emailId: formData.emailId,
        college:
          formData.registrationType === 'external'
            ? formData.college
            : undefined,
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        year: formData.year,
        registrationType: formData.registrationType,
        enrollmentNumber:
          formData.registrationType === 'internal'
            ? formData.enrollmentNumber
            : undefined,
      };

      const response = await fetch(
        `/api/events/${eventId || 'unknown'}/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Registration successful!');
        setSuccess(true);
      } else {
        toast.error(data.error || 'Failed to register for event');
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      toast.error('Failed to register for event');
    } finally {
      setLoading(false);
    }
  };

  const spotsRemaining = eventCapacity - registeredCount;

  // Check if registration deadline has passed
  const isDeadlinePassed = registrationDeadline
    ? new Date() > new Date(registrationDeadline)
    : false;

  // Check if registration should be disabled
  const isRegistrationDisabled =
    loading || spotsRemaining <= 0 || !isRegistrationOpen || isDeadlinePassed;

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Registration Successful!
            </h2>
            <p className="text-muted-foreground mb-6">
              You have successfully registered for {eventTitle}. We&apos;ll send
              you a confirmation email shortly.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/events">Back to Events</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Go to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-2">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row shadow-2xl rounded-3xl overflow-hidden border border-primary/10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
        {/* Left Panel: Event Details */}
        <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-primary text-white p-12 relative">
          <div className="absolute top-6 left-6 opacity-20 text-accent text-7xl select-none pointer-events-none">
            🎉
          </div>
          <div className="w-full max-w-xs mx-auto">
            <h2 className="text-3xl font-bold mb-4">{eventTitle}</h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-accent" />
                <span className="text-lg">{eventDate}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-accent" />
                <span className="text-lg">{eventTime}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-accent" />
                <span className="text-lg">{eventLocation}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-accent" />
                <span className="text-lg">
                  {registeredCount}/{eventCapacity} registered
                </span>
              </div>
              {registrationDeadline && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-accent" />
                  <span className="text-lg">
                    Registration Deadline:{' '}
                    {new Date(registrationDeadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-8 text-center">
              <span
                className={`inline-block px-4 py-2 rounded-full font-semibold text-sm ${spotsRemaining < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
              >
                {spotsRemaining} spots remaining
              </span>
            </div>
          </div>
        </div>
        {/* Right Panel: Registration Form */}
        <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 bg-white dark:bg-gray-900">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-0">
              Event Registration
            </h1>
          </div>
          <div className="mb-6 text-muted-foreground text-base">
            Complete the form below to register for this event
          </div>

          {/* Registration Status Messages */}
          {!isRegistrationOpen && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">
                Registration is currently closed for this event.
              </p>
            </div>
          )}

          {isDeadlinePassed && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">
                Registration deadline has passed. The deadline was{' '}
                {registrationDeadline &&
                  new Date(registrationDeadline).toLocaleDateString()}
                .
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange('fullName', e.target.value)
                    }
                    placeholder="Enter your full name"
                    required
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailId">Email Address *</Label>
                  <Input
                    id="emailId"
                    type="email"
                    value={formData.emailId}
                    onChange={(e) =>
                      handleInputChange('emailId', e.target.value)
                    }
                    placeholder="your.email@example.com"
                    required
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      handleInputChange('department', value)
                    }
                  >
                    <SelectTrigger className="w-full [&_span]:truncate [&_span]:text-ellipsis [&_span]:overflow-hidden">
                      <SelectValue
                        placeholder="Select your department"
                        className="truncate"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amity_school_engineering_technology_aset">
                        Amity School of Engineering & Technology (ASET)
                      </SelectItem>
                      <SelectItem value="amity_institute_information_technology_aiit">
                        Amity Institute of Information Technology (AIIT)
                      </SelectItem>
                      <SelectItem value="amity_school_business_administration">
                        Amity School of Business Administration
                      </SelectItem>
                      <SelectItem value="amity_school_biological_sciences">
                        Amity School of Biological Sciences
                      </SelectItem>
                      <SelectItem value="amity_school_social_sciences">
                        Amity School of Social Sciences — Arts, Humanities,
                        Culture, Psychology, Economics
                      </SelectItem>
                      <SelectItem value="amity_school_architecture_planning">
                        Amity School of Architecture & Planning
                      </SelectItem>
                      <SelectItem value="amity_school_law">
                        Amity School of Law
                      </SelectItem>
                      <SelectItem value="other">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange('phoneNumber', e.target.value)
                    }
                    placeholder="Enter your phone number"
                    required
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year of Study *</Label>
                  <Select
                    value={formData.year}
                    onValueChange={(value) => handleInputChange('year', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st Year</SelectItem>
                      <SelectItem value="2nd">2nd Year</SelectItem>
                      <SelectItem value="3rd">3rd Year</SelectItem>
                      <SelectItem value="4th">4th Year</SelectItem>
                      <SelectItem value="5th">5th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Registration Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                Registration Type
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationType">Registration Type *</Label>
                  <Select
                    value={formData.registrationType}
                    onValueChange={(value: string) =>
                      handleInputChange('registrationType', value)
                    }
                  >
                    <SelectTrigger className="w-full truncate">
                      <SelectValue
                        placeholder="Select registration type"
                        className="truncate"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal" className="truncate">
                        Internal Student (Amity University)
                      </SelectItem>
                      <SelectItem value="external">
                        External Student (Other Universities)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.registrationType === 'internal' && (
                  <div className="space-y-2">
                    <Label htmlFor="enrollmentNumber">
                      Enrollment Number *
                    </Label>
                    <Input
                      id="enrollmentNumber"
                      type="text"
                      value={formData.enrollmentNumber}
                      onChange={(e) =>
                        handleInputChange('enrollmentNumber', e.target.value)
                      }
                      placeholder="Enter your enrollment number"
                      required
                      className="text-lg"
                    />
                  </div>
                )}
                {formData.registrationType === 'external' && (
                  <div className="space-y-2">
                    <Label htmlFor="college">College Name *</Label>
                    <Input
                      id="college"
                      value={formData.college}
                      onChange={(e) =>
                        handleInputChange('college', e.target.value)
                      }
                      placeholder="Enter your college name"
                      required
                      className="text-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full text-lg font-semibold tracking-wide bg-primary hover:bg-primary/90 transition-colors rounded-xl shadow-md py-3"
                disabled={isRegistrationDisabled}
              >
                {loading
                  ? 'Processing...'
                  : !isRegistrationOpen
                    ? 'Registration Closed'
                    : isDeadlinePassed
                      ? 'Registration Deadline Passed'
                      : spotsRemaining <= 0
                        ? 'Event Full'
                        : 'Register for Event'}
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <Link
              href="/events"
              className="inline-flex items-center text-primary hover:text-accent transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
