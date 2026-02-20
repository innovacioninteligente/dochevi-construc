// src/backend/budget/application/budget-service.ts
import type { Budget, BudgetRepository } from '../domain/budget';

/**
 * Application service for budget-related operations.
 */
export class BudgetService {
  private budgetRepository: BudgetRepository;

  constructor(budgetRepository: BudgetRepository) {
    this.budgetRepository = budgetRepository;
  }

  async findBudgetsForUser(userId: string): Promise<Budget[]> {
    return this.budgetRepository.findByLeadId(userId);
  }

  async createNewBudget(data: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
    const newBudget: Budget = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    await this.budgetRepository.save(newBudget);
    return newBudget;
  }
}
