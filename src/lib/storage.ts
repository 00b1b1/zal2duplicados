
import localforage from 'localforage';
import { ProcessedFile } from '@/types';
import { createFileNotification } from './notifications';

// Initialize localforage with a global namespace
localforage.config({
  name: 'express-excel-ship-global',
  storeName: 'processedFiles',
  driver: [
    localforage.INDEXEDDB,
    localforage.WEBSQL,
    localforage.LOCALSTORAGE
  ]
});

// Save a processed file and create notification
export const saveProcessedFile = async (file: ProcessedFile): Promise<void> => {
  try {
    // Get existing files
    const files = await getProcessedFiles();
    
    // Check if file with same name already exists
    const existingFileIndex = files.findIndex(f => f.fileName === file.fileName);
    
    if (existingFileIndex !== -1) {
      // Update existing file
      files[existingFileIndex] = file;
    } else {
      // Add new file
      files.push(file);
      
      // Create enhanced notification for new file
      await createFileNotification(file.fileName, file.uploadedBy, file.days);
    }
    
    // Save back to storage with global setting
    await localforage.setItem('global_files', files);
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Get all processed files
export const getProcessedFiles = async (): Promise<ProcessedFile[]> => {
  try {
    // First try to get files from the new global location
    let files = await localforage.getItem<ProcessedFile[]>('global_files');
    
    // If no files found in global location, try the old location
    if (!files) {
      files = await localforage.getItem<ProcessedFile[]>('files');
      
      // If files found in old location, migrate them to the global location
      if (files && files.length > 0) {
        await localforage.setItem('global_files', files);
        console.log('Migrated files to global storage');
      } else {
        files = [];
      }
    }
    
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
    await localforage.setItem('global_files', updatedFiles);
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
