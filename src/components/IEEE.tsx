import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Users,
  Award,
  Calendar,
  BookOpen,
  Globe,
  Network,
} from 'lucide-react';

import Image from 'next/image';

const IEEE = () => {
  const benefits = [
    {
      icon: Network,
      title: 'Professional Networking',
      description:
        'Connect with over 400,000 IEEE members worldwide across 160+ countries',
    },
    {
      icon: BookOpen,
      title: 'Technical Resources',
      description:
        'Access to IEEE Xplore Digital Library with 4+ million technical documents',
    },
    {
      icon: Award,
      title: 'Career Development',
      description:
        'Professional certifications, career guidance, and industry recognition',
    },
    {
      icon: Globe,
      title: 'Global Community',
      description:
        'Participate in IEEE conferences, workshops, and technical committees',
    },
  ];

  const upcomingIEEEEvents = [
    {
      title: 'IEEE Student Branch Workshop',
      date: 'September 25, 2025',
      time: '3:00 PM - 5:00 PM',
      location: 'Conference Room A',
      description:
        'Introduction to IEEE membership benefits and opportunities for students',
    },
    {
      title: 'IEEE Industry Connect Session',
      date: 'October 15, 2025',
      time: '4:00 PM - 6:00 PM',
      location: 'Auditorium',
      description:
        'Panel discussion with IEEE senior members from leading tech companies',
    },
    {
      title: 'IEEE Research Paper Presentation',
      date: 'November 8, 2025',
      time: '2:00 PM - 4:00 PM',
      location: 'Research Lab',
      description:
        'Students present their research work following IEEE publication standards',
    },
  ];

  const pastActivities = [
    {
      title: 'IEEE Day Celebration 2024',
      date: 'October 1, 2024',
      participants: 85,
      description:
        'Global IEEE Day celebration with technical presentations and networking',
    },
    {
      title: 'IEEE WIE (Women in Engineering) Summit',
      date: 'March 8, 2024',
      participants: 45,
      description:
        'Empowering women in engineering through mentorship and skill development',
    },
    {
      title: 'IEEE Computer Society Tech Talk',
      date: 'February 20, 2024',
      participants: 67,
      description:
        'Insights into emerging technologies and career paths in computer science',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-8 md:py-16">
        <div className="container mx-auto px-4 text-center">
          {/* Mobile: Compact header */}
          <div className="md:hidden">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <Image
                width={50}
                height={50}
                src="/favicon.ico"
                alt="Texplore Club Logo"
                className="h-10 w-10 animate-scale-in"
              />
              <div className="text-2xl font-bold text-primary">×</div>
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold text-lg">
                IEEE
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-3 animate-fade-in">
              Texplore & IEEE Partnership
            </h1>
            <p className="text-sm text-muted-foreground animate-fade-in leading-relaxed">
              Bridging innovation and industry standards through our
              collaboration with IEEE.
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block">
            <div className="flex justify-center items-center space-x-6 mb-8">
              <Image
                width={100}
                height={100}
                src="/favicon.ico"
                alt="Texplore Club Logo"
                className="h-16 w-auto animate-scale-in"
              />
              <div className="text-4xl font-bold text-primary">×</div>
              <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-2xl">
                IEEE
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              Texplore Club & IEEE Partnership
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
              Bridging innovation and industry standards through our
              collaboration with the Institute of Electrical and Electronics
              Engineers (IEEE).
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Overview */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          {/* Mobile: Compact header */}
          <div className="md:hidden max-w-4xl mx-auto text-center mb-8">
            <h2 className="text-xl font-bold mb-3">
              Why IEEE Partnership Matters
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Our partnership with IEEE brings world-class standards, global
              networking, and professional development resources to Texplore
              Club members.
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">
              Why IEEE Partnership Matters
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Our partnership with IEEE brings world-class standards, global
              networking opportunities, and professional development resources
              directly to Texplore Club members. This collaboration ensures our
              students are connected to the global engineering and technology
              community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={index} className="hover-scale text-center">
                  <CardContent className="p-4 md:p-6">
                    <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2 text-sm md:text-base">
                      {benefit.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* IEEE Membership Benefits */}
      <section className="py-8 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Mobile: Compact header */}
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">IEEE Membership Benefits</h2>
            <p className="text-xs text-muted-foreground">
              What you gain as an IEEE student member
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              IEEE Membership Benefits
            </h2>
            <p className="text-muted-foreground">
              What you gain as an IEEE student member through Texplore Club
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 max-w-6xl mx-auto">
            <Card className="hover-scale">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                  <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  <span>Academic Resources</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span>Free access to IEEE Xplore Digital Library</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span>IEEE educational courses and webinars</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span>Technical standards and best practices</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span>Research paper publication opportunities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                  <Network className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  <span>Professional Growth</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span>Global networking with industry professionals</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span>Career guidance and mentorship programs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span>Professional certifications and credentials</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span>Conference discounts and special events</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Removed IEEE events/activities sections as requested */}

      {/* How to Get Involved */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Mobile: Compact header */}
            <div className="md:hidden mb-6">
              <h2 className="text-xl font-bold mb-3">How to Get Involved</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Ready to leverage IEEE resources?
              </p>
            </div>

            {/* Desktop: Full header */}
            <div className="hidden md:block mb-8">
              <h2 className="text-3xl font-bold mb-6">How to Get Involved</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Ready to leverage IEEE resources and connect with the global
                engineering community?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-8">
              <Card className="hover-scale">
                <CardContent className="p-5 md:p-6 text-center">
                  <Users className="h-8 w-8 md:h-12 md:w-12 text-primary mx-auto mb-3 md:mb-4" />
                  <h3 className="font-bold mb-2 text-sm md:text-base">
                    Join Texplore Club
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Become a club member to access IEEE partnership benefits
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-scale">
                <CardContent className="p-5 md:p-6 text-center">
                  <Award className="h-8 w-8 md:h-12 md:w-12 text-primary mx-auto mb-3 md:mb-4" />
                  <h3 className="font-bold mb-2 text-sm md:text-base">
                    Get IEEE Membership
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Apply for IEEE student membership through our club guidance
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 md:py-16 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          {/* Mobile: Compact CTA */}
          <div className="md:hidden">
            <h2 className="text-xl font-bold mb-2">
              Ready to Connect with IEEE?
            </h2>
            <p className="text-sm opacity-90">
              Join Texplore Club and unlock access to IEEE resources.
            </p>
          </div>

          {/* Desktop: Full CTA */}
          <div className="hidden md:block">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Connect with IEEE?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join Texplore Club and unlock access to IEEE&apos;s global network
              and resources.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IEEE;
