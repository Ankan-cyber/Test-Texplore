import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Linkedin,
  Github,
  Globe,
  Users,
  Mail,
  FileText,
} from 'lucide-react';
import type { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AboutMembersService } from '@/lib/services/about-members-service';
import {
  allStaticMembers,
  resolveStaticMemberBySlug,
  slugify,
  type ResolvedMember,
} from '@/lib/about-slug';

export const dynamic = 'force-dynamic';

interface PageParams {
  slug: string;
}

function mapDbMemberToResolved(member: Record<string, any>): ResolvedMember {
  const socialLinks =
    member.socialLinks && typeof member.socialLinks === 'object'
      ? (member.socialLinks as Record<string, string>)
      : {};

  const category =
    member.department === 'LEADERSHIP'
      ? 'LEADERSHIP'
      : member.department === 'DEPARTMENT'
        ? 'DEPARTMENT'
        : 'OTHER';

  return {
    id: member.id,
    slug: slugify(member.displayName || member.user?.name || member.id),
    source: 'db',
    displayName: member.displayName || member.user?.name || 'Member',
    role: member.role || '',
    bio: member.bio || undefined,
    category,
    imageUrl: member.galleryImage?.fileUrl || member.imageUrl || undefined,
    linkedinUrl: socialLinks.linkedin || undefined,
    githubUrl: socialLinks.github || undefined,
    portfolioUrl: socialLinks.portfolio || undefined,
    resumeUrl: member.resumeUrl || undefined,
  };
}

async function loadMember(slug: string): Promise<{
  member: ResolvedMember | null;
  others: ResolvedMember[];
}> {
  let dbMembers: Array<Record<string, any>> = [];
  try {
    const result = await AboutMembersService.listMembers({
      isPublished: true,
      limit: 100,
    });
    dbMembers = result.data;
  } catch (err) {
    // DB or model unavailable — fall back to static data gracefully.
    console.warn('AboutMembersService unavailable, using static fallback', err);
  }

  const dbResolved = dbMembers.map((m) => mapDbMemberToResolved(m));
  const dbMatch = dbResolved.find((m) => m.slug === slug);

  let member: ResolvedMember | null = dbMatch ?? null;
  if (!member) {
    member = resolveStaticMemberBySlug(slug);
  }

  const staticResolved = allStaticMembers();

  // Combine; prefer DB entries — dedupe by slug, exclude current
  const combined: ResolvedMember[] = [];
  const seen = new Set<string>();
  for (const m of [...dbResolved, ...staticResolved]) {
    if (seen.has(m.slug)) continue;
    seen.add(m.slug);
    combined.push(m);
  }

  const others = combined.filter((m) => m.slug !== slug).slice(0, 8);

  return { member, others };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { member } = await loadMember(slug);
  if (!member) {
    return { title: 'Member Not Found — Texplore Club' };
  }
  return {
    title: `${member.displayName} — Texplore Club`,
    description:
      member.bio ||
      `${member.displayName}, ${member.role} at Texplore Club, Amity University.`,
  };
}

