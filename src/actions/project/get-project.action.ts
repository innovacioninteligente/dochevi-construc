'use server';

import { FirestoreProjectRepository } from '@/backend/project/infrastructure/firestore-project-repository';
import { Project } from '@/backend/project/domain/project';

const projectRepository = new FirestoreProjectRepository();

export async function getProjectAction(id: string): Promise<Project | null> {
    try {
        const project = await projectRepository.findById(id);
        if (!project) {
            console.warn(`Project not found: ${id}`);
            return null;
        }
        return project;
    } catch (error) {
        console.error(`Error fetching project ${id}:`, error);
        return null;
    }
}
