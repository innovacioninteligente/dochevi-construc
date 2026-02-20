'use client';

import dynamic from 'next/dynamic';

const SmartBudgetTrigger = dynamic(
    () => import('@/components/budget-widget/smart-trigger').then(mod => mod.SmartBudgetTrigger),
    { ssr: false }
);

const SmartBudgetModal = dynamic(
    () => import('@/components/budget-widget/budget-modal').then(mod => mod.SmartBudgetModal),
    { ssr: false }
);

export function SmartBudgetWrapper({ dictionary }: { dictionary?: any }) {
    return (
        <>
            <SmartBudgetTrigger dictionary={dictionary} />
            <SmartBudgetModal dictionary={dictionary} />
        </>
    );
}
