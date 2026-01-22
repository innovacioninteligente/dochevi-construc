export interface PendingPriceItem {
    id: string; // generated UUID
    searchQuery: string;
    suggestedDescription: string;
    suggestedPrice: number;
    suggestedUnit: string;
    sourceUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    originalUserRequestId?: string; // linkage for analytics
}

export interface PendingPriceItemRepository {
    create(item: PendingPriceItem): Promise<void>;
    findAllPending(): Promise<PendingPriceItem[]>;
    updateStatus(id: string, status: 'approved' | 'rejected'): Promise<void>;
}
