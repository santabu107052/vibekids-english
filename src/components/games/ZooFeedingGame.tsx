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
  animalEmoji: string;
  isHappy: boolean;
  isSad: boolean;
  isEating: boolean;
}

interface ZooFeedingGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

const ANIMAL_EMOJIS = ['🐻', '🐼', '🐨', '🐯', '🦊', '🐰', '🐹', '🦝', '🐧', '🦔'];
const FOOD_EMOJIS = ['🍎', '🍌', '🥕', '🍖', '🥜', '🍯', '🌰', '🍇'];

/**
 * 🦁 BỮA TIỆC SỞ THÚ (Zoo Feeding Party)
 * - Bé đọc nghĩa tiếng Việt → chọn đúng từ tiếng Anh để cho thú ăn
 * - ❌ Đáp án KHÔNG có icon/emoji gợi ý — chỉ có chữ để bé đọc thật
 * - ✅ Trả lời ĐÚNG: thú nhảy lên, ăn miệng nhai nhóp nhép, hiện ❤️
 * - 😢 Trả lời SAI: thú lắc đầu buồn, hiện 💔 rồi bé thử lại
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
  const [currentFood, setCurrentFood] = useState<string>('🍎');
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
    const animalEmojis = shuffle([...ANIMAL_EMOJIS]).slice(0, 3);

    setAnimals(
      options.map((w, i) => ({
        id: `animal-${roundNum}-${i}-${w.id}`,
        word: w,
        animalEmoji: animalEmojis[i],
        isHappy: false,
        isSad: false,
        isEating: false,
      }))
    );
    setCurrentFood(FOOD_EMOJIS[(roundNum - 1) % FOOD_EMOJIS.length]);
    setRoundHasError(false);
    setCurrentRound(roundNum);
    // ❌ Không phát âm tự động
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
      // ✅ Animation 3 bước: nhảy lên → ăn (nhai) → hạnh phúc
      setAnimals((prev) =>
        prev.map((a) =>
          a.id === animal.id ? { ...a, isEating: true, isHappy: false, isSad: false } : a
        )
      );

      setTimeout(() => {
        setAnimals((prev) =>
          prev.map((a) => (a.id === animal.id ? { ...a, isEating: false, isHappy: true } : a))
        );
        soundManager.playVictory();
      }, 450);

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
      }, 1500);
    } else {
      soundManager.playWrong();
      setRoundHasError(true);
      // 😢 Animation: thú buồn, lắc đầu
      setAnimals((prev) => prev.map((a) => (a.id === animal.id ? { ...a, isSad: true } : a)));
      setWrongWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false, 'reading');

      setTimeout(() => {
        setAnimals((prev) => prev.map((a) => ({ ...a, isSad: false })));
      }, 1100);
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
        <span className="text-base">🍽️</span>
        <span className="text-sm font-black text-emerald-700">Đã cho {fedCount} bạn thú ăn</span>
      </div>

      {/* Feeding Goal Banner with Food */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-5 text-white text-center shadow-xl mb-4">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15" />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 mb-1">
            🍽️ Chọn đúng chú thú để cho ăn món <span className="text-lg">{currentFood}</span> này:
          </div>
          <h3 className="text-2xl font-black flex items-center justify-center gap-2">
            <span className="text-3xl">{currentWord.emoji}</span>
            <span>{currentWord.meaningVi}</span>
          </h3>
          <div className="text-xs mt-2 text-emerald-100 font-medium">
            Chú thú mang từ tiếng Anh đúng nghĩa sẽ được ăn!
          </div>
        </div>
      </div>

      {/* Animals Grid — NO ICONS in answer text */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {animals.map((animal) => {
          const isHappy = animal.isHappy;
          const isEating = animal.isEating;
          const isSad = animal.isSad;

          return (
            <button
              key={animal.id}
              type="button"
              onClick={() => handleFeed(animal)}
              disabled={isHappy}
              className={`relative aspect-square rounded-3xl flex flex-col items-center justify-center p-2 border-4 transition-all duration-200 shadow-lg overflow-hidden ${
                isHappy
                  ? 'bg-gradient-to-tr from-yellow-300 via-orange-400 to-amber-500 border-orange-300 ring-4 ring-amber-200 scale-105'
                  : isSad
                  ? 'bg-gradient-to-tr from-slate-300 to-rose-200 border-rose-400'
                  : isEating
                  ? 'bg-gradient-to-tr from-lime-200 to-emerald-300 border-emerald-400 ring-4 ring-lime-200'
                  : 'bg-gradient-to-tr from-emerald-100 to-teal-100 border-emerald-300 hover:from-emerald-50 hover:to-teal-50 active:scale-95'
              } ${isHappy ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {/* Animal face with animation */}
              <span
                className={`text-4xl transition-transform ${
                  isHappy ? 'animate-bounce' : isEating ? 'animate-pulse' : ''
                }`}
                style={
                  isSad
                    ? { animation: 'shake 0.5s ease-in-out 2' }
                    : undefined
                }
              >
                {isHappy ? '🥳' : isEating ? '😋' : isSad ? '😢' : animal.animalEmoji}
              </span>

              {/* Food flying to mouth when eating */}
              {isEating && (
                <span className="absolute top-2 right-2 text-2xl animate-bounce">{currentFood}</span>
              )}

              {/* Heart or broken heart */}
              {isHappy && (
                <span className="absolute top-1.5 right-2 text-lg animate-bounce">❤️</span>
              )}
              {isSad && (
                <span className="absolute top-1.5 right-2 text-lg animate-shake">💔</span>
              )}

              {/* Answer text — NO emoji */}
              <span
                className={`text-xs sm:text-sm font-black mt-1.5 capitalize text-center leading-tight ${
                  isHappy
                    ? 'text-orange-950'
                    : isSad
                    ? 'text-rose-800'
                    : isEating
                    ? 'text-emerald-900'
                    : 'text-emerald-900'
                }`}
              >
                {animal.word.word}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
        💡 Chú thú sẽ nhảy lên ăn ngon lành khi bé chọn đúng — sai thì thú buồn xíu, bé thử lại nhé!
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
