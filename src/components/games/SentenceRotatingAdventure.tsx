import React, { useState, useEffect } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateSentenceProgress, getSentenceProgressMap } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { 
  COMPREHENSIVE_TEMPLATES, 
  generateKidSentenceNoRepeat, 
  SentenceItem, 
  fixIndefiniteArticles 
} from '../../services/sentencePatterns';
import { Check, X, Volume2, Sparkles, ArrowRight, Lightbulb, RotateCcw } from 'lucide-react';

interface SentenceRotatingAdventureProps {
  words: WordItem[];
  profile: Profile;
  mode: 'all' | 'review' | 'new' | 'mixed';
  onExit: () => void;
  onProfileUpdated: () => void;
}

type SentenceGameVariant = 'builder' | 'cloze' | 'detective';

// Fisher-Yates Shuffle
function shuffleList<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const SentenceRotatingAdventure: React.FC<SentenceRotatingAdventureProps> = ({
  words,
  profile,
  mode,
  onExit,
  onProfileUpdated,
}) => {
  const [wordQueue, setWordQueue] = useState<WordItem[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = Math.min(Math.max(5, words.length), Math.max(5, profile.dailyGoal || 5));

  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [currentSentence, setCurrentSentence] = useState<SentenceItem | null>(null);
  const [currentVariant, setCurrentVariant] = useState<SentenceGameVariant>('builder');
  const [score, setScore] = useState(0);

  // States for Builder Variant
  const [targetTokens, setTargetTokens] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [builtSentence, setBuiltSentence] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);

  // States for Cloze Variant (Điền từ còn thiếu)
  const [clozeSentenceDisplay, setClozeSentenceDisplay] = useState<string>('');
  const [clozeTargetWord, setClozeTargetWord] = useState<string>('');
  const [clozeOptions, setClozeOptions] = useState<string[]>([]);
  const [selectedCloze, setSelectedCloze] = useState<string | null>(null);

  // States for Sentence Detective (Nghe câu chọn nghĩa)
  const [detectiveOptions, setDetectiveOptions] = useState<string[]>([]);
  const [selectedDetective, setSelectedDetective] = useState<string | null>(null);

  // Answer status
  const [isAnswered, setIsAnswered] = useState(false);
  const [usedTemplateIds, setUsedTemplateIds] = useState<Set<number>>(new Set());

  // Results
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);

  const VARIANT_CYCLE: SentenceGameVariant[] = ['builder', 'cloze', 'detective'];

  const setupRound = (roundNum: number, queue: WordItem[] = wordQueue) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);

    // Pick rotating variant for this question
    const variant = VARIANT_CYCLE[(roundNum - 1) % VARIANT_CYCLE.length];
    setCurrentVariant(variant);

    // Generate sentence
    const sentencePair = generateKidSentenceNoRepeat(target, target.masteryLevel || 0, usedTemplateIds);
    setCurrentSentence(sentencePair);

    // 1. Prepare Builder Tokens
    const tokens = sentencePair.sentenceEn.replace(/[.,?!]/g, '').split(' ');
    setTargetTokens(tokens);
    setAvailableWords(shuffleList(tokens));
    setBuiltSentence([]);
    setShowHint(false);

    // 2. Prepare Cloze Variant
    // Pick target word or article to blank out
    const blankWord = tokens.length > 2 ? tokens[Math.floor(tokens.length / 2)] : tokens[0];
    setClozeTargetWord(blankWord);
    setClozeSentenceDisplay(sentencePair.sentenceEn.replace(new RegExp(`\\b${blankWord}\\b`, 'i'), '_______'));
    
    // Distractor words
    const clozePool = ['is', 'are', 'a', 'an', 'the', 'my', 'your', 'big', 'small', 'good', 'fast', 'in', 'on', 'with', 'to'];
    const fakeOptions = shuffleList(clozePool.filter(w => w.toLowerCase() !== blankWord.toLowerCase())).slice(0, 3);
    setClozeOptions(shuffleList([blankWord, ...fakeOptions]));
    setSelectedCloze(null);

    // 3. Prepare Detective Options (Vietnamese sentences)
    const otherTemplates = COMPREHENSIVE_TEMPLATES.filter(t => t.id !== sentencePair.id);
    const fakeTranslations = shuffleList(otherTemplates).slice(0, 2).map(t => {
      return fixIndefiniteArticles(t.templateVi.replace('{meaningCapitalized}', 'Cái này').replace('{meaning}', 'nó'));
    });
    setDetectiveOptions(shuffleList([sentencePair.sentenceVi, ...fakeTranslations]));
    setSelectedDetective(null);

    setIsAnswered(false);
    setCurrentRound(roundNum);

    // Play native audio
    setTimeout(() => {
      playWordAudio(sentencePair.sentenceEn);
    }, 250);
  };

  const startNewGame = () => {
    if (words.length === 0) return;
    const shuffled = shuffleList(words);
    setWordQueue(shuffled);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setUsedTemplateIds(new Set());
    setGameResult(null);
    setupRound(1, shuffled);
  };

  useEffect(() => {
    startNewGame();
  }, [words]);

  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isAnswered || !currentSentence) return;
    setIsAnswered(true);

    if (isCorrect) {
      setScore((s) => s + 25);
      setCorrectCount((c) => c + 1);
      updateSentenceProgress(profile.id, currentSentence.id, true);
    } else {
      setWrongCount((w) => w + 1);
      updateSentenceProgress(profile.id, currentSentence.id, false);
    }

    setTimeout(() => {
      if (currentRound >= totalRounds) {
        finishGame(isCorrect);
      } else {
        setupRound(currentRound + 1);
      }
    }, 1500);
  };

  const finishGame = (lastWasCorrect: boolean) => {
    const finalScore = score + (lastWasCorrect ? 25 : 0);
    const finalCorrect = correctCount + (lastWasCorrect ? 1 : 0);
    const accuracy = Math.round((finalCorrect / totalRounds) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 40 + finalScore;

    const result: GameScoreResult = {
      gameType: 'sentence_adventure',
      starsEarned: stars,
      xpEarned: xp,
      accuracy,
      correctWords: [currentWord?.word || 'sentence'],
      wrongWords: [],
    };

    recordGameResult(profile.id, result);
    onProfileUpdated();
    setGameResult(result);
  };

  if (!currentSentence || !currentWord) return null;

  const modeLabel = mode === 'review' ? 'Ôn Mẫu Câu Đã Học' : mode === 'new' ? 'Học Mẫu Câu Mới' : 'Vừa Ôn Vừa Học';

  const getVariantHeader = () => {
    switch (currentVariant) {
      case 'builder':
        return { name: 'Xây Dựng Mẫu Câu', icon: '🏗️', desc: 'Sắp xếp các từ thành câu đúng:' };
      case 'cloze':
        return { name: 'Điền Từ Còn Thiếu', icon: '✏️', desc: 'Chọn từ chính xác để điền vào chỗ trống:' };
      case 'detective':
        return { name: 'Thám Tử Mẫu Câu', icon: '🕵️', desc: 'Lắng nghe phát âm và chọn nghĩa tiếng Việt:' };
    }
  };

  const headerInfo = getVariantHeader();

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title={`Chinh Phục Mẫu Câu (${modeLabel})`}
        emoji="💬"
        score={score}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onExit={onExit}
      />

      {/* Rotating Question Banner */}
      <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 mb-5 text-xs font-bold shadow-2xs">
        <span className="flex items-center gap-1.5">
          <span className="text-base">{headerInfo.icon}</span>
          <span>Câu {currentRound}: <strong className="text-purple-700">{headerInfo.name}</strong></span>
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-extrabold text-[11px]">
          Luân phiên câu hỏi 🔄
        </span>
      </div>

      {/* ======================================================== */}
      {/* VARIANT 1: BUILDER (Xếp chữ ghép câu)                     */}
      {/* ======================================================== */}
      {currentVariant === 'builder' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Dịch câu tiếng Việt này sang tiếng Anh:
              </span>
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold cursor-pointer"
              >
                <Lightbulb size={14} className={showHint ? 'text-amber-300' : 'text-white'} />
                <span>{showHint ? 'Ẩn Gợi Ý' : 'Gợi Ý'}</span>
              </button>
            </div>
            <h3 className="text-2xl font-black">"{currentSentence.sentenceVi}"</h3>
            {showHint && (
              <div className="mt-2 pt-2 border-t border-white/20 text-xs font-mono text-amber-200">
                💡 {currentSentence.sentenceEn}
              </div>
            )}
          </div>

          {/* Built slots */}
          <div className="min-h-20 p-4 rounded-3xl border-3 border-dashed border-indigo-200 bg-white flex flex-wrap items-center justify-center gap-2 shadow-2xs">
            {builtSentence.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Chạm vào các từ bên dưới để ghép câu...</span>
            ) : (
              builtSentence.map((word, i) => (
                <button
                  key={`${word}-${i}`}
                  onClick={() => {
                    if (isAnswered) return;
                    setBuiltSentence(builtSentence.filter((_, idx) => idx !== i));
                    setAvailableWords([...availableWords, word]);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>{word}</span>
                  <span className="text-xs opacity-60">✕</span>
                </button>
              ))
            )}
          </div>

          {/* Word chips */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 p-4 bg-slate-50 rounded-3xl border border-slate-200">
            {availableWords.map((word, i) => (
              <button
                key={`${word}-${i}`}
                onClick={() => {
                  if (isAnswered) return;
                  setBuiltSentence([...builtSentence, word]);
                  setAvailableWords(availableWords.filter((_, idx) => idx !== i));
                }}
                disabled={isAnswered}
                className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-indigo-400 font-bold text-slate-800 rounded-2xl shadow-2xs active:scale-95 cursor-pointer"
              >
                {word}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const builtStr = builtSentence.join(' ').replace(/[.,?!]/g, '').trim().toLowerCase();
              const targetStr = currentSentence.sentenceEn.replace(/[.,?!]/g, '').trim().toLowerCase();
              handleAnswerSubmit(builtStr === targetStr);
            }}
            disabled={builtSentence.length !== targetTokens.length || isAnswered}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-base shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Check size={18} />
            Kiểm Tra Câu Ghép
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 2: CLOZE (Điền từ còn thiếu vào câu)              */}
      {/* ======================================================== */}
      {currentVariant === 'cloze' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-4 border-indigo-100 shadow-xl text-center">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Điền Từ Vào Chỗ Trống</div>
            <h3 className="text-2xl font-black text-slate-900 leading-relaxed font-sans">{clozeSentenceDisplay}</h3>
            <p className="text-xs text-slate-500 mt-2 italic font-medium">"{currentSentence.sentenceVi}"</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {clozeOptions.map((opt, i) => {
              const isSelected = selectedCloze === opt;
              const isTarget = opt.toLowerCase() === clozeTargetWord.toLowerCase();
              let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400';

              if (isAnswered) {
                if (isTarget) btnStyle = 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200';
                else if (isSelected) btnStyle = 'bg-rose-500 border-rose-600 text-white';
                else btnStyle = 'bg-slate-50 border-slate-200 opacity-50';
              }

              return (
                <button
                  key={`${opt}-${i}`}
                  onClick={() => {
                    setSelectedCloze(opt);
                    handleAnswerSubmit(isTarget);
                  }}
                  disabled={isAnswered}
                  className={`p-5 rounded-3xl border-3 font-black text-lg transition-all shadow-2xs active:scale-98 cursor-pointer ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 3: DETECTIVE (Nghe phát âm cả câu chọn nghĩa)      */}
      {/* ======================================================== */}
      {currentVariant === 'detective' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-4 border-indigo-100 shadow-xl text-center">
            <button
              onClick={() => playWordAudio(currentSentence.sentenceEn)}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-200 animate-pulse hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Volume2 size={48} />
            </button>
            <p className="text-sm font-bold text-slate-700">Chạm vào loa để nghe phát âm toàn câu</p>
            <p className="text-xs text-slate-400 mt-1">{headerInfo.desc}</p>
          </div>

          <div className="space-y-3">
            {detectiveOptions.map((opt, i) => {
              const isSelected = selectedDetective === opt;
              const isTarget = opt === currentSentence.sentenceVi;
              let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-purple-400';

              if (isAnswered) {
                if (isTarget) btnStyle = 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200';
                else if (isSelected) btnStyle = 'bg-rose-500 border-rose-600 text-white';
                else btnStyle = 'bg-slate-50 border-slate-200 opacity-50';
              }

              return (
                <button
                  key={`${opt}-${i}`}
                  onClick={() => {
                    setSelectedDetective(opt);
                    handleAnswerSubmit(isTarget);
                  }}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-2xl border-3 font-bold text-left transition-all shadow-2xs active:scale-98 cursor-pointer flex items-center justify-between ${btnStyle}`}
                >
                  <span className="text-sm sm:text-base">{opt}</span>
                  {isAnswered && isTarget && <Check size={18} className="text-white shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
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
