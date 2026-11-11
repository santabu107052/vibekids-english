import React, { useState, useEffect, useCallback } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../services/soundEffects';
import { Lightbulb, Volume2 } from 'lucide-react';

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
 * - 3 gợi ý hé lộ DẦN: (1) Nhóm/chủ đề → (2) Câu ví dụ che từ → (3) ĐỊNH NGHĨA TIẾNG ANH
 * - 🔊 Phát âm là GỢI Ý CUỐI CÙNG (gợi ý 4) — vì nghe phát âm sẽ lộ đáp án ngay
 * - Bé đoán đúng với ít gợi ý hơn → được điểm cao hơn
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
  const [revealedClues, setRevealedClues] = useState(1); // 1..3 = text clues, 4th = audio
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
    const maskedSentence = word.exampleSentence.replace(new RegExp(word.word, 'gi'), '_____');
    return [
      {
        label: 'Gợi ý 1 — Chủ đề',
        icon: '🗂️',
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
    // ❌ KHÔNG phát âm từ khi vào câu — phát âm chỉ là gợi ý cuối
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
    if (revealedClues < 4) {
      setRevealedClues((prev) => prev + 1);
      soundManager.playCorrect();
      // 🔊 Gợi ý thứ 4 = phát âm (gợi ý cuối cùng, sẽ lộ đáp án)
      if (revealedClues === 3 && currentWord) {
        playWordAudio(currentWord.word, currentWord.audioUrl);
      }
    }
  };

  const handlePlayAudioClue = () => {
    if (currentWord) {
      playWordAudio(currentWord.word, currentWord.audioUrl);
    }
  };

  const handlePick = (option: WordItem) => {
    if (isAnswered || !currentWord) return;
    const isCorrect = option.id === currentWord.id;

    if (isCorrect) {
      soundManager.playCorrect();
      setIsAnswered(true);
      // Ít gợi ý hơn = điểm cao hơn (thang 10 → 3)
      const points = Math.max(3, 11 - revealedClues * 2);
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
  const textCluesShown = Math.min(revealedClues, 3);
  const audioClueRevealed = revealedClues >= 4;

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
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-5 text-white text-center shadow-xl mb-4">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15" />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200 mb-2">
            🎭 Từ bí ẩn cần tìm là gì?
          </div>
          <div className="text-4xl mb-1">🔍</div>
          <div className="text-[11px] text-purple-100 font-medium">
            Đã mở {textCluesShown}/3 gợi ý chữ
            {audioClueRevealed && ' + 1 gợi ý âm thanh'} — càng ít gợi ý điểm càng cao!
          </div>
        </div>
      </div>

      {/* Text Clues */}
      <div className="space-y-2.5 mb-3">
        {clues.slice(0, textCluesShown).map((clue, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-3.5 border-2 border-purple-100 shadow-2xs flex items-start gap-3"
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

      {/* Audio Clue — FINAL clue (only after all 3 text clues) */}
      {audioClueRevealed && (
        <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center gap-3">
          <span className="text-xl">🔊</span>
          <div className="flex-1">
            <div className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
              Gợi ý 4 — Phát âm (gợi ý cuối cùng)
            </div>
            <div className="text-xs font-semibold text-amber-900 mt-0.5">
              Nghe kỹ phát âm để chọn đáp án đúng nhé!
            </div>
          </div>
          <button
            type="button"
            onClick={handlePlayAudioClue}
            className="shrink-0 w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Volume2 size={18} />
          </button>
        </div>
      )}

      {/* Reveal more clues button */}
      {revealedClues < 4 && (
        <button
          type="button"
          onClick={handleRevealClue}
          className="w-full mb-4 py-2.5 rounded-2xl border-2 border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Lightbulb size={14} />
          <span>
            {revealedClues < 3
              ? `Xem thêm gợi ý chữ (${3 - revealedClues} còn lại)`
              : 'Mở gợi ý phát âm (gợi ý cuối cùng)'}
          </span>
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
