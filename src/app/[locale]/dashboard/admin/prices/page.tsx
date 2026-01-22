import { PriceBookAdminView } from './price-book-admin-view';

export default async function PriceBookAdminPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    return (
        <div className="p-8">
            <PriceBookAdminView locale={locale} />
        </div>
    );
}
