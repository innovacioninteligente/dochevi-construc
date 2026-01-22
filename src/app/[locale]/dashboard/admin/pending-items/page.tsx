import { getPendingItemsAction } from './actions';
import { PendingItemsTable } from './pending-items-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PendingItemsPage() {
    const items = await getPendingItemsAction();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Partidas Sugeridas por IA</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bandeja de Entrada</CardTitle>
                </CardHeader>
                <CardContent>
                    <PendingItemsTable initialItems={items} />
                </CardContent>
            </Card>
        </div>
    );
}
