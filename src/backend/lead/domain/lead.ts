
export interface PersonalInfo {
    name: string;
    email: string;
    phone: string;
    address?: string; // Added for Budget Client Snapshot
}

export interface LeadPreferences {
    contactMethod: 'whatsapp' | 'email' | 'phone';
    language: string;
}

export interface LeadVerification {
    isVerified: boolean;
    otpCode?: string;
    otpExpiresAt?: Date;
    verifiedAt?: Date;
    attempts: number;
}

/**
 * Lead Aggregate Root
 * Represents a potential client who has initiated contact.
 */
export class Lead {
    constructor(
        public readonly id: string,
        public readonly personalInfo: PersonalInfo,
        public readonly preferences: LeadPreferences,
        public verification: LeadVerification,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) { }

    static create(id: string, info: PersonalInfo, preferences: LeadPreferences): Lead {
        return new Lead(
            id,
            info,
            preferences,
            { isVerified: false, attempts: 0 },
            new Date(),
            new Date()
        );
    }

    // Domain Logic: Request OTP
    generateOtp(code: string, expiresInMinutes: number = 15): void {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

        this.verification = {
            ...this.verification,
            otpCode: code,
            otpExpiresAt: expiresAt,
            attempts: 0
        };
        this.updatedAt = new Date();
    }

    // Domain Logic: Verify OTP
    verifyOtp(code: string): boolean {
        if (this.verification.isVerified) return true;

        if (!this.verification.otpCode || !this.verification.otpExpiresAt) {
            return false;
        }

        if (new Date() > this.verification.otpExpiresAt) {
            return false;
        }

        if (this.verification.otpCode !== code) {
            this.verification.attempts++;
            return false;
        }

        this.verification = {
            isVerified: true,
            verifiedAt: new Date(),
            attempts: this.verification.attempts
        };
        this.updatedAt = new Date();
        return true;
    }
}
