'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Heart, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ClubSettings } from '@/types/common';

const About = () => {
  const [clubSettings, setClubSettings] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<{
    src: string;
    name: string;
    role: string;
  } | null>(null);

  // Departments with head images
  // To add images: Place images in /public/departments/ folder
  // Update the image paths below with actual image paths
  const departments = [
    {
      name: 'Event Management Team',
      head: 'Tejveer singh',
      headImage: '/departments/Event-head.jpeg', // Update with actual image path
      description:
        'Plans, organizes, and executes all events, workshops, competitions, and meetups.',
      responsibilities: [
        'Event Planning',
        'Venue Coordination',
        'Speaker Management',
        'Logistics',
      ],
    },
    {
      name: 'Technology & Development Team',
      head: 'Sahajdeep Singh',
      headImage: '/departments/Sahaj.jpg', // Update with actual image path
      description:
        "Works on the club's tech projects, website, AI/ML tools, and digital product development.",
      responsibilities: [
        'Web Development',
        'AI/ML Projects',
        'Tech Innovation',
        'Digital Products',
      ],
    },
    {
      name: 'Marketing Team',
      head: 'Abhinandan Sambyal',
      headImage: '/departments/marketing-head.jpeg', // Update with actual image path
      description:
        'Handles promotions, social media, public relations, and outreach for events and club branding.',
      responsibilities: [
        'Social Media',
        'Brand Management',
        'Public Relations',
        'Content Creation',
      ],
    },
    {
      name: 'Design & Creative Team',
      head: 'Sifat Singh',
      headImage: '/departments/design-head.jpeg', // Update with actual image path
      description:
        'Creates graphics, posters, videos, event branding, and maintains the visual identity.',
      responsibilities: [
        'Graphic Design',
        'Video Production',
        'Brand Identity',
        'Creative Content',
      ],
    },
    {
      name: 'Finance Team',
      head: 'Sukhmanjeet Singh',
      headImage: '/leadership/president.jpeg', // Update with actual image path
      description:
        'Handles budgeting, sponsorships, funding, and financial planning for events and operations.',
      responsibilities: [
        'Budget Management',
        'Sponsorship Acquisition',
        'Financial Planning',
        'Resource Allocation',
      ],
    },
    {
      name: 'Human Resources Team',
      head: 'Vanshika Rastogi',
      headImage: '/departments/hr-head.jpeg', // Update with actual image path
      description:
        'Manages member onboarding, role assignments, internal communication, and team well-being.',
      responsibilities: [
        'Member Onboarding',
        'Team Management',
        'Internal Communication',
        'Wellness Programs',
      ],
    },
    {
      name: 'Event Management Team',
      head: 'Aryan Sharma',
      headImage: '/departments/Event-head3.jpeg', // Update with actual image path
      description:
        'Plans, organizes, and executes all events, workshops, competitions, and meetups.',
      responsibilities: [
        'Event Planning',
        'Venue Coordination',
        'Speaker Management',
        'Logistics',
      ],
    },
    {
      name: 'Event Management Team',
      head: 'Jasleen Walia',
      headImage: '/departments/Event-head2.jpeg', // Updated image with better headroom to avoid cutting the head
      description:
        'Plans, organizes, and executes all events, workshops, competitions, and meetups.',
      responsibilities: [
        'Event Planning',
        'Venue Coordination',
        'Speaker Management',
        'Logistics',
      ],
    },
  ];

  // Leadership members with their images
  // To add images: Place images in /public/leadership/ folder or use Cloudinary URLs
  // Update the image paths below with actual image paths
  const leaders = [
    {
      name: 'Sukhmanjeet Singh',
      role: 'President',
      image: '/leadership/president.jpeg',
    },
    {
      name: 'Pallavi Sharma',
      role: 'Vice President',
      image: '/leadership/vice-president.jpeg',
    },
    {
      name: 'Prof. (Dr.) Rajni Mohana',
      role: 'Faculty Advisor',
      additionalRole: 'Dean of ASET',
      image: '/leadership/faculty5.jpeg',
    },
    {
      name: 'Prof. (Dr.) Sachin Sharma',
      role: 'Faculty Coordinator',
      additionalRole: 'Head of School of ASET',
      image: '/leadership/faculty3.jpeg',
    },
    {
      name: 'Dr. Himanshu Jindal',
      role: 'Faculty Coordinator',
      additionalRole: 'Head of Department of ASET',
      image: '/leadership/faculty2.jpeg',
    },
    {
      name: 'Prof. (Dr.) Puneet Mittal',
      role: 'Faculty Coordinator',
      additionalRole: 'Placement Coordinator of ASET',
      image: '/leadership/faculty4.jpeg',
    },
    {
      name: 'Dr. Monika Bharti',
      role: 'Faculty Coordinator',
      additionalRole: 'Program Coordinator of ASET',
      image: '/leadership/faculty1.jpeg',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading club information...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-8 md:py-16">
        <div className="container mx-auto px-4 text-center">
          {/* Mobile: Compact layout */}
          <div className="md:hidden">
            <div className="flex justify-center mb-4">
              <Image
                width={60}
                height={60}
                src="/favicon.ico"
                alt="Texplore Club Logo"
                className="h-14 w-14 animate-scale-in"
              />
            </div>
            <h1 className="text-2xl font-bold mb-3 animate-fade-in">
              About Texplore Club
            </h1>
            <p className="text-sm text-muted-foreground animate-fade-in leading-relaxed">
              Where entrepreneurship meets technology, marketing blends with
              creativity, and entertainment comes alive.
            </p>
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden md:block">
            <div className="flex justify-center mb-8">
              <Image
                width={80}
                height={80}
                src="/favicon.ico"
                alt="Texplore Club Logo"
                className="h-20 w-auto animate-scale-in"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              About Texplore Club
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
              Welcome to Texplore Club at{' '}
              {clubSettings?.university_name ||
                'Amity University Punjab, Mohali'}
              ! Where entrepreneurship meets technology, marketing blends with
              creativity, and entertainment comes alive.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8 md:mb-16">
            {/* Mobile: Simplified mission */}
            <div className="md:hidden">
              <div className="flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary mr-2" />
                <h2 className="text-xl font-bold">Our Mission</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                &quot;Step into a space where ideas take flight, where
                entrepreneurship meets technology, marketing blends with
                creativity, and entertainment comes alive.&quot;
              </p>
              <div className="grid grid-cols-1 gap-4">
                <Card className="hover-scale">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-1.5 text-sm">Connect</h3>
                    <p className="text-xs text-muted-foreground">
                      Build lasting relationships with like-minded innovators
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover-scale">
                  <CardContent className="p-4 text-center">
                    <Star className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-1.5 text-sm">Create</h3>
                    <p className="text-xs text-muted-foreground">
                      Turn your ideas into reality through collaborative
                      projects
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover-scale">
                  <CardContent className="p-4 text-center">
                    <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-1.5 text-sm">Lead</h3>
                    <p className="text-xs text-muted-foreground">
                      Develop leadership skills in tech and entrepreneurship
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Desktop: Full mission */}
            <div className="hidden md:block">
              <div className="flex items-center justify-center mb-6">
                <Target className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-3xl font-bold">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                &quot;Still confused about what to do? You&apos;re not alone —
                that&apos;s exactly why we&apos;re here! Step into a space where
                ideas take flight, where entrepreneurship meets technology,
                marketing blends with creativity, and entertainment comes alive.
                &quot;
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="hover-scale">
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-bold mb-2">Connect</h3>
                    <p className="text-sm text-muted-foreground">
                      Build lasting relationships with like-minded innovators
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover-scale">
                  <CardContent className="p-6 text-center">
                    <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-bold mb-2">Create</h3>
                    <p className="text-sm text-muted-foreground">
                      Turn your ideas into reality through collaborative
                      projects
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover-scale">
                  <CardContent className="p-6 text-center">
                    <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-bold mb-2">Lead</h3>
                    <p className="text-sm text-muted-foreground">
                      Develop leadership skills in tech and entrepreneurship
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-8 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Mobile: Compact header */}
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Our Leadership</h2>
            <p className="text-xs text-muted-foreground">
              Meet the people guiding Texplore Club
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Leadership</h2>
            <p className="text-muted-foreground">
              Meet the people guiding Texplore Club to new heights
            </p>
          </div>

          {/* Executive Leadership - First 2 members */}
          <div className="mb-6 md:mb-8">
            <h3 className="text-base md:text-xl font-semibold text-center mb-4 md:mb-6 text-primary">
              Executive Leadership
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
              {leaders.slice(0, 2).map((leader, index) => (
                <Card key={index} className="hover-scale text-center">
                  <CardContent className="p-4 md:p-6">
                    <div
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-3 md:mb-4 overflow-hidden border-4 border-primary/20 shadow-lg cursor-pointer relative z-10"
                      onMouseEnter={() => {
                        if (
                          leader.image &&
                          leader.image !== '/placeholder-avatar.jpg'
                        ) {
                          setHoveredImage({
                            src: leader.image,
                            name: leader.name,
                            role: leader.role,
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredImage(null)}
                    >
                      {leader.image &&
                      leader.image !== '/placeholder-avatar.jpg' ? (
                        <Image
                          src={leader.image}
                          alt={leader.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <h3 className="font-bold text-sm md:text-base leading-tight">
                        {leader.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs font-semibold px-2 md:px-3 py-0.5 md:py-1"
                      >
                        {leader.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Faculty Advisors - Remaining 5 members */}
          <div>
            <h3 className="text-base md:text-xl font-semibold text-center mb-4 md:mb-6 text-primary">
              Faculty Members
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 max-w-6xl mx-auto">
              {leaders.slice(2).map((leader, index) => (
                <Card key={index + 2} className="hover-scale text-center">
                  <CardContent className="p-3 md:p-6">
                    <div
                      className="w-20 h-20 md:w-32 md:h-32 rounded-full mx-auto mb-3 md:mb-4 overflow-hidden border-4 border-primary/20 shadow-lg cursor-pointer relative z-10"
                      onMouseEnter={() => {
                        if (
                          leader.image &&
                          leader.image !== '/placeholder-avatar.jpg'
                        ) {
                          setHoveredImage({
                            src: leader.image,
                            name: leader.name,
                            role: leader.role,
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredImage(null)}
                    >
                      {leader.image &&
                      leader.image !== '/placeholder-avatar.jpg' ? (
                        <Image
                          src={leader.image}
                          alt={leader.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5 md:space-y-2.5">
                      <h3 className="font-bold text-xs md:text-base leading-tight mb-0.5 md:mb-1">
                        {leader.name}
                      </h3>
                      <div className="flex flex-col items-center gap-1 md:gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] md:text-xs font-semibold px-2 md:px-3 py-0.5 md:py-1 whitespace-nowrap"
                        >
                          {leader.role}
                        </Badge>
                        {(leader as any).additionalRole && (
                          <p className="text-[9px] md:text-[11px] text-muted-foreground font-medium text-center leading-tight px-1 md:px-2">
                            {(leader as any).additionalRole}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          {/* Mobile: Compact header */}
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Our Departments</h2>
            <p className="text-xs text-muted-foreground">
              Specialized teams working together
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Departments</h2>
            <p className="text-muted-foreground">
              Specialized teams working together to achieve our mission
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {departments.map((dept, index) => (
              <Card key={index} className="hover-scale group">
                <CardHeader className="p-4 md:p-6">
                  {/* Department Head Image */}
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div
                      className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md flex-shrink-0 cursor-pointer relative z-10"
                      onMouseEnter={() => {
                        if (
                          dept.headImage &&
                          dept.headImage !== '/placeholder-avatar.jpg'
                        ) {
                          setHoveredImage({
                            src: dept.headImage,
                            name: dept.head,
                            role: dept.name,
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredImage(null)}
                    >
                      {dept.headImage &&
                      dept.headImage !== '/placeholder-avatar.jpg' ? (
                        <Image
                          src={dept.headImage}
                          alt={dept.head}
                          width={64}
                          height={64}
                          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${
                            dept.headImage === '/departments/Event-head2.jpeg'
                              ? 'event-head2-image'
                              : ''
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm md:text-lg mb-1">
                        {dept.name}
                      </CardTitle>
                      <p className="text-xs md:text-sm text-primary font-medium">
                        Head: {dept.head}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2 md:line-clamp-none">
                    {dept.description}
                  </p>
                  <div className="space-y-1.5 md:space-y-2">
                    <p className="text-xs md:text-sm font-medium">
                      Key Responsibilities:
                    </p>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {dept.responsibilities.map((resp: string, i: number) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5"
                        >
                          {resp.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Image Preview Overlay */}
      {hoveredImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Blurred Background */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

          {/* Circular Image Pop-up */}
          <div className="relative z-50 animate-fadeInScale pointer-events-none">
            <div className="relative w-80 h-80 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl">
              <Image
                src={hoveredImage.src}
                alt={hoveredImage.name}
                width={320}
                height={320}
                className={`w-full h-full object-cover ${
                  hoveredImage.src === '/departments/Event-head2.jpeg'
                    ? 'event-head2-image'
                    : ''
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-8 md:py-16 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          {/* Mobile: Compact CTA */}
          <div className="md:hidden">
            <h2 className="text-xl font-bold mb-2">
              Ready to Join Our Community?
            </h2>
            <p className="text-sm opacity-90">
              Connect, create, and lead with Texplore Club.
            </p>
          </div>

          {/* Desktop: Full CTA */}
          <div className="hidden md:block">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Join Our Community?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Be part of something bigger. Connect, create, and lead with
              Texplore Club.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
