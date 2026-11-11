import React, { useState, useEffect, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';
import { Volume2, Star } from 'lucide-react';

interface SpellingDetectiveGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

/**
 * ⭐ THÁM TỬ CHÍNH TẢ (Spelling Detective)
 * - 3 phiên bản từ hiện lên: 1 đúng chính tả, 2 bị bóp méo chữ cái
 * - Bé tìm ra từ viết ĐÚNG để "bắt lỗi"
 * - Có nghe phát âm gợi ý
 * - Đúng → ngôi sao sáng lên, sai → gạch đỏ
 */
export const SpellingDetectiveGame: React.FC<SpellingDetectiveGameProps> = ({
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
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [shakeItem, setShakeItem] = useState<string | null>(null);
  const [starsCollected, setStarsCollected] = useState(0);
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

  /**
   * Tạo biến thể SAI TINH TẾ — chỉ đổi ĐÚNG 1 chữ cái so với từ gốc.
   * Quy tắc sư phạm:
   *  1. Nguyên âm → đổi thành nguyên âm KHÁC (a↔e↔i↔o↔u)
   *  2. Phụ âm  → đổi thành phụ âm KHÁC (cùng nhóm phát âm nếu có thể)
   *  3. Nếu từ có ≥2 nguyên âm: hoán đổi vị trí 2 nguyên âm cho nhau
   * Mục tiêu: lỗi khó phát hiện, buộc bé phải đọc kỹ từng chữ.
   */
  const makeMisspelling = (word: string): string => {
    const VOWELS = ['a', 'e', 'i', 'o', 'u'];
    // Nhóm phụ âm dễ nhầm khi đọc/viết
    const CONSONANT_GROUPS: string[][] = [
      ['b', 'p', 'd'],
      ['c', 'k', 'g', 'q'],
      ['m', 'n'],
      ['f', 'v'],
      ['s', 'z', 'x'],
      ['t', 'd'],
      ['l', 'r'],
      ['w', 'v'],
      ['h', 'j'],
      ['y', 'i'],
    ];

    const attempt = (): string | null => {
      const letters = word.toLowerCase().split('');

      // Chọn ngẫu nhiên 1 trong 3 chiến lược (đều chỉ đổi 1 chữ cái)
      const vowelPositions = letters
        .map((c, i) => (VOWELS.includes(c) ? i : -1))
        .filter((i) => i >= 0);

      const canSwapVowels = vowelPositions.length >= 2;

      // Danh sách chiến lược khả dụng
      const strategies: Array<'vowel' | 'consonant' | 'swap'> = ['vowel', 'consonant'];
      if (canSwapVowels) strategies.push('swap');
      // Nếu không có nguyên âm nào thì chỉ còn phụ âm
      if (vowelPositions.length === 0) {
        const idx = strategies.indexOf('vowel');
        if (idx >= 0) strategies.splice(idx, 1);
      }

      const strategy = strategies[Math.floor(Math.random() * strategies.length)];

      if (strategy === 'swap' && canSwapVowels) {
        // Hoán đổi vị trí 2 nguyên âm KHÁC NHAU
        const pairs: Array<[number, number]> = [];
        for (let i = 0; i < vowelPositions.length; i++) {
          for (let j = i + 1; j < vowelPositions.length; j++) {
            if (letters[vowelPositions[i]] !== letters[vowelPositions[j]]) {
              pairs.push([vowelPositions[i], vowelPositions[j]]);
            }
          }
        }
        if (pairs.length === 0) return null;
        const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
        [letters[a], letters[b]] = [letters[b], letters[a]];
        return letters.join('');
      }

      if (strategy === 'vowel' && vowelPositions.length > 0) {
        // Đổi 1 nguyên âm thành nguyên âm khác
        const pos = vowelPositions[Math.floor(Math.random() * vowelPositions.length)];
        const current = letters[pos];
        const others = VOWELS.filter((v) => v !== current);
        letters[pos] = others[Math.floor(Math.random() * others.length)];
        return letters.join('');
      }

      // strategy === 'consonant': đổi 1 phụ âm thành phụ âm khác
      const consonantPositions = letters
        .map((c, i) => (!VOWELS.includes(c) && /[a-z]/.test(c) ? i : -1))
        .filter((i) => i >= 0);

      if (consonantPositions.length === 0) return null;

      // Ưu tiên chọn phụ âm thuộc nhóm dễ nhầm để lỗi tinh vi hơn
      const shuffledPositions = [...consonantPositions].sort(() => Math.random() - 0.5);
      for (const pos of shuffledPositions) {
        const current = letters[pos];
        const group = CONSONANT_GROUPS.find((g) => g.includes(current));
        const candidates = group
          ? group.filter((c) => c !== current)
          : 'bcdfghjklmnpqrstvwxyz'.split('').filter((c) => c !== current);
        if (candidates.length > 0) {
          letters[pos] = candidates[Math.floor(Math.random() * candidates.length)];
          return letters.join('');
        }
      }
      return null;
    };

    for (let i = 0; i < 30; i++) {
      const result = attempt();
      if (result && result !== word.toLowerCase() && result !== word) return result;
    }
    // Fallback (rất hiếm): đổi nguyên âm đầu tiên
    const letters = word.toLowerCase().split('');
    const vi = letters.findIndex((c) => VOWELS.includes(c));
    if (vi >= 0) {
      const others = VOWELS.filter((v) => v !== letters[vi]);
      letters[vi] = others[0];
      return letters.join('');
    }
    return word.toLowerCase() + 's';
  };;

  const setupRound = (roundNum: number, queue: WordItem[] = wordPool) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);

    // Tạo 2 biến thể sai khác nhau
    const wrong1 = makeMisspelling(target.word);
    let wrong2 = makeMisspelling(target.word);
    let guard = 0;
    while (wrong2 === wrong1 && guard < 10) {
      wrong2 = makeMisspelling(target.word);
      guard++;
    }

    const opts = shuffle([
      { text: target.word, isCorrect: true },
      { text: wrong1, isCorrect: false },
      { text: wrong2, isCorrect: false },
    ]);
    setOptions(opts);
    setPicked(null);
    setIsSolved(false);
    setShakeItem(null);
    setRoundHasError(false);
    setCurrentRound(roundNum);
    // ❌ Không tự phát âm — bé bấm nút nghe
  };

  const startNewGame = useCallback(() => {
    if (words.length === 0) return;
    const shuffled = shuffle(words);
    setWordPool(shuffled);
    setScore(0);
    setStarsCollected(0);
    setCorrectWords([]);
    setWrongWords([]);
    setGameResult(null);
    setupRound(1, shuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handlePick = (opt: { text: string; isCorrect: boolean }) => {
    if (!currentWord || isSolved) return;
    setPicked(opt.text);

    if (opt.isCorrect) {
      soundManager.playCorrect();
      setIsSolved(true);
      setStarsCollected((prev) => prev + 1);
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
      soundManager.playWrong();
      setShakeItem(opt.text);
      setRoundHasError(true);
      setWrongWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false, 'spelling');
      setTimeout(() => {
        setShakeItem(null);
        setPicked(null);
      }, 700);
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
      gameType: 'spelling_detective',
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
        <div className="text-4xl mb-2">⭐</div>
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
        title="Thám Tử Chính Tả"
        emoji="⭐"
        score={score}
        currentRound={currentRound}
        totalRounds={totalQuestions}
        onExit={handleExitGame}
      />

      {/* Stars collected */}
      <div className="flex items-center justify-end gap-1 mb-2 px-1 flex-wrap">
        {Array.from({ length: Math.min(10, Math.max(starsCollected, 1)) }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < starsCollected ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}
          />
        ))}
        {starsCollected > 10 && (
          <span className="text-xs font-black text-amber-600 ml-1">+{starsCollected - 10}</span>
        )}
      </div>

      {/* Meaning + audio hint */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 text-white text-center shadow-xl mb-4">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15" />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-100 mb-1">
            ⭐ Tìm ra từ được viết ĐÚNG chính tả:
          </div>
          <h3 className="text-xl sm:text-2xl font-black flex items-center justify-center gap-2">
            <span className="text-3xl">{currentWord.emoji}</span>
            <span>{currentWord.meaningVi}</span>
          </h3>
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

      {/* Three spelling options */}
      <div className="space-y-3">
        {options.map((opt) => {
          const isPicked = picked === opt.text;
          const isShaking = shakeItem === opt.text;
          const showCorrect = isSolved && opt.isCorrect;
          const showWrong = isSolved && !opt.isCorrect;

          let style = 'bg-white border-slate-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50';

          if (showCorrect) {
            style = 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 scale-102';
          } else if (isShaking) {
            style = 'bg-rose-50 border-rose-400 text-rose-800';
          } else if (showWrong) {
            style = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
          } else if (isPicked) {
            style = 'bg-amber-50 border-amber-400 text-amber-900';
          }

          return (
            <button
              key={opt.text}
              type="button"
              onClick={() => handlePick(opt)}
              disabled={isSolved}
              className={`w-full p-4 sm:p-5 rounded-3xl border-3 font-black text-xl sm:text-2xl tracking-wide transition-all shadow-sm flex items-center justify-between active:scale-98 cursor-pointer ${
                isShaking ? 'animate-shake' : ''
              } ${style}`}
            >
              <span className="flex-1 text-left capitalize">
                {showWrong && <span className="mr-1.5 opacity-70">✗</span>}
                {showCorrect && <span className="mr-1.5">✓</span>}
                {opt.text}
              </span>
              {showCorrect && <span className="text-2xl">⭐</span>}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
        💡 Chỉ có MỘT từ viết đúng — 2 từ còn lại bị đổi chữ, thừa chữ hoặc sai nguyên âm đấy!
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
