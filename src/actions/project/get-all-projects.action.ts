'use server';

import { FirestoreProjectRepository } from '@/backend/project/infrastructure/firestore-project-repository';
import { Project } from '@/backend/project/domain/project';

const projectRepository = new FirestoreProjectRepository();

export async function getAllProjectsAction(): Promise<Project[]> {
    try {
        return await projectRepository.findAll();
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}
