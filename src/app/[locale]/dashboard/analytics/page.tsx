import { getGlobalAnalyticsAction } from '@/actions/analytics/get-global-analytics.action';
import { getProviderRankingAction, getBudgetAccuracyAction } from '@/actions/analytics/get-advanced-analytics.action';
import { getAllProjectsAction } from '@/actions/project/get-all-projects.action';
import { getDictionary } from '@/lib/dictionaries';
import { AnalyticsPageClient } from './analytics-page-client';

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const dict = await getDictionary(locale as any);

    const [globalAnalytics, projects, providerRanking, budgetAccuracy] = await Promise.all([
        getGlobalAnalyticsAction(),
        getAllProjectsAction(),
        getProviderRankingAction(),
        getBudgetAccuracyAction(),
    ]);

    return (
        <AnalyticsPageClient
            globalAnalytics={globalAnalytics}
            projects={projects}
            providerRanking={providerRanking}
            budgetAccuracy={budgetAccuracy}
            locale={locale}
        />
    );
}
