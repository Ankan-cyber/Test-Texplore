'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Icons
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Instagram,
  Linkedin,
  Calendar,
} from 'lucide-react';

const CONTACT_INFO = {
  emails: {
    contact: 'texploreamity@gmail.com',
    admin: 'sukhmanjeetsinghvirk@gmail.com',
  },
  phone: '+91 7657991807',
  location: {
    university: 'Amity University Punjab, Mohali ',
    address: 'Sector 82A, Mohali, Punjab 140306',
  },
};

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
        });

        // Show success message
        toast.success(
          'Thank you for your message! We will get back to you soon.',
        );
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to send message. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-8 md:py-16">
        <div className="container mx-auto px-4 text-center">
          {/* Mobile: Compact header */}
          <div className="md:hidden">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 rounded-full p-3">
                <MessageSquare className="h-8 w-8 text-primary animate-scale-in" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-3 animate-fade-in">
              Get in Touch
            </h1>
            <p className="text-sm text-muted-foreground animate-fade-in leading-relaxed">
              Have questions? Want to join? We&apos;d love to hear from you!
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block">
            <div className="flex justify-center mb-8">
              <div className="bg-primary/10 rounded-full p-4">
                <MessageSquare className="h-12 w-12 text-primary animate-scale-in" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
              Have questions about Texplore Club? Want to join our community?
              We&apos;d love to hear from you! Reach out and let&apos;s start a
              conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card className="hover-scale">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                  <Send className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  <span>Send us a Message</span>
                </CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Need assistance? Our team is here to help.
                </p>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 md:space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <Label htmlFor="name" className="text-xs md:text-sm">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange('name', e.target.value)
                        }
                        placeholder="full name"
                        className="h-10 md:h-11 text-sm md:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <Label htmlFor="email" className="text-xs md:text-sm">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange('email', e.target.value)
                        }
                        placeholder="your.email@gmail.com"
                        className="h-10 md:h-11 text-sm md:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="phone" className="text-xs md:text-sm">
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      placeholder="+91 9876543210"
                      className="h-10 md:h-11 text-sm md:text-base"
                    />
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="message" className="text-xs md:text-sm">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange('message', e.target.value)
                      }
                      placeholder="Tell us how we can help you..."
                      rows={4}
                      className="text-sm md:text-base"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    variant="outline"
                    className="w-full h-11 md:h-12 hover-scale border-primary text-primary bg-primary/10 hover:bg-primary hover:text-white backdrop-blur-sm text-sm md:text-base"
                    disabled={isSubmitting}
                  >
                    <Send className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-4 md:space-y-8">
              {/* Contact Details */}
              <Card className="hover-scale">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-6">
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="bg-primary/10 rounded-full p-2 md:p-3 flex-shrink-0">
                      <Mail className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">
                        Email
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground break-words">
                        {CONTACT_INFO.emails.contact}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground break-words">
                        {CONTACT_INFO.emails.admin}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="bg-primary/10 rounded-full p-2 md:p-3 flex-shrink-0">
                      <Phone className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">
                        Phone
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {CONTACT_INFO.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="bg-primary/10 rounded-full p-2 md:p-3 flex-shrink-0">
                      <MapPin className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">
                        Location
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {CONTACT_INFO.location.university}
                        <br />
                        {CONTACT_INFO.location.address}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="hover-scale">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">
                    Follow Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="flex space-x-4">
                    <Link
                      href="https://www.instagram.com/texplore_aup/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 md:h-12 md:w-12 hover-scale"
                      >
                        <Instagram className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </Button>
                    </Link>
                    <Link
                      href="https://www.linkedin.com/company/texplore-club-aup/posts/?feedView=all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 md:h-12 md:w-12 hover-scale"
                      >
                        <Linkedin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-3 md:mt-4">
                    Stay connected with us on social media for the latest
                    updates, event photos, and community highlights.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Mobile: Compact header */}
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground">
              Quick answers to common questions
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Quick answers to common questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
            <Card className="hover-scale">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-bold mb-2 text-sm md:text-base">
                  How do I join Texplore Club?
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Fill out our contact form with your interest to join, or
                  attend one of our events. We review applications and will
                  contact you with next steps.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-bold mb-2 text-sm md:text-base">
                  Is membership free?
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Yes! Texplore Club membership is completely free for all Amity
                  University students. Some special workshops may have minimal
                  material costs.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-bold mb-2 text-sm md:text-base">
                  What if I&apos;m a beginner?
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Perfect! We welcome students at all skill levels. Our
                  community is built on learning together and supporting each
                  other&apos;s growth.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-bold mb-2 text-sm md:text-base">
                  Can I propose an event idea?
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Absolutely! We encourage member-driven initiatives. Contact us
                  with your event proposal and we&apos;ll help you make it
                  happen.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 md:py-16 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          {/* Mobile: Compact CTA */}
          <div className="md:hidden">
            <h2 className="text-xl font-bold mb-2">
              Ready to Join Our Community?
            </h2>
            <p className="text-sm mb-4 opacity-90">
              Connect with us today and start your journey.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="hover-scale border-white text-white bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm"
              asChild
            >
              <Link href="/events">
                <Calendar className="mr-2 h-4 w-4" />
                View Events
              </Link>
            </Button>
          </div>

          {/* Desktop: Full CTA */}
          <div className="hidden md:block">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Join Our Community?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Don&apos;t wait! Connect with us today and start your journey with
              Texplore Club.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                className="hover-scale border-white text-white bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm"
                asChild
              >
                <Link href="/events">
                  <Calendar className="mr-2 h-5 w-5" />
                  View Events
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
