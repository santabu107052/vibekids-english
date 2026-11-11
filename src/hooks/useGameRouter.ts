import { useState, useCallback } from 'react';
import { GameType, WordItem } from '../types';
import { GameLearningMode } from '../components/GameSetupModal';

export interface GameSetupConfig {
  isOpen: boolean;
  targetGame: GameType;
  title: string;
  icon: string;
  badge?: string;
  fixedMode?: GameLearningMode;
}

export interface GameRouterHook {
  activeGame: GameType | null;
  gameWordsPool: WordItem[];
  vocabAdventureMode: 'review' | 'new' | 'mixed';
  sentenceAdventureMode: 'all' | 'review' | 'new' | 'mixed';
  activeQuestionCount: number;
  gameSetupConfig: GameSetupConfig;
  openVocabModeSetup: (mode: 'review' | 'new' | 'mixed', words: WordItem[], onNotice?: (msg: string) => void) => void;
  openSentenceModeSetup: (mode?: 'all' | 'review' | 'new' | 'mixed') => void;
  openSingleGameSetup: (game: { id: GameType; title: string; icon: string; badge: string }) => void;
  handleConfirmGameSetup: (selectedMode: GameLearningMode, count: number, words: WordItem[]) => void;
  closeGameSetup: () => void;
  exitActiveGame: () => void;
}

export function useGameRouter(): GameRouterHook {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [gameWordsPool, setGameWordsPool] = useState<WordItem[]>([]);
  const [vocabAdventureMode, setVocabAdventureMode] = useState<'review' | 'new' | 'mixed'>('mixed');
  const [sentenceAdventureMode, setSentenceAdventureMode] = useState<'all' | 'review' | 'new' | 'mixed'>('all');
  const [activeQuestionCount, setActiveQuestionCount] = useState<number>(10);

  const [gameSetupConfig, setGameSetupConfig] = useState<GameSetupConfig>({
    isOpen: false,
    targetGame: 'vocab_adventure',
    title: 'Cấu hình trò chơi',
    icon: '🎮',
  });

  const openVocabModeSetup = useCallback(
    (mode: 'review' | 'new' | 'mixed', words: WordItem[], onNotice?: (msg: string) => void) => {
      if (mode === 'review') {
        const reviewed = words.filter((w) => (w.masteryLevel || 0) >= 1);
        if (reviewed.length === 0) {
          onNotice?.('Bé chưa có từ vựng nào đã học. Hãy bắt đầu với "Học Từ Mới" nhé!');
          return;
        }
      } else if (mode === 'new') {
        const unlearned = words.filter((w) => (w.masteryLevel || 0) === 0);
        if (unlearned.length === 0) {
          onNotice?.('Bé đã học hết tất cả từ mới hiện có! Hãy bấm "Ôn Từ" hoặc thêm từ vựng mới nhé!');
          return;
        }
      }

      setGameSetupConfig({
        isOpen: true,
        targetGame: 'vocab_adventure',
        title: mode === 'review' ? 'Ôn Từ Đã Học' : mode === 'new' ? 'Học Từ Mới' : 'Vừa Ôn Vừa Học',
        icon: mode === 'review' ? '🔄' : mode === 'new' ? '✨' : '🎯',
        badge: 'Luân phiên 11 game',
        fixedMode: mode,
      });
    },
    []
  );

  const openSentenceModeSetup = useCallback((mode: 'all' | 'review' | 'new' | 'mixed' = 'all') => {
    setGameSetupConfig({
      isOpen: true,
      targetGame: 'sentence_adventure',
      title: mode === 'review' ? 'Ôn Mẫu Câu Đã Học' : mode === 'new' ? 'Học Mẫu Câu Mới' : 'Mẫu Câu Vừa Ôn Vừa Học',
      icon: '💬',
      badge: 'Luân phiên 3 game',
      fixedMode: mode === 'all' ? 'mixed' : mode,
    });
  }, []);

  const openSingleGameSetup = useCallback((game: { id: GameType; title: string; icon: string; badge: string }) => {
    setGameSetupConfig({
      isOpen: true,
      targetGame: game.id,
      title: game.title,
      icon: game.icon,
      badge: game.badge,
      fixedMode: undefined,
    });
  }, []);

  const handleConfirmGameSetup = useCallback(
    (selectedMode: GameLearningMode, count: number, words: WordItem[]) => {
      setActiveQuestionCount(count);

      let pool: WordItem[] = [];
      if (selectedMode === 'review') {
        const reviewed = words.filter((w) => (w.masteryLevel || 0) >= 1);
        pool = reviewed.length > 0 ? reviewed : words;
      } else if (selectedMode === 'new') {
        const unlearned = words.filter((w) => (w.masteryLevel || 0) === 0);
        pool = unlearned.length > 0 ? unlearned : words;
      } else {
        const unlearned = words.filter((w) => (w.masteryLevel || 0) === 0);
        const reviewed = words.filter((w) => (w.masteryLevel || 0) >= 1);
        pool = [...unlearned, ...reviewed];
        if (pool.length === 0) pool = words;
      }

      setGameWordsPool(pool);
      setVocabAdventureMode(selectedMode);
      setSentenceAdventureMode(selectedMode);
      setActiveGame(gameSetupConfig.targetGame);
      setGameSetupConfig((prev) => ({ ...prev, isOpen: false }));
    },
    [gameSetupConfig.targetGame]
  );

  const closeGameSetup = useCallback(() => {
    setGameSetupConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const exitActiveGame = useCallback(() => {
    setActiveGame(null);
  }, []);

  return {
    activeGame,
    gameWordsPool,
    vocabAdventureMode,
    sentenceAdventureMode,
    activeQuestionCount,
    gameSetupConfig,
    openVocabModeSetup,
    openSentenceModeSetup,
    openSingleGameSetup,
    handleConfirmGameSetup,
    closeGameSetup,
    exitActiveGame,
  };
}
