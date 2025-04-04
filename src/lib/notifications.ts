
import localforage from 'localforage';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

// Initialize localforage for notifications
localforage.config({
  name: 'express-excel-ship-notifications',
  storeName: 'notifications',
  driver: [
    localforage.INDEXEDDB,
    localforage.WEBSQL,
    localforage.LOCALSTORAGE
  ]
});

// Save a new notification
export const saveNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> => {
  try {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString()
    };
    
    // Get existing notifications
    const notifications = await getNotifications();
    
    // Add new notification
    notifications.push(newNotification);
    
    // Save back to storage
    await localforage.setItem('notifications', notifications);
    
    return newNotification;
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
};

// Get all notifications
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const notifications = await localforage.getItem<Notification[]>('notifications');
    return notifications || [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notifications = await getNotifications();
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId ? { ...notification, read: true } : notification
    );
    await localforage.setItem('notifications', updatedNotifications);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const notifications = await getNotifications();
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    await localforage.setItem('notifications', updatedNotifications);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notifications = await getNotifications();
    const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);
    await localforage.setItem('notifications', updatedNotifications);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Create a notification with featured day information when available
export const createFileNotification = async (fileName: string, uploadedBy: string, days: string[]): Promise<void> => {
  try {
    // Check if there's a featured day for this file
    const { data, error } = await supabase
      .from('featured_days')
      .select('*')
      .eq('file_id', fileName)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is the error for no rows returned
      console.error('Error fetching featured day:', error);
    }
    
    let message = `${uploadedBy} ha subido un archivo "${fileName}" para los días: ${days.join(', ')}`;
    
    // If there's a featured day, highlight it in the notification
    if (data) {
      const { day, day_of_week } = data;
      message = `${uploadedBy} ha subido un archivo "${fileName}" destacando el día ${day} (${day_of_week})`;
    }
    
    await saveNotification({
      title: 'Nuevo archivo de pedidos disponible',
      message,
      type: 'info'
    });
  } catch (error) {
    console.error('Error creating file notification:', error);
  }
};
