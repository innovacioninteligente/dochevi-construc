'use client';

import {
    MessageSquare,
    PencilRuler,
    Hammer,
    Key
} from 'lucide-react';

export function ProcessSteps({ t }: { t: any }) {
    if (!t) return null;

    const icons = [
        <MessageSquare className="h-6 w-6" key="0" />,
        <PencilRuler className="h-6 w-6" key="1" />,
        <Hammer className="h-6 w-6" key="2" />,
        <Key className="h-6 w-6" key="3" />
    ];

    return (
        <section className="py-24 bg-[#2D2D2D] text-white relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <div className="container-limited text-center mb-16 space-y-4 relative z-10">
                <span className="text-primary font-bold tracking-wider uppercase text-sm">{t.label}</span>
                <h2 className="font-headline text-4xl md:text-5xl font-bold">{t.title}</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    {t.subtitle}
                </p>
            </div>

            <div className="container-limited relative z-10">
                <div className="grid md:grid-cols-4 gap-8 relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-700 -z-10" />

                    {t.steps.map((step: any, index: number) => (
                        <div key={index} className="flex flex-col items-center text-center space-y-6 group">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-full bg-[#3D3D3D] border-4 border-[#2D2D2D] flex items-center justify-center text-primary group-hover:border-primary group-hover:scale-110 transition-all duration-300 shadow-xl">
                                    {icons[index] || <Hammer className="h-6 w-6" />}
                                </div>
                                <div className="absolute -top-2 -right-2 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                    {index + 1}
                                </div>
                            </div>

                            <div className="space-y-2 px-4">
                                <h3 className="font-headline text-xl font-bold group-hover:text-primary transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
