/**
 * Represents a provider/supplier in the system.
 * Auto-created when registering expenses, automatically enriched over time.
 */
export type ProviderCategory =
    | 'materiales'
    | 'mano_de_obra'
    | 'subcontrata'
    | 'alquiler'
    | 'otros';

export interface Provider {
    id: string;
    name: string;
    cif?: string;              // Tax ID (NIF/CIF)

    // Contact
    email?: string;
    phone?: string;
    address?: string;

    // Classification
    category?: ProviderCategory;

    // Audit
    createdAt: Date;
}

// --- Repository Interface ---

export interface ProviderRepository {
    findById(id: string): Promise<Provider | null>;
    findByCif(cif: string): Promise<Provider | null>;
    findAll(): Promise<Provider[]>;
    save(provider: Provider): Promise<void>;
}
