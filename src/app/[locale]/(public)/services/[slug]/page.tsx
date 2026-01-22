import { services } from '@/lib/services';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/dictionaries';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return services.map((service) => ({
    slug: service.id,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string, locale: string } }): Promise<Metadata> {
  const service = services.find((s) => s.id === params.slug);
  const dict = await getDictionary(params.locale as any);
  const serviceTranslation = dict.services[params.slug];

  if (!service || !serviceTranslation) {
    return {};
  }

  const title = `${serviceTranslation.title} | Nombre de empresa`;
  const description = serviceTranslation.shortDescription;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: service.image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [service.image],
    },
  };
}

export default async function ServicePage({ params }: { params: { slug: string, locale: any } }) {
  const service = services.find((s) => s.id === params.slug);
  const dict = await getDictionary(params.locale);
  
  if (!service) {
    notFound();
  }
  
  const serviceTranslation = dict.services[service.id];
  const t_cta = dict.services.cta;

  if (!serviceTranslation) {
      notFound();
  }

  return (
    <>
      <Header t={dict} />
      <main className="flex-1">
        <section className="relative h-64 md:h-80 w-full">
          <Image
            src={service.image}
            alt={`Imagen representativa de ${serviceTranslation.title}`}
            fill
            className="object-cover"
            data-ai-hint={service.imageHint}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative container-limited h-full flex flex-col justify-center text-white">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {serviceTranslation.title}
            </h1>
            <p className="text-lg md:text-xl mt-2 max-w-3xl">{serviceTranslation.subtitle}</p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container-limited">
            <div className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-6">
                <h2 className="text-2xl font-bold font-headline">{t_cta.descriptionTitle}</h2>
                <p className="text-muted-foreground leading-relaxed">{serviceTranslation.description}</p>
                
                <h3 className="text-xl font-bold font-headline pt-6">{t_cta.featuresTitle}</h3>
                <ul className="space-y-4">
                    {serviceTranslation.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                    ))}
                </ul>
                </div>
                
                <aside className="space-y-8 md:col-span-1">
                {/* This space can be used for related services or a sticky menu if needed */}
                </aside>
            </div>
          </div>
        </section>

        <section className="w-full py-20 md:py-28 bg-secondary/50">
            <div className="container-limited text-center">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">{t_cta.title.replace('{serviceName}', serviceTranslation.title.toLowerCase())}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4 mb-8">
                    {t_cta.subtitle}
                </p>
                <Button asChild size="lg" className="font-bold">
                    <Link href="/budget-request">
                        {t_cta.button}
                        <ArrowRight className="ml-2" />
                    </Link>
                </Button>
            </div>
        </section>
      </main>
      <Footer t={dict.home.finalCta} />
    </>
  );
}
