'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Calendar, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { GalleryImage, GalleryFolder } from '@/types/common';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const Gallery = () => {
  const [folders, setFolders] = useState<
    (GalleryFolder & { preview?: GalleryImage[] })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch public folders
  const fetchPublicFolders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/gallery/folders/public');
      if (response.ok) {
        const data = await response.json();
        const baseFolders = (data.folders || []) as (GalleryFolder & {
          images?: {
            id: string;
            fileUrl: string;
            originalName?: string;
            title?: string;
          }[];
        })[];
        const withPreview = baseFolders.map((f) => ({
          ...f,
          preview: (f.images || []).slice(0, 4) as GalleryImage[],
        }));
        setFolders(withPreview as any);
      } else {
        console.error('Failed to fetch folders:', response.status);
        toast.error('Failed to load gallery folders');
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load gallery folders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicFolders();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-8 md:py-16">
        <div className="container mx-auto px-4 text-center">
          {/* Mobile: Compact header */}
          <div className="md:hidden">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Camera className="h-8 w-8 text-primary animate-scale-in" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-3 animate-fade-in">
              Event Gallery
            </h1>
            <p className="text-sm text-muted-foreground animate-fade-in leading-relaxed">
              Explore highlights from our events, workshops, and community
              gatherings.
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block">
            <div className="flex justify-center mb-8">
              <div className="bg-primary/10 rounded-full p-4">
                <Camera className="h-12 w-12 text-primary animate-scale-in" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              Event Gallery
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
              Explore highlights from our events, workshops, competitions, and
              community gatherings. Witness the innovation and collaboration
              that defines Texplore Club.
            </p>
          </div>
        </div>
      </section>

      {/* Removed folder filters; we show folder cards directly */}

      {/* Gallery Grid */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          {/* Mobile: Compact header */}
          <div className="md:hidden text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Gallery Events</h2>
            <p className="text-xs text-muted-foreground">
              Explore albums by event
            </p>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:block text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Gallery Events</h2>
            <p className="text-muted-foreground">Explore albums by event</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mr-3" />
              <span className="text-lg">Loading gallery...</span>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-16">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No photos found</h3>
              <p className="text-muted-foreground mb-6">
                No approved images available in public folders.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {folders.map((folder) => (
                <Card key={folder.id} className="hover-scale overflow-hidden">
                  <div className="aspect-video relative">
                    {folder.preview && folder.preview.length > 0 ? (
                      <Carousel
                        className="w-full h-full"
                        opts={{
                          loop: true,
                          align: 'center',
                        }}
                      >
                        <CarouselContent>
                          {folder.preview.map((img, i) => (
                            <CarouselItem key={i} className="basis-full">
                              <div className="relative h-full aspect-video">
                                <Image
                                  src={img.fileUrl || '/vercel.svg'}
                                  alt={folder.name}
                                  fill
                                  className="object-cover object-center"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  priority
                                />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="h-6 w-6 md:h-7 md:w-7" />
                        <CarouselNext className="h-6 w-6 md:h-7 md:w-7" />
                      </Carousel>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Camera className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                      <Badge variant="secondary" className="text-xs md:text-sm">
                        {folder.name}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 md:p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm md:text-lg truncate">
                        {folder.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {folder._count?.images || 0} photos
                      </p>
                    </div>
                    <Link href={`/gallery/details/${folder.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover-scale text-xs md:text-sm ml-2 flex-shrink-0"
                      >
                        View
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Statistics removed */}

      {/* CTA Section */}
      <section className="py-8 md:py-16 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          {/* Mobile: Compact CTA */}
          <div className="md:hidden">
            <h2 className="text-xl font-bold mb-2">
              Be Part of Our Next Story
            </h2>
            <p className="text-sm mb-4 opacity-90">
              Join upcoming events and get featured!
            </p>
            <Button
              size="sm"
              variant="outline"
              className="hover-scale border-white text-white bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm"
            >
              <Link className="flex items-center" href="/events">
                <Calendar className="mr-2 h-4 w-4" />
                View Events
              </Link>
            </Button>
          </div>

          {/* Desktop: Full CTA */}
          <div className="hidden md:block">
            <h2 className="text-3xl font-bold mb-4">
              Be Part of Our Next Story
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join upcoming events and get featured in our gallery!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                className="hover-scale border-white text-white bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm"
              >
                <Link className="flex" href="/events">
                  <Calendar className="mr-2 h-5 w-5" />
                  View Upcoming Events
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Gallery;
