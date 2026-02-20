// src/backend/analytics/analytics-service.ts
import { Project } from '@/backend/project/domain/project';
import { Expense } from '@/backend/expense/domain/expense';
import { ProjectPhase } from '@/backend/project/domain/project-phase';

// ---- Types ----

export interface PhaseComparison {
    phaseId: string;
    name: string;
    estimatedCost: number;
    realCost: number;
    deviation: number;       // realCost - estimatedCost
    deviationPercent: number; // (deviation / estimatedCost) * 100
    progress: number;
}

export interface ProviderBreakdown {
    providerName: string;
    total: number;
    count: number;
}

export interface MonthlyExpense {
    month: string;  // 'YYYY-MM'
    label: string;  // 'Ene 2026'
    total: number;
    count: number;
}

export interface ProjectAnalytics {
    projectId: string;
    projectName: string;
    status: string;

    // Financial overview
    estimatedBudget: number;
    realCost: number;
    grossMargin: number;        // estimatedBudget - realCost
    deviationPercent: number;   // (realCost - estimatedBudget) / estimatedBudget * 100

    // Burn rate
    daysElapsed: number;
    dailyBurnRate: number;      // realCost / daysElapsed
    projectedTotalCost: number; // burn rate * estimated total days

    // Breakdowns
    phaseComparisons: PhaseComparison[];
    topProviders: ProviderBreakdown[];
    monthlyExpenses: MonthlyExpense[];

    // Expense counts
    totalExpenses: number;
    pendingExpenses: number;
    validatedExpenses: number;
}

export interface GlobalAnalytics {
    // Totals
    totalBilled: number;      // Sum of estimatedBudget across active projects
    totalExpenses: number;     // Sum of validated expense totals
    netProfit: number;         // totalBilled - totalExpenses
    profitMargin: number;      // (netProfit / totalBilled) * 100

    // VAT
    vatCollected: number;      // IVA repercutido (from budgets)
    vatPaid: number;           // IVA soportado (from expenses)
    vatBalance: number;        // vatCollected - vatPaid

    // Projects
    totalProjects: number;
    projectsByStatus: Record<string, number>;

    // Per-project summary
    projectSummaries: {
        id: string;
        name: string;
        status: string;
        estimated: number;
        real: number;
        deviationPercent: number;
    }[];

    // Time series
    monthlyExpenses: MonthlyExpense[];
}

// ---- EVM (Earned Value Management) ----

export interface EVMDataPoint {
    date: string;       // ISO date
    label: string;      // 'Ene 2026'
    plannedValue: number;   // PV: Coste planificado acumulado
    earnedValue: number;    // EV: Valor ganado (progress * estimatedCost)
    actualCost: number;     // AC: Coste real acumulado
}

export interface EVMAnalytics {
    projectId: string;
    projectName: string;

    // Indices
    spi: number;            // Schedule Performance Index (EV / PV)
    cpi: number;            // Cost Performance Index (EV / AC)

    // Forecasts
    eac: number;            // Estimate at Completion (estimatedBudget / CPI)
    etc: number;            // Estimate to Complete (EAC - AC)
    vac: number;            // Variance at Completion (estimatedBudget - EAC)

    // Status
    spiStatus: 'ahead' | 'on_track' | 'behind';
    cpiStatus: 'under_budget' | 'on_budget' | 'over_budget';

    // Curva S data points
    curvaS: EVMDataPoint[];

    // Totals at current date
    currentPV: number;
    currentEV: number;
    currentAC: number;
    estimatedBudget: number;
}

// ---- Provider Ranking ----

export interface ProviderRankingEntry {
    providerId?: string;
    providerName: string;
    cif?: string;
    category?: string;

    totalSpent: number;
    invoiceCount: number;
    projectCount: number;
    projectNames: string[];

    avgInvoiceAmount: number;
    riskPercent: number;    // % of total spend concentrated on this provider

    // Chapter distribution
    chapters: { name: string; total: number }[];
}

