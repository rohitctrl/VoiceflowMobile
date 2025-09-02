import AsyncStorage from '@react-native-async-storage/async-storage';
import { TranscriptionResult } from './transcriptionService';

export interface Recording {
  id: string;
  title: string;
  audioUri: string;
  transcription: TranscriptionResult;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export class StorageService {
  private static readonly RECORDINGS_KEY = 'voice_recordings';
  private static readonly SETTINGS_KEY = 'app_settings';

  // Recording management
  static async saveRecording(recording: Omit<Recording, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recording> {
    try {
      const id = Date.now().toString();
      const newRecording: Recording = {
        ...recording,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const recordings = await this.getAllRecordings();
      recordings.unshift(newRecording); // Add to beginning of array
      
      await AsyncStorage.setItem(this.RECORDINGS_KEY, JSON.stringify(recordings));
      return newRecording;
    } catch (error) {
      console.error('Error saving recording:', error);
      throw error;
    }
  }

  static async getAllRecordings(): Promise<Recording[]> {
    try {
      const recordingsJson = await AsyncStorage.getItem(this.RECORDINGS_KEY);
      if (!recordingsJson) return [];
      
      const recordings = JSON.parse(recordingsJson);
      // Convert date strings back to Date objects
      return recordings.map((recording: any) => ({
        ...recording,
        createdAt: new Date(recording.createdAt),
        updatedAt: new Date(recording.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting recordings:', error);
      return [];
    }
  }

  static async getRecording(id: string): Promise<Recording | null> {
    try {
      const recordings = await this.getAllRecordings();
      return recordings.find(r => r.id === id) || null;
    } catch (error) {
      console.error('Error getting recording:', error);
      return null;
    }
  }

  static async updateRecording(id: string, updates: Partial<Recording>): Promise<Recording | null> {
    try {
      const recordings = await this.getAllRecordings();
      const index = recordings.findIndex(r => r.id === id);
      
      if (index === -1) return null;
      
      recordings[index] = {
        ...recordings[index],
        ...updates,
        updatedAt: new Date(),
      };
      
      await AsyncStorage.setItem(this.RECORDINGS_KEY, JSON.stringify(recordings));
      return recordings[index];
    } catch (error) {
      console.error('Error updating recording:', error);
      throw error;
    }
  }

  static async deleteRecording(id: string): Promise<boolean> {
    try {
      const recordings = await this.getAllRecordings();
      const filteredRecordings = recordings.filter(r => r.id !== id);
      
      await AsyncStorage.setItem(this.RECORDINGS_KEY, JSON.stringify(filteredRecordings));
      return true;
    } catch (error) {
      console.error('Error deleting recording:', error);
      return false;
    }
  }

  static async searchRecordings(query: string): Promise<Recording[]> {
    try {
      const recordings = await this.getAllRecordings();
      const lowerQuery = query.toLowerCase();
      
      return recordings.filter(recording => 
        recording.title.toLowerCase().includes(lowerQuery) ||
        recording.transcription.text.toLowerCase().includes(lowerQuery) ||
        recording.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Error searching recordings:', error);
      return [];
    }
  }

  // Settings management
  static async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      const parsedSettings = settings ? JSON.parse(settings) : {};
      return parsedSettings[key] ?? defaultValue;
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  }

  static async setSetting<T>(key: string, value: T): Promise<void> {
    try {
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      const parsedSettings = settings ? JSON.parse(settings) : {};
      
      parsedSettings[key] = value;
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(parsedSettings));
    } catch (error) {
      console.error('Error setting setting:', error);
      throw error;
    }
  }

  // Utility functions
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.RECORDINGS_KEY, this.SETTINGS_KEY]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  static async getStorageSize(): Promise<{ recordings: number; total: number }> {
    try {
      const recordings = await AsyncStorage.getItem(this.RECORDINGS_KEY);
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      
      const recordingsSize = recordings ? JSON.stringify(recordings).length : 0;
      const settingsSize = settings ? JSON.stringify(settings).length : 0;
      
      return {
        recordings: recordingsSize,
        total: recordingsSize + settingsSize,
      };
    } catch (error) {
      console.error('Error getting storage size:', error);
      return { recordings: 0, total: 0 };
    }
  }

  // Helper function to generate titles
  static generateTitle(transcriptionText: string): string {
    // Extract first sentence or first 50 characters as title
    const firstSentence = transcriptionText.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 0 && firstSentence.length <= 50) {
      return firstSentence;
    }
    
    // Fallback to first 47 characters + "..."
    return transcriptionText.substring(0, 47) + (transcriptionText.length > 47 ? '...' : '');
  }
}