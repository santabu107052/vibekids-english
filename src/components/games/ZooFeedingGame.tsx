import React, { useState, useEffect, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';

interface ZooFeedingGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

type AnimalMood = 'waiting' | 'eating' | 'happy' | 'sad' | 'angry';

// Các bạn thú "đầu bếp" luân phiên ngồi vào bàn
type AnimalId = 'bear' | 'panda' | 'fox' | 'rabbit' | 'tiger' | 'koala' | 'pig' | 'hamster' | 'raccoon' | 'monkey';

interface GuestAnimal {
  id: AnimalId;
  name: string;
  furColor: string;
  furDark: string;
  accent: string;
}

// Chỉ ĐẦU thú được thay đổi khi đổi câu — thân/tay/chân dùng chung 1 hình SVG
const GUEST_ANIMALS: GuestAnimal[] = [
  { id: 'bear', name: 'Gấu Nâu', furColor: '#a16207', furDark: '#78350f', accent: '#fcd34d' },
  { id: 'panda', name: 'Gấu Trúc', furColor: '#f8fafc', furDark: '#0f172a', accent: '#1e293b' },
  { id: 'fox', name: 'Cáo Nhỏ', furColor: '#f97316', furDark: '#c2410c', accent: '#fff7ed' },
  { id: 'rabbit', name: 'Thỏ Bông', furColor: '#f8fafc', furDark: '#e2e8f0', accent: '#fda4af' },
  { id: 'tiger', name: 'Hổ Con', furColor: '#f59e0b', furDark: '#1c1917', accent: '#fef3c7' },
  { id: 'koala', name: 'Koala', furColor: '#94a3b8', furDark: '#475569', accent: '#f1f5f9' },
  { id: 'pig', name: 'Heo Con', furColor: '#fda4af', furDark: '#e11d48', accent: '#fecdd3' },
  { id: 'hamster', name: 'Hamster', furColor: '#d97706', furDark: '#92400e', accent: '#fef3c7' },
  { id: 'raccoon', name: 'Gấu Mèo', furColor: '#64748b', furDark: '#1e293b', accent: '#e2e8f0' },
  { id: 'monkey', name: 'Khỉ Con', furColor: '#92400e', furDark: '#78350f', accent: '#fed7aa' },
];

const FOOD_LIST = ['🍎', '🍌', '🥕', '🍖', '🥜', '🍯', '🌰', '🍇', '🍓', '🥦'];

/**
 * 🍽️ BỮA TIỆC SỞ THÚ (Zoo Dinner Table — Redesigned)
 *
 * Bố cục: Một BÀN ĂN có:
 *   - 1 bạn thú ngồi giữa bàn, tay cầm muỗng nĩa, trước mặt là DĨA TRỐNG
 *   - Câu hỏi = nghĩa tiếng Việt của từ cần tìm
 *   - 3 đáp án = 3 MÓN ĂN đặt trên bàn (mỗi món ghi 1 từ tiếng Anh, KHÔNG có icon)
 *
 * - Bé trả lời ĐÚNG → dĩa trống có thức ăn, thú ăn ngon lành và reo vui 😋→🥳
 * - Bé trả lời SAI  → thú buồn 😢 hoặc tức giận 😠, dĩa vẫn trống
 */

/** ===== ĐẦU THÚ — chỉ phần này thay đổi khi đổi câu ===== */
/** ===== ĐẦU THÚ — vẽ hoàn toàn bằng path SVG thuần, cùng hệ toạ độ với thân =====
 *  Không dùng foreignObject/HTML để tránh lỗi lệch toạ độ.
 *  Hàm nhận (cx, cy) là TÂM ĐẦU trong hệ toạ độ của scene SVG chính.
 */
const AnimalHeadSVG: React.FC<{ animal: GuestAnimal; mood: AnimalMood; cx: number; cy: number }> = ({
  animal,
  mood,
  cx,
  cy,
}) => {
  const { id, furColor, furDark, accent } = animal;

  // Tâm đầu nằm ở (0,0) cục bộ; dùng transform để dời tới (cx, cy)
  const eyes = () => {
    switch (mood) {
      case 'happy':
      case 'eating':
        return (
          <>
            <path d="M -16 -4 Q -11 -10 -6 -4" stroke="#1e293b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M 6 -4 Q 11 -10 16 -4" stroke="#1e293b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            {mood === 'eating' ? (
              <ellipse cx="0" cy="11" rx="7" ry="6" fill="#7f1d1d" />
            ) : (
              <path d="M -8 9 Q 0 17 8 9" stroke="#1e293b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            )}
          </>
        );
      case 'sad':
        return (
          <>
            <path d="M -16 -6 Q -11 -1 -6 -6" stroke="#1e293b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M 6 -6 Q 11 -1 16 -6" stroke="#1e293b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M -8 13 Q 0 5 8 13" stroke="#1e293b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <ellipse cx="-17" cy="4" rx="2.2" ry="3.4" fill="#60a5fa" opacity="0.9" />
          </>
        );
      case 'angry':
        return (
          <>
            <path d="M -17 -12 L -6 -8" stroke="#1e293b" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 17 -12 L 6 -8" stroke="#1e293b" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="-11" cy="-2" r="3.4" fill="#1e293b" />
            <circle cx="11" cy="-2" r="3.4" fill="#1e293b" />
            <rect x="-7" y="10" width="14" height="4.5" rx="1.6" fill="#1e293b" />
          </>
        );
      default:
        return (
          <>
            <circle cx="-11" cy="-4" r="4.2" fill="#1e293b" />
            <circle cx="11" cy="-4" r="4.2" fill="#1e293b" />
            <circle cx="-9.6" cy="-5.4" r="1.3" fill="#fff" />
            <circle cx="12.4" cy="-5.4" r="1.3" fill="#fff" />
            <ellipse cx="0" cy="11" rx="4.2" ry="3.4" fill="#7f1d1d" />
          </>
        );
    }
  };

  const ears = () => {
    switch (id) {
      case 'rabbit':
        return (
          <>
            <ellipse cx="-14" cy="-38" rx="7" ry="17" fill={furColor} stroke={furDark} strokeWidth="2" />
            <ellipse cx="-14" cy="-38" rx="3.4" ry="12" fill={accent} />
            <ellipse cx="14" cy="-38" rx="7" ry="17" fill={furColor} stroke={furDark} strokeWidth="2" />
            <ellipse cx="14" cy="-38" rx="3.4" ry="12" fill={accent} />
          </>
        );
      case 'pig':
        return (
          <>
            <path d="M -26 -20 L -20 -38 L -8 -24 Z" fill={furColor} stroke={furDark} strokeWidth="2" strokeLinejoin="round" />
            <path d="M 26 -20 L 20 -38 L 8 -24 Z" fill={furColor} stroke={furDark} strokeWidth="2" strokeLinejoin="round" />
          </>
        );
      case 'fox':
        return (
          <>
            <path d="M -28 -16 L -24 -42 L -6 -24 Z" fill={furColor} stroke={furDark} strokeWidth="2" strokeLinejoin="round" />
            <path d="M -22 -24 L -20 -35 L -12 -26 Z" fill={accent} />
            <path d="M 28 -16 L 24 -42 L 6 -24 Z" fill={furColor} stroke={furDark} strokeWidth="2" strokeLinejoin="round" />
            <path d="M 22 -24 L 20 -35 L 12 -26 Z" fill={accent} />
          </>
        );
      case 'koala':
        return (
          <>
            <circle cx="-28" cy="-14" r="14" fill={furColor} stroke={furDark} strokeWidth="2" />
            <circle cx="-28" cy="-14" r="8" fill={accent} />
            <circle cx="28" cy="-14" r="14" fill={furColor} stroke={furDark} strokeWidth="2" />
            <circle cx="28" cy="-14" r="8" fill={accent} />
          </>
        );
      case 'hamster':
        return (
          <>
            <circle cx="-20" cy="-28" r="10" fill={furColor} stroke={furDark} strokeWidth="2" />
            <circle cx="-20" cy="-28" r="5" fill={accent} />
            <circle cx="20" cy="-28" r="10" fill={furColor} stroke={furDark} strokeWidth="2" />
            <circle cx="20" cy="-28" r="5" fill={accent} />
          </>
        );
      default:
        return (
          <>
            <circle cx="-24" cy="-26" r="10" fill={furColor} stroke={furDark} strokeWidth="2" />
            <circle cx="-24" cy="-26" r="5" fill={id === 'panda' ? furDark : accent} />
            <circle cx="24" cy="-26" r="10" fill={furColor} stroke={furDark} strokeWidth="2" />
            <circle cx="24" cy="-26" r="5" fill={id === 'panda' ? furDark : accent} />
          </>
        );
    }
  };

  const pattern = () => {
    if (id === 'panda')
      return (
        <>
          <ellipse cx="-14" cy="-4" rx="9" ry="11" fill={furDark} />
          <ellipse cx="14" cy="-4" rx="9" ry="11" fill={furDark} />
        </>
      );
    if (id === 'tiger')
      return (
        <>
          <path d="M -4 -32 L -2 -20" stroke={furDark} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M 4 -32 L 2 -20" stroke={furDark} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M -26 -8 L -18 -6" stroke={furDark} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M 26 -8 L 18 -6" stroke={furDark} strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    if (id === 'raccoon') return <rect x="-24" y="-10" width="48" height="10" rx="5" fill={furDark} opacity="0.92" />;
    if (id === 'fox') return <ellipse cx="0" cy="18" rx="16" ry="12" fill={accent} />;
    if (id === 'monkey') return <ellipse cx="0" cy="8" rx="20" ry="16" fill={accent} />;
    return null;
  };

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {ears()}
      <ellipse cx="0" cy="0" rx="30" ry="30" fill={furColor} stroke={furDark} strokeWidth="2.4" />
      {pattern()}
      {eyes()}
      <ellipse cx="0" cy="8" rx={id === 'pig' ? 7 : 4.5} ry={id === 'pig' ? 5 : 3.4} fill={id === 'pig' ? '#fb7185' : furDark} stroke={id === 'pig' ? '#e11d48' : 'none'} strokeWidth="1.4" />
      {id === 'pig' && (
        <>
          <circle cx="-2.5" cy="8" r="1.5" fill="#9f1239" />
          <circle cx="2.5" cy="8" r="1.5" fill="#9f1239" />
        </>
      )}
      {(id === 'raccoon' || id === 'hamster' || id === 'rabbit') && (
        <>
          <line x1="-32" y1="6" x2="-16" y2="8" stroke="#64748b" strokeWidth="1.2" opacity="0.7" />
          <line x1="-32" y1="12" x2="-16" y2="12" stroke="#64748b" strokeWidth="1.2" opacity="0.7" />
          <line x1="32" y1="6" x2="16" y2="8" stroke="#64748b" strokeWidth="1.2" opacity="0.7" />
          <line x1="32" y1="12" x2="16" y2="12" stroke="#64748b" strokeWidth="1.2" opacity="0.7" />
        </>
      )}
    </g>
  );
};



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
  const [options, setOptions] = useState<WordItem[]>([]);
  const [animal, setAnimal] = useState(GUEST_ANIMALS[0]);
  const [food, setFood] = useState('🍎');
  const [mood, setMood] = useState<AnimalMood>('waiting');
  const [plateFood, setPlateFood] = useState<string | null>(null);
  const [fedCount, setFedCount] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
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
    setOptions(shuffle([target, ...distractors]));

    setAnimal(GUEST_ANIMALS[(roundNum - 1) % GUEST_ANIMALS.length]);
    setFood(FOOD_LIST[(roundNum - 1) % FOOD_LIST.length]);
    setMood('waiting');
    setPlateFood(null);
    setWrongAttempts(0);
    setRoundHasError(false);
    setCurrentRound(roundNum);
    // ❌ Không phát âm tự động để tránh lộ đáp án
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

  const handleServe = (option: WordItem) => {
    if (!currentWord || mood === 'happy' || mood === 'eating') return;
    const isCorrect = option.id === currentWord.id;

    if (isCorrect) {
      soundManager.playCorrect();
      // Bước 1: dĩa có thức ăn, thú bắt đầu ăn
      setPlateFood(food);
      setMood('eating');

      setTimeout(() => {
        // Bước 2: ăn xong, thú reo vui
        setMood('happy');
        soundManager.playVictory();
      }, 700);

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
      }, 1900);
    } else {
      soundManager.playWrong();
      setRoundHasError(true);
      // Lần sai đầu tiên: thú buồn. Từ lần thứ 2 trở đi: thú tức giận
      const nextWrong = wrongAttempts + 1;
      setWrongAttempts(nextWrong);
      setMood(nextWrong >= 2 ? 'angry' : 'sad');
      setWrongWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false, 'reading');

      setTimeout(() => {
        setMood('waiting');
      }, 1400);
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
        <div className="text-4xl mb-2">🍽️</div>
        <p className="text-sm font-bold">Bé cần thêm từ vựng để mở tiệc sở thú nhé!</p>
        <button onClick={onExit} className="mt-4 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  // Biểu cảm của bạn thú theo trạng thái
  const bubbleText: Record<AnimalMood, string> = {
    waiting: `Mình đang đói bụng... Cho mình ăn nhé!`,
    eating: `Nhai nhai... ngon quá!`,
    happy: `Cảm ơn bạn! Món này tuyệt vời! ❤️`,
    sad: `Huhu... món này không đúng rồi...`,
    angry: `Mình vẫn chưa được ăn! Chọn lại đi nào!`,
  };

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Bữa Tiệc Sở Thú"
        emoji="🍽️"
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

      {/* ===== DINNER TABLE SCENE (Full SVG Illustration) ===== */}
      <div className="rounded-[2rem] border-4 border-amber-200 bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 p-3 mb-4 relative overflow-hidden shadow-inner">
        {/* Wall decor */}
        <div className="absolute top-2 right-3 text-2xl opacity-40 select-none">🖼️</div>
        <div className="absolute top-2 left-3 text-xl opacity-30 select-none">💡</div>

        {/* Speech bubble (overlaid, positioned near animal head) */}
        <div className="relative z-20 flex justify-center pt-1 pb-1">
          <div
            className={`relative px-3.5 py-1.5 rounded-2xl text-[11px] font-bold shadow-md max-w-[78%] text-center transition-all ${
              mood === 'happy'
                ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                : mood === 'sad' || mood === 'angry'
                ? 'bg-rose-100 text-rose-800 border-2 border-rose-300'
                : mood === 'eating'
                ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                : 'bg-white text-slate-700 border-2 border-slate-200'
            }`}
          >
            {bubbleText[mood]}
            <div
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] ${
                mood === 'happy'
                  ? 'border-t-emerald-100'
                  : mood === 'sad' || mood === 'angry'
                  ? 'border-t-rose-100'
                  : mood === 'eating'
                  ? 'border-t-amber-100'
                  : 'border-t-white'
              }`}
            />
          </div>
        </div>

        {/* ===== FULL SCENE SVG: animal body + table + plate + cutlery ===== */}
        <div
          className="relative flex justify-center"
          style={{ filter: 'drop-shadow(0 6px 10px rgba(120,53,15,0.18))' }}
        >
          <svg viewBox="0 0 320 280" className="w-full max-w-[340px] h-auto">
            {/* ---------- BACKGROUND: floor ---------- */}
            <rect x="0" y="214" width="320" height="66" fill="#fde68a" opacity="0.5" />
            <rect x="0" y="214" width="320" height="4" fill="#d97706" opacity="0.3" />

            {/* ---------- CHAIR BACK (behind animal) ---------- */}
            <rect x="114" y="56" width="92" height="120" rx="12" fill="#b45309" opacity="0.8" />
            <rect x="120" y="62" width="80" height="108" rx="9" fill="#d97706" opacity="0.45" />

            {/* ---------- ANIMAL BODY (SHARED) ---------- */}
            <ellipse cx="160" cy="168" rx="48" ry="42" fill={animal.furColor} stroke={animal.furDark} strokeWidth="2.6" />
            <ellipse cx="160" cy="176" rx="31" ry="27" fill={animal.accent} opacity="0.5" />

            {/* ---------- ARMS (SHARED) — drawn toward viewer ---------- */}
            {/* Left arm: shoulder -> elbow -> hand resting on table left */}
            <path d="M 120 156 Q 96 176 78 206" stroke={animal.furColor} strokeWidth="17" fill="none" strokeLinecap="round" />
            <path d="M 120 156 Q 96 176 78 206" stroke={animal.furDark} strokeWidth="17" fill="none" strokeLinecap="round" opacity="0.15" />
            {/* Right arm */}
            <path d="M 200 156 Q 224 176 242 206" stroke={animal.furColor} strokeWidth="17" fill="none" strokeLinecap="round" />
            <path d="M 200 156 Q 224 176 242 206" stroke={animal.furDark} strokeWidth="17" fill="none" strokeLinecap="round" opacity="0.15" />
            {/* Hands (paws) */}
            <ellipse cx="78" cy="208" rx="12" ry="10" fill={animal.furColor} stroke={animal.furDark} strokeWidth="2" />
            <ellipse cx="242" cy="208" rx="12" ry="10" fill={animal.furColor} stroke={animal.furDark} strokeWidth="2" />

            {/* ---------- TABLE ---------- */}
            {/* Table legs (LONGER, drawn first so tabletop covers top) */}
            <rect x="44" y="232" width="12" height="40" rx="3" fill="#7c2d12" />
            <rect x="264" y="232" width="12" height="40" rx="3" fill="#7c2d12" />
            <rect x="44" y="232" width="4" height="40" fill="#9a3412" opacity="0.6" />
            <rect x="264" y="232" width="4" height="40" fill="#9a3412" opacity="0.6" />
            {/* Tabletop surface (ellipse) */}
            <ellipse cx="160" cy="226" rx="138" ry="18" fill="#c2410c" />
            <ellipse cx="160" cy="221" rx="138" ry="18" fill="#f97316" />
            {/* Tabletop front edge */}
            <path d="M 22 221 L 22 236 Q 160 260 298 236 L 298 221 Q 160 243 22 221 Z" fill="#b45309" />
            <path d="M 22 221 Q 160 243 298 221" stroke="#92400e" strokeWidth="1.6" fill="none" opacity="0.55" />

            {/* ---------- CUTLERY (IN HANDS, ABOVE TABLE) ---------- */}
            {/* FORK (left hand) — pointing up, clearly visible */}
            <g transform="translate(78,196) rotate(-18)">
              {/* handle */}
              <rect x="-2.6" y="-10" width="5.2" height="30" rx="2.6" fill="#94a3b8" />
              <rect x="-1.4" y="-10" width="1.6" height="30" fill="#e2e8f0" opacity="0.8" />
              {/* head/plate */}
              <rect x="-7" y="-14" width="14" height="5" rx="2.4" fill="#cbd5e1" />
              {/* tines */}
              <rect x="-6.4" y="-24" width="2.4" height="11" rx="1.2" fill="#cbd5e1" />
              <rect x="-1.2" y="-25" width="2.4" height="12" rx="1.2" fill="#cbd5e1" />
              <rect x="4" y="-24" width="2.4" height="11" rx="1.2" fill="#cbd5e1" />
            </g>
            {/* SPOON (right hand) — big bowl, very recognisable */}
            <g transform="translate(242,196) rotate(18)">
              {/* handle */}
              <rect x="-2.6" y="-10" width="5.2" height="30" rx="2.6" fill="#94a3b8" />
              <rect x="-1.4" y="-10" width="1.6" height="30" fill="#e2e8f0" opacity="0.8" />
              {/* spoon bowl */}
              <ellipse cx="0" cy="-17" rx="7.5" ry="10" fill="#dbe3ea" stroke="#94a3b8" strokeWidth="1.6" />
              <ellipse cx="-2" cy="-19" rx="3.4" ry="5" fill="#f8fafc" opacity="0.9" />
            </g>

            {/* ---------- PLATE (on table, in front of animal) ---------- */}
            <g>
              <ellipse cx="160" cy="234" rx="55" ry="16" fill="#7c2d12" opacity="0.28" />
              <ellipse cx="160" cy="230" rx="55" ry="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <ellipse cx="160" cy="230" rx="40" ry="11" fill="#e2e8f0" />
              <ellipse cx="160" cy="230" rx="35" ry="9.5" fill="#f1f5f9" />
              {plateFood ? (
                <text
                  x="160"
                  y="237"
                  textAnchor="middle"
                  fontSize="23"
                  className="animate-in zoom-in duration-300"
                >
                  {plateFood}
                </text>
              ) : (
                <text x="160" y="233" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="700">
                  dĩa trống
                </text>
              )}
            </g>

            {/* ---------- ANIMAL HEAD (ONLY THIS CHANGES PER ROUND) ---------- */}
            {/* Đầu vẽ thẳng bằng path SVG tại đúng tâm thân (x=160), không dùng foreignObject */}
            <g
              className={
                mood === 'eating'
                  ? 'animate-pulse'
                  : mood === 'happy'
                  ? 'animate-happy-glow'
                  : mood === 'angry' || mood === 'sad'
                  ? 'animate-head-sad'
                  : undefined
              }
              style={{ transformOrigin: '160px 118px' }}
            >
              <AnimalHeadSVG animal={animal} mood={mood} cx={160} cy={118} />
            </g>

            {/* ---------- EMOTION EFFECTS ---------- */}
            {mood === 'happy' && (
              <>
                <text x="94" y="92" fontSize="15" className="animate-bounce">✨</text>
                <text x="212" y="92" fontSize="15" className="animate-bounce">✨</text>
                <text x="160" y="58" fontSize="17" className="animate-bounce">❤️</text>
              </>
            )}
            {(mood === 'sad' || mood === 'angry') && (
              <text x="160" y="60" fontSize="17" className="animate-pulse" textAnchor="middle">
                {mood === 'sad' ? '💧' : '💢'}
              </text>
            )}
          </svg>
        </div>

        {/* Animal name label */}
        <div className="text-center -mt-1 mb-1">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-200/80 text-[10px] font-black text-amber-900">
            {animal.name}
          </span>
        </div>
      </div>

      {/* ===== QUESTION: MEANING TO FIND ===== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-5 text-white text-center shadow-xl mb-4">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15" />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 mb-1">
            🍎 Bạn thú muốn ăn món có nghĩa là:
          </div>
          <h3 className="text-2xl font-black flex items-center justify-center gap-2">
            <span className="text-3xl">{currentWord.emoji}</span>
            <span>{currentWord.meaningVi}</span>
          </h3>
          <div className="text-xs mt-2 text-emerald-100 font-medium">
            Chọn đúng từ tiếng Anh để dọn món ăn vào dĩa nhé!
          </div>
        </div>
      </div>

      {/* ===== FOOD DISHES ON THE TABLE (Answer Options — NO ICONS) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isTarget = opt.id === currentWord.id;
          const showCorrect = (mood === 'eating' || mood === 'happy') && isTarget;
          const isWrongPick = mood !== 'waiting' && mood !== 'eating' && mood !== 'happy';

          let style =
            'bg-white border-amber-300 text-amber-950 hover:border-amber-500 hover:bg-amber-50';

          if (showCorrect) {
            style = 'bg-gradient-to-tr from-emerald-400 to-teal-500 border-emerald-600 text-white ring-4 ring-emerald-200 scale-105';
          } else if (isWrongPick) {
            style = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleServe(opt)}
              disabled={mood === 'eating' || mood === 'happy'}
              className={`relative p-4 rounded-2xl border-4 font-black text-base transition-all shadow-md flex flex-col items-center justify-center min-h-[70px] ${style} ${
                mood === 'eating' || mood === 'happy' ? 'cursor-default' : 'active:scale-95 cursor-pointer'
              }`}
            >
              {/* Small bowl decoration on top */}
              <span className="text-lg opacity-70 mb-0.5">🍽️</span>
              <span className="capitalize text-center leading-tight">{opt.word}</span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
        💡 Cho đúng món, bạn thú sẽ ăn ngon lành — chọn sai bạn ấy sẽ buồn hoặc giận đấy nhé!
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
