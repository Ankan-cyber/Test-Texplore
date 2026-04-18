/**
 * About members — slug helpers + static fallback data shared between the
 * About listing page and the dedicated `/about/people/[slug]` profile page.
 */

export interface StaticLeader {
  name: string;
  role: string;
  additionalRole?: string;
  image: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface StaticDepartment {
  name: string;
  head: string;
  headImage: string;
  description: string;
  responsibilities: string[];
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export function slugify(input: string): string {
  return (input || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build a stable slug for a member. Suffixes the role for static faculty
 * entries so multiple coordinators with similar names don't collide.
 */
export function buildMemberSlug(name: string, _role?: string): string {
  // Keep slugs short & readable — role disambiguation is handled separately
  // for departments via `departmentHeadSlug`.
  return slugify(name);
}

export const staticLeaders: StaticLeader[] = [
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

export const staticDepartments: StaticDepartment[] = [
  {
    name: 'Event Management Team',
    head: 'Tejveer singh',
    headImage: '/departments/Event-head.jpeg',
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
    headImage: '/departments/Sahaj.jpg',
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
    headImage: '/departments/marketing-head.jpeg',
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
    headImage: '/departments/design-head.jpeg',
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
    headImage: '/leadership/president.jpeg',
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
    headImage: '/departments/hr-head.jpg',
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
    headImage: '/departments/Event-head3.jpeg',
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
    headImage: '/departments/Event-head2.jpeg',
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

/**
 * Normalised shape shared between DB members and static fallback entries for
 * the profile page.
 */
export interface ResolvedMember {
  id?: string;
  slug: string;
  source: 'db' | 'static-leader' | 'static-department';
  displayName: string;
  role: string;
  additionalRole?: string;
  bio?: string;
  category: 'LEADERSHIP' | 'DEPARTMENT' | 'OTHER';
  departmentName?: string;
  imageUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  responsibilities?: string[];
}

export function leaderSlug(l: StaticLeader): string {
  return slugify(l.name);
}

export function departmentHeadSlug(d: StaticDepartment): string {
  return slugify(`${d.head}-${d.name}`);
}

export function resolveStaticMemberBySlug(slug: string): ResolvedMember | null {
  const leader = staticLeaders.find((l) => leaderSlug(l) === slug);
  if (leader) {
    return {
      slug,
      source: 'static-leader',
      displayName: leader.name,
      role: leader.role,
      additionalRole: leader.additionalRole,
      bio: leader.bio,
      category: 'LEADERSHIP',
      imageUrl: leader.image,
      linkedinUrl: leader.linkedinUrl,
      githubUrl: leader.githubUrl,
      portfolioUrl: leader.portfolioUrl,
    };
  }

  const dept = staticDepartments.find((d) => departmentHeadSlug(d) === slug);
  if (dept) {
    return {
      slug,
      source: 'static-department',
      displayName: dept.head,
      role: `Head — ${dept.name}`,
      bio: dept.description,
      category: 'DEPARTMENT',
      departmentName: dept.name,
      imageUrl: dept.headImage,
      linkedinUrl: dept.linkedinUrl,
      githubUrl: dept.githubUrl,
      portfolioUrl: dept.portfolioUrl,
      responsibilities: dept.responsibilities,
    };
  }

  return null;
}

export function allStaticMembers(): ResolvedMember[] {
  return [
    ...staticLeaders.map<ResolvedMember>((l) => ({
      slug: leaderSlug(l),
      source: 'static-leader',
      displayName: l.name,
      role: l.role,
      additionalRole: l.additionalRole,
      category: 'LEADERSHIP',
      imageUrl: l.image,
    })),
    ...staticDepartments.map<ResolvedMember>((d) => ({
      slug: departmentHeadSlug(d),
      source: 'static-department',
      displayName: d.head,
      role: `Head — ${d.name}`,
      category: 'DEPARTMENT',
      departmentName: d.name,
      imageUrl: d.headImage,
    })),
  ];
}
