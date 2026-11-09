import { useState, useEffect, useCallback } from 'react';
import {
  getProfiles,
  getActiveProfileId,
  getWordsForProfile,
  deleteCustomWord,
  getTodayPracticedWordsCount,
  getRemainingRecommendedWords,
  addRecommendedWordsBatch,
} from '../services/storage';
import { Profile, WordItem } from '../types';

export interface ProfileDataHook {
  profiles: Profile[];
  activeProfile: Profile | null;
  words: WordItem[];
  refreshData: () => void;
  // Derived word groups & counts
  masteredWords: WordItem[];
  learningWords: WordItem[];
  newWords: WordItem[];
  masteredCount: number;
  learningCount: number;
  newCount: number;
  todayPracticedCount: number;
  remainingRecCount: number;
  // 4 Skill Radar scores
  totalCorrect: number;
  totalIncorrect: number;
  totalAnswers: number;
  baseAccuracy: number;
  listeningScore: number;
  readingScore: number;
  spellingScore: number;
  sentenceScore: number;
  // Actions
  handleBatchAddRecommended: (count?: number) => { success: boolean; message: string };
  handleDeleteWord: (wordId: string) => boolean;
  alertNotice: string | null;
  setAlertNotice: (notice: string | null) => void;
}

export function useProfileData(): ProfileDataHook {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    const allProfiles = getProfiles();
    setProfiles(allProfiles);
    const activeId = getActiveProfileId();
    const current = allProfiles.find((p) => p.id === activeId) || allProfiles[0] || null;
    setActiveProfile(current);
    if (current) {
      const profileWords = getWordsForProfile(current.id);
      setWords(profileWords);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Derived calculations
  const masteredWords = words.filter((w) => (w.masteryLevel || 0) >= 4);
  const learningWords = words.filter((w) => (w.masteryLevel || 0) > 0 && (w.masteryLevel || 0) < 4);
  const newWords = words.filter((w) => (w.masteryLevel || 0) === 0);

  const masteredCount = masteredWords.length;
  const learningCount = learningWords.length;
  const newCount = newWords.length;

  const todayPracticedCount = activeProfile ? getTodayPracticedWordsCount(activeProfile.id) : 0;
  const remainingRecCount = activeProfile ? getRemainingRecommendedWords(activeProfile.id).length : 0;

  // 4 Skill Radar Metrics
  const totalCorrect = words.reduce((acc, w) => acc + (w.correctCount || 0), 0);
  const totalIncorrect = words.reduce((acc, w) => acc + (w.incorrectCount || 0), 0);
  const totalAnswers = totalCorrect + totalIncorrect;
  const baseAccuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 75;

  const level = activeProfile ? activeProfile.level : 1;
  const listeningScore = Math.min(100, Math.max(30, baseAccuracy + masteredCount * 2));
  const readingScore = Math.min(100, Math.max(40, Math.round(((masteredCount + learningCount) / Math.max(1, words.length)) * 100)));
  const spellingScore = Math.min(100, Math.max(25, baseAccuracy - 5 + level * 5));
  const sentenceScore = Math.min(100, Math.max(20, level * 15));

  const handleBatchAddRecommended = (count: number = 5): { success: boolean; message: string } => {
    setAlertNotice(null);
    if (!activeProfile) {
      return { success: false, message: 'Chưa chọn hồ sơ người học.' };
    }
    const res = addRecommendedWordsBatch(activeProfile.id, count);
    if (res.added.length > 0) {
      const msg = `🎉 Đã nạp thành công ${res.added.length} từ vựng mới (${res.added.map((w) => w.word).join(', ')}) cho lứa tuổi bé!`;
      setAlertNotice(msg);
      refreshData();
      return { success: true, message: msg };
    } else {
      const msg = `Bé đã nạp hết tất cả từ vựng khuyến nghị phù hợp cho độ tuổi này rồi!`;
      setAlertNotice(msg);
      return { success: false, message: msg };
    }
  };

  const handleDeleteWord = (wordId: string): boolean => {
    if (!activeProfile) return false;
    if (window.confirm('Bạn có chắc muốn xóa từ vựng này khỏi sổ tay của bé?')) {
      deleteCustomWord(activeProfile.id, wordId);
      refreshData();
      return true;
    }
    return false;
  };

  return {
    profiles,
    activeProfile,
    words,
    refreshData,
    masteredWords,
    learningWords,
    newWords,
    masteredCount,
    learningCount,
    newCount,
    todayPracticedCount,
    remainingRecCount,
    totalCorrect,
    totalIncorrect,
    totalAnswers,
    baseAccuracy,
    listeningScore,
    readingScore,
    spellingScore,
    sentenceScore,
    handleBatchAddRecommended,
    handleDeleteWord,
    alertNotice,
    setAlertNotice,
  };
}
