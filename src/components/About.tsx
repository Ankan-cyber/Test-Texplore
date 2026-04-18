'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Heart, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ClubSettings } from '@/types/common';
import { isFeatureEnabled } from '@/lib/feature-flags';
import {
  slugify,
  staticLeaders,
  staticDepartments,
  leaderSlug,
  departmentHeadSlug,
} from '@/lib/about-slug';

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
  const [clubSettings] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<AboutMember[]>([]);
  const [departments, setDepartments] = useState<AboutMember[]>([]);

  // Fetch about members from API
  useEffect(() => {
    const fetchMembers = async () => {
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
          setDepartments(
            data.filter((m: AboutMember) => m.category === 'DEPARTMENT'),
          );
        } else if (response.status === 404 || response.status === 500) {
          console.warn('About API not available, using fallback data');
        }
      } catch (err) {
        console.error('Failed to fetch about members:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // Build combined leadership source: prefer DB, else static fallback
  const leadershipSource: Array<{
    key: string;
    slug: string;
    displayName: string;
    role: string;
    imageUrl?: string;
  }> =
    leaders.length > 0
      ? leaders.map((l) => ({
          key: l.id,
          slug: slugify(l.displayName),
          displayName: l.displayName,
          role: l.role,
          imageUrl: l.imageCloudinaryUrl || l.imageThumbnailUrl,
        }))
      : staticLeaders.map((l) => ({
          key: l.name,
          slug: leaderSlug(l),
          displayName: l.name,
          role: l.role,
          imageUrl: l.image,
        }));

  const executiveLeaders = leadershipSource.filter((m) =>
    (m.role || '').toLowerCase().includes('president'),
  );
  const effectiveExecutiveLeaders =
    executiveLeaders.length > 0 ? executiveLeaders : leadershipSource.slice(0, 2);
  const executiveKeys = new Set(effectiveExecutiveLeaders.map((m) => m.key));
  const facultyLeaders = leadershipSource.filter((m) => !executiveKeys.has(m.key));

  const departmentSource: Array<{
    key: string;
    slug: string;
    name: string;
    head: string;
    description: string;
    imageUrl?: string;
  }> =
    departments.length > 0
      ? departments.map((d) => ({
          key: d.id,
          slug: slugify(d.displayName),
          name: d.displayName,
          head: d.displayName,
          description: d.bio || '',
          imageUrl: d.imageCloudinaryUrl || d.imageThumbnailUrl,
        }))
      : staticDepartments.map((d, i) => ({
          key: `${d.head}-${i}`,
          slug: departmentHeadSlug(d),
          name: d.name,
          head: d.head,
          description: d.description,
          imageUrl: d.headImage,
        }));

  return (
    <div className="min-h-screen bg-background">
      {loading && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          data-testid="about-loading"
        >
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
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Our Leadership</h2>
            <p className="text-xs text-muted-foreground">
              Meet the people guiding Texplore Club
            </p>
          </div>

          <div className="hidden md:block text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Leadership</h2>
            <p className="text-muted-foreground">
              Meet the people guiding Texplore Club to new heights
            </p>
          </div>

          {/* Executive Leadership */}
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
              {effectiveExecutiveLeaders.map((leader) => (
                <Link
                  key={leader.key}
                  href={`/about/people/${leader.slug}`}
                  className="w-full"
                  data-testid={`leader-card-${leader.slug}`}
                >
                  <Card className="hover-scale text-center cursor-pointer w-full">
                    <CardContent className="p-4 md:p-6">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-3 md:mb-4 overflow-hidden border-4 border-primary/20 shadow-lg">
                        {leader.imageUrl ? (
                          <Image
                            src={leader.imageUrl}
                            alt={leader.displayName}
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
                          {leader.displayName}
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
                </Link>
              ))}
            </div>
          </div>

          {/* Faculty Members */}
          <div>
            <h3 className="text-base md:text-xl font-semibold text-center mb-4 md:mb-6 text-primary">
              Faculty Members
            </h3>
            <div className="grid gap-4 md:gap-6 max-w-6xl mx-auto justify-items-center [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
              {facultyLeaders.map((leader) => (
                <Link
                  key={leader.key}
                  href={`/about/people/${leader.slug}`}
                  className="w-full max-w-[220px]"
                  data-testid={`leader-card-${leader.slug}`}
                >
                  <Card className="hover-scale text-center cursor-pointer w-full">
                    <CardContent className="p-3 md:p-6">
                      <div className="w-20 h-20 md:w-32 md:h-32 rounded-full mx-auto mb-3 md:mb-4 overflow-hidden border-4 border-primary/20 shadow-lg">
                        {leader.imageUrl ? (
                          <Image
                            src={leader.imageUrl}
                            alt={leader.displayName}
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
                          {leader.displayName}
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
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Our Departments</h2>
            <p className="text-xs text-muted-foreground">
              Specialized teams working together
            </p>
          </div>

          <div className="hidden md:block text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Departments</h2>
            <p className="text-muted-foreground">
              Specialized teams working together to achieve our mission
            </p>
          </div>

          <div className="grid gap-4 md:gap-6 justify-items-center [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            {departmentSource.map((dept) => (
              <Link
                key={dept.key}
                href={`/about/people/${dept.slug}`}
                className="w-full max-w-[420px]"
                data-testid={`department-card-${dept.slug}`}
              >
                <Card className="hover-scale group cursor-pointer w-full">
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md flex-shrink-0">
                        {dept.imageUrl ? (
                          <Image
                            src={dept.imageUrl}
                            alt={dept.head}
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
                          {dept.name}
                        </CardTitle>
                        <p className="text-xs md:text-sm text-primary font-medium truncate">
                          Head: {dept.head}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0">
                    <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2 md:line-clamp-none">
                      {dept.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 md:py-16 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="md:hidden">
            <h2 className="text-xl font-bold mb-2">
              Ready to Join Our Community?
            </h2>
            <p className="text-sm opacity-90">
              Connect, create, and lead with Texplore Club.
            </p>
          </div>

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
