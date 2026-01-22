'use client';

import {
    Hammer,
    ChefHat,
    Droplets,
    Trees,
    ArrowRight,
    Paintbrush,
    Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ServicesGrid({ t }: { t: any }) {
    if (!t) return null;

    const icons = [
        <Hammer className="h-8 w-8" key="0" />,
        <ChefHat className="h-8 w-8" key="1" />,
        <Droplets className="h-8 w-8" key="2" />,
        <Trees className="h-8 w-8" key="3" />,
        <Paintbrush className="h-8 w-8" key="4" />,
        <Layers className="h-8 w-8" key="5" />
    ];

    // Bento Grid Layout definition
    // First item is large on desktop, standard on mobile.
    // All items same size on mobile to prevent overlap or inequality.
    const getGridClass = (index: number) => {
        if (index === 0) return "md:col-span-2 md:row-span-2 min-h-[250px] md:min-h-[400px]";
        return "md:col-span-1 md:row-span-1 min-h-[250px]";
    };

    return (
        <section className="py-24 bg-muted/20 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="container-limited relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <span className="text-primary font-bold tracking-wider uppercase text-sm">{t.label}</span>
                        <h2 className="font-headline text-4xl md:text-5xl font-bold">{t.title}</h2>
                        <p className="text-muted-foreground text-lg">
                            {t.subtitle}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
                    {t.items.map((service: any, index: number) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={cn(
                                "group relative overflow-hidden rounded-3xl border border-white/20 bg-background shadow-sm hover:shadow-2xl transition-all duration-500",
                                getGridClass(index)
                            )}
                        >
                            {/* Hover Reveal Image Background (Placeholder gradient if no image) */}
                            <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0">
                                {/* Use actual images here when available */}
                                <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-luxury.png')] bg-cover bg-center mix-blend-overlay" />
                            </div>

                            {/* Default Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-secondary/30 z-0 transition-opacity duration-500 group-hover:opacity-0" />

                            <div className="relative z-10 w-full h-full p-8 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-secondary/50 rounded-2xl text-primary group-hover:bg-white/20 group-hover:text-white transition-all duration-300 backdrop-blur-md">
                                        {icons[index] || <Hammer className="h-6 w-6" />}
                                    </div>
                                    <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300 text-white">
                                        <ArrowRight className="h-5 w-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className={cn(
                                        "font-headline font-bold text-foreground group-hover:text-white transition-colors duration-300",
                                        index === 0 ? "text-3xl" : "text-xl"
                                    )}>
                                        {service.title}
                                    </h3>

                                    <p className={cn(
                                        "text-muted-foreground group-hover:text-white/80 transition-colors duration-300 leading-relaxed",
                                        index === 0 ? "text-base line-clamp-3" : "text-sm line-clamp-3"
                                    )}>
                                        {service.description}
                                    </p>
                                </div>
                            </div>

                            <Link href={service.link || '#'} className="absolute inset-0 z-20">
                                <span className="sr-only">{t.cta}</span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
