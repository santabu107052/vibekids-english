import React, { useState, useEffect } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { AudioButton } from '../AudioButton';

interface SpellingBeeGameProps {
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

export const SpellingBeeGame: React.FC<SpellingBeeGameProps> = ({
  words,
  profile,
  questionCount = 10,
  onExit,
  onProfileUpdated,
}) => {
  const [wordQueue, setWordQueue] = useState<WordItem[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = Math.min(questionCount, words.length);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);

  const setupRound = (roundNum: number, queue: WordItem[] = wordQueue) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);
    setInput('');
    setStatus('playing');
    setCurrentRound(roundNum);
    // Auto play audio
    playWordAudio(target.word, target.audioUrl);
  };

  const startNewGame = () => {
    if (words.length === 0) return;
    const shuffled = shuffleList(words);
    setWordQueue(shuffled);
    setScore(0);
    setCorrectWords([]);
    setWrongWords([]);
    setGameResult(null);
    setupRound(1, shuffled);
  };

  useEffect(() => {
    startNewGame();
  }, [words]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'playing' || !currentWord) return;

    if (input.toLowerCase().trim() === currentWord.word.toLowerCase()) {
      setStatus('correct');
      setScore((prev) => prev + 20);
      setCorrectWords((prev) => [...prev, currentWord.word]);
      playWordAudio(currentWord.word, currentWord.audioUrl);

      setTimeout(() => {
        if (currentRound >= totalRounds) {
          finishGame(true);
        } else {
          setupRound(currentRound + 1);
        }
      }, 1200);
    } else {
      setStatus('wrong');
      setWrongWords((prev) => [...prev, currentWord.word]);
      setTimeout(() => {
        setStatus('playing');
        setInput('');
      }, 1000);
    }
  };

  const finishGame = (lastWasCorrect: boolean) => {
    const finalScore = score + (lastWasCorrect ? 20 : 0);
    const correctCount = correctWords.length + (lastWasCorrect ? 1 : 0);
    const accuracy = Math.round((correctCount / totalRounds) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 40 + finalScore;

    const result: GameScoreResult = {
      gameType: 'spelling_bee',
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

  return (
    <div className="max-w-xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Thử Thách Chính Tả"
        emoji="🐝"
        score={score}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onExit={onExit}
      />

      <div className="text-center py-6 bg-white rounded-3xl p-6 border-4 border-indigo-100 shadow-xl mb-6">
        <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-3 uppercase tracking-wider">
          Nghe & Gõ Lại Từ
        </div>
        <div className="flex justify-center mb-4">
          <AudioButton word={currentWord.word} audioUrl={currentWord.audioUrl} size="lg" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          Nghĩa là: <span className="font-bold text-slate-800 italic">{currentWord.meaningVi}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Gõ chính tả từ vựng..."
          className={`flex-1 p-4 rounded-2xl border-4 text-center font-bold text-2xl uppercase tracking-widest focus:outline-hidden ${
            status === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
            status === 'wrong' ? 'border-rose-500 bg-rose-50 text-rose-700 animate-shake' :
            'border-slate-200 focus:border-indigo-500'
          }`}
          autoFocus
          autoComplete="off"
        />
        <button
          type="submit"
          className="px-6 rounded-2xl bg-indigo-600 text-white font-black text-lg"
        >
          OK
        </button>
      </form>

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
