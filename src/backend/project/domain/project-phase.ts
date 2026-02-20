/**
 * Represents a phase/milestone within a construction project.
 * Usually generated from budget chapters (capítulos).
 */
export type PhaseStatus = 'pendiente' | 'en_progreso' | 'completada';

export interface ProjectPhase {
    id: string;
    name: string;          // e.g. "Albañilería", "Fontanería" (from budget chapter)
    order: number;

    // Status
    status: PhaseStatus;
    progress: number;      // 0-100

    // Timeline
    estimatedStartDate?: Date;
    estimatedEndDate?: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;

    // Financial
    estimatedCost: number; // From budget chapter total
    realCost: number;      // Accumulated from invoices

    // Notes
    notes?: string;
}
