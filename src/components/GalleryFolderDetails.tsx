'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface FolderDetailsBySlugProps {
  slug: string; // we accept either slug or id and adapt in fetch
}

export default function FolderDetailsBySlug({
  slug,
}: FolderDetailsBySlugProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Try slug endpoint first; if 404, try by id - using public access
        let res = await fetch(`/api/gallery/folders/slug/${slug}`);
        if (res.status === 404) {
          res = await fetch(`/api/gallery/folders/${slug}?includeImages=true`);
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load folder');
        setFolder(data.folder || data.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load folder');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading album...</p>
        </div>
      </div>
    );
  }

  if (error || !folder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Album Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'Not found'}</p>
          <Link href="/gallery">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Gallery
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const images: any[] = folder.images || [];
  const title = folder.name;
  const description = folder.description;

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/gallery">
              <Button variant="ghost" size="sm" className="hover-scale">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Gallery
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="mb-3">
                {title}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            </div>
            <div>
              <Badge variant="outline">{images.length} photos</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Carousel */}
      {images.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <Carousel
              className="w-full"
              opts={{
                loop: true,
                align: 'start',
              }}
            >
              <CarouselContent>
                {images.map((img) => (
                  <CarouselItem
                    key={img.id}
                    className="md:basis-1/2 lg:basis-1/3"
                  >
                    <div className="p-1">
                      <div className="relative aspect-video rounded-lg overflow-hidden">
                        <Image
                          src={img.fileUrl}
                          alt={img.title || img.originalName}
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>
      )}

      {/* About the Event */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold mb-4">About the Event</h3>
              <div className="prose dark:prose-invert max-w-none">
                {description ? (
                  <div className="text-base leading-relaxed">
                    {description
                      .split('\n')
                      .map((paragraph: string, idx: number) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No description available for this event.
                  </p>
                )}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="mr-2">
                  {images.length} photos
                </Badge>
                {folder.createdAt && (
                  <span className="text-sm text-muted-foreground">
                    Created on {new Date(folder.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
