import { NextRequest, NextResponse } from 'next/server';
import { clientRequirementsFlow } from '@/backend/ai/flows/client-requirements.flow';
import { generateBudgetFlow } from '@/backend/ai/flows/budget/generate-budget.flow';
import { BudgetNarrativeBuilder } from '@/backend/budget/domain/budget-narrative-builder';
import { DetailedFormValues } from '@/components/budget-request/schema';

/**
 * Dev Chat API Endpoint
 * 
 * This endpoint allows the CLI tool to interact with the AI flows.
 * Only available in development mode.
 */

export async function POST(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { action, message, history, requirements } = body;

        if (action === 'message') {
            // Process chat message
            const result = await clientRequirementsFlow({
                userMessage: message,
                history: history || [],
                currentRequirements: requirements || {},
            });

            return NextResponse.json(result);

        } else if (action === 'generate') {
            // Generate budget
            const req = requirements as DetailedFormValues;

            // Infer generic quality from first bathroom or kitchen, default to medium
            let quality: 'basic' | 'medium' | 'premium' | 'luxury' = 'medium';
            if (req.bathrooms?.length && req.bathrooms[0].quality) quality = req.bathrooms[0].quality;
            else if (req.kitchen?.quality) quality = req.kitchen.quality;

            // Map DetailedFormValues to ProjectSpecs
            const specs: any = {
                interventionType: req.projectScope === 'integral' ? 'total' : 'partial',
                propertyType: req.propertyType,
                totalArea: req.totalAreaM2,
                qualityLevel: quality,
                // Rooms only if we have details, otherwise we might just have count which this builder might not accept alone yet
                // But we can map bathrooms
                bathrooms: req.bathrooms?.map((b: any) => ({
                    area: b.floorM2 || 4, // default estimation if missing
                    quality: b.quality || quality
                })),
                kitchens: req.kitchen ? [{
                    area: req.kitchen.floorM2 || 10,
                    quality: req.kitchen.quality || quality
                }] : [],
                demolition: req.demolishPartitions,
                elevator: req.hasElevator,
                parking: false
            };

            const narrative = BudgetNarrativeBuilder.build(specs);
            const result = await generateBudgetFlow({ userRequest: narrative });

            return NextResponse.json(result);

        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[Dev Chat API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
