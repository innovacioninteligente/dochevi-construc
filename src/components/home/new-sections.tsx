'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    BentoGrid,
    BentoCard,
    BentoTitle,
    BentoDescription,
    BentoStat
} from '@/components/ui/bento-grid';
import { TextReveal, Counter } from '@/components/ui/animated-section';
import { HeroTransition } from '@/components/ui/page-transition';

/* ========================================
   IMMERSIVE HERO SECTION
   Main hero with Bento grid layout
   ======================================== */

interface ImmersiveHeroProps {
    title: string;
    subtitle: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    stats?: {
        value: number;
        label: string;
        suffix?: string;
    }[];
    backgroundImage?: string;
}

export function ImmersiveHero({
    title,
    subtitle,
    description,
    ctaText,
    ctaLink,
    secondaryCtaText,
    secondaryCtaLink,
    stats = [],
    backgroundImage = '/images/hero-bg.jpg',
}: ImmersiveHeroProps) {
    return (
        <section className="relative min-h-screen flex items-center py-12 md:py-20 overflow-hidden">
            {/* Background with gradient overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/60" />
            </div>

            {/* Content */}
            <div className="container-limited relative z-10">
                <HeroTransition>
                    <BentoGrid columns={4} className="auto-rows-[minmax(180px,auto)]">
                        {/* Main Title Card - 2x2 */}
                        <BentoCard
                            size="2x2"
                            variant="glass"
                            className="flex flex-col justify-center"
                            hover={false}
                        >
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-primary font-medium mb-4 uppercase tracking-widest text-sm"
                            >
                                {subtitle}
                            </motion.span>

                            <h1 className="heading-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
                                <TextReveal text={title} delay={0.3} duration={0.08} />
                            </h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="text-lg text-muted-foreground max-w-lg leading-relaxed"
                            >
                                {description}
                            </motion.p>
                        </BentoCard>

                        {/* Featured Image Card - 1x2 */}
                        <BentoCard
                            size="1x2"
                            variant="image"
                            backgroundImage="/images/project-featured.jpg"
                            className="hidden lg:flex"
                        >
                            <div className="mt-auto">
                                <span className="text-xs uppercase tracking-widest text-white/70">
                                    Proyecto Destacado
                                </span>
                                <BentoTitle className="text-white mt-2">
                                    Villa Son Vida
                                </BentoTitle>
                            </div>
                        </BentoCard>

                        {/* CTA Card */}
                        <BentoCard
                            size="1x1"
                            variant="primary"
                            className="flex flex-col justify-between"
                        >
                            <BentoDescription className="text-primary-foreground/90">
                                Comienza tu proyecto con un presupuesto personalizado
                            </BentoDescription>
                            <Link href={ctaLink} className="mt-4">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="w-full group"
                                >
                                    {ctaText}
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </BentoCard>

                        {/* Stats Cards */}
                        {stats.slice(0, 2).map((stat, index) => (
                            <BentoCard
                                key={index}
                                size="1x1"
                                variant="default"
                                className="flex items-center justify-center"
                            >
                                <BentoStat
                                    value={<Counter to={stat.value} suffix={stat.suffix} />}
                                    label={stat.label}
                                />
                            </BentoCard>
                        ))}

                        {/* Video/Secondary CTA Card */}
                        {secondaryCtaText && secondaryCtaLink && (
                            <BentoCard
                                size="1x1"
                                variant="outline"
                                className="flex items-center justify-center group cursor-pointer"
                            >
                                <Link
                                    href={secondaryCtaLink}
                                    className="flex flex-col items-center text-center"
                                >
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                                        <Play className="w-6 h-6 text-primary ml-1" />
                                    </div>
                                    <span className="text-sm font-medium">{secondaryCtaText}</span>
                                </Link>
                            </BentoCard>
                        )}
                    </BentoGrid>
                </HeroTransition>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-6 h-10 border-2 border-foreground/20 rounded-full flex justify-center pt-2"
                >
                    <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" />
                </motion.div>
            </motion.div>
        </section>
    );
}

/* ========================================
   PHILOSOPHY SECTION
   Large statement with reveal animation
   ======================================== */

interface PhilosophySectionProps {
    quote: string;
    author?: string;
    description?: string;
}

export function PhilosophySection({
    quote,
    author,
    description,
}: PhilosophySectionProps) {
    return (
        <section className="py-24 md:py-32 bg-secondary text-secondary-foreground">
            <div className="container-limited">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <blockquote className="heading-display text-3xl md:text-4xl lg:text-5xl leading-relaxed mb-8">
                        &quot;{quote}&quot;
                    </blockquote>

                    {author && (
                        <cite className="text-primary font-medium not-italic">
                            — {author}
                        </cite>
                    )}

                    {description && (
                        <p className="mt-8 text-secondary-foreground/70 max-w-2xl mx-auto">
                            {description}
                        </p>
                    )}
                </motion.div>
            </div>
        </section>
    );
}

/* ========================================
   EXPERTISE BENTO SECTION
   Services displayed in bento grid
   ======================================== */

