/**
 * Represents a team member assigned to a construction project.
 */
export type TeamMemberRole =
    | 'jefe_obra'
    | 'operario'
    | 'subcontrata'
    | 'arquitecto'
    | 'aparejador'
    | 'otro';

export interface ProjectTeamMember {
    id: string;
    name: string;
    role: TeamMemberRole;

    // Contact
    phone?: string;
    email?: string;

    // Subcontractor info
    company?: string;

    // Assigned phases (IDs)
    assignedPhases: string[];
}
