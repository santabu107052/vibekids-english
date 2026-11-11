import React, { useState, useEffect, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';

interface CandyLayer {
  id: string;
  emoji: string;
  color: string;
}

interface CandyBuilderGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

const CANDY_COLORS = [
  'from-pink-400 to-rose-500',
  'from-amber-300 to-orange-400',
  'from-lime-300 to-green-400',
  'from-cyan-300 to-blue-400',
  'from-violet-400 to-purple-500',
  'from-yellow-300 to-amber-400',
];

const CANDY_EMOJIS = ['🍬', '🍭', '🧁', '🍩', '🍪', '🎂', '🍫', '🍮'];

/**
 * 🍬 NHÀ THIẾT KẾ KẸO NGỌT (Candy Builder)
 * - Bé trả lời đúng → nhận 1 viên kẹo xếp vào tháp kẹo của mình
 * - Sai → kẹo rung lắc, bé thử lại (không mất gì)
 * - Mục tiêu: xây tháp kẹo cao nhất có thể, mỗi tầng là một chiến thắng
 * - Game thay thế Truy Tìm Kho Báu — vui nhộn, trực quan, phần thưởng liên tục
 */
export const CandyBuilderGame: React.FC<CandyBuilderGameProps> = ({
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
  const [selected, setSelected] = useState<WordItem | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [tower, setTower] = useState<CandyLayer[]>([]);
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

    setSelected(null);
    setIsSolved(false);
    setShakeId(null);
    setRoundHasError(false);
    setCurrentRound(roundNum);
    // ❌ KHÔNG phát âm tự động — tránh lộ đáp án
  };

  const startNewGame = useCallback(() => {
    if (words.length === 0) return;
    const shuffled = shuffle(words);
    setWordPool(shuffled);
    setScore(0);
    setTower([]);
    setCorrectWords([]);
    setWrongWords([]);
    setGameResult(null);
    setupRound(1, shuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handlePick = (option: WordItem) => {
    if (!currentWord || isSolved) return;
    const isCorrect = option.id === currentWord.id;
    setSelected(option);

    if (isCorrect) {
      soundManager.playCorrect();
      setIsSolved(true);
      setScore((prev) => prev + (roundHasError ? 5 : 10));
      setCorrectWords((prev) => [...prev, currentWord.word]);
      playWordAudio(currentWord.word, currentWord.audioUrl);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, true, 'reading');

      // Thêm 1 viên kẹo vào tháp
      const layerIndex = tower.length;
      setTower((prev) => [
        ...prev,
        {
          id: `layer-${layerIndex}-${Date.now()}`,
          emoji: CANDY_EMOJIS[layerIndex % CANDY_EMOJIS.length],
          color: CANDY_COLORS[layerIndex % CANDY_COLORS.length],
        },
      ]);

      setTimeout(() => {
        if (!isInfinite && currentRound >= totalQuestions) {
          finishGame(true);
        } else {
          setupRound(currentRound + 1);
        }
      }, 1100);
    } else {
      soundManager.playWrong();
      setShakeId(option.id);
      setRoundHasError(true);
      setWrongWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false, 'reading');
      setTimeout(() => {
        setShakeId(null);
        setSelected(null);
      }, 650);
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
      gameType: 'candy_builder',
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
        <div className="text-4xl mb-2">🍬</div>
        <p className="text-sm font-bold">Bé cần thêm từ vựng để xây tháp kẹo nhé!</p>
        <button onClick={onExit} className="mt-4 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  const towerHeightLabel =
    tower.length >= 15
      ? '🏆 Tháp Kẹo Huyền Thoại!'
      : tower.length >= 10
      ? '🌟 Tháp Kẹo Siêu Cao!'
      : tower.length >= 6
      ? '🍭 Tháp Kẹo Khủng!'
      : tower.length >= 3
      ? '🍬 Tháp Kẹo Xinh Xắn'
      : tower.length > 0
      ? '🍩 Mới xây tháp kẹo'
      : '🍬 Chọn đúng để xây viên kẹo đầu tiên!';

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Nhà Thiết Kế Kẹo Ngọt"
        emoji="🍬"
        score={score}
        currentRound={currentRound}
        totalRounds={totalQuestions}
        onExit={handleExitGame}
      />

      {/* Candy Tower Play Area */}
      <div className="relative rounded-[2rem] border-4 border-pink-200 bg-gradient-to-b from-pink-50 via-rose-50 to-amber-50 p-4 mb-4 overflow-hidden min-h-[220px]">
        <div className="absolute top-3 left-4 text-xs font-black text-pink-600">
          🍭 Tháp Kẹo Của Bé ({tower.length} tầng)
        </div>
        <div className="absolute top-3 right-4 text-xs font-bold text-rose-500">{towerHeightLabel}</div>

        {/* Tower container - stack from bottom up */}
        <div className="flex flex-col-reverse items-center justify-start gap-1 mt-8 min-h-[160px]">
          {tower.length === 0 ? (
            <div className="text-xs text-pink-500 italic py-8">Tháp kẹo đang trống — bé hãy thêm viên kẹo đầu tiên!</div>
          ) : (
            tower.map((layer, idx) => (
              <div
                key={layer.id}
                className={`flex items-center justify-center rounded-2xl bg-gradient-to-r ${layer.color} shadow-lg border-2 border-white/60 animate-bloom`}
                style={{
                  width: `${Math.max(46, 78 - idx * 1.2)}%`,
                  height: '30px',
                  filter: 'drop-shadow(0 3px 4px rgba(236,72,153,0.25))',
                }}
              >
                <span className="text-lg leading-none">{layer.emoji}</span>
                <span className="ml-1.5 text-[10px] font-black text-white/95">
                  {idx + 1}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Decorative sprinkles */}
        <div className="absolute bottom-2 left-3 text-lg opacity-40">✨</div>
        <div className="absolute bottom-3 right-4 text-lg opacity-40">⭐</div>
      </div>

      {/* Meaning Prompt Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 rounded-3xl p-5 text-white text-center shadow-xl mb-4">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15" />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-wider text-pink-100 mb-1">
            🎨 Chọn từ tiếng Anh đúng nghĩa để thêm kẹo:
          </div>
          <h3 className="text-2xl font-black flex items-center justify-center gap-2">
            <span className="text-3xl">{currentWord.emoji}</span>
            <span>{currentWord.meaningVi}</span>
          </h3>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isTarget = opt.id === currentWord.id;
          const isShaking = shakeId === opt.id;
          const isPicked = selected?.id === opt.id;

          let style = 'bg-white border-pink-200 text-pink-950 hover:border-pink-400 hover:bg-pink-50/50';

          if (isSolved) {
            if (isTarget)
              style = 'bg-gradient-to-tr from-emerald-400 to-teal-500 border-emerald-600 text-white ring-4 ring-emerald-200 scale-105';
            else style = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
          } else if (isShaking) {
            style = 'bg-rose-50 border-rose-400 text-rose-800';
          } else if (isPicked) {
            style = 'bg-pink-100 border-pink-400 text-pink-800';
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handlePick(opt)}
              disabled={isSolved}
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
        💡 Mỗi câu đúng xây thêm 1 tầng kẹo — bé xem tháp kẹo của mình cao thêm mỗi lần nhé!
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
