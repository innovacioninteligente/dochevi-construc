
import { adminFirestore } from '@/backend/shared/infrastructure/firebase/admin-app';
import { FieldValue } from 'firebase-admin/firestore';

const RATE_LIMIT_COLLECTION = 'rate_limits';

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

export class RateLimiter {
    constructor(private config: RateLimitConfig) { }

    async isAllowed(identifier: string): Promise<boolean> {
        const now = Date.now();
        const docRef = adminFirestore.collection(RATE_LIMIT_COLLECTION).doc(identifier);

        try {
            const doc = await docRef.get();

            if (!doc.exists) {
                await docRef.set({
                    count: 1,
                    windowStart: now,
                    expireAt: now + this.config.windowMs // for cleanup
                });
                return true;
            }

            const data = doc.data();
            const windowStart = data?.windowStart || now;

            if (now - windowStart > this.config.windowMs) {
                // Window expired, reset
                await docRef.set({
                    count: 1,
                    windowStart: now,
                    expireAt: now + this.config.windowMs
                });
                return true;
            }

            if (data?.count >= this.config.maxRequests) {
                return false;
            }

            // Increment
            await docRef.update({
                count: FieldValue.increment(1)
            });
            return true;

        } catch (error) {
            console.error('Rate limiter error:', error);
            // Fail open if database error to avoid blocking valid traffic due to infra issues
            return true;
        }
    }
}

// Default limiter: 10 requests per minute per IP/User for expensive AI actions
export const aiRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10
});
