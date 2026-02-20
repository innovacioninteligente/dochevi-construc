/**
 * Represents a single line item within an invoice/expense.
 * Can be linked to a budget chapter / project phase for cost tracking.
 */
export interface InvoiceLine {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;

    // Budget linkage (for Estimado vs Real comparison)
    budgetChapter?: string;    // Name of the budget chapter (e.g. "Albañilería")
    phaseId?: string;          // Link to ProjectPhase.id for realCost accumulation

    // AI suggestion (when extracted by AI)
    suggestedChapter?: string; // AI-suggested chapter, pending user confirmation
}
