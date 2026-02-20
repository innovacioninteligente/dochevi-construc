'use client';

import Image from 'next/image';
import { BudgetWidget } from '@/components/budget-widget';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
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
import { MegaMenu } from './mega-menu';
import { MobileMenu } from './mobile-menu';

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
    { href: { pathname: '/', hash: 'services' }, label: t.header.nav.services },
    { href: '/blog', label: t.header.nav.blog },
    { href: '/contact', label: t.header.nav.contact },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500 ease-in-out h-[10vh] flex items-center",
        isScrolled
          ? "border-b border-primary/10 bg-background/80 backdrop-blur-md shadow-sm"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="w-[85vw] max-w-[1920px] mx-auto flex h-full items-center justify-between transition-all duration-300">
        <div className={cn("transition-transform duration-300 flex-shrink-0", isScrolled ? "scale-90" : "scale-100")}>
          <Link href="/" className="block relative h-12 w-auto aspect-[3/1] md:h-16">
            <Image
              src="/images/logo.avif"
              alt="Grupo RG Logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
        </div>

        <div className="hidden md:block ml-10">
          <MegaMenu t={t} />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <UserNav t={t.header.userNav} />
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <BudgetWidget t={t} />
            </div>
          )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-screen sm:max-w-[100vw] h-full">
              <SheetHeader>
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                <div className="py-4">
                  <div className="w-[120px] h-[40px] bg-muted/30 rounded-md animate-pulse" />
                </div>
              </SheetHeader>
              <MobileMenu
                t={t}
                navLinks={navLinks}
                onLinkClick={handleLinkClick}
                user={user}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
