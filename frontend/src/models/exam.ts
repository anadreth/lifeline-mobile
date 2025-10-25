import { Conversation } from '../lib/conversations';

export interface ExamStepState {
  [stepId: string]: boolean;
}

export interface Exam {
  id: string; // Unique ID, typically a timestamp
  name: string; // User-defined name for the examination
  status: 'in-progress' | 'completed';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  completedSteps: ExamStepState;
  totalSteps: number;
  conversation?: Conversation[];
}
