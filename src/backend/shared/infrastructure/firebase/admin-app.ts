
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';

export function initFirebaseAdminApp(): App {
    if (getApps().length === 0) {
        // Check for Service Account in Env Vars (Local Dev)
        if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            return initializeApp({
                credential: cert({
                    projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newlines
                }),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
        }

        // Production (Vercel/Cloud Run) / Fallback (if using ADC)
        return initializeApp({
            projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID
        });
    }
    return getApps()[0];
}
