import { Profile, WordItem, AgeGroup, GameScoreResult, SkillType } from '../types';
import { CURATED_WORDS } from '../data/curatedWords';
import { RECOMMENDED_VOCABULARY_BANK } from '../data/recommendedWords';

const STORAGE_KEYS = {
  PROFILES: 'vibekids_profiles',
  ACTIVE_PROFILE_ID: 'vibekids_active_profile_id',
  CUSTOM_WORDS: 'vibekids_custom_words_',
  WORD_PROGRESS: 'vibekids_word_progress_',
  SENTENCE_PROGRESS: 'vibekids_sentence_progress_',
};

export const AVATAR_OPTIONS = [
  { id: 'cat', emoji: '🐱', label: 'Mèo Con Miu' },
  { id: 'dog', emoji: '🐶', label: 'Cún Con Vàng' },
  { id: 'lion', emoji: '🦁', label: 'Sư Tử Dũng Mãnh' },
  { id: 'panda', emoji: '🐼', label: 'Gấu Trúc Tinh Nghịch' },
  { id: 'rabbit', emoji: '🐰', label: 'Thỏ Trắng Thông Thái' },
  { id: 'fox', emoji: '🦊', label: 'Cáo Nhanh Trí' },
  { id: 'dino', emoji: '🦖', label: 'Khủng Long Siêu Phàm' },
  { id: 'rocket', emoji: '🚀', label: 'Phi Hành Gia' },
  { id: 'wizard', emoji: '🧙‍♂️', label: 'Phù Thủy Tri Thức' },
];

export function getAgeGroup(age: number): AgeGroup {
  if (age <= 8) return 'kids_6_8';
  if (age <= 11) return 'kids_9_11';
  return 'teens_12_15';
}

/**
 * Get all user profiles
 */
export function getProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) {
      // Seed default profile for first-time onboarding
      const defaultProfile: Profile = {
        id: 'p-default',
        name: 'Bé Miu Miu',
        age: 7,
        avatar: '🐱',
        ageGroup: 'kids_6_8',
        stars: 15,
        xp: 120,
        level: 2,
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        dailyGoal: 5,
        todayCompletedCount: 0,
        badges: ['Người Mới Bắt Đầu', 'Ngôi Sao Sáng'],
      };
      saveProfiles([defaultProfile]);
      setActiveProfileId(defaultProfile.id);
      return [defaultProfile];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Lỗi đọc profiles từ localStorage:', e);
    return [];
  }
}

/**
 * Save all profiles
 */
export function saveProfiles(profiles: Profile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  } catch (e) {
    console.error('Lỗi lưu profiles:', e);
  }
}

/**
 * Get current active profile ID
 */
export function getActiveProfileId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
}

/**
 * Set active profile ID
 */
export function setActiveProfileId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
}

/**
 * Create a brand new profile
 */