export interface ProviderRankingAnalytics {
    providers: ProviderRankingEntry[];
    totalGlobalSpend: number;
    topProviderRiskPercent: number; // Concentration risk: % of spend on top provider
}

// ---- Budget Accuracy ----

export interface BudgetAccuracyEntry {
    projectId: string;
    projectName: string;
    status: string;
    type?: string;          // 'renovation' | 'new_build' | 'quick'
    estimated: number;
    real: number;
    deviationPercent: number;
    phaseAccuracies: {
        name: string;
        estimated: number;
        real: number;
        deviationPercent: number;
    }[];
}

export interface BudgetAccuracyAnalytics {
    entries: BudgetAccuracyEntry[];
    avgDeviationPercent: number;
    medianDeviationPercent: number;
    bestProject: { name: string; deviation: number } | null;
    worstProject: { name: string; deviation: number } | null;

    // Chapter-level aggregation
    chapterAccuracies: {
        chapter: string;
        avgDeviation: number;
        count: number;
    }[];
}

// ---- Service ----

const MONTH_LABELS: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

export class AnalyticsService {

    /**
     * Computes detailed analytics for a single project.
     */
    getProjectAnalytics(project: Project, expenses: Expense[]): ProjectAnalytics {
        const validatedExpenses = expenses.filter(e => e.status === 'validada');
        const realCost = validatedExpenses.reduce((acc, e) => acc + e.total, 0);

        // Days elapsed since start
        const startDate = project.startDate ? new Date(project.startDate) : project.createdAt;
        const now = new Date();
        const daysElapsed = Math.max(1, Math.ceil((now.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));

        const dailyBurnRate = realCost / daysElapsed;

        // Projected cost (if we have an end date)
        let projectedTotalCost = realCost;
        if (project.estimatedEndDate) {
            const totalDays = Math.max(1, Math.ceil((new Date(project.estimatedEndDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));
            projectedTotalCost = dailyBurnRate * totalDays;
        }

        // Phase comparisons
        const phaseComparisons: PhaseComparison[] = project.phases.map(phase => {
            const deviation = phase.realCost - phase.estimatedCost;
            const deviationPercent = phase.estimatedCost > 0
                ? (deviation / phase.estimatedCost) * 100
                : 0;

            return {
                phaseId: phase.id,
                name: phase.name,
                estimatedCost: phase.estimatedCost,
                realCost: phase.realCost,
                deviation,
                deviationPercent,
                progress: phase.progress,
            };
        });

        // Top providers
        const providerMap = new Map<string, { total: number; count: number }>();
        validatedExpenses.forEach(e => {
            const existing = providerMap.get(e.providerName) || { total: 0, count: 0 };
            existing.total += e.total;
            existing.count += 1;
            providerMap.set(e.providerName, existing);
        });
        const topProviders = Array.from(providerMap.entries())
            .map(([providerName, data]) => ({ providerName, ...data }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // Monthly expenses
        const monthlyExpenses = this.groupByMonth(validatedExpenses);

        const deviationPercent = project.estimatedBudget > 0
            ? ((realCost - project.estimatedBudget) / project.estimatedBudget) * 100
            : 0;

        return {
            projectId: project.id,
            projectName: project.name,
            status: project.status,
            estimatedBudget: project.estimatedBudget,
            realCost,
            grossMargin: project.estimatedBudget - realCost,
            deviationPercent,
            daysElapsed,
            dailyBurnRate,
            projectedTotalCost,
            phaseComparisons,
            topProviders,
            monthlyExpenses,
            totalExpenses: expenses.length,
            pendingExpenses: expenses.filter(e => e.status === 'pendiente').length,
            validatedExpenses: validatedExpenses.length,
        };
    }

    /**
     * Computes global analytics across all projects.
     */
    getGlobalAnalytics(projects: Project[], allExpenses: Expense[]): GlobalAnalytics {
        const validatedExpenses = allExpenses.filter(e => e.status === 'validada');

        const totalBilled = projects.reduce((acc, p) => acc + p.estimatedBudget, 0);
        const totalExpensesAmount = validatedExpenses.reduce((acc, e) => acc + e.total, 0);
        const netProfit = totalBilled - totalExpensesAmount;
        const profitMargin = totalBilled > 0 ? (netProfit / totalBilled) * 100 : 0;

        // VAT
        const vatPaid = validatedExpenses.reduce((acc, e) => acc + e.taxAmount, 0);
        // Approximate VAT collected from budgets (21% is standard)
        const vatCollected = projects.reduce((acc, p) => acc + (p.estimatedBudget * 0.21 / 1.21), 0);

        // Projects by status
        const projectsByStatus: Record<string, number> = {};
        projects.forEach(p => {
            projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
        });

        // Per-project summaries
        const projectSummaries = projects.map(p => {
            const projectExpenses = validatedExpenses.filter(e => e.projectId === p.id);
            const real = projectExpenses.reduce((acc, e) => acc + e.total, 0);
            const deviationPercent = p.estimatedBudget > 0
                ? ((real - p.estimatedBudget) / p.estimatedBudget) * 100
                : 0;

            return {
                id: p.id,
                name: p.name,
                status: p.status,
                estimated: p.estimatedBudget,
                real,
                deviationPercent,
            };
        });

        const monthlyExpenses = this.groupByMonth(validatedExpenses);

        return {
            totalBilled,
            totalExpenses: totalExpensesAmount,
            netProfit,
            profitMargin,
            vatCollected,
            vatPaid,
            vatBalance: vatCollected - vatPaid,
            totalProjects: projects.length,
            projectsByStatus,
            projectSummaries,
            monthlyExpenses,
        };
    }

    /**
     * Groups expenses by month for chart data.
     */
    private groupByMonth(expenses: Expense[]): MonthlyExpense[] {
        const map = new Map<string, { total: number; count: number }>();

        expenses.forEach(e => {
            const date = e.invoiceDate ? new Date(e.invoiceDate) : new Date(e.createdAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${month}`;

            const existing = map.get(key) || { total: 0, count: 0 };
            existing.total += e.total;
            existing.count += 1;
            map.set(key, existing);
        });

        return Array.from(map.entries())
            .map(([month, data]) => ({
                month,
                label: `${MONTH_LABELS[month.split('-')[1]]} ${month.split('-')[0]}`,
                ...data,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    // ====================================================================
    // ADVANCED ANALYTICS
    // ====================================================================

    /**
     * Earned Value Management (EVM) for a single project.
     * Computes SPI, CPI, EAC, and Curva S data points.
     */
    getEVMAnalytics(project: Project, expenses: Expense[]): EVMAnalytics {
        const validatedExpenses = expenses.filter(e => e.status === 'validada');
        const budget = project.estimatedBudget;

        const startDate = project.startDate ? new Date(project.startDate) : new Date(project.createdAt);
        const now = new Date();
        const endDate = project.estimatedEndDate ? new Date(project.estimatedEndDate) : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        const totalDuration = Math.max(1, endDate.getTime() - startDate.getTime());
        const elapsed = Math.max(0, now.getTime() - startDate.getTime());
        const progressRatio = Math.min(1, elapsed / totalDuration);

        // Current values
        const currentPV = budget * progressRatio; // Planned Value
        const currentEV = project.phases.reduce((acc, p) => acc + (p.progress / 100) * p.estimatedCost, 0); // Earned Value
        const currentAC = validatedExpenses.reduce((acc, e) => acc + e.total, 0); // Actual Cost

        // Indices
        const spi = currentPV > 0 ? currentEV / currentPV : 1;
        const cpi = currentAC > 0 ? currentEV / currentAC : 1;

        // Forecasts
        const eac = cpi > 0 ? budget / cpi : budget;
        const etc = Math.max(0, eac - currentAC);
        const vac = budget - eac;

        // Status interpretation
        const spiStatus: EVMAnalytics['spiStatus'] = spi > 1.05 ? 'ahead' : spi < 0.95 ? 'behind' : 'on_track';
        const cpiStatus: EVMAnalytics['cpiStatus'] = cpi > 1.05 ? 'under_budget' : cpi < 0.95 ? 'over_budget' : 'on_budget';

        // Build Curva S data points (month by month)
        const curvaS: EVMDataPoint[] = [];
        const monthlyExpenses = this.groupByMonth(validatedExpenses);

        // Generate monthly PV points from start to end
        const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        let currentMonth = new Date(startMonth);
        let cumulativePV = 0;
        let cumulativeAC = 0;

        while (currentMonth <= endMonth && currentMonth <= now) {
            const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = `${MONTH_LABELS[String(currentMonth.getMonth() + 1).padStart(2, '0')]} ${currentMonth.getFullYear()}`;

            // PV: Linear distribution of budget over time
            const monthElapsed = Math.max(0, currentMonth.getTime() - startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            cumulativePV = Math.min(budget, budget * (monthElapsed / totalDuration));

            // AC: Actual expenses in this month
            const monthExpense = monthlyExpenses.find(m => m.month === monthKey);
            if (monthExpense) cumulativeAC += monthExpense.total;

            // EV: Approximate as proportional to phase progress at that point
            // Simplified: interpolate between 0 and current EV
            const monthProgress = Math.min(1, monthElapsed / totalDuration);
            const estimatedEV = currentEV * (monthProgress / progressRatio || 0);

            curvaS.push({
                date: monthKey,
                label: monthLabel,
                plannedValue: Math.round(cumulativePV),
                earnedValue: Math.round(Math.min(estimatedEV, budget)),
                actualCost: Math.round(cumulativeAC),
            });

            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }

        return {
            projectId: project.id,
            projectName: project.name,
            spi: Math.round(spi * 100) / 100,
            cpi: Math.round(cpi * 100) / 100,
            eac: Math.round(eac),
            etc: Math.round(etc),
            vac: Math.round(vac),
            spiStatus,
            cpiStatus,
            curvaS,
            currentPV: Math.round(currentPV),
            currentEV: Math.round(currentEV),
            currentAC: Math.round(currentAC),
            estimatedBudget: budget,
        };
    }

    /**
     * Global provider ranking across all projects.
     */
    getProviderRanking(projects: Project[], allExpenses: Expense[]): ProviderRankingAnalytics {
        const validatedExpenses = allExpenses.filter(e => e.status === 'validada');
        const totalGlobalSpend = validatedExpenses.reduce((acc, e) => acc + e.total, 0);

        // Build provider map
        const providerMap = new Map<string, {
            providerId?: string;
            cif?: string;
            totalSpent: number;
            invoiceCount: number;
            projectIds: Set<string>;
            chapters: Map<string, number>;
        }>();

        validatedExpenses.forEach(e => {
            const key = e.providerName;
            const existing = providerMap.get(key) || {
                providerId: e.providerId,
                cif: e.providerCif,
                totalSpent: 0,
                invoiceCount: 0,
                projectIds: new Set<string>(),
                chapters: new Map<string, number>(),
            };

            existing.totalSpent += e.total;
            existing.invoiceCount += 1;
            existing.projectIds.add(e.projectId);

            // Chapter distribution from invoice lines
            e.lines.forEach(line => {
                const chapter = line.budgetChapter || line.suggestedChapter || 'Sin capítulo';
                existing.chapters.set(chapter, (existing.chapters.get(chapter) || 0) + line.total);
            });

            providerMap.set(key, existing);
        });

        // Build project name lookup
        const projectNameMap = new Map(projects.map(p => [p.id, p.name]));

        const providers: ProviderRankingEntry[] = Array.from(providerMap.entries())
            .map(([providerName, data]) => ({
                providerId: data.providerId,
                providerName,
                cif: data.cif,
                totalSpent: data.totalSpent,
                invoiceCount: data.invoiceCount,
                projectCount: data.projectIds.size,
                projectNames: Array.from(data.projectIds).map(id => projectNameMap.get(id) || id),
                avgInvoiceAmount: data.invoiceCount > 0 ? data.totalSpent / data.invoiceCount : 0,
                riskPercent: totalGlobalSpend > 0 ? (data.totalSpent / totalGlobalSpend) * 100 : 0,
                chapters: Array.from(data.chapters.entries())
                    .map(([name, total]) => ({ name, total }))
                    .sort((a, b) => b.total - a.total),
            }))
            .sort((a, b) => b.totalSpent - a.totalSpent);

        const topProviderRiskPercent = providers.length > 0 ? providers[0].riskPercent : 0;

        return { providers, totalGlobalSpend, topProviderRiskPercent };
    }

    /**
     * Budget accuracy analysis across all projects (historical learning).
     */
    getBudgetAccuracy(projects: Project[], allExpenses: Expense[]): BudgetAccuracyAnalytics {
        const validatedExpenses = allExpenses.filter(e => e.status === 'validada');

        // Only analyze projects with real costs (exclude brand-new ones)
        const relevantProjects = projects.filter(p => {
            const realCost = validatedExpenses
                .filter(e => e.projectId === p.id)
                .reduce((acc, e) => acc + e.total, 0);
            return realCost > 0 && p.estimatedBudget > 0;
        });

        const entries: BudgetAccuracyEntry[] = relevantProjects.map(p => {
            const projectExpenses = validatedExpenses.filter(e => e.projectId === p.id);
            const real = projectExpenses.reduce((acc, e) => acc + e.total, 0);
            const deviationPercent = (real - p.estimatedBudget) / p.estimatedBudget * 100;

            const phaseAccuracies = p.phases
                .filter(ph => ph.estimatedCost > 0 || ph.realCost > 0)
                .map(ph => ({
                    name: ph.name,
                    estimated: ph.estimatedCost,
                    real: ph.realCost,
                    deviationPercent: ph.estimatedCost > 0
                        ? ((ph.realCost - ph.estimatedCost) / ph.estimatedCost) * 100
                        : 0,
                }));

            return {
                projectId: p.id,
                projectName: p.name,
                status: p.status,
                estimated: p.estimatedBudget,
                real,
                deviationPercent,
                phaseAccuracies,
            };
        });

        // Aggregate stats
        const deviations = entries.map(e => e.deviationPercent);
        const avgDeviationPercent = deviations.length > 0
            ? deviations.reduce((a, b) => a + b, 0) / deviations.length
            : 0;

        const sorted = [...deviations].sort((a, b) => a - b);
        const medianDeviationPercent = sorted.length > 0
            ? sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                : sorted[Math.floor(sorted.length / 2)]
            : 0;

        const bestProject = entries.length > 0
            ? entries.reduce((best, e) => Math.abs(e.deviationPercent) < Math.abs(best.deviationPercent) ? e : best)
            : null;
        const worstProject = entries.length > 0
            ? entries.reduce((worst, e) => Math.abs(e.deviationPercent) > Math.abs(worst.deviationPercent) ? e : worst)
            : null;

        // Chapter-level aggregation (across all projects)
        const chapterMap = new Map<string, { total: number; count: number }>();
        entries.forEach(entry => {
            entry.phaseAccuracies.forEach(phase => {
                const existing = chapterMap.get(phase.name) || { total: 0, count: 0 };
                existing.total += phase.deviationPercent;
                existing.count += 1;
                chapterMap.set(phase.name, existing);
            });
        });

        const chapterAccuracies = Array.from(chapterMap.entries())
            .map(([chapter, data]) => ({
                chapter,
                avgDeviation: data.count > 0 ? data.total / data.count : 0,
                count: data.count,
            }))
            .sort((a, b) => Math.abs(b.avgDeviation) - Math.abs(a.avgDeviation));

        return {
            entries,
            avgDeviationPercent,
            medianDeviationPercent,
            bestProject: bestProject ? { name: bestProject.projectName, deviation: bestProject.deviationPercent } : null,
            worstProject: worstProject ? { name: worstProject.projectName, deviation: worstProject.deviationPercent } : null,
            chapterAccuracies,
        };
    }
}
