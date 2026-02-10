import { getDictionary } from '@/lib/dictionaries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, MapPin, Phone, Send, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { WebPageJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale as any);
  const t = dict.contact;
  const t_cta = dict.blog.cta;

  const contactDetails = [
    {
      icon: <MapPin className="h-5 w-5" />,
      label: t.address.label,
      value: t.address.value || "Petra, Mallorca",
      description: "Nuestras oficinas centrales",
    },
    {
      icon: <Phone className="h-5 w-5" />,
      label: t.phone.label,
      value: t.phone.value || "+34 674 26 69 69",
      href: `tel:${(t.phone.value || "+34 674 26 69 69").replace(/\s/g, '')}`,
      description: "Llámanos de Lunes a Viernes",
    },
    {
      icon: <Mail className="h-5 w-5" />,
      label: t.email.label,
      value: t.email.value || "info@gruporg.com",
      href: `mailto:${t.email.value || "info@gruporg.com"}`,
      description: "Te responderemos en menos de 24h",
    }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      <WebPageJsonLd
        name="Contacto - Grupo RG"
        description="Contacta con Grupo RG para tus proyectos de construcción y reformas en Mallorca."
        url={`https://gruporg.es/${locale}/contact`}
        type="ContactPage"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Inicio', href: `/${locale}` },
        { name: t.title || 'Contacto', href: `/${locale}/contact` }
      ]} />

      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_50%)]" />
        <div className="container-limited relative z-10 text-center space-y-6">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary animate-fade-up">
            {t.title}
          </div>
          <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground animate-fade-up [animation-delay:100ms]">
            Llevemos su visión <br /> <span className="text-primary italic">a la realidad</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up [animation-delay:200ms]">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="w-full pb-24 bg-background">
        <div className="container-limited grid lg:grid-cols-12 gap-16">
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-12 animate-fade-up [animation-delay:300ms]">
            <div className="space-y-4">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.formTitle}</h2>
              <p className="text-muted-foreground text-balanced">
                Complete el siguiente formulario y un experto de nuestro equipo se pondrá en contacto con usted para discutir los detalles de su proyecto.
              </p>
            </div>

            <form className="grid sm:grid-cols-2 gap-8 p-1 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 p-8 shadow-sm backdrop-blur-sm">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t.form.name}</Label>
                <Input
                  id="name"
                  placeholder={t.form.namePlaceholder}
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12"
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t.form.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.form.emailPlaceholder}
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12"
                />
              </div>
              <div className="sm:col-span-2 space-y-4">
                <Label htmlFor="message" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t.form.message}</Label>
                <Textarea
                  id="message"
                  placeholder={t.form.messagePlaceholder}
                  className="min-h-[160px] bg-background/50 border-primary/20 focus-visible:ring-primary resize-none"
                />
              </div>
              <div className="sm:col-span-2 pt-4">
                <Button type="submit" size="lg" className="w-full sm:w-auto h-14 px-12 text-base font-bold group shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                  {t.form.button}
                  <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Button>
              </div>
            </form>
          </div>

          {/* Info Side */}
          <div className="lg:col-span-5 space-y-12 animate-fade-up [animation-delay:400ms]">
            <div className="space-y-8">
              <h2 className="font-headline text-3xl font-bold">{t.infoTitle}</h2>
              <div className="grid gap-6">
                {contactDetails.map((item, index) => (
                  <Card key={index} className="group overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-md bg-secondary/10">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                          {item.icon}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          {item.href ? (
                            <a href={item.href} className="text-lg font-medium text-foreground hover:text-primary transition-colors block">
                              {item.value}
                            </a>
                          ) : (
                            <p className="text-lg font-medium text-foreground">{item.value}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden border border-primary/20 shadow-xl group">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12318.513481232811!2d3.1028782!3d39.613915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12964bfa95f33663%3A0xc6cb511993214e6b!2s07520%20Petra%2C%20Balearic%20Islands!5e0!3m2!1sen!2ses!4v1700000000000!5m2!1sen!2ses"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Petra, Mallorca"
                  className="grayscale hover:grayscale-0 transition-all duration-500 scale-[1.01] group-hover:scale-105"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-24 mb-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[150%] bg-white blur-[120px] rotate-12" />
        </div>
        <div className="container-limited text-center relative z-10 space-y-8">
          <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
            {t_cta.title}
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto font-light leading-relaxed">
            {t_cta.subtitle}
          </p>
          <div className="pt-4">
            <Button asChild size="lg" variant="secondary" className="h-16 px-10 text-lg font-bold group">
              <Link href="/budget-request">
                {t_cta.button}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
