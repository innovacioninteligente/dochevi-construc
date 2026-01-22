import { getDictionary } from '@/lib/dictionaries';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { blogPosts } from '@/lib/blog-posts';

export default async function BlogPage({ params: { locale } }: { params: { locale: any } }) {
  const dict = await getDictionary(locale);
  const t = dict.blog;

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
          <div className="container-limited">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card key={post.id} className="group overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300">
                  <div className="relative h-56 w-full">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={post.imageHint}
                    />
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col">
                    <p className="text-sm text-primary font-semibold mb-2">{post.category}</p>
                    <h3 className="font-headline text-xl font-bold mb-2 flex-grow">{post.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{post.excerpt}</p>
                    <Button asChild variant="link" className="p-0 h-auto mt-auto self-start">
                        <Link href={`/blog/${post.slug}`} className="font-bold">
                            {t.readMore} <ArrowRight className="ml-2" />
                        </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-20 md:py-28 bg-secondary/50">
            <div className="container-limited text-center">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.cta.title}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4 mb-8">
                    {t.cta.subtitle}
                </p>
                <Button asChild size="lg" className="font-bold">
                    <Link href="/budget-request">
                        {t.cta.button}
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
