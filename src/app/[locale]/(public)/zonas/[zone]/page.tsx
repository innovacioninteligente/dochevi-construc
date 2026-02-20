import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/dictionaries';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
// generateAlternates replaced by constructMetadata
import { locations } from '@/lib/locations';

export async function generateStaticParams() {
    return locations.map(loc => ({
        zone: loc.toLowerCase().replace(/\s+/g, '-')
    }));
}

import { constructMetadata } from '@/i18n/seo-utils';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; zone: string }> }): Promise<Metadata> {
    const { locale, zone } = await params;
    const locationName = zone.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return constructMetadata({
        title: `Reformas en ${locationName} | Mallorca Premium Construction`,
        description: `Servicios de construcción y reformas integrales en ${locationName}, Mallorca. Calidad garantizada y acabados de lujo.`,
        path: '/zonas/[zone]',
        locale,
        params: { zone }
    });
}

export default async function LocationPage({ params }: { params: Promise<{ locale: string; zone: string }> }) {
    const { locale, zone } = await params;
    const locationName = zone.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // We ideally want a dictionary for this, but for now we fallback to generic content
    const dict = await getDictionary(locale as any);
    const t = dict.home.cta; // Reusing CTA translations

    const isValidLocation = locations.some(l => l.toLowerCase().replace(/\s+/g, '-') === zone);
    if (!isValidLocation) {
        // We could 404, but let's be lenient or check strictness
        // notFound();
    }

    return (
        <main className="flex-1">
            <section className="w-full py-20 md:py-28 bg-secondary/20">
                <div className="container-limited text-center">
                    <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                        Reformas en {locationName}
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                        Realizamos proyectos exclusivos de construcción y renovación en {locationName}.
                        Transformamos tu propiedad con los más altos estándares de calidad.
                    </p>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="container-limited text-center">
                    <p className="mb-8 text-muted-foreground">
                        ¿Tienes una propiedad en <strong>{locationName}</strong>? Contáctanos para un presupuesto personalizado.
                    </p>

                    <Button asChild size="lg" className="font-bold">
                        <Link href="/budget-request">
                            {t.title || "Solicitar Presupuesto"}
                            <ArrowRight className="ml-2" />
                        </Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}
