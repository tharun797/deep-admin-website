import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface MatchConfig {
  lastRun: Date | null;
  matchingInProgress: boolean;
  totalMatches: number;
  lastRunBy: string | null;
  // Progress tracking
  progressStatus?: 'idle' | 'initializing' | 'matching' | 'processing_unmatched' | 'finalizing' | 'completed' | 'error';
  totalUsers?: number;
  processedUsers?: number;
  matchedUsers?: number;
  unmatchedUsers?: number;
  startTime?: Date | null;
  endTime?: Date | null;
  estimatedTimeRemaining?: number; // in seconds
}

interface FirestoreMatchConfigUpdate {
  lastRun?: Timestamp | null;
  matchingInProgress?: boolean;
  totalMatches?: number;
  lastRunBy?: string | null;
  updatedAt?: ReturnType<typeof serverTimestamp>;
  // Progress tracking
  progressStatus?: 'idle' | 'initializing' | 'matching' | 'processing_unmatched' | 'finalizing' | 'completed' | 'error';
  totalUsers?: number;
  processedUsers?: number;
  matchedUsers?: number;
  unmatchedUsers?: number;
  startTime?: Timestamp | null;
  endTime?: Timestamp | null;
  estimatedTimeRemaining?: number;
}

export class MatchConfigService {
  private static readonly COLLECTION = 'appConfig';
  private static readonly DOC_ID = 'matchSettings';
  private static readonly TAG = 'MatchConfigService';