export function createProfile(name: string, age: number, avatar: string, dailyGoal = 5): Profile {
  const profiles = getProfiles();
  const ageGroup = getAgeGroup(age);
  const newProfile: Profile = {
    id: `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    age,
    avatar,
    ageGroup,
    stars: 10, // Welcome gift stars
    xp: 0,
    level: 1,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    dailyGoal,
    todayCompletedCount: 0,
    badges: ['Tân Binh Xuất Sắc'],
  };

  profiles.push(newProfile);
  saveProfiles(profiles);
  setActiveProfileId(newProfile.id);

  // Tự động nạp trước gói từ vựng khởi đầu phong phú (20 từ) phù hợp với độ tuổi của bé
  try {
    addRecommendedWordsBatch(newProfile.id, 20);
  } catch (err) {
    console.warn('Không thể nạp từ khởi tạo:', err);
  }

  return newProfile;
}

/**
 * Delete a profile and its associated data
 */
export function deleteProfile(id: string): void {
  let profiles = getProfiles();
  profiles = profiles.filter(p => p.id !== id);
  saveProfiles(profiles);
  localStorage.removeItem(`${STORAGE_KEYS.CUSTOM_WORDS}${id}`);
  localStorage.removeItem(`${STORAGE_KEYS.WORD_PROGRESS}${id}`);
  
  if (getActiveProfileId() === id) {
    if (profiles.length > 0) {
      setActiveProfileId(profiles[0].id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    }
  }
}

/**
 * Get custom words for a profile
 */
export function getCustomWords(profileId: string): WordItem[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.CUSTOM_WORDS}${profileId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save custom words
 */
export function saveCustomWords(profileId: string, words: WordItem[]): void {
  localStorage.setItem(`${STORAGE_KEYS.CUSTOM_WORDS}${profileId}`, JSON.stringify(words));
}

/**
 * Add a custom word for a profile
 */
export function addCustomWord(profileId: string, wordItem: WordItem): void {
  const words = getCustomWords(profileId);
  // Avoid duplicates
  const existingIdx = words.findIndex(w => w.word.toLowerCase() === wordItem.word.toLowerCase());
  if (existingIdx >= 0) {
    words[existingIdx] = { ...words[existingIdx], ...wordItem };
  } else {
    words.unshift(wordItem);
  }
  saveCustomWords(profileId, words);
}

/**
 * Delete custom word
 */
export function deleteCustomWord(profileId: string, wordId: string): void {
  const words = getCustomWords(profileId).filter(w => w.id !== wordId);
  saveCustomWords(profileId, words);
  
  // Also clean up progress map
  const map = getWordProgressMap(profileId);
  delete map[wordId];
  saveWordProgressMap(profileId, map);
}

/**
 * Word progress tracking
 */
export interface WordProgressData {
  masteryLevel: number; // 0 to 5
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string;
  listeningCorrect?: number;
  readingCorrect?: number;
  spellingCorrect?: number;
}

export function getWordProgressMap(profileId: string): Record<string, WordProgressData> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.WORD_PROGRESS}${profileId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveWordProgressMap(profileId: string, map: Record<string, WordProgressData>): void {
  localStorage.setItem(`${STORAGE_KEYS.WORD_PROGRESS}${profileId}`, JSON.stringify(map));
}

/**
 * Get all words available for a profile (Curated for their age group + their custom words)
 */
export function getWordsForProfile(profileId: string): WordItem[] {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  const targetAgeGroup = profile?.ageGroup || 'kids_6_8';

  // 1. Get curated words matching this profile's age group (or 'all')
  const curated = CURATED_WORDS.filter(w => w.ageGroup === targetAgeGroup || w.ageGroup === 'all');
  
  // 2. Get custom words
  const custom = getCustomWords(profileId);

  // 3. Merge with progress data
  const progressMap = getWordProgressMap(profileId);

  const merged = [...custom, ...curated].map(word => {
    // If the word already exists in the merged list, it might be a duplicate, so take the custom one
    // But this mapping logic handles the progress
    const progress = progressMap[word.id] || progressMap[word.word.toLowerCase()];
    const result = { ...word };
    if (progress) {
      result.masteryLevel = progress.masteryLevel;
      result.correctCount = progress.correctCount;
      result.incorrectCount = progress.incorrectCount;
      result.listeningCorrect = progress.listeningCorrect || 0;
      result.readingCorrect = progress.readingCorrect || 0;
      result.spellingCorrect = progress.spellingCorrect || 0;
    }
    return result;
  });

  // Ensure uniqueness: Custom words take priority over curated ones if they share the same 'word' property
  const uniqueMap = new Map<string, WordItem>();
  merged.forEach(w => {
    const existing = uniqueMap.get(w.word.toLowerCase());
    if (!existing || w.isCustom) {
      uniqueMap.set(w.word.toLowerCase(), w);
    }
  });

  return Array.from(uniqueMap.values());
}

/**
 * Dynamic calculation of unique words practiced/reviewed today for a profile
 */
export function getTodayPracticedWordsCount(profileId: string): number {
  const map = getWordProgressMap(profileId);
  const today = new Date().toISOString().split('T')[0];
  let count = 0;
  for (const progress of Object.values(map)) {
    if (progress.lastReviewed && progress.lastReviewed.startsWith(today)) {
      count++;
    }
  }
  return count;
}

/**
 * Get remaining recommended words that haven't been added yet for this profile
 */
export function getRemainingRecommendedWords(profileId: string): WordItem[] {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  const targetAgeGroup = profile?.ageGroup || 'kids_6_8';

  const currentWords = getWordsForProfile(profileId);
  const existingWords = new Set(currentWords.map(w => w.word.trim().toLowerCase()));

  return RECOMMENDED_VOCABULARY_BANK.filter(w => {
    const matchAge = w.ageGroup === targetAgeGroup || w.ageGroup === 'all';
    return matchAge && !existingWords.has(w.word.trim().toLowerCase());
  });
}

/**
 * Add a batch of recommended words to the child's profile (guaranteeing 0 duplicates)
 */
export function addRecommendedWordsBatch(
  profileId: string, 
  count: number = 5
): { added: WordItem[]; remaining: number } {
  const remainingList = getRemainingRecommendedWords(profileId);
  const toAdd = remainingList.slice(0, count);

  if (toAdd.length > 0) {
    const words = getCustomWords(profileId);
    for (const item of toAdd) {
      const newItem: WordItem = {
        ...item,
        id: `rec-${profileId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        isCustom: true,
      };
      const existingIdx = words.findIndex(w => w.word.toLowerCase() === newItem.word.toLowerCase());
      if (existingIdx >= 0) {
        words[existingIdx] = { ...words[existingIdx], ...newItem };
      } else {
        words.unshift(newItem);
      }
    }
    saveCustomWords(profileId, words);
  }

  const remainingAfter = Math.max(0, remainingList.length - toAdd.length);
  return { added: toAdd, remaining: remainingAfter };
}

