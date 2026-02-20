
export interface RoomSpecs {
    area: number;
    height?: number; // default 2.5
    perimeter?: number;
    windowCount?: number;
    doorCount?: number;
}

export interface BathroomSpecs {
    area: number;
    hasShower?: boolean;
    hasBathtub?: boolean;
    tilingHeight?: number; // 2.5 full, 1.2 half
    quality: 'basic' | 'medium' | 'premium';
}

export interface KitchenSpecs {
    area: number;
    island?: boolean;
    lShape?: boolean;
    quality: 'basic' | 'medium' | 'premium';
}

export interface ProjectSpecs {
    propertyType: 'flat' | 'house' | 'office';
    interventionType: 'total' | 'partial' | 'new_build';
    totalArea: number;

    // Detailed room breakdowns
    rooms?: RoomSpecs[];
    bathrooms?: BathroomSpecs[];
    kitchens?: KitchenSpecs[];

    // General qualities
    qualityLevel: 'basic' | 'medium' | 'premium' | 'luxury';

    // Specific needs (flags)
    demolition?: boolean;
    elevator?: boolean;
    parking?: boolean;

    // User provided context
    description?: string;
    files?: string[];
}
