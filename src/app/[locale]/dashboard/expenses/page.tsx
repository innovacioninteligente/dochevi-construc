import { getAllExpensesAction } from '@/actions/expense/get-project-expenses.action';
import { getAllProjectsAction } from '@/actions/project/get-all-projects.action';
import { getDictionary } from '@/lib/dictionaries';
import { ExpensesPageClient } from './expenses-page-client';

export default async function ExpensesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const dict = await getDictionary(locale as any);

    const [expenses, projects] = await Promise.all([
        getAllExpensesAction(),
        getAllProjectsAction(),
    ]);

    return (
        <ExpensesPageClient
            expenses={expenses}
            projects={projects}
            locale={locale}
        />
    );
}
