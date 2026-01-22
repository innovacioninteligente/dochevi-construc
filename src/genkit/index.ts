
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import { firebase } from '@genkit-ai/firebase';

export const ai = genkit({
    plugins: [
        googleAI(),
        // firebase(), // Temporarily disabled due to import error // Temporarily disabled due to import error
    ],
    model: 'googleai/gemini-2.0-flash', // Switched to 2.0-flash for speed/reliability
});
