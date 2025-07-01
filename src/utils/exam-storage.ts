import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exam } from '../models/exam';
import { totalSteps } from '../constants/exam-data';

const EXAMS_STORAGE_KEY = 'lifeline_exams';

// Fetch all exams
export const getAllExams = async (): Promise<Exam[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(EXAMS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to fetch exams.', e);
    return [];
  }
};

// Get a single exam by ID
export const getExamById = async (id: string): Promise<Exam | null> => {
  try {
    const allExams = await getAllExams();
    return allExams.find(exam => exam.id === id) || null;
  } catch (e) {
    console.error(`Failed to fetch exam with id ${id}.`, e);
    return null;
  }
};

// Save an exam (creates or updates)
export const saveExam = async (examToSave: Exam): Promise<void> => {
  try {
    const allExams = await getAllExams();
    const index = allExams.findIndex(exam => exam.id === examToSave.id);
    if (index !== -1) {
      allExams[index] = examToSave; // Update existing
    } else {
      allExams.push(examToSave); // Add new
    }
    const jsonValue = JSON.stringify(allExams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    await AsyncStorage.setItem(EXAMS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save exam.', e);
  }
};

// Create a new exam
export const createNewExam = async (): Promise<Exam> => {
  const newExam: Exam = {
    id: new Date().toISOString(), // Unique ID based on timestamp
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
    const allExams = await getAllExams();
    const updatedExams = allExams.filter(exam => exam.id !== id);
    const jsonValue = JSON.stringify(updatedExams);
    await AsyncStorage.setItem(EXAMS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error(`Failed to delete exam with id ${id}.`, e);
  }
};
