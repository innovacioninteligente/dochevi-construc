'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useWidgetContext } from '@/context/budget-widget-context';

export function HeroSection({ t }: { t: any }) {
    const { openWidget } = useWidgetContext();
    if (!t) return null;

    return (
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Background Image with Ken Burns Effect */}
            <div className="absolute inset-0 w-full h-full">
                {/* We can reproduce the ken burns with framer motion too if we want more control, 
            but keeping the existing CSS class is fine if it works. 
            However, we can make it smoother with motion.div */}
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "easeOut" }}
                    className="relative w-full h-full"
                >
                    <Image
                        src="/images/hero-luxury.png"
                        alt="Luxury Renovation"
                        fill
                        className="object-cover"
                        priority
                    />
                </motion.div>
            </div>

            {/* Overlay - Darker for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

            {/* Content */}
            <div className="relative z-10 container-limited px-4 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className="max-w-5xl mx-auto space-y-6 md:space-y-8 p-6 md:p-12 rounded-3xl bg-white/5 backdrop-blur-[2px] border border-white/10 shadow-2xl"
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="font-headline text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#FDFBF7] drop-shadow-lg leading-[1.1]"
                        dangerouslySetInnerHTML={{ __html: t.title }}
                    />

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-lg md:text-2xl text-gray-200 max-w-3xl mx-auto font-light tracking-wide leading-relaxed"
                    >
                        {t.subtitle}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4 sm:pt-8"
                    >
                        <Button size="lg" onClick={() => openWidget('general')} className="bg-primary text-primary-foreground hover:bg-primary/90 text-base md:text-lg px-6 py-5 md:px-10 md:py-7 rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] transition-all duration-300 transform hover:-translate-y-1 h-auto w-full sm:w-auto">
                            {t.cta}
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-white/50 text-white hover:bg-white/10 hover:border-white bg-transparent text-base md:text-lg px-6 py-5 md:px-10 md:py-7 rounded-full backdrop-blur-sm transition-all duration-300 h-auto w-full sm:w-auto">
                            <Link href="/services">{t.ctaSecondary}</Link>
                        </Button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            >
                <div className="w-[30px] h-[50px] border-2 border-white/30 rounded-full flex justify-center p-2 backdrop-blur-sm bg-black/10">
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="w-1 h-2 bg-white rounded-full"
                    />
                </div>
            </motion.div>
        </section>
    );
}
