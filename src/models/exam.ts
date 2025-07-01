export interface ExamStepState {
  [stepId: string]: boolean;
}

export interface Exam {
  id: string; // Unique ID, typically a timestamp
  status: 'in-progress' | 'completed';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  completedSteps: ExamStepState;
  totalSteps: number;
}
