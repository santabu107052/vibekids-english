import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';
import { Volume2 } from 'lucide-react';

interface TreasureChest {
  id: string;
  word: WordItem;
  opened: boolean;
}

interface TreasureHuntGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

/**
 * 🗝️ TRUY TÌM KHO BÁU (Treasure Hunt)
 * - Nghe âm thanh bí ẩn (phát âm tiếng Anh)
 * - Mở từng rương để tìm đúng từ kho báu
 * - Sai: rương khép lại, bé thử rương khác (không trừ mạng)
 */
export const TreasureHuntGame: React.FC<TreasureHuntGameProps> = ({
  words,
  profile,
  questionCount = 10,
  onExit,
  onProfileUpdated,
}) => {
  const isInfinite = questionCount >= 9000;
  const totalQuestions = isInfinite ? 9999 : questionCount;

  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetWord, setTargetWord] = useState<WordItem | null>(null);
  const [chests, setChests] = useState<TreasureChest[]>([]);
  const [foundTreasure, setFoundTreasure] = useState(false);
  const [goldCoins, setGoldCoins] = useState(0);
  const [roundHasError, setRoundHasError] = useState(false);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);
  const [wordPool, setWordPool] = useState<WordItem[]>([]);

  const shuffle = <T,>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const setupRound = (roundNum: number, queue: WordItem[] = wordPool) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setTargetWord(target);

    const others = queue.filter((w) => w.id !== target.id);
    const distractors = shuffle(others).slice(0, 2);
    const options = shuffle([target, ...distractors]);

    setChests(
      options.map((w, i) => ({
        id: `chest-${roundNum}-${i}-${w.id}`,
        word: w,
        opened: false,
      }))
    );
    setFoundTreasure(false);
    setRoundHasError(false);
    setCurrentRound(roundNum);

    setTimeout(() => playWordAudio(target.word, target.audioUrl), 250);
  };

  const startNewGame = useCallback(() => {
    if (words.length === 0) return;
    const shuffled = shuffle(words);
    setWordPool(shuffled);
    setScore(0);
    setGoldCoins(0);
    setCorrectWords([]);
    setWrongWords([]);
    setGameResult(null);
    setupRound(1, shuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleOpenChest = (chest: TreasureChest) => {
    if (foundTreasure || chest.opened) return;
    const isCorrect = chest.word.id === targetWord?.id;

    if (isCorrect) {
      soundManager.playCorrect();
      setFoundTreasure(true);
      setChests((prev) => prev.map((c) => (c.id === chest.id ? { ...c, opened: true } : c)));
      setScore((prev) => prev + (roundHasError ? 5 : 10));
      setGoldCoins((prev) => prev + 1);
      setCorrectWords((prev) => [...prev, chest.word.word]);
      playWordAudio(chest.word.word, chest.word.audioUrl);
      updateWordProgress(profile.id, chest.word.id, chest.word.word, true, 'listening');

      setTimeout(() => {
        if (!isInfinite && currentRound >= totalQuestions) {
          finishGame(true);
        } else {
          setupRound(currentRound + 1);
        }
      }, 1100);
    } else {
      soundManager.playWrong();
      setRoundHasError(true);
      setChests((prev) => prev.map((c) => (c.id === chest.id ? { ...c, opened: true } : c)));
      setWrongWords((prev) => [...prev, chest.word.word]);
      updateWordProgress(profile.id, chest.word.id, chest.word.word, false, 'listening');

      setTimeout(() => {
        setChests((prev) => prev.map((c) => ({ ...c, opened: false })));
      }, 900);
    }
  };

  const finishGame = (lastWasCorrect: boolean) => {
    const finalScore = score + (lastWasCorrect ? 10 : 0);
    const correctCount = correctWords.length + (lastWasCorrect ? 1 : 0);
    const totalAttempted = Math.max(1, currentRound);
    const accuracy = Math.min(100, Math.round((correctCount / totalAttempted) * 100));
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 25 + finalScore;

    const result: GameScoreResult = {
      gameType: 'treasure_hunt',
      starsEarned: stars,
      xpEarned: xp,
      accuracy,
      correctWords: Array.from(new Set(correctWords)),
      wrongWords: Array.from(new Set(wrongWords)),
    };

    recordGameResult(profile.id, result);
    onProfileUpdated();
    setGameResult(result);
  };

  const handleExitGame = () => {
    const completed = correctWords.length + wrongWords.length;
    if (isInfinite && completed > 0) {
      finishGame(false);
    } else {
      onExit();
    }
  };

  const handleReplayAudio = () => {
    if (targetWord) playWordAudio(targetWord.word, targetWord.audioUrl);
  };

  if (!targetWord) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="text-4xl mb-2">🗝️</div>
        <p className="text-sm font-bold">Bé cần thêm từ vựng để đi tìm kho báu nhé!</p>
        <button onClick={onExit} className="mt-4 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Truy Tìm Kho Báu"
        emoji="🗝️"
        score={score}
        currentRound={currentRound}
        totalRounds={totalQuestions}
        onExit={handleExitGame}
      />

      {/* Gold Counter */}
      <div className="flex items-center justify-end gap-1.5 mb-2 px-1">
        <span className="text-base">🪙</span>
        <span className="text-sm font-black text-amber-700">{goldCoins} kho báu</span>
      </div>

      {/* Listening Panel */}
      <div className="bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-6 text-white text-center shadow-lg mb-4 relative overflow-hidden">
        <div className="absolute -top-4 -left-4 text-6xl opacity-20 select-none">🗺️</div>
        <div className="absolute -bottom-4 -right-4 text-6xl opacity-20 select-none">🧭</div>

        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-100 mb-3">
          🎧 Lắng nghe và mở chiếc rương chứa từ đúng
        </p>
        <button
          type="button"
          onClick={handleReplayAudio}
          className="w-20 h-20 rounded-full bg-white/95 hover:bg-white text-amber-600 flex items-center justify-center mx-auto shadow-xl active:scale-95 transition-all cursor-pointer"
        >
          <Volume2 size={38} />
        </button>
        <p className="text-xs font-semibold text-amber-50 mt-3">Chạm loa để nghe lại âm thanh bí ẩn</p>
      </div>

      {/* Treasure Chests */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {chests.map((chest) => {
          const isTarget = chest.word.id === targetWord.id;
          const showContent = chest.opened || (foundTreasure && isTarget);

          return (
            <button
              key={chest.id}
              type="button"
              onClick={() => handleOpenChest(chest)}
              disabled={foundTreasure}
              className={`aspect-square rounded-3xl flex flex-col items-center justify-center p-2 border-4 transition-all duration-200 shadow-md active:scale-95 ${
                showContent && isTarget
                  ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 border-emerald-300 ring-4 ring-emerald-200 scale-105'
                  : chest.opened
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-gradient-to-tr from-amber-200 to-yellow-300 border-amber-400 hover:from-amber-100 hover:to-yellow-200'
              } ${foundTreasure ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {showContent ? (
                <>
                  <span className="text-2xl">{isTarget ? '💎' : '🕸️'}</span>
                  <span
                    className={`text-[11px] sm:text-xs font-black mt-1 capitalize text-center leading-tight ${
                      isTarget ? 'text-white' : 'text-rose-700'
                    }`}
                  >
                    {chest.word.word}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl sm:text-4xl">🎁</span>
                  <span className="text-[10px] font-bold text-amber-800 mt-1">Mở rương</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
        💡 Mở đúng rương sẽ tìm thấy kho báu quý giá — Bé có thể thử lại nếu mở nhầm nhé!
      </p>

      {gameResult && (
        <GameVictoryModal
          isOpen={!!gameResult}
          result={gameResult}
          onPlayAgain={startNewGame}
          onHome={onExit}
        />
      )}
    </div>
  );
};
