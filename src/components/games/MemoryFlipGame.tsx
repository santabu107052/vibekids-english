import React, { useState, useEffect } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { AudioButton } from '../AudioButton';

interface MemoryCard {
  id: string;
  wordId: string;
  word: string;
  type: 'word' | 'meaning';
  content: string;
  subContent?: string;
  emoji?: string;
  audioUrl?: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryFlipGameProps {
  words: WordItem[];
  profile: Profile;
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

export const MemoryFlipGame: React.FC<MemoryFlipGameProps> = ({
  words,
  profile,
  questionCount = 10,
  onExit,
  onProfileUpdated,
}) => {
  const isInfinite = questionCount >= 9000;
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MemoryCard[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [totalPairs, setTotalPairs] = useState<number>(6);
  const [turns, setTurns] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);

  // Initialize cards
  const initGame = () => {
    // For Memory grid, 4 to 6 pairs per screen is visually perfect
    const pairCount = Math.min(6, words.length);
    setTotalPairs(pairCount);

    const shuffledWords = [...words].sort(() => 0.5 - Math.random()).slice(0, pairCount);
    
    const newCards: MemoryCard[] = [];
    shuffledWords.forEach((w) => {
      // Card 1: English word
      newCards.push({
        id: `${w.id}-en`,
        wordId: w.id,
        word: w.word,
        type: 'word',
        content: w.word,
        subContent: w.phonetic,
        audioUrl: w.audioUrl,
        isFlipped: false,
        isMatched: false,
      });

      // Card 2: Vietnamese meaning + emoji
      newCards.push({
        id: `${w.id}-vi`,
        wordId: w.id,
        word: w.word,
        type: 'meaning',
        content: w.meaningVi,
        emoji: w.emoji,
        audioUrl: w.audioUrl,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle cards
    setCards(newCards.sort(() => 0.5 - Math.random()));
    setSelectedCards([]);
    setMatchedPairs(0);
    setTurns(0);
    setIsChecking(false);
    setGameResult(null);
  };

  useEffect(() => {
    initGame();
  }, [words]);

  const handleCardClick = (card: MemoryCard) => {
    if (isChecking || card.isFlipped || card.isMatched) return;

    // Flip card
    const updatedCards = cards.map((c) =>
      c.id === card.id ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    // Always pronounce the English word for whichever card is flipped
    playWordAudio(card.word, card.audioUrl);

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsChecking(true);
      setTurns((prev) => prev + 1);

      const [first, second] = newSelected;
      const isMatch = first.wordId === second.wordId && first.type !== second.type;

      setTimeout(() => {
        if (isMatch) {
          // Play pronunciation
          playWordAudio(first.word, first.audioUrl || second.audioUrl);

          setCards((prev) =>
            prev.map((c) =>
              c.wordId === first.wordId ? { ...c, isMatched: true, isFlipped: true } : c
            )
          );
          setMatchedPairs((prev) => {
            const next = prev + 1;
            if (next === totalPairs) {
              if (isInfinite) {
                // In infinite mode, reload another fresh set of cards!
                setTimeout(() => {
                  initGame();
                  setMatchedPairs(0);
                }, 800);
              } else {
                handleGameOver(updatedCards);
              }
            }
            return next;
          });
        } else {
          // Flip back
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c
            )
          );
        }
        setSelectedCards([]);
        setIsChecking(false);
      }, 900);
    }
  };

  const handleGameOver = (_finalCards: MemoryCard[]) => {
    const accuracy = Math.round((totalPairs / Math.max(turns + 1, totalPairs)) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 25;

    const uniqueWords = Array.from(new Set(cards.map((c) => c.word)));

    const result: GameScoreResult = {
      gameType: 'memory_flip',
      starsEarned: stars,
      xpEarned: xp,
      accuracy,
      correctWords: uniqueWords,
      wrongWords: [],
    };

    recordGameResult(profile.id, result);
    onProfileUpdated();
    setGameResult(result);
  };

  const handleExitGame = () => {
    if (isInfinite && matchedPairs > 0) {
      handleGameOver(cards);
    } else {
      onExit();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Lật Thẻ Mặt Chữ & Nghĩa"
        emoji="🃏"
        score={matchedPairs * 10}
        currentRound={matchedPairs}
        totalRounds={isInfinite ? 9999 : totalPairs}
        onExit={handleExitGame}
      />

      <div className="mb-4 flex items-center justify-between text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
        <div>
          <span>Số lượt lật: </span>
          <span className="font-bold text-slate-800">{turns}</span>
        </div>
        <div>
          <span>Cặp đã tìm thấy: </span>
          <span className="font-bold text-indigo-600">{matchedPairs} / {totalPairs}</span>
        </div>
        <button
          onClick={initGame}
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          Xáo bài lại
        </button>
      </div>

      {/* Cards Grid */}
      <div className={`grid gap-3 sm:gap-4 ${totalPairs === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4'}`}>
        {cards.map((card) => {
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`h-32 sm:h-36 rounded-3xl p-3 border-3 cursor-pointer select-none transition-all duration-300 flex flex-col items-center justify-center text-center relative ${
                card.isMatched
                  ? 'border-emerald-300 bg-emerald-50/80 scale-95 opacity-80'
                  : card.isFlipped
                  ? 'border-indigo-400 bg-white shadow-lg ring-4 ring-indigo-100 scale-102'
                  : 'border-indigo-200 bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-102 shadow-md'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <div className="flex flex-col items-center justify-center animate-in zoom-in-90">
                  {card.emoji && <span className="text-3xl mb-1">{card.emoji}</span>}
                  <span className={`font-black capitalize leading-tight ${card.type === 'word' ? 'text-lg sm:text-xl text-indigo-900 font-sans' : 'text-sm sm:text-base text-slate-800'}`}>
                    {card.content}
                  </span>
                  {card.subContent && (
                    <span className="text-[11px] font-semibold text-indigo-500 mt-1">
                      {card.subContent}
                    </span>
                  )}
                  {card.type === 'word' && (
                    <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                      <AudioButton word={card.word} audioUrl={card.audioUrl} size="sm" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-white/90">
                  <span className="text-3xl font-black mb-1">?</span>
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">VibeKids</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {gameResult && (
        <GameVictoryModal
          isOpen={true}
          result={gameResult}
          onPlayAgain={initGame}
          onHome={onExit}
        />
      )}
    </div>
  );
};
