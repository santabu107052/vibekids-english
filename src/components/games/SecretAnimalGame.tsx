import React, { useState, useEffect, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';
import { Volume2, Lightbulb } from 'lucide-react';

interface ClueStep {
  label: string;
  content: string;
  icon: string;
}

interface SecretAnimalGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

/**
 * 🕵️‍♀️ VỊ KHÁCH BÍ MẬT (Secret Animal Guess)
 * - Mỗi vòng: 3 gợi ý hé lộ dần về một từ vựng bí ẩn
 * - Gợi ý 1: Hình dáng/emoji gợi ý
 * - Gợi ý 2: Câu ví dụ có chứa từ (bị che khuất)
 * - Gợi ý 3: Định nghĩa tiếng Anh đơn giản
 * - Bé có thể trả lời ngay khi chỉ dùng 1 gợi ý (điểm cao) hoặc xem thêm gợi ý (điểm thấp hơn)
 */
export const SecretAnimalGame: React.FC<SecretAnimalGameProps> = ({
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
  const [revealedClues, setRevealedClues] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
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

  const getClues = (word: WordItem): ClueStep[] => {
    const maskedSentence = word.exampleSentence.replace(
      new RegExp(word.word, 'gi'),
      '_____'
    );
    return [
      {
        label: 'Gợi ý 1 — Hình dáng',
        icon: word.emoji || '❓',
        content: `Từ này thuộc nhóm: ${word.category}`,
      },
      {
        label: 'Gợi ý 2 — Câu ví dụ',
        icon: '📖',
        content: maskedSentence,
      },
      {
        label: 'Gợi ý 3 — Định nghĩa tiếng Anh',
        icon: '💡',
        content: word.definitionEn,
      },
    ];
  };

  const setupRound = (roundNum: number, queue: WordItem[] = wordPool) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);

    const others = queue.filter((w) => w.id !== target.id);
    const distractors = shuffle(others).slice(0, 3);
    setOptions(shuffle([target, ...distractors]));

    setRevealedClues(1);
    setIsAnswered(false);
    setRoundHasError(false);
    setCurrentRound(roundNum);

    setTimeout(() => playWordAudio(target.word, target.audioUrl), 200);
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

  const handleRevealClue = () => {
    if (revealedClues < 3) {
      setRevealedClues((prev) => prev + 1);
      soundManager.playCorrect();
    }
  };

  const handlePick = (option: WordItem) => {
    if (isAnswered || !currentWord) return;
    const isCorrect = option.id === currentWord.id;

    if (isCorrect) {
      soundManager.playCorrect();
      setIsAnswered(true);
      // Ít gợi ý hơn = điểm cao hơn
      const points = Math.max(3, 10 - (revealedClues - 1) * 2);
      setScore((prev) => prev + (roundHasError ? Math.ceil(points / 2) : points));
      setCorrectWords((prev) => [...prev, currentWord.word]);
      playWordAudio(currentWord.word, currentWord.audioUrl);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, true, 'reading');

      setTimeout(() => {
        if (!isInfinite && currentRound >= totalQuestions) {
          finishGame(true);
        } else {
          setupRound(currentRound + 1);
        }
      }, 1200);
    } else {
      soundManager.playWrong();
      setRoundHasError(true);
      setWrongWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false, 'reading');
    }
  };

  const finishGame = (lastWasCorrect: boolean) => {
    const correctCount = correctWords.length + (lastWasCorrect ? 1 : 0);
    const totalAttempted = Math.max(1, currentRound);
    const accuracy = Math.min(100, Math.round((correctCount / totalAttempted) * 100));
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 25 + score;

    const result: GameScoreResult = {
      gameType: 'secret_animal',
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
        <div className="text-4xl mb-2">🕵️‍♀️</div>
        <p className="text-sm font-bold">Bé cần thêm từ vựng để giải mã bí mật nhé!</p>
        <button onClick={onExit} className="mt-4 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  const clues = getClues(currentWord);

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Vị Khách Bí Mật"
        emoji="🕵️‍♀️"
        score={score}
        currentRound={currentRound}
        totalRounds={totalQuestions}
        onExit={handleExitGame}
      />

      {/* Secret Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-5 text-white text-center shadow-lg mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200 mb-1">
          🎭 Từ bí ẩn cần tìm là gì?
        </div>
        <div className="text-3xl mb-2">🔍❓</div>
        <button
          type="button"
          onClick={() => playWordAudio(currentWord.word, currentWord.audioUrl)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold transition-all cursor-pointer"
        >
          <Volume2 size={14} />
          <span>Nghe âm thanh gợi ý</span>
        </button>
      </div>

      {/* Clues */}
      <div className="space-y-2.5 mb-4">
        {clues.slice(0, revealedClues).map((clue, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-3.5 border-2 border-purple-100 shadow-2xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2"
          >
            <span className="text-xl shrink-0">{clue.icon}</span>
            <div>
              <div className="text-[10px] font-black text-purple-600 uppercase tracking-wider">
                {clue.label}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                {clue.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reveal more clues button */}
      {revealedClues < 3 && (
        <button
          type="button"
          onClick={handleRevealClue}
          className="w-full mb-4 py-2.5 rounded-2xl border-2 border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Lightbulb size={14} />
          <span>Xem thêm gợi ý ({3 - revealedClues} còn lại — điểm thưởng sẽ thấp hơn)</span>
        </button>
      )}

      {/* Answer Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isTarget = opt.id === currentWord.id;
          let style =
            'bg-white border-purple-200 text-purple-950 hover:border-purple-400 hover:bg-purple-50/50';

          if (isAnswered) {
            if (isTarget) style = 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200';
            else style = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handlePick(opt)}
              disabled={isAnswered}
              className={`p-4 rounded-3xl border-3 font-black text-sm sm:text-base transition-all shadow-sm active:scale-95 cursor-pointer capitalize ${style}`}
            >
              {opt.word}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
        💡 Càng ít gợi ý, bé nhận được càng nhiều điểm thưởng đấy!
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
