import React, { useState, useEffect, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';
import { Volume2, Delete } from 'lucide-react';

interface MissingLettersGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

/**
 * 🔤 CHỮ CÁI BỊ MẤT (Missing Letters)
 * - Từ tiếng Anh bị che đi 1-2 chữ cái (tùy độ dài), bé điền chữ cái còn thiếu
 * - Bé thấy nghĩa tiếng Việt + phiên âm, có thể nghe phát âm để đoán
 * - Bàn phím chữ cái lớn cho bé dễ chạm trên iPad
 * - Điền đúng → chữ cái sáng lên, từ hoàn chỉnh hiện rõ
 */
export const MissingLettersGame: React.FC<MissingLettersGameProps> = ({
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
  const [maskedChars, setMaskedChars] = useState<{ char: string; isHidden: boolean; filled: string }[]>([]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [distractorKeys, setDistractorKeys] = useState<string[]>([]);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const [roundHasError, setRoundHasError] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
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

  const ALL_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

  const setupRound = (roundNum: number, queue: WordItem[] = wordPool) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);

    const chars = target.word.toLowerCase().split('');
    // Độ khó theo độ dài từ:
    //  - Ngắn (<=4 ký tự): ẩn 1 chữ
    //  - Trung bình (5-7 ký tự): ẩn 2 chữ
    //  - Dài (>=8 ký tự): ẩn 3 chữ
    // Ưu tiên không ẩn chữ đầu/cuối để bé còn nhận diện được từ.
    const hideCount = chars.length <= 4 ? 1 : chars.length <= 7 ? 2 : 3;
    let candidates: number[] = [];
    for (let i = 1; i < chars.length - 1; i++) candidates.push(i);
    // Từ quá ngắn (<=2 ký tự) không có vị trí giữa → cho phép che chữ cuối
    if (candidates.length === 0) {
      candidates = chars.map((_, i) => i);
    }
    // QUAN TRỌNG: không ẩn 2 ô có cùng một chữ cái (vd "happy" ẩn cả 2 chữ "p"),
    // vì bàn phím chỉ có 1 nút cho mỗi chữ — bé không thể điền ô thứ hai.
    const pickHidden: number[] = [];
    const usedLetters = new Set<string>();
    for (const idx of shuffle(candidates)) {
      if (pickHidden.length >= hideCount) break;
      const letter = chars[idx];
      if (usedLetters.has(letter)) continue;
      usedLetters.add(letter);
      pickHidden.push(idx);
    }
    // Nếu từ không đủ chữ cái khác nhau, chấp nhận cho phép lặp
    if (pickHidden.length === 0) pickHidden.push(candidates[0]);
    const hiddenIdx = pickHidden.sort((a, b) => a - b);

    const masked = chars.map((ch, i) => ({
      char: ch,
      isHidden: hiddenIdx.includes(i),
      filled: '',
    }));
    setMaskedChars(masked);
    setActiveSlot(hiddenIdx[0] ?? 0);

    // Bàn phím: chữ cái đúng + 9 chữ nhiễu (11 nút tổng)
    const correctLetters = Array.from(new Set(hiddenIdx.map((i) => chars[i])));
    const pool = ALL_LETTERS.filter((l) => !correctLetters.includes(l));
    const distractor = shuffle(pool).slice(0, 10);
    setDistractorKeys(shuffle([...correctLetters, ...distractor]));

    setIsSolved(false);
    setShakeKey(null);
    setRoundHasError(false);
    setCurrentRound(roundNum);
    // ❌ Không tự phát âm — bé bấm nút để nghe
  };

  const startNewGame = useCallback(() => {
    if (words.length === 0) return;
    const shuffled = shuffle(words);
    setWordPool(shuffled);
    setScore(0);
    setCorrectWords([]);
    setWrongWords([]);
    setGameResult(null);
    setupRound(1, shuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleKey = (key: string) => {
    if (!currentWord || isSolved) return;

    // Nếu ô đang chọn đã được điền rồi, tự nhảy sang ô trống kế tiếp
    let slot = activeSlot;
    if (!maskedChars[slot]?.isHidden || maskedChars[slot]?.filled) {
      const emptySlot = maskedChars.findIndex((c) => c.isHidden && !c.filled);
      if (emptySlot === -1) return;
      slot = emptySlot;
      setActiveSlot(emptySlot);
    }

    const isCorrect = maskedChars[slot].char === key;

    if (isCorrect) {
      soundManager.playCorrect();
      const updated = maskedChars.map((c, i) => (i === slot ? { ...c, filled: key } : c));
      setMaskedChars(updated);

      // Tìm ô ẩn tiếp theo chưa điền
      const nextSlot = updated.findIndex((c) => c.isHidden && !c.filled);
      if (nextSlot === -1) {
        // Hoàn thành từ
        setIsSolved(true);
        setScore((prev) => prev + (roundHasError ? 5 : 10));
        setCorrectWords((prev) => [...prev, currentWord.word]);
        playWordAudio(currentWord.word, currentWord.audioUrl);
        updateWordProgress(profile.id, currentWord.id, currentWord.word, true, 'spelling');

        setTimeout(() => {
          if (!isInfinite && currentRound >= totalQuestions) {
            finishGame(true);
          } else {
            setupRound(currentRound + 1);
          }
        }, 1200);
      } else {
        setActiveSlot(nextSlot);
      }
    } else {
      soundManager.playWrong();
      setShakeKey(key);
      setRoundHasError(true);
      setWrongWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false, 'spelling');
      setTimeout(() => setShakeKey(null), 620);
    }
  };

  const handleBackspace = () => {
    if (isSolved || !currentWord) return;
    // Xoá chữ vừa điền và quay về ô gần nhất phía trước
    const filledSlots = maskedChars.map((c, i) => (c.isHidden && c.filled ? i : -1)).filter((i) => i >= 0);
    const lastFilled = filledSlots[filledSlots.length - 1];
    if (lastFilled !== undefined && lastFilled !== activeSlot) {
      setMaskedChars((prev) => prev.map((c, i) => (i === lastFilled ? { ...c, filled: '' } : c)));
      setActiveSlot(lastFilled);
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
      gameType: 'missing_letters',
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
        <div className="text-4xl mb-2">🔤</div>
        <p className="text-sm font-bold">Bé cần thêm từ vựng để chơi trò này nhé!</p>
        <button onClick={onExit} className="mt-4 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Chữ Cái Bị Mất"
        emoji="🔤"
        score={score}
        currentRound={currentRound}
        totalRounds={totalQuestions}
        onExit={handleExitGame}
      />

      {/* Meaning + audio hint */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-3xl p-5 text-white text-center shadow-xl mb-4">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15" />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-wider text-violet-100 mb-1">
            🔤 Điền chữ cái còn thiếu để hoàn thành từ:
          </div>
          <h3 className="text-xl sm:text-2xl font-black flex items-center justify-center gap-2">
            <span className="text-3xl">{currentWord.emoji}</span>
            <span>{currentWord.meaningVi}</span>
          </h3>
          <div className="text-xs text-violet-200 font-mono mt-1">{currentWord.phonetic}</div>
          <button
            type="button"
            onClick={() => playWordAudio(currentWord.word, currentWord.audioUrl)}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/25 hover:bg-white/35 text-xs font-bold transition-all cursor-pointer"
          >
            <Volume2 size={14} />
            Nghe phát âm gợi ý
          </button>
        </div>
      </div>

      {/* Word slots */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-5 flex-wrap">
        {maskedChars.map((c, i) => {
          const isActive = i === activeSlot && !isSolved;
          const display = c.isHidden ? c.filled : c.char;
          return (
            <div
              key={i}
              onClick={() => {
                if (!isSolved && c.isHidden && !c.filled) setActiveSlot(i);
              }}
              className={`flex items-center justify-center rounded-2xl border-3 font-black transition-all ${
                c.isHidden
                  ? isSolved
                    ? 'w-11 h-14 sm:w-12 sm:h-16 text-2xl bg-emerald-500 border-emerald-600 text-white shadow-md'
                    : isActive
                    ? 'w-11 h-14 sm:w-12 sm:h-16 text-2xl bg-amber-50 border-amber-500 text-slate-900 ring-4 ring-amber-200 animate-pulse cursor-pointer'
                    : 'w-11 h-14 sm:w-12 sm:h-16 text-2xl bg-white border-indigo-300 text-slate-900 cursor-pointer hover:border-indigo-400'
                  : 'w-9 h-12 sm:w-10 sm:h-14 text-xl bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              {display || (c.isHidden ? '_' : '')}
            </div>
          );
        })}
      </div>

      {/* Letter keyboard */}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mb-3">
        {distractorKeys.map((key) => {
          const isShaking = shakeKey === key;
          // Chỉ khoá nút khi TẤT CẢ ô mang chữ cái này đã được điền
          const slotsForLetter = maskedChars.filter((c) => c.isHidden && c.char === key);
          const used =
            slotsForLetter.length > 0 && slotsForLetter.every((c) => c.filled === key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              disabled={isSolved || used}
              className={`py-3 rounded-2xl font-black text-lg sm:text-xl uppercase transition-all shadow-sm active:scale-95 cursor-pointer ${
                used
                  ? 'bg-slate-100 border-2 border-slate-200 text-slate-300'
                  : isShaking
                  ? 'bg-rose-100 border-2 border-rose-400 text-rose-700 animate-shake'
                  : 'bg-white border-2 border-indigo-200 text-indigo-900 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
            >
              {key}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleBackspace}
        disabled={isSolved}
        className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
      >
        <Delete size={14} />
        Xoá chữ vừa điền
      </button>

      <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
        💡 Bé điền đúng từng chữ cái theo thứ tự nhé — từ sẽ sáng lên khi hoàn thành!
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
