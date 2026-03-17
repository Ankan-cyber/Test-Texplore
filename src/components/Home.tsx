'use client';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Users,
  Calendar,
  Trophy,
  Clock,
  MapPin,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  imageUrl?: string;
  maxCapacity?: number;
  links?: string[];
  _count?: {
    registrations: number;
  };
}

const Home = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/events?status=PUBLISHED&limit=3');
        const data = await response.json();

        if (response.ok) {
          // Filter for upcoming events (startDate is in the future)
          const now = new Date();
          const upcoming = data.events.filter((event: Event) => {
            const startDate = new Date(event.startDate);
            return startDate > now;
          });

          setUpcomingEvents(upcoming.slice(0, 3)); // Limit to 3 events
        } else {
          setError('Failed to load events');
        }
      } catch (err) {
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEventIcon = (index: number) => {
    const icons = [Calendar, Trophy, Users];
    return icons[index % icons.length];
  };

  const getEventGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-8 md:py-20">
          {/* Mobile: Compact vertical layout */}
          <div className="md:hidden text-center">
            <div className="flex justify-center mb-4">
              <Image
                width={80}
                height={80}
                src="/favicon.ico"
                alt="Texplore Club Logo"
                className="h-16 w-16 rounded-full"
              />
            </div>
            <h1 className="text-2xl font-bold mb-3 animate-fade-in">
              Welcome to <span className="text-accent">Texplore Club</span>
            </h1>
            <p className="text-sm opacity-90 mb-6 leading-relaxed">
              Step into a space where ideas take flight, where entrepreneurship
              meets technology.
            </p>
            <div className="flex flex-col gap-2.5">
              <Button
                size="lg"
                variant="outline"
                className="hover-scale border-white text-white bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm"
                asChild
              >
                <Link
                  href="/joinclub"
                  className="flex items-center justify-center"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Join Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover-scale border-white text-white bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm"
                asChild
              >
                <Link
                  href="/events"
                  className="flex items-center justify-center"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  View Events
                </Link>
              </Button>
            </div>
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden md:block text-center">
            <div className="flex justify-center mb-8">
              <Image
                width={100}
                height={100}
                src="/favicon.ico"
                alt="Texplore Club Logo"
                className="h-24 w-auto rounded-full"
              />
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Welcome to <span className="text-accent">Texplore Club</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Still confused about what to do? You&apos;re not alone —
              that&apos;s exactly why we&apos;re here! Step into a space where
              ideas take flight, where entrepreneurship meets technology.
            </p>
            <div className="flex flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                className="hover-scale border-white text-white bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm"
                asChild
              >
                <Link href="/joinclub">
                  <Users className="mr-2 h-5 w-5" />
                  Join Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
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

      {/* Featured Events */}
      <section className="py-8 md:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          {/* Mobile: Simplified header */}
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-xs text-muted-foreground">
              Join us for exciting workshops and competitions
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Upcoming Events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join us for exciting workshops, competitions, and networking
              opportunities that will help you grow your skills and connect with
              like-minded individuals.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Loading upcoming events...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No upcoming events at the moment.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Check back soon for new events!
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: Horizontal scroll cards */}
              <div className="md:hidden">
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                  {upcomingEvents.map((event, index) => {
                    const IconComponent = getEventIcon(index);
                    const gradientClass = getEventGradient(index);

                    return (
                      <div
                        key={event.id}
                        className="flex-shrink-0 w-[85vw] bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                      >
                        <div className="h-32 relative overflow-hidden">
                          {event.imageUrl ? (
                            <Image
                              src={event.imageUrl}
                              alt={event.title}
                              fill
                              className="object-cover"
                              sizes="85vw"
                            />
                          ) : (
                            <div
                              className={`h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
                            >
                              <IconComponent className="h-10 w-10 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-bold mb-1.5 line-clamp-2">
                            {event.title}
                          </h3>
                          <div className="space-y-1 mb-3">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              <span className="truncate">
                                {formatDate(event.startDate)}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                <span className="truncate">
                                  {event.location}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            asChild
                          >
                            <Link href="/events">View Details</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center mt-4">
                  <Button size="sm" className="w-auto" asChild>
                    <Link href="/events">
                      View All Events
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {upcomingEvents.map((event, index) => {
                  const IconComponent = getEventIcon(index);
                  const gradientClass = getEventGradient(index);

                  return (
                    <div
                      key={event.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                      <div className="h-48 relative overflow-hidden">
                        {event.imageUrl ? (
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div
                            className={`h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
                          >
                            <IconComponent className="h-16 w-16 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 line-clamp-2">
                          {event.title}
                        </h3>
                        <p className="text-base text-muted-foreground mb-4 line-clamp-3">
                          {event.description}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.maxCapacity &&
                            event._count?.registrations !== undefined && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>
                                  {event._count.registrations}/
                                  {event.maxCapacity} participants
                                </span>
                              </div>
                            )}
                          {event.links && event.links.length > 0 && (
                            <div className="flex items-start text-sm text-muted-foreground">
                              <LinkIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                              <div className="flex flex-wrap gap-1">
                                {event.links.map((link, index) => {
                                  const [name, url] = link.split('|');
                                  return (
                                    <a
                                      key={index}
                                      href={url || link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                      {name || `Link ${index + 1}`}
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(event.startDate)}
                          </span>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/events">Learn More</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block text-center mt-12">
                <Button size="lg" asChild>
                  <Link href="/events">
                    View All Events
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4 text-center">
          {/* Mobile: Simplified mission */}
          <div className="md:hidden">
            <h2 className="text-lg font-bold mb-3">Our Mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Where <strong>entrepreneurship meets technology</strong>, where{' '}
              <strong>marketing blends with creativity</strong>, and where{' '}
              <strong>entertainment comes alive</strong>.
            </p>
          </div>

          {/* Desktop: Full mission */}
          <div className="hidden md:block">
            <h2 className="text-3xl font-bold mb-8">Our Mission</h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Texplore Club is where{' '}
                <strong>entrepreneurship meets technology</strong>, where
                <strong> marketing blends with creativity</strong>, and where{' '}
                <strong>entertainment comes alive</strong>. We connect students
                to learn, create, and lead in tech, marketing, creativity, and
                community.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
