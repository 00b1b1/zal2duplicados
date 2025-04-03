
import localforage from 'localforage';
import { ProcessedFile } from '@/types';

// Initialize localforage
localforage.config({
  name: 'express-excel-ship',
  storeName: 'processedFiles'
});

// Save a processed file
export const saveProcessedFile = async (file: ProcessedFile): Promise<void> => {
  try {
    // Get existing files
    const files = await getProcessedFiles();
    
    // Add new file
    files.push(file);
    
    // Save back to storage
    await localforage.setItem('files', files);
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Get all processed files
export const getProcessedFiles = async (): Promise<ProcessedFile[]> => {
  try {
    const files = await localforage.getItem<ProcessedFile[]>('files');
    return files || [];
  } catch (error) {
    console.error('Error getting files:', error);
    return [];
  }
};

// Delete a processed file
export const deleteProcessedFile = async (fileId: string): Promise<void> => {
  try {
    const files = await getProcessedFiles();
    const updatedFiles = files.filter(file => file.id !== fileId);
    await localforage.setItem('files', updatedFiles);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Get a single processed file by ID
export const getProcessedFileById = async (fileId: string): Promise<ProcessedFile | null> => {
  try {
    const files = await getProcessedFiles();
    return files.find(file => file.id === fileId) || null;
  } catch (error) {
    console.error('Error getting file:', error);
    return null;
  }
};
