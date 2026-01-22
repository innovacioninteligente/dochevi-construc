import { getDictionary } from '@/lib/dictionaries';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { VisionSection } from '@/components/home/vision-section';
import { ServicesGrid } from '@/components/home/services-grid';
import { TransformationsSection } from '@/components/home/transformations-section';
import { ProcessSteps } from '@/components/home/process-steps';
import { LocationsGrid } from '@/components/home/locations-grid';
import { FaqSection } from '@/components/home/faq-section';
import { CtaSection } from '@/components/home/cta-section';
import { HeroSection } from '@/components/home/hero-section';



export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale as any); // Cast because 'nl' might not be fully inferred yet in some IDEs or strict check

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <HeroSection t={dict.home.hero} />

      <VisionSection t={dict.home.vision} />

      <ServicesGrid t={dict.home.servicesGrid} />

      <TransformationsSection t={dict.home.transformations} />

      <ProcessSteps t={dict.home.processSteps} />

      <LocationsGrid t={dict.home.locations} />

      <FaqSection t={dict.home.faq} />

      <CtaSection t={dict.home.cta} />

    </main>
  );
}
