'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CtaSection({ t }: { t: any }) {
    if (!t) return null;

    return (
        <section className="py-32 bg-primary relative overflow-hidden text-white pattern-grid">
            {/* Abstract circular shapes for background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="container-limited relative z-10 text-center space-y-8">
                <h2 className="font-headline text-4xl md:text-6xl font-bold">
                    {t.title}
                </h2>
                <p className="text-white/90 text-xl md:text-2xl max-w-3xl mx-auto font-light">
                    {t.subtitle}
                </p>
                <div className="pt-8 flex flex-col sm:flex-row gap-6 justify-center">
                    <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-7 rounded-full shadow-2xl font-bold">
                        <Link href="/budget-request">{t.buttonPrimary}</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-10 py-7 rounded-full backdrop-blur-sm">
                        <Link href="/contact">{t.buttonSecondary} <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                </div>
                <p className="text-sm text-white/60 pt-8 uppercase tracking-widest">
                    {t.note}
                </p>
            </div>
        </section>
    );
}
