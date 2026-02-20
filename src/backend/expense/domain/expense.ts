import { InvoiceLine } from '@/backend/expense/domain/invoice-line';

// --- Status Machine ---
export type ExpenseStatus = 'pendiente' | 'validada' | 'rechazada';

export const EXPENSE_STATUS_TRANSITIONS: Record<ExpenseStatus, ExpenseStatus[]> = {
    pendiente: ['validada', 'rechazada'],
    validada: [],    // Final state (cannot undo a validated expense easily)
    rechazada: ['pendiente'], // Allow re-evaluation
};

export function isValidExpenseTransition(from: ExpenseStatus, to: ExpenseStatus): boolean {
    return EXPENSE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// --- Main Entity ---

/**
 * Represents an expense/invoice linked to a construction project (Obra).
 * Contains embedded invoice lines for cost breakdown.
 */
export interface Expense {
    id: string;

    // Linked Project
    projectId: string;

    // Provider reference
    providerId?: string;
    providerName: string;       // Snapshot for display without JOIN
    providerCif?: string;

    // Invoice data
    invoiceNumber?: string;
    invoiceDate?: Date;

    // Financial
    subtotal: number;
    taxRate: number;             // e.g. 0.21 for 21% IVA
    taxAmount: number;
    total: number;

    // Lines
    lines: InvoiceLine[];

    // Status
    status: ExpenseStatus;

    // Attachments
    pdfUrl?: string;             // Cloud Storage URL

    // AI extraction metadata
    extractionConfidence?: number; // 0-1, from AI extraction flow
    extractedByAI?: boolean;

    // Notes
    notes?: string;

    // Audit
    createdAt: Date;
    updatedAt: Date;
}

// --- Repository Interface ---

export interface ExpenseRepository {
    findById(id: string): Promise<Expense | null>;
    findByProjectId(projectId: string): Promise<Expense[]>;
    findAll(): Promise<Expense[]>;
    save(expense: Expense): Promise<void>;
    delete(id: string): Promise<void>;
}
