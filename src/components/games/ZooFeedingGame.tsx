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
const GUEST_ANIMALS = [
  { emoji: '🐻', name: 'Gấu Nâu' },
  { emoji: '🐼', name: 'Gấu Trúc' },
  { emoji: '🦊', name: 'Cáo Nhỏ' },
  { emoji: '🐰', name: 'Thỏ Bông' },
  { emoji: '🐯', name: 'Hổ Con' },
  { emoji: '🐨', name: 'Koala' },
  { emoji: '🐧', name: 'Cánh Cụt' },
  { emoji: '🐹', name: 'Chuột Hamster' },
  { emoji: '🐷', name: 'Heo Con' },
  { emoji: '🦝', name: 'Gấu Mèo' },
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
  const animalFace: Record<AnimalMood, string> = {
    waiting: animal.emoji,
    eating: '😋',
    happy: '🥳',
    sad: '😢',
    angry: '😠',
  };

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

      {/* ===== DINNER TABLE SCENE ===== */}
      <div className="rounded-[2rem] border-4 border-amber-200 bg-gradient-to-b from-rose-50 via-amber-50 to-orange-100 p-5 mb-4 relative overflow-hidden shadow-inner">
        {/* Wall decoration */}
        <div className="absolute top-3 right-4 text-2xl opacity-40 select-none">🖼️</div>
        <div className="absolute top-4 left-4 text-xl opacity-30 select-none">💡</div>

        {/* Guest animal sitting at table */}
        <div className="flex flex-col items-center pt-2 pb-1">
          {/* Speech bubble */}
          <div
            className={`relative mb-2 px-4 py-2 rounded-2xl text-xs font-bold shadow-md max-w-[85%] text-center transition-all ${
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

          {/* Animal with cutlery */}
          <div className="relative">
            {/* Fork (left hand) */}
            <span className="absolute -left-8 top-4 text-2xl select-none" style={{ transform: 'rotate(-25deg)' }}>
              🍴
            </span>
            {/* Animal face with mood animation */}
            <div
              className={`text-6xl transition-transform ${
                mood === 'happy'
                  ? 'animate-bounce'
                  : mood === 'eating'
                  ? 'animate-pulse'
                  : mood === 'angry'
                  ? 'animate-shake'
                  : mood === 'sad'
                  ? 'animate-shake'
                  : 'animate-soft-bounce'
              }`}
            >
              {animalFace[mood]}
            </div>
            {/* Knife (right hand) */}
            <span className="absolute -right-8 top-4 text-2xl select-none" style={{ transform: 'rotate(25deg)' }}>
              🔪
            </span>

            {/* Emotion sparkles */}
            {mood === 'happy' && (
              <>
                <span className="absolute -top-2 -left-6 text-xl animate-bounce">✨</span>
                <span className="absolute -top-2 -right-6 text-xl animate-bounce" style={{ animationDelay: '150ms' }}>
                  ✨
                </span>
              </>
            )}
            {(mood === 'sad' || mood === 'angry') && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl animate-pulse">
                {mood === 'sad' ? '💧' : '💢'}
              </span>
            )}
          </div>

          <div className="text-[11px] font-black text-amber-800 mt-1">{animal.name}</div>
        </div>

        {/* Empty plate in front of the animal */}
        <div className="flex justify-center mb-1">
          <div className="relative w-28 h-14 rounded-full bg-white border-4 border-slate-300 shadow-md flex items-center justify-center">
            {/* Inner plate rim */}
            <div className="absolute inset-1.5 rounded-full border-2 border-slate-200" />
            {plateFood ? (
              <span className="relative text-3xl animate-in zoom-in duration-300">{plateFood}</span>
            ) : (
              <span className="relative text-[10px] font-bold text-slate-400">Dĩa trống</span>
            )}
          </div>
        </div>

        {/* Table line */}
        <div className="h-3 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 shadow-md mx-2" />
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
