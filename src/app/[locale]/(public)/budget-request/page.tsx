import { getDictionary } from '@/lib/dictionaries';
import { BudgetRequestForm } from '@/components/budget-request/budget-request-form';

export default async function BudgetRequestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale as any);
  const t_br = dict.budgetRequest;

  return (
    <>
      <div className="w-full py-16 md:py-20 bg-background">
        <div className="container-limited text-center">
          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            {t_br.page.title}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t_br.page.description}
          </p>

          <div className='w-full flex justify-center mt-12'>
            <BudgetRequestForm t={dict} />
          </div>
        </div>
      </div>
    </>
  );
}
