import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

const Footer = () => {
  return (
    <div>
      <footer className="bg-primary text-primary-foreground py-6 md:py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Logo and Description */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Image
                  width={30}
                  height={30}
                  src="/favicon.ico"
                  alt="Texplore Club Logo"
                  className="h-6 w-6 md:h-7 md:w-7"
                />
                <span className="font-semibold text-sm md:text-md">
                  Texplore Club
                </span>
              </div>
              <p className="text-xs sm:text-sm opacity-80 mb-3 md:mb-4">
                Empowering students through technology and entrepreneurship.
              </p>
              <div className="flex space-x-3">
                <a
                  href="https://www.linkedin.com/company/texplore-club-aup/posts/?feedView=all"
                  className="transition-all duration-300 hover:text-accent"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M8 11v5"></path>
                    <path d="M8 8v.01"></path>
                    <path d="M12 16v-5"></path>
                    <path d="M16 16v-3a2 2 0 0 0-4 0"></path>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/texplore_aup/"
                  className="transition-all duration-300 hover:text-accent"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">Instagram</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect
                      width="20"
                      height="20"
                      x="2"
                      y="2"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links - Hidden on mobile */}
            <div className="hidden md:block col-span-1">
              <h3 className="font-semibold text-md mb-3">Quick Links</h3>
              <ul className="text-sm space-y-1">
                <li>
                  <Link
                    href="/"
                    className="hover:font-bold transition-all duration-300 "
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events"
                    className="hover:font-bold transition-all duration-300 "
                  >
                    Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ieee"
                    className="hover:font-bold transition-all duration-300 "
                  >
                    IEEE
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:font-bold transition-all duration-300 "
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:font-bold transition-all duration-300 "
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-1">
              <h3 className="font-semibold text-sm md:text-md mb-2 md:mb-3">
                Contact Us
              </h3>
              <address className="not-italic text-xs sm:text-sm">
                <p className="mb-1 break-words">
                  Email: texploreamity@gmail.com
                </p>
                <p className="mb-1">Phone: +91 7657991807</p>
                <p>
                  Amity University Punjab,
                  <br />
                  Mohali
                </p>
              </address>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 mt-4 md:mt-6 pt-3 md:pt-4 text-xs text-center opacity-70">
            <p>
              &copy; {new Date().getFullYear()} Texplore Club. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