export function getSkillForGame(gameType: string): SkillType {
  switch (gameType) {
    case 'sound_detective':
      return 'listening';
    case 'word_scramble':
    case 'spelling_bee':
      return 'spelling';
    case 'memory_flip':
    case 'word_match':
    default:
      return 'reading';
  }
}

/**
 * Tính toán masteryLevel theo quy định sư phạm:
 * - 1 từ được cho là thành thạo (masteryLevel = 5) khi bé trả lời đúng >= 5 lần trong MỖI kỹ năng
 *   (Nghe, Đọc mặt chữ & nghĩa, Chính tả) (cả 3 kỹ năng đều >= 5 lần đúng).
 * - Nếu bé trả lời sai 1 lần ở bất kỳ kỹ năng nào, lập tức chuyển từ thành thạo sang đang luyện tập.
 */
export function calculateWordMasteryLevel(
  listeningCorrect: number = 0,
  readingCorrect: number = 0,
  spellingCorrect: number = 0,
  hasPracticed: boolean = false
): number {
  if (listeningCorrect >= 5 && readingCorrect >= 5 && spellingCorrect >= 5) {
    return 5; // Thành thạo
  }
  if (!hasPracticed && listeningCorrect === 0 && readingCorrect === 0 && spellingCorrect === 0) {
    return 0; // Từ mới chưa học
  }
  let skillsMet = 0;
  if (listeningCorrect >= 5) skillsMet++;
  if (readingCorrect >= 5) skillsMet++;
  if (spellingCorrect >= 5) skillsMet++;

  if (skillsMet === 2) return 3;
  if (skillsMet === 1) return 2;
  return 1;
}

/**
 * Update word mastery after playing games
 */
