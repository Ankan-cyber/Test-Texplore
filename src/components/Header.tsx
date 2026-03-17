'use client';
import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Camera,
  Mail,
  Menu,
  X,
  Home,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  id: string;
  email: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  roles: Array<{
    role: {
      name: string;
      level: number;
    };
  }>;
  profile?: {
    fullName?: string;
    department?: string;
    year?: number;
  };
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'About', href: '/about', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'IEEE', href: '/ieee', icon: Award },
    { name: 'Gallery', href: '/gallery', icon: Camera },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const hasRole = (roleName: string) => {
    return user?.roles.some((r) => r.role.name === roleName) || false;
  };

  const displayName = user?.profile?.fullName || user?.name || 'User';

  return (
    <div>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover-scale">
              <Image
                width={40}
                height={40}
                src="/favicon.ico"
                alt="Texplore Club"
                className="h-10 w-auto rounded-full"
              />
              <div>
                <h1 className="text-xl font-bold text-primary">
                  Texplore Club
                </h1>
                <p className="text-xs text-muted-foreground">
                  Tech Entrepreneurship & Innovation
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-foreground/80 hover:text-foreground transition-colors duration-200 story-link font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                size="sm"
                variant="outline"
                className="hover-scale border-primary text-primary bg-primary/10 hover:bg-primary hover:text-white backdrop-blur-sm"
                asChild
              >
                <Link href="/joinclub">Join Club</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t bg-background/95 backdrop-blur animate-fade-in">
              <nav className="flex flex-col space-y-4 p-4">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 text-foreground/80 hover:text-primary transition-colors duration-200 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {IconComponent && <IconComponent size={18} />}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                <div className="pt-4 border-t">
                  {user ? (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Welcome, {displayName}
                        {user && !loading && hasRole('admin') && (
                          <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary text-primary bg-primary/10 hover:bg-primary hover:text-white backdrop-blur-sm"
                      asChild
                    >
                      <Link
                        href="/joinclub"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Join Club
                      </Link>
                    </Button>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default Header;
