'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  Settings,
  PlusCircle,
  DollarSign,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/auth/user-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { LanguageSwitcher } from './language-switcher';

export function DashboardLayout({ children, t }: { children: React.ReactNode, t: any }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: t.dashboard.nav.dashboard, icon: <LayoutDashboard /> },
    { href: '/dashboard/budget-request', label: t.dashboard.nav.requestBudget, icon: <PlusCircle /> },
    { href: '/dashboard/my-budgets', label: t.dashboard.nav.myBudgets, icon: <FileText /> },
    { href: '/dashboard/seo-generator', label: t.dashboard.nav.seoGenerator, icon: <Lightbulb /> },


  ];

  const settingsNavItems = [
    { href: '/dashboard/settings/pricing', label: t.dashboard.nav.pricing, icon: <DollarSign /> },
    { href: '/dashboard/admin/prices', label: 'Admin Precios', icon: <FileText /> },
    { href: '/dashboard/settings', label: t.dashboard.nav.settings, icon: <Settings /> },
  ];




  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // You can return a loading spinner here
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.endsWith(item.href)}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarMenu className="mt-auto">
            {settingsNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.includes(item.href)}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="items-center">
          <LanguageSwitcher />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 w-full border-b bg-background">
          <div className="container flex h-16 items-center justify-end">
            <UserNav t={t.header.userNav} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
