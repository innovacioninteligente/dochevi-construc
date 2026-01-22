import { Building } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, width = 60, height = 20 }: { className?: string, width?: number, height?: number }) {
  return (
    <Link href="/" className={cn("block relative", className)}>
      {/* Use a standard img for simplicity with external URLs unless domains are configured in next.config.js, 
           but unoptimized Next Image is better for layout stability if we know dimensions. 
           Given constraints, a simple img with object-contain is safest for external hotlinks if we lack config access.
           However, let's try standard Next Image with unoptimized prop to allow external without config changes if needed, 
           or just standard img tag. */}
      <img
        src="https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fdochevi%2Flogo.png?alt=media&token=5a49433e-2b9f-4984-b5f8-41eb5a6fd3a0"
        alt="Dochevi Construction"
        style={{ width: width, height: 'auto', maxHeight: height * 2, objectFit: 'contain' }}
      />
    </Link>
  );
}