export function updateWordProgress(
  profileId: string,
  wordId: string,
  wordStr: string,
  isCorrect: boolean,
  skill: SkillType = 'reading'
): void {
  const map = getWordProgressMap(profileId);
  const key = wordId || wordStr.toLowerCase();
  const current: WordProgressData = map[key] || {
    masteryLevel: 0,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewed: new Date().toISOString(),
    listeningCorrect: 0,
    readingCorrect: 0,
    spellingCorrect: 0,
  };

  let listening = current.listeningCorrect || 0;
  let reading = current.readingCorrect || 0;
  let spelling = current.spellingCorrect || 0;

  // Hỗ trợ tương thích ngược cho dữ liệu cũ nếu đã đạt mốc thành thạo trước đó
  if (current.masteryLevel >= 4 && listening === 0 && reading === 0 && spelling === 0) {
    listening = 5;
    reading = 5;
    spelling = 5;
  }

  if (isCorrect) {
    current.correctCount += 1;
    if (skill === 'listening') listening += 1;
    else if (skill === 'spelling') spelling += 1;
    else reading += 1;

    current.listeningCorrect = listening;
    current.readingCorrect = reading;
    current.spellingCorrect = spelling;

    current.masteryLevel = calculateWordMasteryLevel(listening, reading, spelling, true);
  } else {
    current.incorrectCount += 1;
    // QUY TẮC: Nếu bé trả lời sai 1 lần ở bất kỳ kỹ năng nào, lập tức chuyển từ thành thạo sang đang luyện tập.
    // Hạ số lần đúng của kỹ năng này xuống dưới 5
    if (skill === 'listening') listening = Math.max(0, Math.min(4, listening - 1));
    else if (skill === 'spelling') spelling = Math.max(0, Math.min(4, spelling - 1));
    else reading = Math.max(0, Math.min(4, reading - 1));

    current.listeningCorrect = listening;
    current.readingCorrect = reading;
    current.spellingCorrect = spelling;

    // Chắc chắn không còn đủ 3 kỹ năng >= 5 -> chuyển sang đang luyện tập (1, 2 hoặc 3)
    current.masteryLevel = calculateWordMasteryLevel(listening, reading, spelling, true);
    if (current.masteryLevel >= 4) {
      current.masteryLevel = 3;
    }
  }

  current.lastReviewed = new Date().toISOString();
  map[key] = current;
  saveWordProgressMap(profileId, map);
}

/**
 * Record Game Result: update XP, Stars, Level, Streaks
 */
