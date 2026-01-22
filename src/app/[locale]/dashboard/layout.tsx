import { DashboardLayout } from "@/components/dashboard-layout";
import { getDictionary } from "@/lib/dictionaries";

export default async function Layout({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const dict = await getDictionary(locale as any);
    return <DashboardLayout t={dict}>{children}</DashboardLayout>;
}
