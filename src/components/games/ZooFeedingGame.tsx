import React, { useState, useEffect, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';

interface ZooAnimal {
  id: string;
  word: WordItem;
  isHappy: boolean;
  isSad: boolean;
}

interface ZooFeedingGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

/**
 * 🦁 BỮA TIỆC SỞ THÚ (Zoo Feeding Party)
 * - Bé nghe/đọc nghĩa tiếng Việt của một chú thú
 * - Chọn đúng từ tiếng Anh để cho chú thú ăn món ngon
 * - Sai: chú thú lắc đầu buồn nhưng KHÔNG bỏ cuộc, bé thử lại
 * - Đúng: chú thú reo vui, nhảy lên hạnh phúc
 */
export const ZooFeedingGame: React.FC<ZooFeedingGameProps> = ({
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
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [animals, setAnimals] = useState<ZooAnimal[]>([]);
  const [fedCount, setFedCount] = useState(0);
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
    setCurrentWord(target);

    const others = queue.filter((w) => w.id !== target.id);
    const distractors = shuffle(others).slice(0, 2);
    const options = shuffle([target, ...distractors]);

    setAnimals(
      options.map((w, i) => ({
        id: `animal-${roundNum}-${i}-${w.id}`,
        word: w,
        isHappy: false,
        isSad: false,
      }))
    );
    setRoundHasError(false);
    setCurrentRound(roundNum);

    setTimeout(() => playWordAudio(target.word, target.audioUrl), 200);
  };

  const startNewGame = useCallback(() => {
    if (words.length === 0) return;
    const shuffled = shuffle(words);
    setWordPool(shuffled);
    setScore(0);
    setFedCount(0);
    setCorrectWords([]);
    setWrongWords([]);
    setGameResult(null);
    setupRound(1, shuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleFeed = (animal: ZooAnimal) => {
    if (!currentWord || animals.some((a) => a.isHappy)) return;
    const isCorrect = animal.word.id === currentWord.id;

    if (isCorrect) {
      soundManager.playCorrect();
      setAnimals((prev) =>
        prev.map((a) => (a.id === animal.id ? { ...a, isHappy: true, isSad: false } : a))
      );
      setScore((prev) => prev + (roundHasError ? 5 : 10));
      setFedCount((prev) => prev + 1);
      setCorrectWords((prev) => [...prev, currentWord.word]);
      playWordAudio(currentWord.word, currentWord.audioUrl);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, true, 'reading');

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
      setAnimals((prev) => prev.map((a) => (a.id === animal.id ? { ...a, isSad: true } : a)));
      setWrongWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false, 'reading');

      setTimeout(() => {
        setAnimals((prev) => prev.map((a) => ({ ...a, isSad: false })));
      }, 850);
    }
  };

  const finishGame = (lastWasCorrect: boolean) => {
    const finalScore = score + (lastWasCorrect ? 10 : 0);
    const correctCount = correctWords.length + (lastWasCorrect ? 1 : 0);
    const totalAttempted = Math.max(1, currentRound);
    const accuracy = Math.min(100, Math.round((correctCount / totalAttempted) * 100));
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 20 + finalScore;

    const result: GameScoreResult = {
      gameType: 'zoo_feeding',
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

  if (!currentWord) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="text-4xl mb-2">🦁</div>
        <p className="text-sm font-bold">Bé cần thêm từ vựng để mở tiệc sở thú nhé!</p>
        <button onClick={onExit} className="mt-4 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Bữa Tiệc Sở Thú"
        emoji="🦁"
        score={score}
        currentRound={currentRound}
        totalRounds={totalQuestions}
        onExit={handleExitGame}
      />

      {/* Fed Counter */}
      <div className="flex items-center justify-end gap-1.5 mb-2 px-1">
        <span className="text-base">🍎</span>
        <span className="text-sm font-black text-emerald-700">Đã cho {fedCount} bạn thú ăn</span>
      </div>

      {/* Feeding Goal Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-5 text-white text-center shadow-lg mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 mb-1">
          🍽️ Cho chú thú ăn đúng món:
        </div>
        <h3 className="text-2xl font-black flex items-center justify-center gap-2">
          <span>{currentWord.emoji}</span>
          <span>{currentWord.meaningVi}</span>
        </h3>
        <div className="text-xs mt-2 text-emerald-100 font-medium">Chạm vào chú thú mang từ tiếng Anh đúng nhé!</div>
      </div>

      {/* Animals Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {animals.map((animal) => (
          <button
            key={animal.id}
            type="button"
            onClick={() => handleFeed(animal)}
            disabled={animal.isHappy}
            className={`aspect-square rounded-3xl flex flex-col items-center justify-center p-2 border-4 transition-all duration-200 shadow-md active:scale-95 ${
              animal.isHappy
                ? 'bg-gradient-to-tr from-yellow-300 to-orange-400 border-orange-300 ring-4 ring-amber-200 scale-105'
                : animal.isSad
                ? 'bg-rose-100 border-rose-300'
                : 'bg-gradient-to-tr from-emerald-100 to-teal-100 border-emerald-300 hover:from-emerald-50 hover:to-teal-50'
            } ${animal.isHappy ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className={`text-4xl transition-transform ${animal.isHappy ? 'animate-bounce' : ''}`}>
              {animal.isHappy ? '🎉' : animal.isSad ? '😢' : animal.word.emoji}
            </span>
            <span
              className={`text-xs sm:text-sm font-black mt-1 capitalize text-center leading-tight ${
                animal.isHappy ? 'text-orange-900' : animal.isSad ? 'text-rose-700' : 'text-emerald-900'
              }`}
            >
              {animal.word.word}
            </span>
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
        💡 Chú thú nhỏ sẽ reo vui khi bé cho ăn đúng món đấy!
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
