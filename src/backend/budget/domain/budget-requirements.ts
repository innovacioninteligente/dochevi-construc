
import { ProjectSpecs } from './project-specs';

/**
 * Represents the extracted requirements from the client conversation.
 * This is the intermediate state before creating a technical Budget.
 * Decoupled from Frontend Zod Schemas.
 */
export interface BudgetRequirement {
    // Metadata
    id?: string;
    leadId?: string; // Upgraded from userId
    createdAt: Date;
    status: 'gathering' | 'complete' | 'converted';

    // Core Domain Specs (can be partial during gathering)
    specs: Partial<ProjectSpecs>;

    // Qualities/Preferences (Global Override)
    targetBudget?: string;
    urgency?: string;

    // Phase 7: Aparejador Validation Logic
    projectScale?: 'minor' | 'major' | 'unknown';
    phaseChecklist?: Record<string, 'pending' | 'addressed' | 'not_applicable'>;
    isReadyForGeneration?: boolean;

    // Raw Context
    originalPrompt?: string;
    transcriptions: string[];
    attachmentUrls: string[];

    // AI Analysis (The AI's understanding)
    detectedNeeds: {
        category: string;
        description: string;
        estimatedQuantity?: number;
        unit?: string;
    }[];

    // Extraction Results
    activeBatchJobId?: string;
    completedBudgetId?: string;
    completedBudgetTotal?: number;
    completedBudgetItems?: number;
}
