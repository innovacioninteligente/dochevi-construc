
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

async function listModels() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
        console.error("GOOGLE_GENAI_API_KEY is not set");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // Note: The specific method to list models might depend on the SDK version.
        // In newer SDKs: genAI.getGenerativeModel is for inference.
        // Management API is often separate or via a specific manager.
        // Let's try to infer if there's a model listing capability or check via REST if SDK lacks it in this version.
        // Actually, usually it's genAI.makeRequest or similar, but let's try a direct fetch which is safer.

        // Using direct REST API to list models
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods?.join(', ')})`);
            });
        } else {
            console.error("Failed to list models:", data);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