interface ExpertiseItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    image?: string;
    featured?: boolean;
}

interface ExpertiseBentoProps {
    title: string;
    subtitle: string;
    items: ExpertiseItem[];
}

export function ExpertiseBento({
    title,
    subtitle,
    items,
}: ExpertiseBentoProps) {
    const featuredItem = items.find(item => item.featured);
    const regularItems = items.filter(item => !item.featured);

    return (
        <section className="py-20 md:py-28">
            <div className="container-limited">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-16"
                >
                    <span className="text-primary font-medium uppercase tracking-widest text-sm">
                        {subtitle}
                    </span>
                    <h2 className="heading-display text-3xl md:text-4xl lg:text-5xl mt-4">
                        {title}
                    </h2>
                </motion.div>

                {/* Bento Grid */}
                <BentoGrid columns={4}>
                    {/* Featured Item - 2x2 with image */}
                    {featuredItem && (
                        <BentoCard
                            size="2x2"
                            variant="image"
                            backgroundImage={featuredItem.image}
                            className="group cursor-pointer"
                        >
                            <Link href={featuredItem.href} className="flex flex-col h-full">
                                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center mb-4">
                                    {featuredItem.icon}
                                </div>
                                <div className="mt-auto">
                                    <BentoTitle className="text-white group-hover:text-primary transition-colors">
                                        {featuredItem.title}
                                    </BentoTitle>
                                    <BentoDescription className="text-white/80 mt-2">
                                        {featuredItem.description}
                                    </BentoDescription>
                                </div>
                            </Link>
                        </BentoCard>
                    )}

                    {/* Regular Items */}
                    {regularItems.slice(0, 4).map((item, index) => (
                        <BentoCard
                            key={index}
                            size="1x1"
                            variant="default"
                            className="group cursor-pointer"
                        >
                            <Link href={item.href} className="flex flex-col h-full">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    {item.icon}
                                </div>
                                <BentoTitle className="group-hover:text-primary transition-colors">
                                    {item.title}
                                </BentoTitle>
                                <BentoDescription className="mt-2 line-clamp-2">
                                    {item.description}
                                </BentoDescription>
                                <div className="mt-auto pt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    Ver más <ArrowRight className="ml-1 w-4 h-4" />
                                </div>
                            </Link>
                        </BentoCard>
                    ))}
                </BentoGrid>
            </div>
        </section>
    );
}

/* ========================================
   NUMBERS SECTION
   Animated statistics
   ======================================== */

interface NumberItem {
    value: number;
    suffix?: string;
    label: string;
}

interface NumbersSectionProps {
    items: NumberItem[];
}

export function NumbersSection({ items }: NumbersSectionProps) {
    return (
        <section className="py-16 md:py-24 bg-muted/50">
            <div className="container-limited">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {items.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="text-center"
                        >
                            <div className="heading-display text-4xl md:text-5xl lg:text-6xl text-primary">
                                <Counter to={item.value} suffix={item.suffix} />
                            </div>
                            <p className="mt-2 text-muted-foreground text-sm uppercase tracking-wide">
                                {item.label}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ========================================
   TERRITORIES SECTION
   Service areas map
   ======================================== */

interface TerritoriesSectionProps {
    title: string;
    description: string;
    locations: string[];
}

export function TerritoriesSection({
    title,
    description,
    locations,
}: TerritoriesSectionProps) {
    return (
        <section className="py-20 md:py-28 bg-secondary text-secondary-foreground overflow-hidden">
            <div className="container-limited">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-primary font-medium uppercase tracking-widest text-sm">
                            Áreas de servicio
                        </span>
                        <h2 className="heading-display text-3xl md:text-4xl lg:text-5xl mt-4 mb-6">
                            {title}
                        </h2>
                        <p className="text-secondary-foreground/70 mb-8">
                            {description}
                        </p>

                        {/* Location tags */}
                        <div className="flex flex-wrap gap-3">
                            {locations.map((location, index) => (
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="px-4 py-2 bg-secondary-foreground/10 rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-default"
                                >
                                    {location}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Map illustration placeholder */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative aspect-square"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="heading-display text-4xl text-primary">🏝️</span>
                                </div>
                                <p className="text-secondary-foreground/70 text-sm">
                                    Islas Baleares
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

/* ========================================
   CONTACT STRIP
   Inline CTA section
   ======================================== */

interface ContactStripProps {
    title: string;
    ctaText: string;
    ctaLink: string;
}

export function ContactStrip({
    title,
    ctaText,
    ctaLink,
}: ContactStripProps) {
    return (
        <section className="py-20 md:py-28">
            <div className="container-limited">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12 bg-primary rounded-3xl"
                >
                    <h2 className="heading-display text-2xl md:text-3xl text-primary-foreground text-center md:text-left">
                        {title}
                    </h2>
                    <Link href={ctaLink}>
                        <Button
                            size="lg"
                            variant="secondary"
                            className="group whitespace-nowrap"
                        >
                            {ctaText}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
