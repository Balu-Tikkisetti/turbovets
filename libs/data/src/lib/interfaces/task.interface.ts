export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'to-do' | 'started' | 'ongoing' | 'completed';
    category: 'work' | 'personal';
    priority: 'critical' | 'high' | 'medium' | 'low';
    department?: string;
    startDate?: Date;
    startTime?: string;
    dueDate?: Date;
    dueTime?: string;
    recurring: boolean;
    assigneeId?: string;
    creatorId: string;
    createdAt: Date;
    updatedAt: Date;
}

// Alias for compatibility
export type TaskInterface = Task;