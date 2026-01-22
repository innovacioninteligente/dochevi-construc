import { Suspense } from 'react';
import { getBudgetConfigAction } from './actions';
import { BudgetConfigForm } from './budget-config-form';
import { Skeleton } from "@/components/ui/skeleton";

export default async function BudgetSettingsPage() {
    const config = await getBudgetConfigAction();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Configuración de Presupuestos</h3>
                <p className="text-sm text-muted-foreground">
                    Ajusta los parámetros financieros globales del sistema.
                </p>
            </div>
            <div className="separator" />
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <BudgetConfigForm initialConfig={config} />
            </Suspense>
        </div>
    );
}
