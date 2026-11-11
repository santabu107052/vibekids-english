import React, { useState, useEffect, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';
import { Trophy, RotateCcw } from 'lucide-react';

interface CandyLayer {
  id: string;
  emoji: string;
  color: string;
  shade: string;
}

interface HighScore {
  height: number;
  date: string;
}

interface CandyBuilderGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

const CANDY_STYLES = [
  { color: 'from-pink-400 to-rose-500', shade: '#f43f5e' },
  { color: 'from-amber-300 to-orange-400', shade: '#f59e0b' },
  { color: 'from-lime-300 to-green-400', shade: '#84cc16' },
  { color: 'from-cyan-300 to-blue-400', shade: '#06b6d4' },
  { color: 'from-violet-400 to-purple-500', shade: '#8b5cf6' },
  { color: 'from-yellow-300 to-amber-400', shade: '#eab308' },
];

const CANDY_EMOJIS = ['🍬', '🍭', '🧁', '🍩', '🍪', '🎂', '🍫', '🍮', '🍡', '🥮'];

const HIGH_SCORE_KEY = 'vibekids_candy_highscores';

/**
 * 🍬 NHÀ THIẾT KẾ KẸO NGỌT (Candy Tower Builder)
 *
 * - Bé trả lời đúng → kẹo xếp lên tháp, tháp cao dần thành hình tháp thật
 * - ❌ Trả lời SAI → tháp đổ sập, xây lại từ đầu (đây chính là thử thách!)
 * - 🏆 Bảng High Scores: Lưu top 3 tháp cao nhất từng xây
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
  const [towerCollapsed, setTowerCollapsed] = useState(false);
  const [roundHasError, setRoundHasError] = useState(false);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);
  const [wordPool, setWordPool] = useState<WordItem[]>([]);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [newRecord, setNewRecord] = useState<number | null>(null);

  // Load high scores
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${HIGH_SCORE_KEY}_${profile.id}`);
      if (raw) setHighScores(JSON.parse(raw));
    } catch {
      setHighScores([]);
    }
  }, [profile.id]);

  const saveHighScore = (height: number) => {
    if (height <= 0) return;
    try {
      const raw = localStorage.getItem(`${HIGH_SCORE_KEY}_${profile.id}`);
      const existing: HighScore[] = raw ? JSON.parse(raw) : [];
      const updated = [
        ...existing,
        { height, date: new Date().toISOString().split('T')[0] },
      ]
        .sort((a, b) => b.height - a.height)
        .slice(0, 3);
      localStorage.setItem(`${HIGH_SCORE_KEY}_${profile.id}`, JSON.stringify(updated));
      setHighScores(updated);
      // Kiểm tra kỷ lục mới
      const best = existing.length > 0 ? Math.max(...existing.map((h) => h.height)) : 0;
      if (height > best) setNewRecord(height);
    } catch {
      // ignore
    }
  };

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
    setTowerCollapsed(false);
    setCurrentRound(roundNum);
    // ❌ Không phát âm tự động
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
    setNewRecord(null);
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

      // Thêm 1 tầng kẹo lên tháp
      const layerIndex = tower.length;
      const style = CANDY_STYLES[layerIndex % CANDY_STYLES.length];
      setTower((prev) => [
        ...prev,
        {
          id: `layer-${layerIndex}-${Date.now()}`,
          emoji: CANDY_EMOJIS[layerIndex % CANDY_EMOJIS.length],
          color: style.color,
          shade: style.shade,
        },
      ]);

      setTimeout(() => {
        if (!isInfinite && currentRound >= totalQuestions) {
          finishGame(true);
        } else {
          setupRound(currentRound + 1);
        }
      }, 950);
    } else {
      // ❌ SAI → THÁP ĐỔ SẬP
      soundManager.playWrong();
      setShakeId(option.id);
      setRoundHasError(true);
      setWrongWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false, 'reading');

      if (tower.length > 0) {
        setTowerCollapsed(true);
        // Lưu high score trước khi đổ
        saveHighScore(tower.length);
        // Tháp đổ trong 900ms, sau đó reset về 0
        setTimeout(() => {
          setTower([]);
          setTowerCollapsed(false);
        }, 900);
      }

      setTimeout(() => {
        setShakeId(null);
        setSelected(null);
      }, 650);
    }
  };

  const finishGame = (lastWasCorrect: boolean) => {
    // Lưu chiều cao cuối cùng của tháp
    const finalHeight = tower.length + (lastWasCorrect ? 1 : 0);
    saveHighScore(finalHeight);

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
    saveHighScore(tower.length);
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

      {/* High Scores Panel */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-amber-800 flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-600" />
            3 Tháp Kẹo Cao Nhất
          </span>
          <span className="text-[10px] font-bold text-amber-600">Cao hiện tại: {tower.length} tầng</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => {
            const hs = highScores[i];
            const medal = ['🥇', '🥈', '🥉'][i];
            return (
              <div
                key={i}
                className={`flex-1 rounded-xl px-2 py-1.5 text-center border ${
                  hs
                    ? 'bg-white border-amber-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200 border-dashed'
                }`}
              >
                <div className="text-sm">{medal}</div>
                {hs ? (
                  <>
                    <div className="text-base font-black text-amber-700 leading-none">{hs.height}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{hs.date}</div>
                  </>
                ) : (
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">--</div>
                )}
              </div>
            );
          })}
        </div>
        {newRecord && (
          <div className="mt-2 text-center text-[11px] font-black text-rose-600 animate-pulse">
            🎉 KỶ LỤC MỚI: {newRecord} tầng!
          </div>
        )}
      </div>

      {/* ===== CANDY TOWER (Realistic Pyramid Shape) ===== */}
      <div className="relative rounded-[2rem] border-4 border-pink-200 bg-gradient-to-b from-sky-100 via-pink-50 to-rose-100 p-4 mb-4 overflow-hidden min-h-[250px]">
        <div className="absolute top-2 left-4 text-xs font-black text-pink-600">
          🏗️ Tháp Kẹo Của Bé
        </div>
        <div className="absolute top-2 right-4 text-xs font-bold text-rose-500">
          {tower.length > 0 ? `${tower.length} tầng` : 'chưa có tầng nào'}
        </div>

        {/* Tower built from bottom-up, pyramid narrowing */}
        <div
          className={`flex flex-col-reverse items-center gap-0.5 mt-9 min-h-[190px] transition-all duration-500 ${
            towerCollapsed ? 'opacity-0 translate-y-6 rotate-12' : 'opacity-100'
          }`}
        >
          {tower.length === 0 ? (
            <div className="text-xs text-pink-400 italic py-10 text-center">
              {towerCollapsed
                ? '💥 Tháp đổ rồi! Xây lại từ đầu nhé...'
                : 'Tháp đang trống — bé hãy thêm tầng đầu tiên!'}
            </div>
          ) : (
            tower.map((layer, idx) => {
              // Pyramid: base widest, top narrowest — using % width relative to container
              const widthPct = Math.max(24, 92 - idx * 6);
              return (
                <div
                  key={layer.id}
                  className={`relative flex items-center justify-center rounded-md bg-gradient-to-b ${layer.color} shadow-md animate-bloom`}
                  style={{
                    width: `${widthPct}%`,
                    height: '22px',
                    borderBottom: `3px solid ${layer.shade}`,
                    boxShadow: `0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)`,
                  }}
                >
                  <span className="text-sm leading-none">{layer.emoji}</span>
                  <span className="absolute right-1.5 text-[9px] font-black text-white/80">
                    {idx + 1}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Ground decorative */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-pink-300/60 to-transparent" />
        <div className="absolute bottom-1 left-3 text-xs opacity-50">🌱</div>
        <div className="absolute bottom-1 right-3 text-xs opacity-50">🌱</div>
      </div>

      {/* Question Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 rounded-3xl p-5 text-white text-center shadow-xl mb-4">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15" />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-wider text-pink-100 mb-1">
            🎨 Chọn từ đúng nghĩa để xây tầng kẹo mới:
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
        💡 Đúng thì tháp cao thêm — sai thì tháp ĐỔ SẬP và xây lại từ đầu. Cẩn thận nhé!
      </p>

      {/* Warning about reset */}
      {tower.length > 0 && (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-rose-600">
          <RotateCcw size={12} />
          <span>Trả lời sai sẽ mất cả {tower.length} tầng kẹo đấy!</span>
        </div>
      )}

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
