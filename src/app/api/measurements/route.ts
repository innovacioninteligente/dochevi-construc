/**
 * Measurement Processing API Route
 * 
 * POST: Accepts PDF file, processes it through extraction and pricing flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { measurementPricingFlow } from '@/backend/ai/private/flows/measurements/measurement-pricing.flow';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Please upload a PDF or image.' },
                { status: 400 }
            );
        }

        // Convert to base64
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        console.log(`[API:measurements] Processing ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

        // Process through the pricing flow (which calls extraction internally)
        const result = await measurementPricingFlow({
            pdfBase64: base64,
            mimeType: file.type,
            useDeepSearch: true
        });

        return NextResponse.json({
            success: true,
            data: result,
            fileName: file.name,
        });

    } catch (error) {
        console.error('[API:measurements] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process measurements'
            },
            { status: 500 }
        );
    }
}

// Config for larger file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};
