import { getDictionary } from '@/lib/dictionaries';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

export default async function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  const dict = await getDictionary(locale);
  const t = dict.contact;
  const t_cta = dict.blog.cta;

  const contactDetails = [
    {
      icon: <MapPin className="h-6 w-6 text-primary" />,
      label: t.address.label,
      value: "Carrer de la Mar, 123, 07001 Palma, Mallorca",
    },
    {
      icon: <Phone className="h-6 w-6 text-primary" />,
      label: t.phone.label,
      value: "+34 626 00 64 61",
      href: "tel:+34626006461",
    },
    {
      icon: <Mail className="h-6 w-6 text-primary" />,
      label: t.email.label,
      value: "info@yakuconstrucciones.com",
      href: "mailto:info@yakuconstrucciones.com",
    }
  ];

  return (
    <>
      <Header t={dict} />
      <main className="flex-1">
        <section className="w-full py-20 md:py-28 bg-secondary/50">
          <div className="container-limited text-center">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {t.title}
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t.subtitle}
            </p>
          </div>
        </section>

        <section className="w-full py-20 md:py-28 bg-background">
          <div className="container-limited grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h2 className="font-headline text-3xl font-bold">{t.formTitle}</h2>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.form.name}</Label>
                  <Input id="name" placeholder={t.form.namePlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.form.email}</Label>
                  <Input id="email" type="email" placeholder={t.form.emailPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t.form.message}</Label>
                  <Textarea id="message" placeholder={t.form.messagePlaceholder} className="min-h-[150px]" />
                </div>
                <Button type="submit" size="lg">{t.form.button}</Button>
              </form>
            </div>
            <div className="space-y-8">
              <h2 className="font-headline text-3xl font-bold">{t.infoTitle}</h2>
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {contactDetails.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div>{item.icon}</div>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        {item.href ? (
                          <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-muted-foreground">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div className="aspect-video w-full">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3075.922543459463!2d2.64836471536968!3d39.5714399794717!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x129792575b6d65c3%3A0x4645b7a37a67f08c!2sCatedral-Bas%C3%ADlica%20de%20Santa%20Mar%C3%ADa%20de%20Mallorca!5e0!3m2!1ses!2ses!4v1678886456789!5m2!1ses!2ses"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mapa de ubicación"
                    className='rounded-lg'
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 md:py-28 bg-secondary/50">
            <div className="container-limited text-center">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">{t_cta.title}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4 mb-8">
                    {t_cta.subtitle}
                </p>
                <Button asChild size="lg" className="font-bold">
                    <Link href="/budget-request">
                        {t_cta.button}
                        <ArrowRight className="ml-2" />
                    </Link>
                </Button>
            </div>
        </section>
      </main>
      <Footer t={dict.home.finalCta} />
    </>
  );
}
