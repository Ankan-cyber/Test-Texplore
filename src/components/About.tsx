'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Heart, Star, ArrowRight, X, Linkedin, Github, Globe } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ClubSettings } from '@/types/common';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isFeatureEnabled } from '@/lib/feature-flags';

interface AboutMember {
  id: string;
  displayName: string;
  role: string;
  bio: string;
  category: string;
  imageCloudinaryUrl?: string;
  imageThumbnailUrl?: string;
  galleryImageId?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

const About = () => {
  const [clubSettings, setClubSettings] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<{
    src: string;
    name: string;
    role: string;
  } | null>(null);
  const [selectedMember, setSelectedMember] = useState<AboutMember | null>(null);
  const [leaders, setLeaders] = useState<AboutMember[]>([]);
  const [departments, setDepartments] = useState<AboutMember[]>([]);

  // Fetch about members from API
  useEffect(() => {
    const fetchMembers = async () => {
      // Check if About system is enabled
      if (!isFeatureEnabled('ABOUT_SYSTEM_ENABLED')) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/about', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setLeaders(data.filter((m: AboutMember) => m.category === 'LEADERSHIP'));
          setDepartments(data.filter((m: AboutMember) => m.category === 'DEPARTMENT'));
          setError(null);
        } else if (response.status === 404 || response.status === 500) {
          // API not available, use fallback
          console.warn('About API not available, using fallback data');
        }
      } catch (err) {
        console.error('Failed to fetch about members:', err);
        // Silently fail and use fallback - don't show error to user
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // Departments with head images
  // To add images: Place images in /public/departments/ folder
  // Update the image paths below with actual image paths
  const departmentsStaticFallback = [
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
      headImage: '/departments/hr-head.jpg', // Update with actual image path
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
  const leadersStaticFallback = [
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

  const leadershipSource: any[] =
    leaders.length > 0 ? leaders : leadersStaticFallback;

  const executiveLeaders = leadershipSource.filter((member) => {
    const role = (member.role || '').toLowerCase();
    return role.includes('president');
  });

  const fallbackExecutiveLeaders = leadershipSource.slice(0, 2);
  const effectiveExecutiveLeaders =
    executiveLeaders.length > 0 ? executiveLeaders : fallbackExecutiveLeaders;

  const leadershipIds = new Set(
    effectiveExecutiveLeaders.map((member) => member.id || member.name),
  );
  const facultyLeaders = leadershipSource.filter(
    (member) => !leadershipIds.has(member.id || member.name),
  );

  const departmentSource: any[] =
    departments.length > 0 ? departments : departmentsStaticFallback;

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
            <div
              className={[
                'grid gap-4 md:gap-6 mx-auto justify-items-center',
                effectiveExecutiveLeaders.length <= 1
                  ? 'grid-cols-1 max-w-md'
                  : 'grid-cols-1 md:grid-cols-2 max-w-3xl',
              ].join(' ')}
            >
              {effectiveExecutiveLeaders.map((leader, index) => (
                <Card
                  key={leader.id || leader.name || index}
                  className="hover-scale text-center cursor-pointer w-full"
                  onClick={() => leaders.length > 0 && setSelectedMember(leader)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-3 md:mb-4 overflow-hidden border-4 border-primary/20 shadow-lg">
                      {(leader.imageCloudinaryUrl || (leader as any).image) ? (
                        <Image
                          src={
                            leader.imageCloudinaryUrl ||
                            leader.imageThumbnailUrl ||
                            (leader as any).image
                          }
                          alt={leader.displayName || (leader as any).name}
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
                        {leader.displayName || (leader as any).name}
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
            <div
              className="grid gap-4 md:gap-6 max-w-6xl mx-auto justify-items-center [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]"
            >
              {facultyLeaders.map((leader, index) => (
                <Card
                  key={leader.id || leader.name || index}
                  className="hover-scale text-center cursor-pointer w-full max-w-[220px]"
                  onClick={() => leaders.length > 0 && setSelectedMember(leader)}
                >
                  <CardContent className="p-3 md:p-6">
                    <div className="w-20 h-20 md:w-32 md:h-32 rounded-full mx-auto mb-3 md:mb-4 overflow-hidden border-4 border-primary/20 shadow-lg">
                      {(leader.imageCloudinaryUrl || (leader as any).image) ? (
                        <Image
                          src={
                            leader.imageCloudinaryUrl ||
                            leader.imageThumbnailUrl ||
                            (leader as any).image
                          }
                          alt={leader.displayName || (leader as any).name}
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
                        {leader.displayName || (leader as any).name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-[10px] md:text-xs font-semibold px-2 md:px-3 py-0.5 md:py-1 whitespace-nowrap"
                      >
                        {leader.role}
                      </Badge>
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

          <div
            className="grid gap-4 md:gap-6 justify-items-center [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]"
          >
            {departmentSource.map((dept, index) => (
              <Card
                key={index}
                className="hover-scale group cursor-pointer w-full max-w-[420px]"
                onClick={() =>
                  departments.length > 0 && setSelectedMember(dept as AboutMember)
                }
              >
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md flex-shrink-0">
                      {(dept.imageCloudinaryUrl || (dept as any).headImage) ? (
                        <Image
                          src={
                            dept.imageCloudinaryUrl ||
                            dept.imageThumbnailUrl ||
                            (dept as any).headImage
                          }
                          alt={dept.displayName || (dept as any).head}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm md:text-lg mb-1">
                        {dept.displayName || (dept as any).name}
                      </CardTitle>
                      <p className="text-xs md:text-sm text-primary font-medium truncate">
                        Head: {dept.displayName || (dept as any).head}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2 md:line-clamp-none">
                    {dept.bio || (dept as any).description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Member Details Modal */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-md">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">{selectedMember.displayName}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Profile Image */}
                {selectedMember.imageCloudinaryUrl && (
                  <div className="flex justify-center">
                    <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-primary/20">
                      <Image
                        src={selectedMember.imageCloudinaryUrl}
                        alt={selectedMember.displayName}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Role */}
                <div className="text-center">
                  <h3 className="font-semibold">{selectedMember.role}</h3>
                </div>

                {/* Bio */}
                {selectedMember.bio && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm">{selectedMember.bio}</p>
                  </div>
                )}

                {/* Social Links */}
                <div className="flex justify-center gap-3 pt-4">
                  {selectedMember.linkedinUrl && (
                    <a
                      href={selectedMember.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition"
                      title="LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {selectedMember.githubUrl && (
                    <a
                      href={selectedMember.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition"
                      title="GitHub"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {selectedMember.portfolioUrl && (
                    <a
                      href={selectedMember.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition"
                      title="Portfolio"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