export function recordGameResult(profileId: string, result: GameScoreResult): Profile | null {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return null;

  profile.stars += result.starsEarned;
  profile.xp += result.xpEarned;
  
  // Level up formula: Level = Math.floor(XP / 100) + 1
  const newLevel = Math.floor(profile.xp / 100) + 1;
  profile.level = newLevel;

  // Streak check
  const today = new Date().toISOString().split('T')[0];
  if (profile.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (profile.lastActiveDate === yesterday) {
      profile.streak += 1;
    } else {
      profile.streak = 1;
    }
    profile.lastActiveDate = today;
    profile.todayCompletedCount = 1;
  } else {
    profile.todayCompletedCount += 1;
  }

  // Badges unlock
  if (profile.stars >= 50 && !profile.badges.includes('Thợ Săn Ngôi Sao')) {
    profile.badges.push('Thợ Săn Ngôi Sao');
  }
  if (profile.streak >= 7 && !profile.badges.includes('Chiến Binh Chăm Chỉ 7 Ngày')) {
    profile.badges.push('Chiến Binh Chăm Chỉ 7 Ngày');
  }
  if (profile.level >= 5 && !profile.badges.includes('Bậc Thầy Từ Vựng')) {
    profile.badges.push('Bậc Thầy Từ Vựng');
  }

  // Update mastery for each word in a single I/O pass (batch update)
  const map = getWordProgressMap(profileId);
  const nowIso = new Date().toISOString();
  const skill = getSkillForGame(result.gameType);

  for (const w of result.correctWords) {
    const key = w.toLowerCase();
    const current: WordProgressData = map[key] || {
      masteryLevel: 0,
      correctCount: 0,
      incorrectCount: 0,
      lastReviewed: nowIso,
      listeningCorrect: 0,
      readingCorrect: 0,
      spellingCorrect: 0,
    };
    current.correctCount += 1;
    if (skill === 'listening') current.listeningCorrect = (current.listeningCorrect || 0) + 1;
    else if (skill === 'spelling') current.spellingCorrect = (current.spellingCorrect || 0) + 1;
    else current.readingCorrect = (current.readingCorrect || 0) + 1;

    current.masteryLevel = calculateWordMasteryLevel(
      current.listeningCorrect || 0,
      current.readingCorrect || 0,
      current.spellingCorrect || 0,
      true
    );
    current.lastReviewed = nowIso;
    map[key] = current;
  }

  for (const w of result.wrongWords) {
    const key = w.toLowerCase();
    const current: WordProgressData = map[key] || {
      masteryLevel: 0,
      correctCount: 0,
      incorrectCount: 0,
      lastReviewed: nowIso,
      listeningCorrect: 0,
      readingCorrect: 0,
      spellingCorrect: 0,
    };
    current.incorrectCount += 1;
    if (skill === 'listening') {
      current.listeningCorrect = Math.max(0, Math.min(4, (current.listeningCorrect || 0) - 1));
    } else if (skill === 'spelling') {
      current.spellingCorrect = Math.max(0, Math.min(4, (current.spellingCorrect || 0) - 1));
    } else {
      current.readingCorrect = Math.max(0, Math.min(4, (current.readingCorrect || 0) - 1));
    }

    current.masteryLevel = calculateWordMasteryLevel(
      current.listeningCorrect || 0,
      current.readingCorrect || 0,
      current.spellingCorrect || 0,
      true
    );
    if (current.masteryLevel >= 4) {
      current.masteryLevel = 3;
    }
    current.lastReviewed = nowIso;
    map[key] = current;
  }

  saveWordProgressMap(profileId, map);

  // Live recalculation of today's unique words practiced directly from memory
  let todayCount = 0;
  for (const progress of Object.values(map)) {
    if (progress.lastReviewed && progress.lastReviewed.startsWith(today)) {
      todayCount++;
    }
  }
  profile.todayCompletedCount = todayCount;
  saveProfiles(profiles);

  return profile;
}

/**
 * Export all data to JSON string for backup
 */
export function exportAllData(): string {
  const backup: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('vibekids_')) {
      backup[key] = localStorage.getItem(key);
    }
  }
  return JSON.stringify(backup, null, 2);
}

/**
 * Sentence Pattern progress tracking (id -> masteryLevel, correctCount, incorrectCount)
 */
export interface SentenceProgressData {
  masteryLevel: number; // 0 = Chưa học/Mới, 1-2 = Đang học, 3+ = Đã thành thạo
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string;
}

export function getSentenceProgressMap(profileId: string): Record<number, SentenceProgressData> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SENTENCE_PROGRESS}${profileId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSentenceProgressMap(profileId: string, map: Record<number, SentenceProgressData>): void {
  localStorage.setItem(`${STORAGE_KEYS.SENTENCE_PROGRESS}${profileId}`, JSON.stringify(map));
}

export function updateSentenceProgress(profileId: string, templateId: number, isCorrect: boolean): void {
  const map = getSentenceProgressMap(profileId);
  const current = map[templateId] || {
    masteryLevel: 0,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewed: new Date().toISOString(),
  };

  if (isCorrect) {
    current.correctCount += 1;
    current.masteryLevel = Math.min(5, current.masteryLevel + 1);
  } else {
    current.incorrectCount += 1;
    current.masteryLevel = Math.max(0, current.masteryLevel - 1);
  }
  current.lastReviewed = new Date().toISOString();
  map[templateId] = current;
  saveSentenceProgressMap(profileId, map);
}

/**
 * Import data from JSON string
 */
export function importAllData(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val === 'string') {
        localStorage.setItem(key, val);
      }
    }
    return true;
  } catch (e) {
    console.error('Lỗi khôi phục dữ liệu:', e);
    return false;
  }
}
