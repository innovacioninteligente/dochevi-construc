'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '../theme-switcher';

export function Header({ t }: { t: any }) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/#services', label: t.header.nav.services },
    { href: '/blog', label: t.header.nav.blog },
    { href: '/contact', label: t.header.nav.contact },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500 ease-in-out",
        isScrolled
          ? "border-b border-primary/10 bg-background/80 backdrop-blur-md shadow-sm py-2"
          : "bg-transparent border-transparent py-6"
      )}
    >
      <div className="container-limited flex h-[10vh] min-h-[60px] md:h-20 items-center justify-between transition-all duration-300">
        <div className={cn("transition-transform duration-300", isScrolled ? "scale-90" : "scale-100")}>
          <div className="md:hidden">
            <Logo width={120} height={40} />
          </div>
          <div className="hidden md:block">
            <Logo width={180} height={60} /> {/* Adjusted size for better visibility */}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 ml-10 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative text-foreground/80 transition-colors hover:text-primary font-headline tracking-wide",
                "after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {user ? (
            <UserNav t={t.header.userNav} />
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild className="cta-pulse shadow-lg hover:shadow-primary/20 transition-all font-semibold px-6">
                <Link href="/budget-request">{t.header.nav.budgetRequest}</Link>
              </Button>
            </div>
          )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                <div className="py-4">
                  <Logo />
                </div>
              </SheetHeader>
              <div className="flex flex-col gap-4 py-8">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={handleLinkClick} className="text-lg font-medium text-foreground transition-colors hover:text-primary font-headline">
                    {link.label}
                  </Link>
                ))}
                <Link href="/budget-request" onClick={handleLinkClick} className="text-lg font-medium text-primary transition-colors hover:text-primary/80 font-headline">
                  {t.header.nav.budgetRequest}
                </Link>
              </div>
              <div className="absolute bottom-4 right-4 left-4 flex flex-col gap-2">
                {user ? null : (
                  <Button asChild onClick={handleLinkClick} className="w-full">
                    <Link href="/budget-request">{t.header.nav.budgetRequest}</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
