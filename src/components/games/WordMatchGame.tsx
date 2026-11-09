import React, { useState, useEffect } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { AudioButton } from '../AudioButton';
import { soundManager } from '../../services/soundEffects';
import { Check, X, Sparkles } from 'lucide-react';

interface WordMatchGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

// Fisher-Yates Shuffle
function shuffleList<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const WordMatchGame: React.FC<WordMatchGameProps> = ({
  words,
  profile,
  questionCount = 10,
  onExit,
  onProfileUpdated,
}) => {
  const isInfinite = questionCount >= 9000;
  const [wordQueue, setWordQueue] = useState<WordItem[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = isInfinite ? 9999 : questionCount;
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [options, setOptions] = useState<WordItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<WordItem | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);

  // Setup round from the pre-shuffled queue
  const setupRound = (roundNum: number, queue: WordItem[] = wordQueue) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);

    // Play pronunciation automatically for sensory learning
    playWordAudio(target.word, target.audioUrl);

    // Pick 3 distractors from all other words
    const otherWords = words.filter((w) => w.id !== target.id);
    const shuffledOthers = shuffleList(otherWords);
    const distractors = shuffledOthers.slice(0, 3);
    const roundOptions = shuffleList([target, ...distractors]);
    setOptions(roundOptions);

    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentRound(roundNum);
  };

  const startNewGame = () => {
    if (words.length === 0) return;
    const shuffled = shuffleList(words);
    const selected = isInfinite ? shuffled : shuffled.slice(0, totalRounds);
    setWordQueue(selected);
    setScore(0);
    setLives(3);
    setCorrectWords([]);
    setWrongWords([]);
    setGameResult(null);
    setupRound(1, selected);
  };

  useEffect(() => {
    startNewGame();
  }, [words]);

  const handleSelect = (option: WordItem) => {
    if (isAnswered || !currentWord) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option.id === currentWord.id;

    if (isCorrect) {
      soundManager.playCorrect();
      setScore((prev) => prev + 10);
      setCorrectWords((prev) => [...prev, currentWord.word]);
      playWordAudio(currentWord.word, currentWord.audioUrl);
    } else {
      soundManager.playWrong();
      setLives((prev) => Math.max(0, prev - 1));
      setWrongWords((prev) => [...prev, currentWord.word]);
    }

    setTimeout(() => {
      const isGameOver = lives - (isCorrect ? 0 : 1) <= 0;
      const isCompleted = !isInfinite && currentRound >= totalRounds;

      if (isGameOver || isCompleted) {
        finishGame(isCorrect);
      } else {
        setupRound(currentRound + 1);
      }
    }, 1200);
  };

  const finishGame = (lastWasCorrect: boolean, isEarlyExit = false) => {
    const finalScore = score + (lastWasCorrect ? 10 : 0);
    const correctCount = correctWords.length + (lastWasCorrect ? 1 : 0);
    const totalAttempted = isEarlyExit ? (correctWords.length + wrongWords.length) : currentRound;
    const accuracy = totalAttempted > 0 ? Math.min(100, Math.round((correctCount / totalAttempted) * 100)) : 100;
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 20 + finalScore;

    const result: GameScoreResult = {
      gameType: 'word_match',
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

  if (!currentWord) return null;

  const handleExitGame = () => {
    const completedQuestions = correctWords.length + wrongWords.length;
    if (isInfinite && completedQuestions > 0) {
      finishGame(false, true);
    } else {
      onExit();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Bong Bóng Bắt Từ Vựng"
        emoji="🎈"
        score={score}
        lives={lives}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onExit={handleExitGame}
      />

      {/* Target Word Display Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-indigo-100 shadow-xl text-center relative overflow-hidden mb-6">
        <div className="absolute top-3 right-3">
          <AudioButton word={currentWord.word} audioUrl={currentWord.audioUrl} size="lg" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-3 uppercase tracking-wider">
          Từ Vựng Cần Đoán
        </div>

        <h3 className="text-3xl sm:text-4xl font-black text-slate-900 capitalize tracking-wide font-sans">
          {currentWord.word}
        </h3>

        <div className="text-sm font-semibold text-indigo-600 mt-1">
          {currentWord.phonetic}
        </div>

        <p className="text-xs text-slate-400 mt-3 font-medium">
          Chọn nghĩa tiếng Việt chính xác của từ vựng ở trên 👇
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {options.map((opt) => {
          const isSelected = selectedOption?.id === opt.id;
          const isTarget = opt.id === currentWord.id;

          let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40';

          if (isAnswered) {
            if (isTarget) {
              btnStyle = 'bg-emerald-500 border-emerald-600 text-white shadow-lg ring-4 ring-emerald-200 scale-102';
            } else if (isSelected) {
              btnStyle = 'bg-rose-500 border-rose-600 text-white shadow-lg ring-4 ring-rose-200';
            } else {
              btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              disabled={isAnswered}
              className={`p-4 sm:p-5 rounded-3xl border-3 font-bold text-base sm:text-lg transition-all duration-200 flex items-center justify-between shadow-sm active:scale-98 ${btnStyle}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-left font-bold text-base sm:text-lg">{opt.meaningVi}</span>
                {isAnswered && isTarget && (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 ml-2">
                    <Check size={18} strokeWidth={3} />
                  </div>
                )}
                {isAnswered && isSelected && !isTarget && (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 ml-2">
                    <X size={18} strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {gameResult && (
        <GameVictoryModal
          isOpen={true}
          result={gameResult}
          onPlayAgain={startNewGame}
          onHome={onExit}
        />
      )}
    </div>
  );
};
