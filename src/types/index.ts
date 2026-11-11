export type AgeGroup = 'kids_6_8' | 'kids_9_11' | 'teens_12_15';

export interface Profile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  ageGroup: AgeGroup;
  stars: number;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  createdAt: string;
  dailyGoal: number; // number of words/games per day
  todayCompletedCount: number;
  badges: string[];
}

export type SkillType = 'listening' | 'reading' | 'spelling';

export interface WordItem {
  id: string;
  word: string;
  phonetic: string;
  audioUrl?: string;
  partOfSpeech: string;
  meaningVi: string;
  definitionEn: string;
  exampleSentence: string;
  exampleVi?: string;
  ageGroup: AgeGroup | 'all';
  category: string;
  isCustom: boolean; // true = added by user/parent, false = curated
  emoji: string;
  masteryLevel: number; // 0 (new) to 5 (mastered)
  lastReviewed?: string;
  correctCount: number;
  incorrectCount: number;
  listeningCorrect?: number;
  readingCorrect?: number;
  spellingCorrect?: number;
}

export type GameType = 
  | 'memory_flip' 
  | 'word_match' 
  | 'word_scramble' 
  | 'sound_detective' 
  | 'spelling_bee' 
  | 'sentence_builder'
  | 'sentence_cloze'
  | 'sentence_detective'
  | 'vocab_adventure'
  | 'sentence_adventure'
  // 🎮 5 GAME VUI CHƠI MỚI (Play-to-Learn, không áp lực)
  | 'bubble_pop'
  | 'mystery_garden'
  | 'treasure_hunt'
  | 'zoo_feeding'
  | 'secret_animal';

export interface GameScoreResult {
  gameType: GameType;
  starsEarned: number;
  xpEarned: number;
  accuracy: number;
  correctWords: string[];
  wrongWords: string[];
}