export default async function AboutMemberPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const { member, others } = await loadMember(slug);

  if (!member) {
    notFound();
  }

  const initial = member.displayName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background" data-testid="member-profile-page">
      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <nav
            className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground"
            aria-label="Breadcrumb"
            data-testid="member-profile-breadcrumbs"
          >
            <Link
              href="/"
              className="hover:text-foreground transition"
              data-testid="breadcrumb-home"
            >
              Home
            </Link>
            <span>/</span>
            <Link
              href="/about"
              className="hover:text-foreground transition"
              data-testid="breadcrumb-about"
            >
              About
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {member.displayName}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero / Header */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-10 md:py-16">
        <div className="container mx-auto px-4">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6"
            data-testid="back-to-about-link"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Our People
          </Link>

          <div className="grid md:grid-cols-[260px_1fr] gap-8 md:gap-12 items-start">
            {/* Portrait */}
            <div
              className="w-40 h-40 md:w-64 md:h-64 rounded-2xl overflow-hidden border-4 border-primary/20 shadow-xl bg-primary/10 flex items-center justify-center"
              data-testid="member-profile-photo"
            >
              {member.imageUrl ? (
                <Image
                  src={member.imageUrl}
                  alt={member.displayName}
                  width={320}
                  height={320}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <span className="text-5xl md:text-7xl font-bold text-primary">
                  {initial}
                </span>
              )}
            </div>

            {/* Identity */}
            <div>
              <Badge
                variant="secondary"
                className="mb-3 text-xs uppercase tracking-wide"
                data-testid="member-profile-category"
              >
                {member.category === 'LEADERSHIP'
                  ? 'Leadership'
                  : member.category === 'DEPARTMENT'
                    ? 'Department Head'
                    : 'Team Member'}
              </Badge>
              <h1
                className="text-3xl md:text-5xl font-bold leading-tight mb-2"
                data-testid="member-profile-name"
              >
                {member.displayName}
              </h1>
              <p
                className="text-lg md:text-xl text-primary font-semibold"
                data-testid="member-profile-role"
              >
                {member.role}
              </p>
              {member.additionalRole && (
                <p
                  className="text-sm md:text-base text-muted-foreground mt-1"
                  data-testid="member-profile-additional-role"
                >
                  {member.additionalRole}
                </p>
              )}
              {member.departmentName && (
                <p
                  className="text-sm md:text-base text-muted-foreground mt-1"
                  data-testid="member-profile-department"
                >
                  {member.departmentName}
                </p>
              )}

              {/* Socials */}
              {(member.linkedinUrl ||
                member.githubUrl ||
                member.portfolioUrl ||
                member.resumeUrl) && (
                <div
                  className="flex gap-3 mt-6"
                  data-testid="member-profile-social-links"
                >
                  {member.linkedinUrl && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition"
                      title="LinkedIn"
                      data-testid="social-linkedin"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {member.githubUrl && (
                    <a
                      href={member.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition"
                      title="GitHub"
                      data-testid="social-github"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {member.portfolioUrl && (
                    <a
                      href={member.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition"
                      title="Portfolio"
                      data-testid="social-portfolio"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                  {member.resumeUrl && (
                    <a
                      href={member.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition"
                      title="Resume"
                      data-testid="social-resume"
                    >
                      <FileText className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-[1fr_300px] gap-10">
            {/* Bio / description */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                data-testid="member-profile-bio-heading"
              >
                About {member.displayName.split(' ')[0]}
              </h2>
              {member.bio ? (
                <div
                  className="prose prose-neutral max-w-none text-base md:text-lg leading-relaxed text-foreground/90 whitespace-pre-line"
                  data-testid="member-profile-bio"
                >
                  {member.bio}
                </div>
              ) : (
                <p
                  className="text-muted-foreground text-base md:text-lg leading-relaxed"
                  data-testid="member-profile-bio-empty"
                >
                  {member.displayName} is part of the Texplore Club team at
                  Amity University, contributing to our mission of bringing
                  entrepreneurship, technology, creativity and community
                  together for students.
                </p>
              )}

              {member.responsibilities && member.responsibilities.length > 0 && (
                <div
                  className="mt-8"
                  data-testid="member-profile-responsibilities"
                >
                  <h3 className="text-lg font-semibold mb-3">
                    Focus Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {member.responsibilities.map((r) => (
                      <Badge
                        key={r}
                        variant="outline"
                        className="text-xs md:text-sm"
                      >
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar quick-facts */}
            <aside
              className="space-y-4"
              data-testid="member-profile-sidebar"
            >
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Quick Facts
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{member.displayName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Role</dt>
                      <dd className="font-medium">{member.role}</dd>
                    </div>
                    {member.additionalRole && (
                      <div>
                        <dt className="text-muted-foreground">Also</dt>
                        <dd className="font-medium">{member.additionalRole}</dd>
                      </div>
                    )}
                    {member.departmentName && (
                      <div>
                        <dt className="text-muted-foreground">Department</dt>
                        <dd className="font-medium">{member.departmentName}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Get in Touch
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Want to collaborate with {member.displayName.split(' ')[0]}{' '}
                    or the team?
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    data-testid="contact-team-link"
                  >
                    <Mail className="h-4 w-4" />
                    Contact Texplore
                  </Link>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      {/* Other team members */}
      {others.length > 0 && (
        <section className="py-10 md:py-16 bg-muted/30 border-t">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6 md:mb-8 flex-wrap gap-2">
              <h2
                className="text-2xl md:text-3xl font-bold"
                data-testid="other-members-heading"
              >
                Meet other team members
              </h2>
              <Link
                href="/about"
                className="text-sm font-medium text-primary hover:underline"
                data-testid="view-all-members-link"
              >
                View all →
              </Link>
            </div>

            <div
              className="grid gap-4 md:gap-6 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]"
              data-testid="other-members-grid"
            >
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/about/people/${o.slug}`}
                  className="group"
                  data-testid={`other-member-card-${o.slug}`}
                >
                  <Card className="hover-scale text-center h-full">
                    <CardContent className="p-4">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-3 overflow-hidden border-2 border-primary/20 bg-primary/10 flex items-center justify-center">
                        {o.imageUrl ? (
                          <Image
                            src={o.imageUrl}
                            alt={o.displayName}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Users className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">
                        {o.displayName}
                      </h3>
                      <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-2">
                        {o.role}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
