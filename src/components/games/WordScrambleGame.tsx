import React, { useState, useEffect } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { AudioButton } from '../AudioButton';
import { RotateCcw, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';

interface LetterTile {
  id: string;
  char: string;
  isUsed: boolean;
}

interface WordScrambleGameProps {
  words: WordItem[];
  profile: Profile;
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

export const WordScrambleGame: React.FC<WordScrambleGameProps> = ({
  words,
  profile,
  onExit,
  onProfileUpdated,
}) => {
  const [wordQueue, setWordQueue] = useState<WordItem[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = Math.min(6, words.length);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [availableLetters, setAvailableLetters] = useState<LetterTile[]>([]);
  const [placedLetters, setPlacedLetters] = useState<(LetterTile | null)[]>([]);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);

  const setupRound = (roundNum: number, queue: WordItem[] = wordQueue) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);

    // Audio cue
    playWordAudio(target.word, target.audioUrl);

    // Split chars and scramble
    const chars = target.word.toLowerCase().split('');
    const tiles: LetterTile[] = chars.map((char, index) => ({
      id: `${char}-${index}-${Math.random()}`,
      char: char.toUpperCase(),
      isUsed: false,
    }));

    // Scramble tiles with Fisher-Yates
    const scrambled = shuffleList(tiles);
    setAvailableLetters(scrambled);
    setPlacedLetters(new Array(chars.length).fill(null));
    setStatus('playing');
    setCurrentRound(roundNum);
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

  // Click on available letter to place it
  const handleSelectLetter = (tile: LetterTile) => {
    if (tile.isUsed || status !== 'playing') return;

    // Find first empty slot
    const firstEmptyIndex = placedLetters.findIndex((slot) => slot === null);
    if (firstEmptyIndex === -1) return;

    const newPlaced = [...placedLetters];
    newPlaced[firstEmptyIndex] = tile;
    setPlacedLetters(newPlaced);

    setAvailableLetters((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, isUsed: true } : t))
    );

    // Check if word is complete
    if (firstEmptyIndex === placedLetters.length - 1) {
      checkWord(newPlaced);
    }
  };

  // Click placed letter to return it
  const handleRemoveLetter = (index: number) => {
    if (status !== 'playing') return;
    const tile = placedLetters[index];
    if (!tile) return;

    const newPlaced = [...placedLetters];
    newPlaced[index] = null;
    setPlacedLetters(newPlaced);

    setAvailableLetters((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, isUsed: false } : t))
    );
  };

  // Check spelling
  const checkWord = (currentPlaced: (LetterTile | null)[]) => {
    if (!currentWord) return;
    const spelled = currentPlaced.map((t) => t?.char || '').join('').toLowerCase();
    const target = currentWord.word.toLowerCase();

    if (spelled === target) {
      setStatus('correct');
      setScore((prev) => prev + 15);
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
        // Clear placed letters and reset status
        setPlacedLetters(new Array(target.length).fill(null));
        setAvailableLetters((prev) => prev.map((t) => ({ ...t, isUsed: false })));
        setStatus('playing');
      }, 1000);
    }
  };

  // Hint: place the first letter
  const handleHint = () => {
    if (!currentWord || status !== 'playing') return;
    const targetChar = currentWord.word[0].toUpperCase();
    const available = availableLetters.find((t) => !t.isUsed && t.char === targetChar);
    if (available && placedLetters[0] === null) {
      handleSelectLetter(available);
    }
  };

  const finishGame = (lastWasCorrect: boolean) => {
    const finalScore = score + (lastWasCorrect ? 15 : 0);
    const correctCount = correctWords.length + (lastWasCorrect ? 1 : 0);
    const accuracy = Math.round((correctCount / totalRounds) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 25 + finalScore;

    const result: GameScoreResult = {
      gameType: 'word_scramble',
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
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Xếp Chữ Thần Tốc (Chính Tả)"
        emoji="🚂"
        score={score}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onExit={onExit}
      />

      {/* Word Hint Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border-4 border-indigo-100 shadow-xl text-center mb-6 relative">
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleHint}
            title="Gợi ý chữ cái đầu"
            className="w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-700 flex items-center justify-center transition-all shadow-xs"
          >
            <Lightbulb size={18} />
          </button>
          <AudioButton word={currentWord.word} audioUrl={currentWord.audioUrl} size="md" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-2 uppercase tracking-wider">
          Gợi Ý Nghĩa
        </div>
        <h3 className="text-2xl font-black text-indigo-900 mt-1">{currentWord.meaningVi}</h3>
        <p className="text-xs text-slate-400 mt-2 italic font-serif">"{currentWord.exampleSentence}"</p>
      </div>

      {/* Target Word Slots (The Train) */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {placedLetters.map((tile, idx) => (
          <div
            key={idx}
            onClick={() => handleRemoveLetter(idx)}
            className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-3 flex items-center justify-center font-black text-xl sm:text-2xl cursor-pointer transition-all duration-200 select-none ${
              tile
                ? status === 'correct'
                  ? 'bg-emerald-500 border-emerald-600 text-white scale-105'
                  : status === 'wrong'
                  ? 'bg-rose-500 border-rose-600 text-white animate-shake'
                  : 'bg-indigo-600 border-indigo-700 text-white shadow-md'
                : 'border-dashed border-indigo-300 bg-indigo-50/40 text-slate-300 hover:bg-indigo-50'
            }`}
          >
            {tile?.char || ''}
          </div>
        ))}
      </div>

      {/* Available Letters Pool */}
      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200">
        <div className="text-xs font-bold text-slate-500 mb-3 text-center uppercase tracking-wider">
          Chạm vào các chữ cái để ghép thành từ hoàn chỉnh:
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {availableLetters.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleSelectLetter(tile)}
              disabled={tile.isUsed || status !== 'playing'}
              className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-3 font-black text-xl sm:text-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center select-none ${
                tile.isUsed
                  ? 'bg-slate-200 border-slate-300 text-slate-400 opacity-40 cursor-not-allowed scale-90'
                  : 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800 hover:bg-indigo-50 hover:scale-105'
              }`}
            >
              {tile.char}
            </button>
          ))}
        </div>
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
