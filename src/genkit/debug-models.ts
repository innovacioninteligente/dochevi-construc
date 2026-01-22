
import 'dotenv/config';
import { ai } from './index';

async function listModels() {
    const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ No API Key found in process.env");
        return;
    }

    console.log("--- Listing Available Models via HTTP API ---");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", data.error);
            return;
        }

        if (data.models) {
            console.log(`Found ${data.models.length} models:`);
            data.models.forEach((m: any) => {
                if (m.name.includes('gemini')) {
                    console.log(` - ${m.name} (${m.displayName}) [${m.supportedGenerationMethods.join(', ')}]`);
                }
            });
        } else {
            console.log("No models returned.");
        }

    } catch (e: any) {
        console.error("❌ Fetch failed:", e.message);
    }
}

async function main() {
    await listModels();

    console.log("\n--- Testing Genkit Generation Again ---");
    // Only test if we found models? No, let's just try 1.5-flash one last time with correct logging
    try {
        // Attempting to use the string found in list or default
        const modelName = 'googleai/gemini-1.5-flash';
        console.log(`Querying ${modelName}...`);
        const res = await ai.generate({ model: modelName, prompt: 'Hi' });
        console.log("✅ Success:", res.text);
    } catch (e: any) {
        console.log("❌ Genkit Fail:", e.message);
    }
}

main();
