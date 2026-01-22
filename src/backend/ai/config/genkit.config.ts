
import { genkit } from 'genkit';
import { googleAI, textEmbedding004 } from '@genkit-ai/googleai';

/**
 * Shared Genkit Instance Configuration.
 * Initializes Genkit with Google AI plugin and exports the AI instance and Embedding Model.
 */

// Initialize Genkit
export const ai = genkit({
    plugins: [
        googleAI(), // Automatically uses GOOGLE_GENAI_API_KEY from env
    ],
    promptDir: 'src/backend/ai/prompts', // Explicitly set prompt directory
});

// Export the Embedding Model Reference
// We allow the deprecation warning because migrating to @genkit-ai/google-genai requires package changes.
// Using the object reference ensures runtime compatibility with the installed version.
export const embeddingModel = textEmbedding004;
