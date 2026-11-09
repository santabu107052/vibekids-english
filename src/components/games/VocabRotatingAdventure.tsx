import React, { useState, useEffect } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { Check, X, Volume2, Sparkles, ArrowRight, Lightbulb, RotateCcw } from 'lucide-react';

interface VocabRotatingAdventureProps {
  words: WordItem[];
  allWords: WordItem[];
  profile: Profile;
  mode: 'review' | 'new' | 'mixed';
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

export type MiniGameVariant = 'memory_flip' | 'bubble_match' | 'sound_detective' | 'scramble' | 'spelling';

interface MiniFlipCard {
  id: string;
  pairKey: string;
  type: 'word' | 'meaning';
  text: string;
  sub?: string;
  emoji?: string;
  isFlipped: boolean;
  isMatched: boolean;
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

export const VocabRotatingAdventure: React.FC<VocabRotatingAdventureProps> = ({
  words,
  allWords,
  profile,
  mode,
  questionCount = 10,
  onExit,
  onProfileUpdated,
}) => {
  const [wordQueue, setWordQueue] = useState<WordItem[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = Math.min(questionCount, words.length);

  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [currentVariant, setCurrentVariant] = useState<MiniGameVariant>('memory_flip');
  const [score, setScore] = useState(0);

  // States for Memory Flip (Lật thẻ mặt chữ và nghĩa)
  const [memoryCards, setMemoryCards] = useState<MiniFlipCard[]>([]);
  const [selectedMemoryCards, setSelectedMemoryCards] = useState<MiniFlipCard[]>([]);

  // States for Bubble Match & Sound Detective
  const [options, setOptions] = useState<WordItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<WordItem | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // States for Word Scramble
  const [scrambleLetters, setScrambleLetters] = useState<{ id: string; char: string; used: boolean }[]>([]);
  const [placedLetters, setPlacedLetters] = useState<{ id: string; char: string }[]>([]);

  // States for Spelling Bee
  const [typingInput, setTypingInput] = useState('');

  // Results
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);

  // 5 Mini-Games rotating across questions
  const VARIANT_CYCLE: MiniGameVariant[] = ['memory_flip', 'bubble_match', 'sound_detective', 'scramble', 'spelling'];

  const setupRound = (roundNum: number, queue: WordItem[] = wordQueue) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);

    // Pick rotating variant for this question
    const variant = VARIANT_CYCLE[(roundNum - 1) % VARIANT_CYCLE.length];
    setCurrentVariant(variant);

    // Prepare distractors
    const poolForDistractors = allWords.length >= 4 ? allWords : words;
    const otherWords = poolForDistractors.filter((w) => w.id !== target.id && w.word !== target.word);
    const shuffledOthers = shuffleList(otherWords);
    const distractors = shuffledOthers.slice(0, 3);
    const roundOptions = shuffleList([target, ...distractors]);
    setOptions(roundOptions);

    // Prepare Memory Flip Cards (2 pairs = 4 cards)
    const distractorWord = shuffledOthers[0] || target;
    const cardA: MiniFlipCard = {
      id: `en-${target.id}`,
      pairKey: target.id,
      type: 'word',
      text: target.word,
      sub: target.phonetic,
      isFlipped: false,
      isMatched: false,
    };
    const cardB: MiniFlipCard = {
      id: `vi-${target.id}`,
      pairKey: target.id,
      type: 'meaning',
      text: target.meaningVi,
      emoji: target.emoji,
      isFlipped: false,
      isMatched: false,
    };
    const cardC: MiniFlipCard = {
      id: `en-${distractorWord.id}`,
      pairKey: distractorWord.id,
      type: 'word',
      text: distractorWord.word,
      sub: distractorWord.phonetic,
      isFlipped: false,
      isMatched: false,
    };
    const cardD: MiniFlipCard = {
      id: `vi-${distractorWord.id}`,
      pairKey: distractorWord.id,
      type: 'meaning',
      text: distractorWord.meaningVi,
      emoji: distractorWord.emoji,
      isFlipped: false,
      isMatched: false,
    };
    setMemoryCards(shuffleList([cardA, cardB, cardC, cardD]));
    setSelectedMemoryCards([]);

    // Prepare scramble letters
    const chars = target.word.toLowerCase().split('');
    const tiles = chars.map((ch, idx) => ({ id: `${ch}-${idx}-${Math.random()}`, char: ch.toUpperCase(), used: false }));
    setScrambleLetters(shuffleList(tiles));
    setPlacedLetters([]);

    // Prepare spelling input
    setTypingInput('');
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentRound(roundNum);

    // Audio cue
    setTimeout(() => {
      playWordAudio(target.word, target.audioUrl);
    }, 250);
  };

