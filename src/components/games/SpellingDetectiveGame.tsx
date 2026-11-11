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

  /** Tạo biến thể sai chính tả — LUÔN khác từ gốc (vòng lặp thử tối đa 20 lần) */
  const makeMisspelling = (word: string): string => {
    const attempt = (): string => {
      const letters = word.split('');
      if (letters.length < 3) {
        // Từ ngắn: thay 1 ký tự
        const idx = Math.floor(Math.random() * letters.length);
        const original = letters[idx];
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        const letters26 = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => c !== original);
        // Ưu tiên đổi nguyên âm khác để sai rõ ràng hơn
        const vowelChoices = vowels.filter((v) => v !== original);
        letters[idx] =
          vowels.includes(original) && vowelChoices.length > 0
            ? vowelChoices[Math.floor(Math.random() * vowelChoices.length)]
            : letters26[Math.floor(Math.random() * letters26.length)];
        return letters.join('');
      }

      const strategy = Math.floor(Math.random() * 3);
      if (strategy === 0) {
        // Hoán đổi 2 chữ cái liền nhau — chỉ chọn cặp KHÁC nhau
        const pairs: number[] = [];
        for (let i = 0; i < letters.length - 1; i++) {
          if (letters[i] !== letters[i + 1]) pairs.push(i);
        }
        if (pairs.length === 0) return word; // toàn chữ giống nhau, thử strategy khác
        const idx = pairs[Math.floor(Math.random() * pairs.length)];
        [letters[idx], letters[idx + 1]] = [letters[idx + 1], letters[idx]];
        return letters.join('');
      }
      if (strategy === 1) {
        // Nhân đôi 1 chữ cái không nằm sát bản sao giống nó
        const idx = Math.floor(Math.random() * letters.length);
        const next = letters[idx + 1];
        if (next === letters[idx]) return word; // tránh tạo "aaa" trùng
        letters.splice(idx, 0, letters[idx]);
        return letters.join('');
      }
      // Thay 1 nguyên âm bằng nguyên âm KHÁC
      const vowels = ['a', 'e', 'i', 'o', 'u'];
      const vowelIdx = letters.findIndex((c) => vowels.includes(c));
      if (vowelIdx >= 0) {
        const current = letters[vowelIdx];
        const others = vowels.filter((v) => v !== current);
        letters[vowelIdx] = others[Math.floor(Math.random() * others.length)];
        return letters.join('');
      }
      // Không có nguyên âm: đổi phụ âm cuối
      const lastIdx = letters.length - 1;
      const consonants = 'bcdfghjklmnpqrstvwxyz'.split('').filter((c) => c !== letters[lastIdx]);
      letters[lastIdx] = consonants[Math.floor(Math.random() * consonants.length)];
      return letters.join('');
    };

    for (let i = 0; i < 20; i++) {
      const result = attempt();
      if (result !== word && result.length > 0) return result;
    }
    // Fallback tuyệt đối an toàn: thêm 1 chữ cái vào cuối
    return word + 'e';
  };

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
