import { blogPosts } from '@/lib/blog-posts';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/dictionaries';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Calendar, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
// generateAlternates is used by constructMetadata internally now, but if imported, remove it.
// keeping it clean.

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

import { constructMetadata } from '@/i18n/seo-utils';

// ... (existing imports)

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return {};
  }

  return constructMetadata({
    title: `${post.title} | Nombre de empresa`,
    description: post.excerpt,
    image: post.image,
    path: '/blog/[slug]',
    locale,
    params: { slug },
    type: 'article'
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string, locale: any }> }) {
  const resolvedParams = await params;
  const post = blogPosts.find((p) => p.slug === resolvedParams.slug);
  const dict = await getDictionary(resolvedParams.locale);
  const t_cta = dict.blog.cta;

  if (!post) {
    notFound();
  }

  // Placeholder content
  const fullContent = `${post.excerpt}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n### Un subtítulo de ejemplo\n\nCurabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicul.`;

  return (
    <>
      <Header t={dict} />
      <main className="flex-1">
        <section className="relative h-64 md:h-80 w-full">
          <Image
            src={post.image}
            alt={`Imagen representativa de ${post.title}`}
            fill
            className="object-cover"
            data-ai-hint={post.imageHint}
          />
          <div className="absolute inset-0 bg-black/50" />
        </section>

        <section className="py-16 md:py-24">
          <div className="container-limited">
            <article className="prose dark:prose-invert max-w-none mx-auto lg:max-w-4xl">
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span className="font-semibold text-primary">{post.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>24 de Mayo, 2024</span>
                  </div>
                </div>
                <h1 className="font-headline text-4xl md:text-5xl font-bold !mb-4">
                  {post.title}
                </h1>
              </div>
              <ReactMarkdown>{fullContent}</ReactMarkdown>
            </article>
          </div>
        </section>

        <section className="w-full py-20 md:py-28 bg-secondary/50">
          <div className="container-limited text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">{t_cta.postCta.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4 mb-8">
              {t_cta.postCta.subtitle}
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
