import { Exam } from '../models/exam';
import { totalSteps } from '../constants/exam-data';
import apiService from '../services/api';
import { ClientEncryptionService } from '../services/encryption';

// Cache for frequently accessed data
let examCache: Exam[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check if cache is valid
const isCacheValid = (): boolean => {
  return Date.now() - cacheTimestamp < CACHE_DURATION;
};

// Fetch all exams from secure backend
export const getAllExams = async (): Promise<Exam[]> => {
  try {
    // Return cached data if valid
    if (isCacheValid() && examCache.length > 0) {
      return examCache;
    }

    // Fetch encrypted exam data from backend
    const response = await apiService.getHealthData('exam');
    
    if (response.error) {
      console.error('Failed to fetch exams from backend:', response.error);
      return examCache; // Return cached data on error
    }

    // Decrypt each exam
    const decryptedExams: Exam[] = [];
    
    for (const encryptedItem of response.data?.data || []) {
      try {
        const decryptedExam = await apiService.decryptHealthData(encryptedItem);
        decryptedExams.push({
          ...decryptedExam,
          id: encryptedItem.id, // Use backend ID
          createdAt: encryptedItem.createdAt,
          updatedAt: encryptedItem.updatedAt
        });
      } catch (error) {
        console.error('Failed to decrypt exam:', error);
        // Skip corrupted data
      }
    }

    // Update cache
    examCache = decryptedExams.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    cacheTimestamp = Date.now();

    return examCache;
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    return examCache; // Return cached data on error
  }
};

// Get a single exam by ID
export const getExamById = async (id: string): Promise<Exam | null> => {
  try {
    // Check cache first
    if (isCacheValid()) {
      const cachedExam = examCache.find(exam => exam.id === id);
      if (cachedExam) {
        return cachedExam;
      }
    }

    // Fetch from backend
    const response = await apiService.getHealthDataById(id);
    
    if (response.error) {
      console.error(`Failed to fetch exam ${id}:`, response.error);
      return null;
    }

    if (!response.data) {
      return null;
    }

    // Decrypt the exam data
    const decryptedExam = await apiService.decryptHealthData(response.data);
    
    const exam: Exam = {
      ...decryptedExam,
      id: response.data.id,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt
    };

    // Update cache
    const existingIndex = examCache.findIndex(e => e.id === id);
    if (existingIndex >= 0) {
      examCache[existingIndex] = exam;
    } else {
      examCache.push(exam);
    }

    return exam;
  } catch (error) {
    console.error(`Failed to fetch exam with id ${id}:`, error);
    return null;
  }
};

// Save an exam (creates or updates)
export const saveExam = async (examToSave: Exam): Promise<void> => {
  try {
    // Prepare exam data (remove backend-specific fields)
    const examData = {
      name: examToSave.name,
      status: examToSave.status,
      completedSteps: examToSave.completedSteps,
      totalSteps: examToSave.totalSteps
    };

    let response;
    
    // Check if exam already exists in backend
    const existingExam = await getExamById(examToSave.id);
    
    if (existingExam && existingExam.createdAt) {
      // Update existing exam
      response = await apiService.updateHealthData(examToSave.id, examData, 'exam');
    } else {
      // Create new exam
      response = await apiService.createHealthData(examData, 'exam');
    }

    if (response.error) {
      throw new Error(response.error.message);
    }

    // Update the exam with backend response
    if (response.data) {
      examToSave.id = response.data.id;
      examToSave.updatedAt = response.data.updatedAt || response.data.createdAt;
      if (response.data.createdAt) {
        examToSave.createdAt = response.data.createdAt;
      }
    }

    // Update cache
    const existingIndex = examCache.findIndex(exam => exam.id === examToSave.id);
    if (existingIndex >= 0) {
      examCache[existingIndex] = examToSave;
    } else {
      examCache.push(examToSave);
    }

    // Re-sort cache
    examCache.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error('Failed to save exam:', error);
    throw error; // Re-throw to handle in UI
  }
};

// Create a new exam
export const createNewExam = async (name: string): Promise<Exam> => {
  const newExam: Exam = {
    id: '', // Will be set by backend
    name,
    status: 'in-progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedSteps: {},
    totalSteps: totalSteps,
  };
  
  await saveExam(newExam);
  return newExam;
};

// Delete an exam by ID
export const deleteExamById = async (id: string): Promise<void> => {
  try {
    const response = await apiService.deleteHealthData(id);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    // Remove from cache
    examCache = examCache.filter(exam => exam.id !== id);
    
  } catch (error) {
    console.error(`Failed to delete exam with id ${id}:`, error);
    throw error; // Re-throw to handle in UI
  }
};

// Clear cache (useful for logout)
export const clearExamCache = (): void => {
  examCache = [];
  cacheTimestamp = 0;
};

// Force refresh from backend
export const refreshExams = async (): Promise<Exam[]> => {
  clearExamCache();
  return getAllExams();
};
