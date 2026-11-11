import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';

interface FloatingBubble {
  id: string;
  word: WordItem;
  x: number; // % of play area width
  y: number; // % of play area height
  drift: number; // horizontal drift velocity
  bob: number; // bobbing phase offset
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
 * 🎈 BONG BÓNG TỪ VỰNG (3D GLOSSY BUBBLES)
 * - Bong bóng 3D bóng loáng với highlight gradient, glow và bóng đổ
 * - KHÔNG tự phát âm từ câu hỏi (vì sẽ lộ đáp án) — chỉ phát khi bé trả lời đúng
 * - Bong bóng trôi nổi nhẹ nhàng lơ lửng trong khung
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
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);
  const [mood, setMood] = useState<BubbleMood>('idle');
  const [roundHasError, setRoundHasError] = useState(false);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);
  const [wordPool, setWordPool] = useState<WordItem[]>([]);

  const animRef = useRef<number | null>(null);
  const bubblesRef = useRef<FloatingBubble[]>([]);
  const frameRef = useRef(0);

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

    const newBubbles: FloatingBubble[] = options.map((w, i) => ({
      id: `bubble-${roundNum}-${i}-${w.id}`,
      word: w,
      x: 26 + i * 24,
      y: 30 + i * 18,
      drift: (Math.random() - 0.5) * 0.04,
      bob: Math.random() * Math.PI * 2,
    }));
    bubblesRef.current = newBubbles;
    setBubbles(newBubbles);
    setMood('idle');
    setRoundHasError(false);
    setCurrentRound(roundNum);
    // ❌ KHÔNG tự phát âm từ câu hỏi — sẽ lộ đáp án cho bé
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

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Gentle floating animation
  useEffect(() => {
    if (!currentWord) return;

    const tick = () => {
      frameRef.current++;
      if (frameRef.current % 3 === 0) {
        const t = frameRef.current / 60;
        bubblesRef.current = bubblesRef.current.map((b) => {
          const nextX = b.x + b.drift;
          const nextY = b.y + Math.sin(t + b.bob) * 0.35;
          return {
            ...b,
            x: nextX < 16 || nextX > 84 ? b.x - b.drift : nextX,
            y: nextY < 24 || nextY > 78 ? b.y - Math.sin(t + b.bob) * 0.35 : nextY,
          };
        });
        setBubbles([...bubblesRef.current]);
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [currentWord?.id]);

  const handleBubbleTap = (bubble: FloatingBubble) => {
    if (!currentWord || mood === 'correct') return;
    const isCorrect = bubble.word.id === currentWord.id;

    if (isCorrect) {
      soundManager.playCorrect();
      setMood('correct');
      setScore((prev) => prev + (roundHasError ? 5 : 10));
      setCorrectWords((prev) => [...prev, currentWord.word]);
      // ✅ Chỉ phát âm khi ĐÚNG — củng cố phát âm chuẩn
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

      {/* Target Meaning Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-3xl p-5 text-white text-center shadow-xl mb-4">
        <div className="absolute -top-8 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-100 mb-1">
            🫧 Chạm bong bóng có từ tiếng Anh khớp nghĩa:
          </div>
          <h3 className="text-2xl font-black flex items-center justify-center gap-2">
            <span className="text-3xl">{currentWord.emoji}</span>
            <span>{currentWord.meaningVi}</span>
          </h3>
        </div>
      </div>

      {/* 3D Bubble Play Area */}
      <div
        className={`relative w-full rounded-[2rem] overflow-hidden border-4 shadow-inner transition-colors duration-300 ${
          mood === 'wrong'
            ? 'border-rose-300'
            : mood === 'correct'
            ? 'border-emerald-300'
            : 'border-sky-200'
        }`}
        style={{
          height: '400px',
          background:
            mood === 'wrong'
              ? 'radial-gradient(circle at 30% 20%, #ffe4e6 0%, #fecdd3 50%, #fda4af 100%)'
              : mood === 'correct'
              ? 'radial-gradient(circle at 30% 20%, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)'
              : 'radial-gradient(circle at 25% 18%, #f0f9ff 0%, #dbeafe 45%, #93c5fd 100%)',
        }}
      >
        {/* Soft clouds */}
        <div className="absolute top-5 left-5 text-4xl opacity-40 select-none">☁️</div>
        <div className="absolute bottom-8 right-6 text-3xl opacity-30 select-none">☁️</div>
        <div className="absolute top-1/2 left-8 text-2xl opacity-20 select-none">☁️</div>

        {bubbles.map((bubble) => {
          const isWrongBubble = mood === 'wrong' && bubble.word.id !== currentWord.id;
          const isCorrectBubble = mood === 'correct' && bubble.word.id === currentWord.id;

          return (
            <button
              key={bubble.id}
              type="button"
              onClick={() => handleBubbleTap(bubble)}
              className="absolute rounded-full flex items-center justify-center font-black cursor-pointer select-none border-0 p-0 transition-transform duration-150 active:scale-95"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: '116px',
                height: '116px',
                transform: `translate(-50%, -50%) scale(${isCorrectBubble ? 1.18 : 1})`,
                willChange: 'transform',
                // 🌟 3D GLOSSY BUBBLE — multi-layer gradients, inner glow, specular highlight
                background: isCorrectBubble
                  ? `radial-gradient(circle at 32% 26%, #ffffff 0%, #d1fae5 12%, #34d399 45%, #059669 78%, #047857 100%)`
                  : isWrongBubble
                  ? `radial-gradient(circle at 32% 26%, #ffffff 0%, #fecdd3 14%, #fb7185 52%, #e11d48 85%, #9f1239 100%)`
                  : `radial-gradient(circle at 32% 26%, #ffffff 0%, #e0f2fe 12%, #60a5fa 46%, #3b82f6 76%, #1d4ed8 100%)`,
                boxShadow: isCorrectBubble
                  ? `inset -10px -12px 24px rgba(4,120,87,0.55), inset 8px 8px 18px rgba(255,255,255,0.75), 0 10px 22px rgba(16,185,129,0.45), 0 0 0 5px rgba(167,243,208,0.6)`
                  : isWrongBubble
                  ? `inset -10px -12px 24px rgba(159,18,57,0.5), inset 8px 8px 18px rgba(255,255,255,0.7), 0 10px 22px rgba(244,63,94,0.4)`
                  : `inset -10px -12px 24px rgba(29,78,216,0.5), inset 8px 8px 18px rgba(255,255,255,0.85), 0 12px 24px rgba(59,130,246,0.35), 0 0 0 4px rgba(191,219,254,0.5)`,
              }}
            >
              {/* Specular highlight (bright glossy spot) */}
              <span
                className="absolute rounded-full pointer-events-none"
                style={{
                  top: '12%',
                  left: '20%',
                  width: '32%',
                  height: '24%',
                  background:
                    'radial-gradient(ellipse at center, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 100%)',
                  filter: 'blur(1px)',
                }}
              />
              {/* Secondary small highlight */}
              <span
                className="absolute rounded-full pointer-events-none"
                style={{
                  bottom: '16%',
                  right: '18%',
                  width: '16%',
                  height: '12%',
                  background:
                    'radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
                }}
              />
              {/* Word text */}
              <span
                className="relative z-10 px-2 text-center leading-tight capitalize text-white"
                style={{
                  fontSize: bubble.word.word.length > 8 ? '13px' : bubble.word.word.length > 5 ? '15px' : '17px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.35), 0 1px 1px rgba(0,0,0,0.5)',
                }}
              >
                {bubble.word.word}
              </span>
            </button>
          );
        })}

        {mood === 'correct' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-7xl animate-bounce drop-shadow-2xl">✨</span>
          </div>
        )}
        {mood === 'wrong' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-5xl animate-shake opacity-80">💫</span>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
        💡 Bong bóng lơ lửng nhẹ nhàng — bé chạm đúng bong bóng khớp nghĩa nhé!
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
