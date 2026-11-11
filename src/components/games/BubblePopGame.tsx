import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';

interface FallingWord {
  id: string;
  word: WordItem;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  speed: number;
}

interface BubblePopGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

type BubbleMood = 'idle' | 'correct' | 'wrong';

/**
 * 🎈 BONG BÓNG TỪ VỰNG BAY LƠ LỬNG (Falling Bubbles)
 * - 3 bong bóng mang từ tiếng Anh rơi nhẹ nhàng từ trên xuống
 * - Bé chạm đúng bong bóng khớp nghĩa tiếng Việt
 * - Trả lời sai: bong bóng rung nhẹ, KHÔNG mất mạng, KHÔNG trừ điểm (chỉ hạ độ chính xác)
 */
export const BubblePopGame: React.FC<BubblePopGameProps> = ({
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
  const [bubbles, setBubbles] = useState<FallingWord[]>([]);
  const [mood, setMood] = useState<BubbleMood>('idle');
  const [roundHasError, setRoundHasError] = useState(false);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);
  const [wordPool, setWordPool] = useState<WordItem[]>([]);

  const animRef = useRef<number | null>(null);
  const bubblesRef = useRef<FallingWord[]>([]);

  const shuffle = <T,>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const startNewGame = useCallback(() => {
    if (words.length === 0) return;
    const shuffled = shuffle(words);
    setWordPool(shuffled);
    setScore(0);
    setCorrectWords([]);
    setWrongWords([]);
    setGameResult(null);
    setRoundHasError(false);
    setMood('idle');
    setupRound(1, shuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  const setupRound = (roundNum: number, queue: WordItem[] = wordPool) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);

    // 3 bong bóng: 1 đúng + 2 nhiễu
    const others = queue.filter((w) => w.id !== target.id);
    const distractors = shuffle(others).slice(0, 2);
    const options = shuffle([target, ...distractors]);

    const newBubbles: FallingWord[] = options.map((w, i) => ({
      id: `bubble-${roundNum}-${i}-${w.id}`,
      word: w,
      x: 18 + i * 32,
      y: -25 - i * 12,
      speed: 0.35 + Math.random() * 0.2,
    }));
    bubblesRef.current = newBubbles;
    setBubbles(newBubbles);
    setMood('idle');
    setRoundHasError(false);
    setCurrentRound(roundNum);

    setTimeout(() => playWordAudio(target.word, target.audioUrl), 200);
  };

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Animation Loop: bong bóng bay lên từ từ (Floating up gently)
  useEffect(() => {
    if (!currentWord) return;

    const tick = () => {
      bubblesRef.current = bubblesRef.current.map((b) => ({
        ...b,
        y: b.y >= 100 ? -25 : b.y + b.speed,
      }));
      setBubbles([...bubblesRef.current]);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [currentWord?.id]);

  const handleBubbleTap = (bubble: FallingWord) => {
    if (!currentWord || mood === 'correct') return;
    const isCorrect = bubble.word.id === currentWord.id;

    if (isCorrect) {
      soundManager.playCorrect();
      setMood('correct');
      setScore((prev) => prev + (roundHasError ? 5 : 10));
      setCorrectWords((prev) => [...prev, currentWord.word]);
      playWordAudio(currentWord.word, currentWord.audioUrl);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, true, 'reading');

      setTimeout(() => {
        if (!isInfinite && currentRound >= totalQuestions) {
          finishGame(true);
        } else {
          setupRound(currentRound + 1);
        }
      }, 1000);
    } else {
      soundManager.playWrong();
      setMood('wrong');
      setRoundHasError(true);
      setWrongWords((prev) => [...prev, bubble.word.word]);
      updateWordProgress(profile.id, bubble.word.id, bubble.word.word, false, 'reading');

      setTimeout(() => setMood('idle'), 700);
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
      gameType: 'bubble_pop',
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
        <div className="text-4xl mb-2">🎈</div>
        <p className="text-sm font-bold">Bé cần thêm từ vựng để chơi game này nhé!</p>
        <button onClick={onExit} className="mt-4 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Bong Bóng Từ Vựng"
        emoji="🎈"
        score={score}
        currentRound={currentRound}
        totalRounds={totalQuestions}
        onExit={handleExitGame}
      />

      {/* Vietnamese Meaning Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-3xl p-5 text-white text-center shadow-lg mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-100 mb-1">
          Chạm bong bóng từ tiếng Anh có nghĩa:
        </div>
        <h3 className="text-2xl font-black flex items-center justify-center gap-2">
          <span>{currentWord.emoji}</span>
          <span>{currentWord.meaningVi}</span>
        </h3>
      </div>

      {/* Floating Bubbles Play Area */}
      <div
        className={`relative w-full rounded-3xl overflow-hidden border-4 transition-colors duration-300 ${
          mood === 'wrong'
            ? 'border-rose-300 bg-rose-50'
            : mood === 'correct'
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-sky-100'
        }`}
        style={{
          height: '380px',
          background:
            mood === 'wrong'
              ? undefined
              : 'radial-gradient(circle at 20% 15%, #e0f2fe 0%, #bae6fd 45%, #7dd3fc 100%)',
        }}
      >
        {/* Decor clouds */}
        <div className="absolute top-6 left-6 text-3xl opacity-60 select-none">☁️</div>
        <div className="absolute top-24 right-10 text-2xl opacity-50 select-none">☁️</div>

        {bubbles.map((bubble) => {
          const isWrongBubble = mood === 'wrong' && bubble.word.id !== currentWord.id;
          const isCorrectBubble = mood === 'correct' && bubble.word.id === currentWord.id;

          return (
            <button
              key={bubble.id}
              type="button"
              onClick={() => handleBubbleTap(bubble)}
              className={`absolute rounded-full flex items-center justify-center font-black text-sm sm:text-base shadow-xl transition-all duration-150 active:scale-90 cursor-pointer select-none ${
                isCorrectBubble
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-200 scale-110'
                  : isWrongBubble
                  ? 'bg-rose-200 text-rose-700 ring-2 ring-rose-300'
                  : 'bg-white/95 text-sky-900 hover:bg-white ring-2 ring-sky-200'
              }`}
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: '108px',
                height: '108px',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="px-2 text-center leading-tight capitalize">{bubble.word.word}</span>
            </button>
          );
        })}

        {mood === 'correct' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-6xl animate-bounce">✨</span>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
        💡 Bong bóng bay lơ lửng nhẹ nhàng — bé chạm đúng bong bóng có nghĩa vừa hiện nhé!
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
