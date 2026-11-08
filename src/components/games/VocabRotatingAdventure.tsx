import React, { useState, useEffect } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { Check, X, Volume2, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';

interface VocabRotatingAdventureProps {
  words: WordItem[];
  allWords: WordItem[];
  profile: Profile;
  mode: 'review' | 'new' | 'mixed';
  onExit: () => void;
  onProfileUpdated: () => void;
}

type MiniGameVariant = 'bubble_match' | 'sound_detective' | 'scramble' | 'spelling';

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
  onExit,
  onProfileUpdated,
}) => {
  const [wordQueue, setWordQueue] = useState<WordItem[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = Math.min(words.length, Math.max(5, profile.dailyGoal || 5));

  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [currentVariant, setCurrentVariant] = useState<MiniGameVariant>('bubble_match');
  const [score, setScore] = useState(0);

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

  // Sequence of game variants rotated across questions
  const VARIANT_CYCLE: MiniGameVariant[] = ['bubble_match', 'sound_detective', 'scramble', 'spelling'];

  const setupRound = (roundNum: number, queue: WordItem[] = wordQueue) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);

    // Pick rotating variant for this question
    const variant = VARIANT_CYCLE[(roundNum - 1) % VARIANT_CYCLE.length];
    setCurrentVariant(variant);

    // Prepare distractors for multiple choice variants
    const poolForDistractors = allWords.length >= 4 ? allWords : words;
    const otherWords = poolForDistractors.filter((w) => w.id !== target.id && w.word !== target.word);
    const shuffledOthers = shuffleList(otherWords);
    const distractors = shuffledOthers.slice(0, 3);
    const roundOptions = shuffleList([target, ...distractors]);
    setOptions(roundOptions);

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

  // Answer handler
  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isAnswered || !currentWord) return;
    setIsAnswered(true);

    if (isCorrect) {
      setScore((s) => s + 20);
      setCorrectWords((c) => [...c, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, true);
    } else {
      setWrongWords((w) => [...w, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false);
    }

    setTimeout(() => {
      if (currentRound >= totalRounds) {
        finishGame(isCorrect);
      } else {
        setupRound(currentRound + 1);
      }
    }, 1400);
  };

  const finishGame = (lastWasCorrect: boolean) => {
    const finalScore = score + (lastWasCorrect ? 20 : 0);
    const correctCount = correctWords.length + (lastWasCorrect ? 1 : 0);
    const accuracy = Math.round((correctCount / totalRounds) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 30 + finalScore;

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
          Luân phiên câu hỏi 🔄
        </span>
      </div>

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
                  onClick={() => {
                    if (isAnswered) return;
                    setPlacedLetters(placedLetters.filter((_, i) => i !== idx));
                    setScrambleLetters(scrambleLetters.map((t) => (t.id === tile.id ? { ...t, used: false } : t)));
                  }}
                  className="w-12 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  {tile.char}
                </button>
              ))
            )}
          </div>

          {/* Letter pool */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-4 bg-slate-50 rounded-3xl border border-slate-200">
            {scrambleLetters.map((tile) => (
              <button
                key={tile.id}
                onClick={() => {
                  if (tile.used || isAnswered) return;
                  setPlacedLetters([...placedLetters, { id: tile.id, char: tile.char }]);
                  setScrambleLetters(scrambleLetters.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));
                }}
                disabled={tile.used || isAnswered}
                className={`w-12 h-14 rounded-2xl border-2 font-black text-xl transition-all shadow-2xs flex items-center justify-center ${
                  tile.used
                    ? 'bg-slate-200 border-slate-300 text-slate-400 opacity-40 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800 hover:bg-indigo-50 active:scale-95 cursor-pointer'
                }`}
              >
                {tile.char}
              </button>
            ))}
          </div>

          {/* Check Button */}
          <button
            onClick={() => {
              const builtWord = placedLetters.map((t) => t.char).join('').toLowerCase();
              handleAnswerSubmit(builtWord === currentWord.word.toLowerCase());
            }}
            disabled={placedLetters.length !== currentWord.word.length || isAnswered}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-base shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Kiểm Tra Chữ Ghép
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 4: SPELLING BEE (Thử thách chính tả)              */}
      {/* ======================================================== */}
      {currentVariant === 'spelling' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-4 border-indigo-100 shadow-xl text-center">
            <button
              onClick={() => playWordAudio(currentWord.word, currentWord.audioUrl)}
              className="w-20 h-20 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs cursor-pointer"
            >
              <Volume2 size={36} />
            </button>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gợi ý nghĩa</div>
            <h3 className="text-2xl font-black text-slate-900">{currentWord.meaningVi}</h3>
            <p className="text-xs text-slate-400 mt-2">{variantInfo.instruction}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAnswerSubmit(typingInput.trim().toLowerCase() === currentWord.word.toLowerCase());
            }}
            className="space-y-4"
          >
            <input
              type="text"
              value={typingInput}
              onChange={(e) => setTypingInput(e.target.value)}
              disabled={isAnswered}
              placeholder="Gõ chính tả từ tiếng Anh..."
              className="w-full p-4 rounded-2xl border-3 border-indigo-200 focus:border-indigo-600 text-center font-black text-2xl uppercase tracking-widest bg-white shadow-sm focus:outline-hidden"
              autoFocus
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={!typingInput.trim() || isAnswered}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-base shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Gửi Đáp Án
            </button>
          </form>
        </div>
      )}

      {/* Game Victory Modal */}
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
