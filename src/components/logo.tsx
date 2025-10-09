import { Building } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, width = 48, height = 48 }: { className?: string, width?: number, height?: number }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-xl font-bold font-headline", className)}>
      <Building className="text-primary" style={{ width, height }} />
      <span className="hidden md:inline-block">Nombre de empresa</span>
    </Link>
  );
}
