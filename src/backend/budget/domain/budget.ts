import { ProjectSpecs } from './project-specs';
import { PersonalInfo } from '@/backend/lead/domain/lead';

export type BudgetLineItemType = 'PARTIDA' | 'MATERIAL';

export interface BudgetPartida {
  type: 'PARTIDA';
  id: string;
  order: number;
  code: string; // From PriceBook
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number; // Includes labor + materials
  totalPrice: number;
  originalTask?: string; // The user intent that generated this
  note?: string;
  isEstimate?: boolean;
  isRealCost?: boolean; // True if recalculated by Construction Analyst
  matchConfidence?: number; // 0-100 Score from Vector Search
  breakdown?: BudgetBreakdownComponent[]; // Detailed cost structure
  relatedMaterial?: {
    sku: string;
    name: string;
    merchant: string;
    unitPrice: number;
    url?: string;
  };
}

export interface BudgetBreakdownComponent {
  code?: string;
  concept: string; // e.g. "Mano de obra", "Material: Keraben Forest"
  type: 'LABOR' | 'MATERIAL' | 'MACHINERY' | 'OTHER';
  price: number; // Unit price of this component
  yield?: number; // Rendimiento (e.g. 0.05 h/m2)
  waste?: number; // Merma % (only for materials)
  total: number; // price * yield * (1+waste)
  isSubstituted?: boolean; // True if this component was swapped by AI
}

export interface BudgetMaterial {
  type: 'MATERIAL';
  id: string;
  order: number;
  sku: string; // From MaterialCatalog (e.g. Obramat)
  name: string;
  description: string;
  merchant: string;
  unit: string;
  quantity: number;
  unitPrice: number; // Product cost only
  totalPrice: number;
  deliveryTime?: string;
  originalTask?: string;
  note?: string;
  isEstimate?: boolean;
}

export type BudgetLineItem = BudgetPartida | BudgetMaterial;

export interface BudgetChapter {
  id: string;
  name: string; // e.g. "01. Demoliciones"
  order: number;
  items: BudgetLineItem[];
  totalPrice: number;
}

export interface BudgetCostBreakdown {
  materialExecutionPrice: number; // PEM (Sum of chapters)
  overheadExpenses: number; // Gastos Generales (e.g. 13%)
  industrialBenefit: number; // Beneficio Industrial (e.g. 6%)
  tax: number; // IVA
  globalAdjustment: number;
  total: number; // PEC + IVA
}

/**
 * Represents the core Budget entity in the domain layer.
 * Now supports Chapters and Distinct Item Types.
 */
export interface Budget {
  id: string;

  // Owner Reference (Linked to Lead Module)
  leadId: string;

  // Snapshot of client data at budget creation time (Immutable record)
  clientSnapshot: PersonalInfo;

  // Metadata
  status: 'draft' | 'pending_review' | 'approved' | 'sent';
  createdAt: Date;
  updatedAt: Date;
  version: number;
  type?: 'renovation' | 'quick' | 'new_build';

  // Domain Project Data
  specs: ProjectSpecs;

  // Structure
  chapters: BudgetChapter[];

  // Financials
  costBreakdown: BudgetCostBreakdown;
  totalEstimated: number; // Deprecated, use costBreakdown.total

  // Origin & Metadata
  source?: 'wizard' | 'pdf_measurement' | 'manual';
  pricingMetadata?: {
    uploadedFileName?: string;
    pageCount?: number;
    extractionConfidence?: number;
  };

  // Quick Consultation Response
  quickQuote?: {
    price: number;
    message: string;
    answeredAt: Date;
  };

  // AI Renders
  renders?: BudgetRender[];
}

export interface BudgetRender {
  id: string;
  url: string;
  originalUrl?: string;
  prompt: string;
  style: string;
  roomType: string;
  createdAt: Date;
}

/**
 * Represents a repository interface for budget data persistence.
 */
export interface BudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findByLeadId(leadId: string): Promise<Budget[]>;
  findAll(): Promise<Budget[]>;
  save(budget: Budget): Promise<void>;
  delete(id: string): Promise<void>;
}
