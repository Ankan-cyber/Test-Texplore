'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  Lightbulb,
  Network,
  Link,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Event } from '@/types/common';
import Image from 'next/image';

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching events from API...');
      const response = await fetch('/api/events');

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Events data:', data);

      if (data.events) {
        setEvents(data.events);
        console.log('Events loaded:', data.events.length);
      } else {
        setError('No events data received');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string | undefined) => {
    switch (category) {
      case 'competition':
        return Trophy;
      case 'networking':
        return Network;
      case 'meetup':
        return Network;
      default:
        return Lightbulb;
    }
  };

  const getCategoryColor = (category: string | undefined) => {
    switch (category) {
      case 'competition':
        return 'bg-red-100 text-red-800';
      case 'networking':
        return 'bg-blue-100 text-blue-800';
      case 'meetup':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Compute past events based on endDate < now or status === 'COMPLETED'
  const now = new Date();
  console.log('Total events:', events.length);
  console.log('Current time:', now);

  const pastEvents = events.filter((e) => {
    const isPast = new Date(e.endDate) < now || e.status === 'COMPLETED';
    if (isPast) {
      console.log(
        'Past event:',
        e.title,
        'Status:',
        e.status,
        'EndDate:',
        e.endDate,
      );
    }
    return isPast;
  });

  const upcomingEvents = events.filter(
    (e) => new Date(e.endDate) >= now && e.status !== 'COMPLETED',
  );

  console.log('Past events count:', pastEvents.length);
  console.log('Upcoming events count:', upcomingEvents.length);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-8 md:py-16">
        <div className="container mx-auto px-4 text-center">
          {/* Mobile: Compact header */}
          <div className="md:hidden">
            <h1 className="text-2xl font-bold mb-3 animate-fade-in">
              Events & Workshops
            </h1>
            <p className="text-sm text-muted-foreground animate-fade-in leading-relaxed">
              Join our exciting events designed to boost your skills and expand
              your network.
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              Events & Workshops
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
              Join our exciting events designed to boost your skills, expand
              your network, and accelerate your journey in tech
              entrepreneurship.
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          {/* Mobile: Compact header */}
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-xs text-muted-foreground">
              Don&apos;t miss out on these opportunities
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Upcoming Events</h2>
            <p className="text-muted-foreground">
              Don&apos;t miss out on these amazing opportunities
            </p>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading events...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <div className="text-lg">{error}</div>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg">No upcoming events at the moment.</div>
            </div>
          ) : (
            <>
              {/* Mobile: Simplified cards */}
              <div className="md:hidden space-y-4">
                {upcomingEvents.map((event: Event) => {
                  const IconComponent = getCategoryIcon(
                    event.category ?? 'workshop',
                  );
                  const spotsRemaining = event.maxCapacity
                    ? event.maxCapacity - (event._count?.registrations || 0)
                    : null;

                  const isDeadlinePassed = event.registrationDeadline
                    ? new Date() > new Date(event.registrationDeadline)
                    : false;

                  const isRegistrationDisabled =
                    (spotsRemaining !== null && spotsRemaining <= 0) ||
                    !event.isRegistrationOpen ||
                    isDeadlinePassed;

                  return (
                    <Card
                      key={event.id}
                      className="hover-scale overflow-hidden"
                    >
                      {event.imageUrl && (
                        <div className="relative w-full aspect-[16/9] overflow-hidden">
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover object-center"
                            sizes="100vw"
                            priority
                          />
                        </div>
                      )}
                      <CardHeader className="p-4">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                            <IconComponent className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base mb-1.5 line-clamp-2">
                              {event.title}
                            </CardTitle>
                            <Badge
                              className={`${getCategoryColor(event.category)} text-xs`}
                            >
                              {event.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="truncate">
                              {formatDate(event.startDate)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-primary flex-shrink-0" />
                            <span>{formatTime(event.startDate)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Users className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="truncate">
                              {event._count?.registrations || 0}/
                              {event.maxCapacity || '∞'} registered
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          {spotsRemaining !== null && (
                            <span
                              className={`text-xs font-medium ${
                                spotsRemaining < 10
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {spotsRemaining} spots
                            </span>
                          )}
                          <Button
                            size="sm"
                            className="hover-scale text-xs"
                            disabled={
                              isRegistrationDisabled || isDeadlinePassed
                            }
                            onClick={() =>
                              router.push(`/events/${event.id}/register`)
                            }
                          >
                            Register
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop: Full cards */}
              <div className="hidden md:grid lg:grid-cols-2 gap-8">
                {upcomingEvents.map((event: Event) => {
                  const IconComponent = getCategoryIcon(
                    event.category ?? 'workshop',
                  );
                  const spotsRemaining = event.maxCapacity
                    ? event.maxCapacity - (event._count?.registrations || 0)
                    : null;

                  const isDeadlinePassed = event.registrationDeadline
                    ? new Date() > new Date(event.registrationDeadline)
                    : false;

                  const isRegistrationDisabled =
                    (spotsRemaining !== null && spotsRemaining <= 0) ||
                    !event.isRegistrationOpen ||
                    isDeadlinePassed;

                  return (
                    <Card
                      key={event.id}
                      className="hover-scale overflow-hidden"
                    >
                      {event.imageUrl && (
                        <div className="relative w-full aspect-[16/9] overflow-hidden">
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover object-center"
                            sizes="(max-width: 1200px) 50vw, 33vw"
                            priority
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <IconComponent className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">
                                {event.title}
                              </CardTitle>
                              <Badge
                                className={getCategoryColor(event.category)}
                              >
                                {event.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                          {event.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{formatTime(event.startDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{event.location || 'TBA'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span>
                              {event._count?.registrations || 0}/
                              {event.maxCapacity || '∞'} registered
                            </span>
                          </div>
                          {event.registrationDeadline && (
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="text-xs">
                                Deadline:{' '}
                                {formatDate(event.registrationDeadline)}
                              </span>
                            </div>
                          )}
                          {event.links && event.links.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <Link className="h-4 w-4 text-primary" />
                              <div className="flex flex-wrap gap-2">
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

                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm">
                            {spotsRemaining !== null && (
                              <span
                                className={`font-medium ${
                                  spotsRemaining < 10
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }`}
                              >
                                {spotsRemaining} spots remaining
                              </span>
                            )}
                          </div>
                          <Button
                            className="hover-scale"
                            disabled={
                              isRegistrationDisabled || isDeadlinePassed
                            }
                            onClick={() =>
                              router.push(`/events/${event.id}/register`)
                            }
                          >
                            Register Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Past Events */}
      <section className="py-8 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Mobile: Compact header */}
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Past Events</h2>
            <p className="text-xs text-muted-foreground">
              See what we&apos;ve accomplished
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Past Events</h2>
            <p className="text-muted-foreground">
              See what we&apos;ve accomplished together
            </p>
          </div>

          {pastEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm md:text-lg">No past events yet.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {pastEvents.map((event) => (
                <Card key={event.id} className="hover-scale overflow-hidden">
                  {event.imageUrl && (
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        priority
                      />
                    </div>
                  )}
                  <CardContent className="p-4 md:p-6">
                    <h3 className="font-bold mb-2 text-sm md:text-base line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-primary font-medium">
                        {formatDate(event.endDate)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Event Categories */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          {/* Mobile: Compact header */}
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Event Categories</h2>
            <p className="text-xs text-muted-foreground">
              Diverse learning opportunities
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Event Categories</h2>
            <p className="text-muted-foreground">
              Diverse learning opportunities for every interest
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="hover-scale text-center">
              <CardContent className="p-5 md:p-8">
                <Trophy className="h-8 w-8 md:h-12 md:w-12 text-primary mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-xl font-bold mb-2">
                  Competitions
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Hackathons, ideathons, and challenges to test your skills and
                  creativity
                </p>
              </CardContent>
            </Card>
            <Card className="hover-scale text-center">
              <CardContent className="p-5 md:p-8">
                <Lightbulb className="h-8 w-8 md:h-12 md:w-12 text-primary mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-xl font-bold mb-2">
                  Workshops
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Hands-on learning sessions covering tech, business, and
                  creative skills
                </p>
              </CardContent>
            </Card>
            <Card className="hover-scale text-center">
              <CardContent className="p-5 md:p-8">
                <Network className="h-8 w-8 md:h-12 md:w-12 text-primary mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-xl font-bold mb-2">
                  Networking
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Meet industry experts, mentors, and fellow entrepreneurs in
                  your field
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
            <h2 className="text-xl font-bold mb-2">Don&apos;t Miss Out!</h2>
            <p className="text-sm opacity-90">
              Stay updated with our latest events.
            </p>
          </div>

          {/* Desktop: Full CTA */}
          <div className="hidden md:block">
            <h2 className="text-3xl font-bold mb-4">Don&apos;t Miss Out!</h2>
            <p className="text-xl mb-8 opacity-90">
              Stay updated with our latest events and be the first to register.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Events;
