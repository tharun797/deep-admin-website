import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { GoogleAiService } from '../services/googleAiService';
import { GenerateGradingPrompt } from '../utils/generateGradingPrompt';
import { ImageState } from '../types';

const ALLOWED_EMAILS = ['admin@deep.com'];

export interface TierStats {
  A: number;
  B: number;
  C: number;
  D: number;
  ungraded: number;
  recentlyUpdated: number;
  failed: number;
  totalGraded: number;
}

export interface GradingProgress {
  status: 'idle' | 'initializing' | 'grading' | 'finalizing' | 'completed' | 'error';
  processed: number;
  total: number;
  startTime: Date | null;
  endTime: Date | null;
}

 const usePhotoGrading = (
  onLastRunChange?: (lastRun: string) => void,
  onDurationChange?: (duration: string) => void,
) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [tierStats, setTierStats] = useState<TierStats>({
    A: 0, B: 0, C: 0, D: 0,
    ungraded: 0, recentlyUpdated: 0, failed: 0, totalGraded: 0,
  });
  const [progress, setProgress] = useState<GradingProgress>({
    status: 'idle', processed: 0, total: 0, startTime: null, endTime: null,
  });

  // Cache ref — fetched once, won't re-fetch unless grading completes
  const statsLoadedRef = useRef<boolean>(false);

  // ─── Formatters ────────────────────────────────────────────────
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  };

  const formatDuration = (start: Date | null, end: Date | null): string => {
    if (!start || !end) return 'N/A';
    const secs = Math.round((end.getTime() - start.getTime()) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  // ─── Auth ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAdmin(!!(user?.email && ALLOWED_EMAILS.includes(user.email)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ─── Load tier stats once on mount ─────────────────────────────
  useEffect(() => {
    if (!statsLoadedRef.current) {
      loadTierStats();
    }
  }, []);

  const loadTierStats = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));

      const stats: TierStats = {
        A: 0, B: 0, C: 0, D: 0,
        ungraded: 0,
        recentlyUpdated: 0,
        failed: 0,
        totalGraded: 0,
      };

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Only count test users
        if (data.userType !== 'test') return;

        const tier = (data.tier ?? null) as 'A' | 'B' | 'C' | 'D' | null;
        const photoUpdatedAt = data.photoUpdatedAt ?? null;
        const gradingFailed = data.gradingFailed === true;

        // ── Recently Updated ──────────────────────────────────────
        // photoUpdatedAt is not null → user updated their photo after last grade
        if (photoUpdatedAt !== null) {
          stats.recentlyUpdated++;
        }

        // ── Needs Grading ─────────────────────────────────────────
        // tier is null/missing → never graded
        // photoUpdatedAt is not null → photo changed, needs re-grade
          if (gradingFailed) {
          stats.failed++;
          return;
           
        }
        if (tier === null || photoUpdatedAt !== null) {
          stats.ungraded++;
          return; // don't count in any other bucket
        }

        // ── Failed Grading ────────────────────────────────────────
        // gradingFailed is true → AI failed to grade this user
      

        // ── Tier Buckets (A / B / C / D) ─────────────────────────
        // tier exists, not failed, not needing re-grade → successfully graded
        if (['A', 'B', 'C', 'D'].includes(tier)) {
          stats[tier]++;
          stats.totalGraded++;
        }
      });

      setTierStats(stats);
      statsLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading tier stats:', error);
    }
  };

  // ─── Get images subcollection ───────────────────────────────────
  const getUserImages = async (userId: string): Promise<ImageState[]> => {
    try {
      const imagesSnapshot = await getDocs(collection(db, 'users', userId, 'images'));
      return imagesSnapshot.docs.map(d => ({
        docId: d.id,
        imagePath: d.data().imagePath || '',
        replacedImagePath: d.data().replacedImagePath || null,
        newImagePath: d.data().newImagePath || null,
      }));
    } catch (error) {
      console.error(`Error fetching images for user ${userId}:`, error);
      return [];
    }
  };

  // ─── Trigger grading ────────────────────────────────────────────
  const handleTriggerGrading = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !ALLOWED_EMAILS.includes(currentUser.email || '')) {
      alert('⚠️ Unauthorized Action\n\nOnly admins can trigger photo grading.');
      return;
    }

    setIsProcessing(true);
    const startTime = new Date();
    setProgress({ status: 'initializing', processed: 0, total: 0, startTime, endTime: null });

    try {
      const snapshot = await getDocs(collection(db, 'users'));

      // Grade: test users where tier is null/missing OR photo was updated since last grade
      const usersToGrade = snapshot.docs.filter(d => {
        const data = d.data();
        const tier = data.tier ?? null;
        const photoUpdatedAt = data.photoUpdatedAt ?? null;
        return data.userType === 'test' && (tier === null || photoUpdatedAt !== null);
      });

      setProgress(prev => ({ ...prev, status: 'grading', total: usersToGrade.length }));

      const aiService = new GoogleAiService();
      let processed = 0;
      let graded = 0;
      let failed = 0;

      for (const userDoc of usersToGrade) {
        try {
          const images = await getUserImages(userDoc.id);

          if (images.length === 0) {
            await updateDoc(doc(db, 'users', userDoc.id), {
              gradingFailed: true,
              gradingFailedReason: 'No images found',
              gradedAt: new Date(),
              photoUpdatedAt: null,
            });
            failed++;
          } else {
            const prompt = GenerateGradingPrompt.generateGradingPrompt(userDoc.id, images);
            const result = await aiService.gradeUserPhotos(images, prompt);

            if (result) {
              await updateDoc(doc(db, 'users', userDoc.id), {
                tier: result.tier,
                tierScore: result.score,
                tierReason: result.reason,
                tierStrength: result.strength,
                tierImprovement: result.improvement,
                gradedAt: new Date(),
                gradingFailed: false,
                photoUpdatedAt: null, // clear — graded, won't be re-queued
              });
              graded++;
            } else {
              await updateDoc(doc(db, 'users', userDoc.id), {
                gradingFailed: true,
                gradingFailedReason: 'AI returned no result',
                gradedAt: new Date(),
                photoUpdatedAt: null,
              });
              failed++;
            }
          }
        } catch (userError) {
          console.error(`Error grading user ${userDoc.id}:`, userError);
          failed++;
        }

        processed++;
        setProgress(prev => ({ ...prev, processed }));
      }

      const endTime = new Date();
      setProgress(prev => ({ ...prev, status: 'completed', endTime }));

      if (onLastRunChange) onLastRunChange(formatTimeAgo(startTime));
      if (onDurationChange) onDurationChange(formatDuration(startTime, endTime));

      // Invalidate cache → re-fetch fresh counts
      statsLoadedRef.current = false;
      await loadTierStats();

      alert(`✅ Photo Grading Completed!\n\nProcessed: ${processed} users\nSuccessfully graded: ${graded}\nFailed: ${failed}\nTime taken: ${formatDuration(startTime, endTime)}`);
    } catch (error) {
      console.error('Grading error:', error);
      setProgress(prev => ({ ...prev, status: 'error' }));
      alert('❌ Error during photo grading. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Progress helpers ───────────────────────────────────────────
  const getProgressPercentage = (): number => {
    if (progress.total === 0) return 0;
    if (progress.status === 'initializing') return 5;
    if (progress.status === 'completed') return 100;
    return Math.round((progress.processed / progress.total) * 90) + 5;
  };

  const getProgressMessage = (): string => {
    switch (progress.status) {
      case 'initializing': return 'Loading users to grade...';
      case 'grading': return `Grading user ${progress.processed} of ${progress.total}...`;
      case 'completed': return 'Grading completed successfully!';
      case 'error': return 'An error occurred during grading';
      default: return 'Preparing...';
    }
  };

  return {
    isAdmin,
    loading,
    isProcessing,
    tierStats,       // has A, B, C, D, ungraded, recentlyUpdated, failed, totalGraded
    progress,
    handleTriggerGrading,
    getProgressPercentage,
    getProgressMessage,
  };
};

// Add this at the very end of usePhotoGrading.ts
export default usePhotoGrading;
