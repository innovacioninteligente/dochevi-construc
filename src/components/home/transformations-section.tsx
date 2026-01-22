'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Play } from 'lucide-react';

export function TransformationsSection({ t }: { t: any }) {
    if (!t) return null;

    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    return (
        <section className="py-20 bg-background overflow-hidden">
            <div className="container-limited">
                <div className="grid lg:grid-cols-12 gap-8 items-center">

                    {/* Left Column: Vertical Video Showcase - Spans 5 columns */}
                    <div className="lg:col-span-5 relative mx-auto lg:mx-0 w-full max-w-[400px]">
                        {/* Decorative background blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full -z-10" />

                        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10 aspect-[9/16] group cursor-pointer" onClick={toggleMute}>
                            <video
                                ref={videoRef}
                                src="https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fdochevi%2Ffinal.mp4?alt=media&token=ca374d0a-2ffc-4dc6-a603-99088aef30ec"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                            {/* Sound Control Indicator */}
                            <div className="absolute bottom-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </div>

                            {/* Tap hint */}
                            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isMuted ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                                <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm font-medium">
                                    Tap for Sound
                                </div>
                            </div>
                        </div>

                        {/* Featured Badge */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            className="absolute -left-6 top-12 bg-background border border-border shadow-xl py-3 px-6 rounded-r-xl z-20 hidden md:block"
                        >
                            <span className="font-headline font-bold text-primary tracking-widest text-sm uppercase">Featured Project</span>
                        </motion.div>
                    </div>

                    {/* Right Column: Text Content - Spans 7 columns */}
                    <div className="lg:col-span-7 space-y-8 relative z-10 lg:pl-12">
                        <div className="space-y-4">
                            <span className="text-primary font-bold tracking-widest uppercase text-xs md:text-sm">{t.label}</span>
                            <h2
                                className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
                                dangerouslySetInnerHTML={{ __html: t.title }}
                            />
                        </div>

                        <p className="text-lg text-muted-foreground leading-relaxed font-light">
                            {t.subtitle}
                        </p>

                        <div className="space-y-6 pt-4">
                            {/* Reuse sidebar steps as features if available, or just static appealing text */}
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary">
                                    <Play className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground text-lg">{t.sidebarTitle}</h4>
                                    <p className="text-muted-foreground text-sm leading-relaxed mt-1">{t.sidebarDescription}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button asChild size="lg" className="rounded-full px-8 text-lg shadow-lg shadow-primary/20">
                                <Link href="/portfolio">{t.cta}</Link>
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
