'use client';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Camera,
  Share2,
  Heart,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { GalleryImage } from '@/types/common';
import toast from 'react-hot-toast';

interface GalleryDetailsProps {
  imageId: string;
}

export default function GalleryDetails({ imageId }: GalleryDetailsProps) {
  const [image, setImage] = useState<GalleryImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  // Fetch image details
  const fetchImageDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/gallery/images/${imageId}`);
      if (response.ok) {
        const data = await response.json();
        setImage(data.image);
      } else {
        console.error('Failed to fetch image:', response.status);
        toast.error('Failed to load image details');
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      toast.error('Failed to load image details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImageDetails();
  }, [imageId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading image details...</p>
        </div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Image Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested gallery image could not be found.
          </p>
          <Link href="/gallery">
            <Button>Back to Gallery</Button>
          </Link>
        </div>
      </div>
    );
  }

  const eventTitle =
    image.event?.title || image.folder?.name || 'Gallery Image';
  const eventDate = image.event?.startDate
    ? new Date(image.event.startDate).toLocaleDateString()
    : new Date(image.createdAt).toLocaleDateString();
  const eventLocation = image.event?.location || 'Various Locations';
  const eventDescription =
    image.event?.description || image.description || 'No description available';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/gallery">
              <Button variant="ghost" size="sm" className="hover-scale">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gallery
              </Button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1">
              <Badge variant="secondary" className="mb-3">
                {eventTitle}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {image.title || image.originalName}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {eventDescription}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{eventDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{eventLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Uploaded by {image.uploader?.name || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={`hover-scale ${isLiked ? 'text-red-500 border-red-500' : ''}`}
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`}
                />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              <Button variant="outline" size="sm" className="hover-scale">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Image */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg overflow-hidden mb-4">
                  {image.fileUrl ? (
                    <img
                      src={image.fileUrl}
                      alt={image.title || image.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-16 w-16 text-primary/60 mx-auto mb-4" />
                        <p className="text-lg text-muted-foreground">
                          Image Preview
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {image.title || image.originalName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Info */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Image Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">File Name:</span>
                      <p className="font-medium">{image.originalName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">File Size:</span>
                      <p className="font-medium">
                        {image.fileSize
                          ? `${(image.fileSize / 1024 / 1024).toFixed(1)}MB`
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Upload Date:
                      </span>
                      <p className="font-medium">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-medium">
                        {image.isApproved ? 'Approved' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Description */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Image Details</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-muted-foreground leading-relaxed">
                      {image.description ||
                        'No description available for this image.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {image.tags && image.tags.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {image.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Image Stats */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Image Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Event/Folder
                      </span>
                      <span className="font-medium">{eventTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upload Date</span>
                      <span className="font-medium">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uploader</span>
                      <span className="font-medium">
                        {image.uploader?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Type</span>
                      <span className="font-medium">{image.mimeType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium">
                        {image.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Information */}
              {image.event && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-4">
                      Event Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Event Title
                        </span>
                        <p className="font-medium">{image.event.title}</p>
                      </div>
                      {image.event.description && (
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Description
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {image.event.description}
                          </p>
                        </div>
                      )}
                      {image.event.location && (
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Location
                          </span>
                          <p className="font-medium">{image.event.location}</p>
                        </div>
                      )}
                      {image.event.startDate && (
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Date
                          </span>
                          <p className="font-medium">
                            {new Date(
                              image.event.startDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Folder Information */}
              {image.folder && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-4">
                      Folder Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Folder Name
                        </span>
                        <p className="font-medium">{image.folder.name}</p>
                      </div>
                      {image.folder.description && (
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Description
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {image.folder.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Related Gallery CTA */}
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-bold mb-3">
                    Explore More Images
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Discover other amazing photos in our gallery
                  </p>
                  <Link href="/gallery">
                    <Button className="w-full hover-scale">View Gallery</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
