'use client';

import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const locations = [
    "Son Vida",
    "Portals Nous",
    "Bendinat",
    "Santa Ponsa",
    "Port d'Andratx",
    "Camp de Mar",
    "Palma Centro",
    "Illetas"
];

export function LocationsGrid({ t }: { t: any }) {
    if (!t) return null;

    return (
        <section className="py-24 bg-background border-t">
            <div className="container-limited text-center space-y-12">
                <div className="space-y-4">
                    <span className="text-primary font-bold tracking-wider uppercase text-sm">{t.label}</span>
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.title}</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {locations.map((loc, index) => (
                        <Link key={index} href={`/zonas/${loc.toLowerCase().replace(/\s+/g, '-')}`} className="group p-4 bg-muted/50 rounded-lg border border-transparent hover:border-primary/30 hover:bg-white hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
                            <MapPin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">{loc}</span>
                        </Link>
                    ))}
                </div>

                <div className="pt-8">
                    <Button variant="link" className="text-muted-foreground hover:text-primary">
                        {t.link} &rarr;
                    </Button>
                </div>
            </div>
        </section>
    );
}
