import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { GoogleAiService, RankingResult, PhotoRanking } from '../services/googleAiService';
import { GenerateRankingPrompt } from '../utils/generateRankingPrompt';
import { ImageState } from '../types';

const ALLOWED_EMAILS = ['admin@deep.com'];

export interface RankingStats {
  totalProcessed: number;
  totalFailed: number;
  totalSuccess: number;
}

export interface RankingProgress {
  status: 'idle' | 'initializing' | 'ranking' | 'finalizing' | 'completed' | 'error';
  processed: number;
  total: number;
  startTime: Date | null;
  endTime: Date | null;
}

const usePhotoRanking = (
  onLastRunChange?: (lastRun: string) => void,
  onDurationChange?: (duration: string) => void,
) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [rankingStats, setRankingStats] = useState<RankingStats>({
    totalProcessed: 0,
    totalFailed: 0,
    totalSuccess: 0,
  });
  const [progress, setProgress] = useState<RankingProgress>({
    status: 'idle',
    processed: 0,
    total: 0,
    startTime: null,
    endTime: null,
  });

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

  // ─── Load ranking stats once on mount ─────────────────────────
  useEffect(() => {
    if (!statsLoadedRef.current && !loading) {
      loadRankingStats();
    }
  }, [loading]);

  const loadRankingStats = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));

      const stats: RankingStats = {
        totalProcessed: 0,
        totalFailed: 0,
        totalSuccess: 0,
      };

      // Count users with ranked images
      for (const userDoc of snapshot.docs) {
        const data = userDoc.data();

        // Only count test users
        if (data.userType !== 'test') continue;

        try {
          const imagesSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'images'));

          let userHasRankedImages = false;
          let userHasFailedRanking = false;

          imagesSnapshot.forEach((imageDoc) => {
            const imgData = imageDoc.data();
            if (imgData.rank !== undefined && imgData.rank !== null) {
              userHasRankedImages = true;
            }
            if (imgData.rankingFailed === true) {
              userHasFailedRanking = true;
            }
          });

          if (userHasRankedImages) {
            stats.totalProcessed++;
            stats.totalSuccess++;
          } else if (userHasFailedRanking) {
            stats.totalProcessed++;
            stats.totalFailed++;
          }
        } catch (error) {
          console.error(`Error checking images for user ${userDoc.id}:`, error);
        }
      }

      setRankingStats(stats);
      statsLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading ranking stats:', error);
    }
  };

  // ─── Get images subcollection ───────────────────────────────────
  const getUserImages = async (userId: string): Promise<ImageState[]> => {
    try {
      const imagesSnapshot = await getDocs(collection(db, 'users', userId, 'images'));
      return imagesSnapshot.docs.map(d => {
        const data = d.data();
        return {
          docId: d.id,
          imagePath: data.imagePath || '',
          replacedImagePath: data.replacedImagePath || null,
          newImagePath: data.newImagePath || null,
          rank: data.rank != null ? Number(data.rank) : undefined,
          rankScore: data.rankScore != null ? Number(data.rankScore) : undefined,
          rankReason: data.rankReason || undefined,
          rankingSummary: data.rankingSummary || undefined,
          bestPhotoAdvice: data.bestPhotoAdvice || undefined,
          rankedAt: data.rankedAt?.toDate() || undefined,
          rankingFailed: data.rankingFailed || false,
          rankingFailedReason: data.rankingFailedReason || undefined,
        };
      });
    } catch (error) {
      console.error(`Error fetching images for user ${userId}:`, error);
      return [];
    }
  };

  // ─── Trigger ranking ───────────────────────────────────────────
  const handleTriggerRanking = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !ALLOWED_EMAILS.includes(currentUser.email || '')) {
      alert('⚠️ Unauthorized Action\n\nOnly admins can trigger photo ranking.');
      return;
    }

    setIsProcessing(true);
    const startTime = new Date();
    setProgress({ status: 'initializing', processed: 0, total: 0, startTime, endTime: null });

    try {
      const snapshot = await getDocs(collection(db, 'users'));

      // Get all test users that need ranking
      const usersToRank: { userId: string; hasRanking: boolean }[] = [];

      for (const userDoc of snapshot.docs) {
        const data = userDoc.data();
        if (data.userType !== 'test') continue;

        try {
          const imagesSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'images'));

          let hasRanking = false;
          imagesSnapshot.forEach((imageDoc) => {
            const imgData = imageDoc.data();
            if (imgData.rank !== undefined && imgData.rank !== null) {
              hasRanking = true;
            }
          });

          if (!hasRanking) {
            usersToRank.push({ userId: userDoc.id, hasRanking: false });
          }
        } catch (error) {
          console.error(`Error checking ranking for user ${userDoc.id}:`, error);
        }
      }

      setProgress(prev => ({ ...prev, status: 'ranking', total: usersToRank.length }));

      const aiService = new GoogleAiService();
      let processed = 0;
      let ranked = 0;
      let failed = 0;

      for (const userToRank of usersToRank) {
        try {
          const images = await getUserImages(userToRank.userId);

          if (images.length === 0) {
            // Mark all images as failed
            for (const img of images) {
              await updateDoc(doc(db, 'users', userToRank.userId, 'images', img.docId), {
                rankingFailed: true,
                rankingFailedReason: 'User has no images',
              });
            }
            failed++;
          } else {
            const prompt = GenerateRankingPrompt.generateRankingPrompt(userToRank.userId, images);
            const result: RankingResult | null = await aiService.rankUserPhotos(images, prompt);

            if (result && result.rankings && result.rankings.length > 0) {
              // Store ranking data in each image document
              for (const ranking of result.rankings) {
                const imageIndex = ranking.imageIndex;
                if (imageIndex >= 0 && imageIndex < images.length) {
                  await updateDoc(
                    doc(db, 'users', userToRank.userId, 'images', images[imageIndex].docId),
                    {
                      rank: ranking.rank,
                      rankScore: ranking.score,
                      rankReason: ranking.reason,
                      rankingSummary: result.summary,
                      bestPhotoAdvice: result.bestPhotoAdvice,
                      rankedAt: new Date(),
                      rankingFailed: false,
                    }
                  );
                }
              }
              ranked++;
            } else {
              // Mark all images as failed
              for (const img of images) {
                await updateDoc(doc(db, 'users', userToRank.userId, 'images', img.docId), {
                  rankingFailed: true,
                  rankingFailedReason: 'AI returned no result',
                  rankedAt: new Date(),
                });
              }
              failed++;
            }
          }
        } catch (userError) {
          console.error(`Error ranking user ${userToRank.userId}:`, userError);
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
      await loadRankingStats();

      alert(`✅ Photo Ranking Completed!\n\nProcessed: ${processed} users\nSuccessfully ranked: ${ranked}\nFailed: ${failed}\nTime taken: ${formatDuration(startTime, endTime)}`);
    } catch (error) {
      console.error('Ranking error:', error);
      setProgress(prev => ({ ...prev, status: 'error' }));
      alert('❌ Error during photo ranking. Check console for details.');
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
      case 'initializing': return 'Loading users to rank...';
      case 'ranking': return `Ranking photos for user ${progress.processed} of ${progress.total}...`;
      case 'completed': return 'Photo ranking completed successfully!';
      case 'error': return 'An error occurred during ranking';
      default: return 'Preparing...';
    }
  };

  return {
    isAdmin,
    loading,
    isProcessing,
    rankingStats,
    progress,
    handleTriggerRanking,
    getProgressPercentage,
    getProgressMessage,
  };
};

export default usePhotoRanking;