  const startNewGame = () => {
    if (words.length === 0) return;
    const shuffled = shuffleList(words);
    const selected = shuffled.slice(0, totalRounds);
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

  // Answer handler
  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isAnswered || !currentWord) return;
    setIsAnswered(true);

    if (isCorrect) {
      setScore((prev) => prev + 20);
      setCorrectWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, true);
    } else {
      setWrongWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false);
    }

    setTimeout(() => {
      if (currentRound < totalRounds) {
        setupRound(currentRound + 1);
      } else {
        finishGame(isCorrect);
      }
    }, 1200);
  };

  // Memory card click handler
  const handleMemoryCardClick = (card: MiniFlipCard) => {
    if (isAnswered || card.isFlipped || card.isMatched || selectedMemoryCards.length >= 2) return;

    const newCards = memoryCards.map((c) => (c.id === card.id ? { ...c, isFlipped: true } : c));
    setMemoryCards(newCards);
    const newSelected = [...selectedMemoryCards, card];
    setSelectedMemoryCards(newSelected);

    if (newSelected.length === 2) {
      const [c1, c2] = newSelected;
      if (c1.pairKey === c2.pairKey && c1.type !== c2.type) {
        // MATCHED!
        if (c1.pairKey === currentWord?.id) {
          playWordAudio(currentWord.word, currentWord.audioUrl);
        }
        setTimeout(() => {
          setMemoryCards((prev) => prev.map((c) => (c.pairKey === c1.pairKey ? { ...c, isMatched: true } : c)));
          setSelectedMemoryCards([]);

          // If target word matched -> win point!
          if (c1.pairKey === currentWord?.id) {
            handleAnswerSubmit(true);
          }
        }, 500);
      } else {
        // MISMATCH
        setTimeout(() => {
          setMemoryCards((prev) => prev.map((c) => (!c.isMatched ? { ...c, isFlipped: false } : c)));
          setSelectedMemoryCards([]);
        }, 800);
      }
    }
  };

  const handleTileClick = (tile: { id: string; char: string; used: boolean }) => {
    if (tile.used || isAnswered || !currentWord) return;
    const nextPlaced = [...placedLetters, tile];
    setPlacedLetters(nextPlaced);
    setScrambleLetters(scrambleLetters.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));

    if (nextPlaced.length === currentWord.word.length) {
      const spelled = nextPlaced.map((t) => t.char).join('').toLowerCase();
      handleAnswerSubmit(spelled === currentWord.word.toLowerCase());
    }
  };

  const handleRemovePlaced = (index: number) => {
    if (isAnswered) return;
    const removed = placedLetters[index];
    setPlacedLetters(placedLetters.filter((_, i) => i !== index));
    setScrambleLetters(scrambleLetters.map((t) => (t.id === removed.id ? { ...t, used: false } : t)));
  };

  const handleSpellingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typingInput.trim() || isAnswered || !currentWord) return;
    handleAnswerSubmit(typingInput.trim().toLowerCase() === currentWord.word.toLowerCase());
  };

  const finishGame = (lastIsCorrect: boolean) => {
    const finalScore = score + (lastIsCorrect ? 20 : 0);
    const finalCorrectCount = correctWords.length + (lastIsCorrect ? 1 : 0);
    const accuracy = Math.round((finalCorrectCount / totalRounds) * 100);

    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = finalScore + stars * 10;

    const result: GameScoreResult = {
      gameType: 'vocab_adventure',
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

  const modeLabel = mode === 'review' ? 'Ôn Từ Đã Học' : mode === 'new' ? 'Học Từ Mới' : 'Vừa Ôn Vừa Học';

  const getVariantTitle = () => {
    switch (currentVariant) {
      case 'memory_flip':
        return { name: 'Lật Thẻ Trí Nhớ (Mặt Chữ & Nghĩa)', icon: '🃏', instruction: 'Lật và ghép cặp thẻ: Từ tiếng Anh với Nghĩa tiếng Việt tương ứng!' };
      case 'bubble_match':
        return { name: 'Bong Bóng Bắt Từ', icon: '🎈', instruction: 'Chọn nghĩa tiếng Việt chính xác của từ vựng:' };
      case 'sound_detective':
        return { name: 'Thám Tử Âm Thanh', icon: '🕵️', instruction: 'Lắng nghe phát âm và chọn nghĩa tiếng Việt:' };
      case 'scramble':
        return { name: 'Xếp Chữ Thần Tốc', icon: '🚂', instruction: 'Chạm các chữ cái để ghép thành từ tiếng Anh:' };
      case 'spelling':
        return { name: 'Thử Thách Chính Tả', icon: '🐝', instruction: 'Nghe phát âm và gõ lại từ vựng chính xác:' };
    }
  };

  const variantInfo = getVariantTitle();

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title={`Chinh Phục Từ Vựng (${modeLabel})`}
        emoji="⚡"
        score={score}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onExit={onExit}
      />

      {/* Dynamic Mini-Game Indicator Banner */}
      <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 mb-5 text-xs font-bold shadow-2xs">
        <span className="flex items-center gap-1.5">
          <span className="text-base">{variantInfo.icon}</span>
          <span>Câu {currentRound}: <strong className="text-indigo-700">{variantInfo.name}</strong></span>
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[11px]">
          Luân phiên 5 Game 🔄
        </span>
      </div>

      {/* ======================================================== */}
      {/* VARIANT 0: MEMORY FLIP (Lật thẻ mặt chữ & nghĩa)          */}
      {/* ======================================================== */}
      {currentVariant === 'memory_flip' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border-4 border-amber-100 shadow-xl text-center">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Mục tiêu vòng này</div>
            <h3 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
              <span>{currentWord.emoji}</span>
              <span className="capitalize">{currentWord.word}</span>
              <span className="text-sm font-semibold text-slate-400 font-mono">({currentWord.meaningVi})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">{variantInfo.instruction}</p>
          </div>

          {/* 2x2 Grid of Flip Cards */}
          <div className="grid grid-cols-2 gap-4">
            {memoryCards.map((card) => {
              const isOpen = card.isFlipped || card.isMatched;

              return (
                <div
                  key={card.id}
                  onClick={() => handleMemoryCardClick(card)}
                  className={`h-36 rounded-3xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 shadow-md select-none active:scale-95 border-4 ${
                    card.isMatched
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-4 ring-emerald-100'
                      : isOpen
                      ? 'bg-white border-indigo-400 text-indigo-950 shadow-indigo-100 scale-102'
                      : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 border-white text-white hover:opacity-90'
                  }`}
                >
                  {isOpen ? (
                    <div className="animate-in zoom-in-75 space-y-1">
                      {card.emoji && <div className="text-3xl mb-1">{card.emoji}</div>}
                      <div className="font-black text-lg capitalize">{card.text}</div>
                      {card.sub && <div className="text-xs font-mono text-indigo-500">{card.sub}</div>}
                      {card.isMatched && (
                        <div className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1 mt-1">
                          <Check size={14} /> Chính xác
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <div className="text-4xl animate-pulse">🃏</div>
                      <div className="text-xs font-black text-white/90 uppercase tracking-wider">Chạm để lật</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 1: BUBBLE MATCH (Bong bóng bắt từ)                */}
      {/* ======================================================== */}
      {currentVariant === 'bubble_match' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-4 border-indigo-100 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => playWordAudio(currentWord.word, currentWord.audioUrl)}
                className="w-10 h-10 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs cursor-pointer"
              >
                <Volume2 size={20} />
              </button>
            </div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Từ Vựng Tiếng Anh</div>
            <h3 className="text-4xl font-black text-slate-900 capitalize tracking-wide font-sans">{currentWord.word}</h3>
            <div className="text-sm font-semibold text-indigo-500 mt-1">{currentWord.phonetic}</div>
            <p className="text-xs text-slate-400 mt-3">{variantInfo.instruction}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {options.map((opt) => {
              const isSelected = selectedOption?.id === opt.id;
              const isTarget = opt.id === currentWord.id;
              let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20';

              if (isAnswered) {
                if (isTarget) btnStyle = 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 shadow-md';
                else if (isSelected) btnStyle = 'bg-rose-500 border-rose-600 text-white ring-4 ring-rose-200';
                else btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedOption(opt);
                    handleAnswerSubmit(opt.id === currentWord.id);
                  }}
                  disabled={isAnswered}
                  className={`p-5 rounded-3xl border-3 font-bold text-base transition-all flex items-center justify-between shadow-2xs active:scale-98 cursor-pointer ${btnStyle}`}
                >
                  <span className="text-left font-bold text-base sm:text-lg">{opt.meaningVi}</span>
                  {isAnswered && isTarget && <Check size={20} className="text-white shrink-0 ml-2" />}
                  {isAnswered && isSelected && !isTarget && <X size={20} className="text-white shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 2: SOUND DETECTIVE (Thám tử âm thanh)             */}
      {/* ======================================================== */}
      {currentVariant === 'sound_detective' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-4 border-indigo-100 shadow-xl text-center">
            <button
              onClick={() => playWordAudio(currentWord.word, currentWord.audioUrl)}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:scale-105 active:scale-95 transition-all text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200 animate-pulse cursor-pointer"
            >
              <Volume2 size={48} />
            </button>
            <p className="text-sm font-bold text-slate-700">Chạm vào loa để nghe lại âm thanh</p>
            <p className="text-xs text-slate-400 mt-1">{variantInfo.instruction}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {options.map((opt) => {
              const isSelected = selectedOption?.id === opt.id;
              const isTarget = opt.id === currentWord.id;
              let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20';

              if (isAnswered) {
                if (isTarget) btnStyle = 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 shadow-md';
                else if (isSelected) btnStyle = 'bg-rose-500 border-rose-600 text-white ring-4 ring-rose-200';
                else btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedOption(opt);
                    handleAnswerSubmit(opt.id === currentWord.id);
                  }}
                  disabled={isAnswered}
                  className={`p-5 rounded-3xl border-3 font-bold text-base transition-all flex flex-col items-center justify-center text-center shadow-2xs active:scale-98 cursor-pointer ${btnStyle}`}
                >
                  <span className="font-bold text-base sm:text-lg">{opt.meaningVi}</span>
                  {isAnswered && isTarget && (
                    <span className="text-xs font-semibold mt-1 opacity-90 uppercase">({opt.word})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 3: WORD SCRAMBLE (Xếp chữ thần tốc)               */}
      {/* ======================================================== */}
      {currentVariant === 'scramble' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-4 border-indigo-100 shadow-xl text-center relative">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => playWordAudio(currentWord.word, currentWord.audioUrl)}
                className="w-10 h-10 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center cursor-pointer shadow-xs"
              >
                <Volume2 size={20} />
              </button>
            </div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Nghĩa Cần Ghép</div>
            <h3 className="text-2xl font-black text-indigo-900">{currentWord.meaningVi}</h3>
            <p className="text-xs text-slate-400 mt-2 italic">"{currentWord.exampleSentence}"</p>
          </div>

          {/* Placed letters slot */}
          <div className="flex flex-wrap items-center justify-center gap-2 min-h-16 p-3 bg-white rounded-3xl border-2 border-dashed border-indigo-200">
            {placedLetters.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Chạm vào các chữ cái bên dưới để xếp từ...</span>
            ) : (
              placedLetters.map((tile, idx) => (
                <button
                  key={`${tile.id}-${idx}`}
                  onClick={() => handleRemovePlaced(idx)}
                  disabled={isAnswered}
                  className="w-11 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-md flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
                >
                  {tile.char}
                </button>
              ))
            )}
          </div>

          {/* Scramble letters choices */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {scrambleLetters.map((tile) => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                disabled={tile.used || isAnswered}
                className={`w-12 h-13 rounded-2xl font-black text-xl border-3 shadow-xs transition-all cursor-pointer ${
                  tile.used
                    ? 'bg-slate-100 border-slate-200 text-slate-300 opacity-40 cursor-not-allowed'
                    : 'bg-white border-indigo-200 hover:border-indigo-500 text-indigo-950 active:scale-95 hover:bg-indigo-50'
                }`}
              >
                {tile.char}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 4: SPELLING BEE (Thử thách chính tả)               */}
      {/* ======================================================== */}
      {currentVariant === 'spelling' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-4 border-indigo-100 shadow-xl text-center">
            <button
              onClick={() => playWordAudio(currentWord.word, currentWord.audioUrl)}
              className="w-20 h-20 rounded-full bg-linear-to-tr from-rose-500 to-pink-500 hover:scale-105 active:scale-95 transition-all text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-200 cursor-pointer"
            >
              <Volume2 size={36} />
            </button>
            <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Nghĩa của từ</div>
            <h3 className="text-xl font-black text-slate-800 mt-1">{currentWord.meaningVi}</h3>
            <p className="text-xs text-slate-400 mt-1">Gõ lại từ tiếng Anh chính xác vào ô bên dưới:</p>
          </div>

          <form onSubmit={handleSpellingSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={typingInput}
                onChange={(e) => setTypingInput(e.target.value)}
                disabled={isAnswered}
                placeholder="Nhập từ tiếng Anh..."
                autoFocus
                className="w-full text-center text-2xl font-black tracking-widest uppercase p-4 rounded-3xl border-3 border-indigo-200 focus:border-indigo-600 focus:outline-hidden bg-white shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!typingInput.trim() || isAnswered}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-base shadow-lg shadow-indigo-100 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Kiểm Tra Đáp Án</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {isAnswered && (
            <div className={`p-4 rounded-2xl text-center font-bold text-sm animate-in fade-in ${
              typingInput.trim().toLowerCase() === currentWord.word.toLowerCase()
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {typingInput.trim().toLowerCase() === currentWord.word.toLowerCase() ? (
                <span>🎉 Xuất sắc! Bạn đã gõ đúng từ: <strong>{currentWord.word}</strong></span>
              ) : (
                <span>Đáp án đúng là: <strong className="uppercase underline">{currentWord.word}</strong></span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Victory Modal */}
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