  // In-memory cache
  private static cache: MatchConfig | null = null;
  private static cacheTimestamp: number | null = null;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  /**
   * Get match configuration from cache or Firestore
   */
  static async getMatchConfig(): Promise<MatchConfig> {
    try {
      // Check if cache is valid
      if (this.cache && this.cacheTimestamp) {
        const now = Date.now();
        if (now - this.cacheTimestamp < this.CACHE_TTL) {
          console.info(`${this.TAG}: Returning cached match config`);
          return this.cache;
        }
      }

      // Fetch from Firestore
      console.info(`${this.TAG}: Fetching match config from Firestore`);
      const configRef = doc(db, this.COLLECTION, this.DOC_ID);
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        const data = configSnap.data();
        const config: MatchConfig = {
          lastRun: data.lastRun ? (data.lastRun as Timestamp).toDate() : null,
          matchingInProgress: data.matchingInProgress || false,
          totalMatches: data.totalMatches || 0,
          lastRunBy: data.lastRunBy || null,
          progressStatus: data.progressStatus || 'idle',
          totalUsers: data.totalUsers || 0,
          processedUsers: data.processedUsers || 0,
          matchedUsers: data.matchedUsers || 0,
          unmatchedUsers: data.unmatchedUsers || 0,
          startTime: data.startTime ? (data.startTime as Timestamp).toDate() : null,
          endTime: data.endTime ? (data.endTime as Timestamp).toDate() : null,
          estimatedTimeRemaining: data.estimatedTimeRemaining || 0,
        };

        // Update cache
        this.cache = config;
        this.cacheTimestamp = Date.now();

        return config;
      } else {
        // Initialize with default values
        const defaultConfig: MatchConfig = {
          lastRun: null,
          matchingInProgress: false,
          totalMatches: 0,
          lastRunBy: null,
        };

        await this.updateMatchConfig(defaultConfig);
        return defaultConfig;
      }
    } catch (error) {
      console.error(`${this.TAG}: Error fetching match config:`, error);
      throw error;
    }
  }

  /**
   * Update match configuration in Firestore and cache
   */
  static async updateMatchConfig(config: Partial<MatchConfig>): Promise<void> {
    try {
      console.info(`${this.TAG}: Updating match config`, config);
      
      const configRef = doc(db, this.COLLECTION, this.DOC_ID);
      
      const updateData: FirestoreMatchConfigUpdate = {};
      
      if (config.lastRun !== undefined) {
        updateData.lastRun = config.lastRun ? Timestamp.fromDate(config.lastRun) : null;
      }
      
      if (config.matchingInProgress !== undefined) {
        updateData.matchingInProgress = config.matchingInProgress;
      }
      
      if (config.totalMatches !== undefined) {
        updateData.totalMatches = config.totalMatches;
      }
      
      if (config.lastRunBy !== undefined) {
        updateData.lastRunBy = config.lastRunBy;
      }

      if (config.progressStatus !== undefined) {
        updateData.progressStatus = config.progressStatus;
      }

      if (config.totalUsers !== undefined) {
        updateData.totalUsers = config.totalUsers;
      }

      if (config.processedUsers !== undefined) {
        updateData.processedUsers = config.processedUsers;
      }

      if (config.matchedUsers !== undefined) {
        updateData.matchedUsers = config.matchedUsers;
      }

      if (config.unmatchedUsers !== undefined) {
        updateData.unmatchedUsers = config.unmatchedUsers;
      }

      if (config.startTime !== undefined) {
        updateData.startTime = config.startTime ? Timestamp.fromDate(config.startTime) : null;
      }

      if (config.endTime !== undefined) {
        updateData.endTime = config.endTime ? Timestamp.fromDate(config.endTime) : null;
      }

      if (config.estimatedTimeRemaining !== undefined) {
        updateData.estimatedTimeRemaining = config.estimatedTimeRemaining;
      }

      // Always update the timestamp
      updateData.updatedAt = serverTimestamp();

      await setDoc(configRef, updateData, { merge: true });

      // Invalidate cache so next read fetches fresh data
      this.invalidateCache();
      
      console.info(`${this.TAG}: Match config updated successfully`);
    } catch (error) {
      console.error(`${this.TAG}: Error updating match config:`, error);
      throw error;
    }
  }

  /**
   * Mark matching as started
   */
  static async startMatching(adminEmail: string): Promise<void> {
    await this.updateMatchConfig({
      matchingInProgress: true,
      lastRunBy: adminEmail,
      progressStatus: 'initializing',
      startTime: new Date(),
      endTime: null,
      totalUsers: 0,
      processedUsers: 0,
      matchedUsers: 0,
      unmatchedUsers: 0,
      estimatedTimeRemaining: 0,
    });
  }

  /**
   * Mark matching as completed
   */
  static async completeMatching(totalMatches: number, unmatchedCount: number): Promise<void> {
    await this.updateMatchConfig({
      matchingInProgress: false,
      lastRun: new Date(),
      totalMatches: totalMatches,
      endTime: new Date(),
      progressStatus: 'completed',
      matchedUsers: totalMatches,
      unmatchedUsers: unmatchedCount,
      estimatedTimeRemaining: 0,
    });
  }

  /**
   * Update progress during matching
   */
  static async updateProgress(progress: {
    status: 'initializing' | 'matching' | 'processing_unmatched' | 'finalizing';
    totalUsers?: number;
    processedUsers?: number;
    matchedUsers?: number;
    unmatchedUsers?: number;
    estimatedTimeRemaining?: number;
  }): Promise<void> {
    await this.updateMatchConfig({
      progressStatus: progress.status,
      ...(progress.totalUsers !== undefined && { totalUsers: progress.totalUsers }),
      ...(progress.processedUsers !== undefined && { processedUsers: progress.processedUsers }),
      ...(progress.matchedUsers !== undefined && { matchedUsers: progress.matchedUsers }),
      ...(progress.unmatchedUsers !== undefined && { unmatchedUsers: progress.unmatchedUsers }),
      ...(progress.estimatedTimeRemaining !== undefined && { estimatedTimeRemaining: progress.estimatedTimeRemaining }),
    });
  }

  // /**
  //  * Mark matching as failed
  //  */
  // static async markMatchingFailed(error: string): Promise<void> {
  //   await this.updateMatchConfig({
  //     matchingInProgress: false,
  //     endTime: new Date(),
  //     progressStatus: 'error',
  //     estimatedTimeRemaining: 0,
  //   });
  // }

  /**
   * Get the last run time
   */
  static async getLastRunTime(): Promise<Date | null> {
    const config = await this.getMatchConfig();
    return config.lastRun;
  }

  /**
   * Check if matching is currently in progress
   */
  static async isMatchingInProgress(): Promise<boolean> {
    const config = await this.getMatchConfig();
    return config.matchingInProgress;
  }

  /**
   * Invalidate the cache to force fresh fetch on next read
   */
  static invalidateCache(): void {
    console.info(`${this.TAG}: Cache invalidated`);
    this.cache = null;
    this.cacheTimestamp = null;
  }

  /**
   * Get cached config without making a Firestore call
   * Returns null if cache is not available or expired
   */
  static getCachedConfig(): MatchConfig | null {
    if (this.cache && this.cacheTimestamp) {
      const now = Date.now();
      if (now - this.cacheTimestamp < this.CACHE_TTL) {
        return this.cache;
      }
    }
    return null;
  }
}