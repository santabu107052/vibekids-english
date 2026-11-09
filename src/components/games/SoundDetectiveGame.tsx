import React, { useState, useEffect } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { AudioButton } from '../AudioButton';
import { Volume2 } from 'lucide-react';

interface SoundDetectiveGameProps {
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

export const SoundDetectiveGame: React.FC<SoundDetectiveGameProps> = ({
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
  const [targetWord, setTargetWord] = useState<WordItem | null>(null);
  const [options, setOptions] = useState<WordItem[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answeredCorrect, setAnsweredCorrect] = useState<boolean | null>(null);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);

  const setupRound = (roundNum: number, queue: WordItem[] = wordQueue) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setTargetWord(target);

    // Pick 3 distractors from all other words
    const otherWords = words.filter((w) => w.id !== target.id);
    const shuffledOthers = shuffleList(otherWords);
    const distractors = shuffledOthers.slice(0, 3);
    const roundOptions = shuffleList([target, ...distractors]);
    setOptions(roundOptions);

    setIsAnswered(false);
    setAnsweredCorrect(null);
    setCurrentRound(roundNum);

    // Auto play mystery audio
    setTimeout(() => {
      playWordAudio(target.word, target.audioUrl);
    }, 200);
  };

  const startNewGame = () => {
    if (words.length === 0) return;
    const shuffled = shuffleList(words);
    const selected = isInfinite ? shuffled : shuffled.slice(0, totalRounds);
    setWordQueue(selected);
    setScore(0);
    setCorrectWords([]);
    setWrongWords([]);
    setGameResult(null);
    setupRound(1, selected);
  };

  useEffect(() => {
    startNewGame();
  }, [words]);

  const handlePlayAudio = () => {
    if (targetWord) {
      playWordAudio(targetWord.word, targetWord.audioUrl);
    }
  };

  const handleSelect = (option: WordItem) => {
    if (isAnswered || !targetWord) return;

    setIsAnswered(true);
    const isCorrect = option.id === targetWord.id;
    setAnsweredCorrect(isCorrect);

    if (isCorrect) {
      setScore((prev) => prev + 15);
      setCorrectWords((prev) => [...prev, targetWord.word]);
      playWordAudio(targetWord.word, targetWord.audioUrl);
    } else {
      setWrongWords((prev) => [...prev, targetWord.word]);
    }

    setTimeout(() => {
      if (isInfinite || currentRound < totalRounds) {
        setupRound(currentRound + 1);
      } else {
        finishGame(isCorrect);
      }
    }, 1200);
  };

  const finishGame = (lastWasCorrect: boolean) => {
    const finalScore = score + (lastWasCorrect ? 15 : 0);
    const correctCount = correctWords.length + (lastWasCorrect ? 1 : 0);
    const effectiveTotal = isInfinite ? Math.max(1, currentRound) : totalRounds;
    const accuracy = Math.round((correctCount / effectiveTotal) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 30 + finalScore;

    const result: GameScoreResult = {
      gameType: 'sound_detective',
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

  if (!targetWord) return null;

  const handleExitGame = () => {
    if (isInfinite && currentRound > 1) {
      finishGame(false);
    } else {
      onExit();
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Thám Tử Âm Thanh"
        emoji="🕵️"
        score={score}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onExit={handleExitGame}
      />

      <div className="text-center py-8">
        <button
          onClick={handlePlayAudio}
          className="w-32 h-32 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center text-white mb-4 animate-pulse mx-auto"
        >
          <Volume2 size={64} />
        </button>
        <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2 uppercase tracking-wider">
          Nghe Phát Âm Bản Ngữ
        </div>
        <p className="text-sm font-bold text-slate-600">
          Bé hãy lắng nghe và chọn nghĩa tiếng Việt chính xác nhé! 👇
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {options.map((opt) => {
          let stateClass = 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/30';
          if (isAnswered) {
            if (opt.id === targetWord.id) stateClass = 'bg-emerald-500 border-emerald-600 text-white shadow-lg ring-4 ring-emerald-200 scale-102';
            else if (answeredCorrect === false && opt.id === targetWord.id) stateClass = 'opacity-50';
            else stateClass = 'opacity-30 border-slate-200 bg-slate-50';
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              disabled={isAnswered}
              className={`p-5 sm:p-6 rounded-3xl border-3 font-bold text-base sm:text-lg transition-all shadow-sm flex flex-col items-center justify-center text-center select-none active:scale-98 min-h-[90px] ${stateClass}`}
            >
              <div>{opt.meaningVi}</div>
              {isAnswered && opt.id === targetWord.id && (
                <div className="text-xs font-semibold mt-1 opacity-90 uppercase tracking-wider">
                  ({opt.word})
                </div>
              )}
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
