'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "¿cuánto tiempo tarda una reforma integral en Mallorca?",
        answer: "El tiempo varía según la complejidad, pero una reforma integral estándar suele oscilar entre 3 y 5 meses. En Express Renovation Mallorca, garantizamos plazos cerrados por contrato gracias a nuestra planificación previa con tecnología 3D, evitando los retrasos habituales del sector."
    },
    {
        question: "¿Gestionáis las licencias de obra?",
        answer: "Sí, nos encargamos de todo el proceso burocrático. Desde la solicitud de licencias municipales (obra mayor o menor) hasta la gestión de ocupación de vía pública. Nuestro equipo técnico conoce al detalle las normativas de cada ayuntamiento."
    },
    {
        question: "¿Puedo ver el diseño antes de empezar la obra?",
        answer: "Absolutamente. Es parte fundamental de nuestro Método Express. Desarrollamos renders fotorrealistas y planos detallados antes de poner el primer ladrillo, asegurando que el resultado final coincida exactamente con tu visión."
    },
    {
        question: "¿Trabajáis con presupuesto cerrado?",
        answer: "Sí. Nuestra política de transparencia elimina las sorpresas. Una vez aprobado el diseño y los materiales, el precio es fijo, salvo que tú decidas realizar cambios durante la obra."
    }
];

export function FaqSection({ t }: { t: any }) {
    if (!t) return null;

    return (
        <section className="py-24 bg-muted/20">
            <div className="container-limited grid md:grid-cols-2 gap-16">
                <div className="space-y-6">
                    <span className="text-primary font-bold tracking-wider uppercase text-sm">{t.label}</span>
                    <h2 className="font-headline text-4xl font-bold leading-tight">{t.title}</h2>
                    <p className="text-muted-foreground text-lg">
                        {t.subtitle}
                    </p>
                    {/* Add an image here for visual balance?? maybe later */}
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border">
                    <Accordion type="single" collapsible className="w-full">
                        {t.items.map((faq: any, index: number) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary transition-colors">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
}
