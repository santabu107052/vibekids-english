import React, { useState, useEffect, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';
import { Trophy } from 'lucide-react';

interface HintCard {
  id: string;
  word: WordItem;
  options: WordItem[];
  picked: WordItem | null;
  isSolved: boolean;
}

interface MysteryGardenGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

/** Các mốc phần thưởng cụ thể theo số bông hoa */
const GARDEN_MILESTONES = [
  { flowers: 3, emoji: '🌱', label: 'Mầm Xanh', reward: 'Huy hiệu Mầm Xanh' },
  { flowers: 6, emoji: '🌿', label: 'Vườn Con', reward: 'Huy hiệu Vườn Con' },
  { flowers: 10, emoji: '🌻', label: 'Vườn Nở Rộ', reward: 'Huy hiệu Vườn Nở Rộ' },
  { flowers: 15, emoji: '💐', label: 'Vườn Thần Tiên', reward: 'Huy hiệu Vườn Thần Tiên' },
  { flowers: 20, emoji: '🏆', label: 'Bậc Thầy Làm Vườn', reward: 'Huy hiệu Bậc Thầy Làm Vườn' },
];

/**
 * 🌻 KHU VƯỜN BÍ ẨN (Mystery Garden — Có mục tiêu & phần thưởng)
 * - Mỗi câu đúng = 1 bông hoa + 1 giọt nước (nếu bé trả lời sai sẽ KHÔNG mất bông hoa)
 * - Mục tiêu rõ ràng: đạt mốc 3 → 6 → 10 → 15 → 20 bông hoa để mở khóa Huy hiệu
 * - Thanh tiến độ trực quan cho mốc tiếp theo
 * - ❌ KHÔNG tự phát âm đáp án khi vào câu (tránh lộ đáp án)
 */
export const MysteryGardenGame: React.FC<MysteryGardenGameProps> = ({
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
  const [hintCard, setHintCard] = useState<HintCard | null>(null);
  const [garden, setGarden] = useState<string[]>([]);
  const [roundHasError, setRoundHasError] = useState(false);
  const [shakeOption, setShakeOption] = useState<string | null>(null);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);
  const [wordPool, setWordPool] = useState<WordItem[]>([]);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);

  const shuffle = <T,>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const FLOWERS = ['🌸', '🌻', '🌷', '🌹', '🌺', '🌼', '💐', '🏵️'];

  const setupRound = (roundNum: number, queue: WordItem[] = wordPool) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];

    const others = queue.filter((w) => w.id !== target.id);
    const distractors = shuffle(others).slice(0, 2);
    const options = shuffle([target, ...distractors]);

    setHintCard({
      id: `seed-${roundNum}`,
      word: target,
      options,
      picked: null,
      isSolved: false,
    });
    setRoundHasError(false);
    setShakeOption(null);
    setCurrentRound(roundNum);
    // ❌ KHÔNG phát âm — sẽ lộ đáp án
  };

  const startNewGame = useCallback(() => {
    if (words.length === 0) return;
    const shuffled = shuffle(words);
    setWordPool(shuffled);
    setScore(0);
    setCorrectWords([]);
    setWrongWords([]);
    setGarden([]);
    setJustUnlocked(null);
    setGameResult(null);
    setupRound(1, shuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handlePick = (option: WordItem) => {
    if (!hintCard || hintCard.isSolved) return;
    const isCorrect = option.id === hintCard.word.id;

    if (isCorrect) {
      soundManager.playCorrect();
      const flower = FLOWERS[(currentRound - 1) % FLOWERS.length];
      const newCount = garden.length + 1;
      setGarden((prev) => [...prev, flower]);
      setScore((prev) => prev + (roundHasError ? 5 : 10));
      setCorrectWords((prev) => [...prev, hintCard.word.word]);
      setHintCard({ ...hintCard, picked: option, isSolved: true });
      // ✅ Chỉ phát âm khi đúng — bé học cách đọc từ đó
      playWordAudio(hintCard.word.word, hintCard.word.audioUrl);
      updateWordProgress(profile.id, hintCard.word.id, hintCard.word.word, true, 'reading');

      // Kiểm tra mốc phần thưởng vừa đạt
      const milestone = GARDEN_MILESTONES.find((m) => m.flowers === newCount);
      if (milestone) {
        setJustUnlocked(`${milestone.emoji} ${milestone.reward}!`);
        soundManager.playVictory();
        setTimeout(() => setJustUnlocked(null), 2400);
      }

      setTimeout(() => {
        if (!isInfinite && currentRound >= totalQuestions) {
          finishGame(true);
        } else {
          setupRound(currentRound + 1);
        }
      }, 1300);
    } else {
      soundManager.playWrong();
      setShakeOption(option.id);
      setRoundHasError(true);
      setWrongWords((prev) => [...prev, hintCard.word.word]);
      updateWordProgress(profile.id, hintCard.word.id, hintCard.word.word, false, 'reading');
      setTimeout(() => setShakeOption(null), 650);
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
      gameType: 'mystery_garden',
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

  if (!hintCard) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="text-4xl mb-2">🌻</div>
        <p className="text-sm font-bold">Bé cần thêm từ vựng để trồng vườn hoa nhé!</p>
        <button onClick={onExit} className="mt-4 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  // Tiến độ tới mốc phần thưởng tiếp theo
  const nextMilestone = GARDEN_MILESTONES.find((m) => m.flowers > garden.length);
  const prevMilestone = [...GARDEN_MILESTONES].reverse().find((m) => m.flowers <= garden.length);
  const rangeStart = prevMilestone?.flowers ?? 0;
  const rangeEnd = nextMilestone?.flowers ?? rangeStart + 1;
  const progressPct = Math.min(
    100,
    Math.round(((garden.length - rangeStart) / Math.max(1, rangeEnd - rangeStart)) * 100)
  );

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Khu Vườn Bí Ẩn"
        emoji="🌻"
        score={score}
        currentRound={currentRound}
        totalRounds={totalQuestions}
        onExit={handleExitGame}
      />

      {/* Garden Visualization with Progress Goal */}
      <div className="rounded-[2rem] border-4 border-green-300 bg-gradient-to-b from-sky-200 via-emerald-100 to-lime-200 p-4 mb-4 relative overflow-hidden">
        <div className="absolute top-3 left-3 text-3xl opacity-50 select-none">☀️</div>
        <div className="absolute top-3 right-3 text-2xl opacity-40 select-none">☁️</div>

        {/* Milestone progress bar */}
        <div className="relative z-10 mb-3">
          <div className="flex items-center justify-between text-[11px] font-black text-emerald-800 mb-1">
            <span className="flex items-center gap-1">
              <Trophy size={12} />
              {nextMilestone
                ? `Mục tiêu: ${nextMilestone.flowers} bông → ${nextMilestone.emoji} ${nextMilestone.label}`
                : '🏆 Đã đạt mốc cao nhất!'}
            </span>
            <span>
              {garden.length}/{nextMilestone?.flowers ?? GARDEN_MILESTONES[GARDEN_MILESTONES.length - 1].flowers}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/70 overflow-hidden border border-emerald-300/60 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lime-400 via-emerald-400 to-green-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Garden flowers */}
        <div className="flex flex-wrap items-end justify-center gap-1.5 min-h-[80px] relative z-10">
          {garden.length === 0 ? (
            <span className="text-xs text-emerald-700 italic">
              Chọn đúng từ để trồng bông hoa đầu tiên nhé!
            </span>
          ) : (
            garden.map((flower, idx) => (
              <span key={idx} className="text-2xl sm:text-3xl animate-bloom">
                {flower}
              </span>
            ))
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-emerald-400/50 to-transparent" />
      </div>

      {/* Milestone badge unlock toast */}
      {justUnlocked && (
        <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-center font-black text-sm shadow-lg animate-in zoom-in">
          🎉 Mở khóa: {justUnlocked}
        </div>
      )}

      {/* Milestone list */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {GARDEN_MILESTONES.map((m) => {
          const unlocked = garden.length >= m.flowers;
          return (
            <span
              key={m.flowers}
              className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${
                unlocked
                  ? 'bg-amber-100 border-amber-400 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {m.emoji} {m.flowers}
            </span>
          );
        })}
      </div>

      {/* Seed Hint Card */}
      <div className="bg-white rounded-3xl p-6 border-4 border-emerald-100 shadow-lg text-center mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2">
          🌱 Hạt giống bí ẩn — Bé chọn từ tiếng Anh đúng nghĩa:
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center justify-center gap-2">
          <span>{hintCard.word.emoji}</span>
          <span>{hintCard.word.meaningVi}</span>
        </h3>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {hintCard.options.map((opt) => {
          const isTarget = opt.id === hintCard.word.id;
          const isShaking = shakeOption === opt.id;

          let style = 'bg-white border-emerald-200 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-50/50';

          if (hintCard.isSolved) {
            if (isTarget) style = 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 scale-105';
            else style = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
          } else if (isShaking) {
            style = 'bg-rose-50 border-rose-400 text-rose-800';
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handlePick(opt)}
              disabled={hintCard.isSolved}
              className={`p-5 rounded-3xl border-3 font-black text-base sm:text-lg transition-all flex items-center justify-center text-center shadow-sm active:scale-95 cursor-pointer capitalize ${
                isShaking ? 'animate-shake' : ''
              } ${style}`}
            >
              {opt.word}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
        💡 Mỗi câu đúng nở 1 bông hoa — đạt mốc để mở khóa Huy hiệu đặc biệt!
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
