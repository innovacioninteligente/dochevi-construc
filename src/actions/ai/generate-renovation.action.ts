'use server';

import { generateRenderFlow } from '@/backend/ai/private/flows/renovation/generate-render.flow';

interface GenerateRenovationParams {
    imageBuffers: string[]; // Base64 input array from client
    style: string;
    roomType: string;
    budgetId: string;
    additionalRequirements?: string;
}

export async function generateRenovationAction({
    imageBuffers,
    style,
    roomType,
    budgetId,
    additionalRequirements
}: GenerateRenovationParams) {
    try {
        // 1. Call AI Flow
        const result = await generateRenderFlow({
            imageBuffers,
            style,
            roomType,
            additionalRequirements
        });

        if (!result.generatedImage) {
            return { success: false, error: "Failed to generate image" };
        }

        // 2. Return Base64 to Client (Client will handle Storage Upload)
        return {
            success: true,
            base64: result.generatedImage
        };

    } catch (error) {
        console.error("Error in generateRenovationAction:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
