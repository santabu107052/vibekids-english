import React, { useState, useEffect } from 'react';
import { WordItem, Profile, GameScoreResult } from '../../types';
import { recordGameResult, updateSentenceProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { generateKidSentenceNoRepeat, SentenceItem } from '../../services/sentencePatterns';
import { Check, X, RotateCcw, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';

interface SentenceBuilderProps {
  words: WordItem[];
  profile: Profile;
  onExit: () => void;
  onProfileUpdated: () => void;
  mode?: 'all' | 'review' | 'new' | 'mixed';
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

// Strip punctuation and normalize for comparing
function cleanForCompare(str: string): string {
  return str.replace(/[.,?!]/g, '').trim().toLowerCase();
}

export const SentenceBuilderGame: React.FC<SentenceBuilderProps> = ({
  words,
  profile,
  onExit,
  onProfileUpdated,
}) => {
  const [wordQueue, setWordQueue] = useState<WordItem[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = Math.min(6, words.length);
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  
  // Stable sentence pair for current round
  const [currentSentence, setCurrentSentence] = useState<SentenceItem | null>(null);
  const [targetTokens, setTargetTokens] = useState<string[]>([]);
  
  // Interactive chips state
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [builtSentence, setBuiltSentence] = useState<string[]>([]);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);

  // Track used templates to avoid repetition
  const [usedTemplateIds, setUsedTemplateIds] = useState<Set<number>>(new Set());

  const setupRound = (roundNum: number, queue: WordItem[] = wordQueue) => {
    if (queue.length === 0) return;
    const targetIdx = (roundNum - 1) % queue.length;
    const target = queue[targetIdx];
    setCurrentWord(target);

    // Dùng generator mới với cơ chế chống lặp
    const sentencePair = generateKidSentenceNoRepeat(target, target.masteryLevel || 0, usedTemplateIds);
    setCurrentSentence(sentencePair);

    const tokens = sentencePair.sentenceEn.replace(/[.,?!]/g, '').split(' ');
    setTargetTokens(tokens);
    setAvailableWords(shuffleList(tokens));
    setBuiltSentence([]);
    setStatus('playing');
    setShowHint(false);
    setCurrentRound(roundNum);
  };

  const startNewGame = () => {
    if (words.length === 0) return;
    const shuffled = shuffleList(words);
    setWordQueue(shuffled);
    setScore(0);
    setUsedTemplateIds(new Set()); // Reset ván mới là reset danh sách câu đã dùng
    setCorrectWords([]);
    setWrongWords([]);
    setGameResult(null);
    setupRound(1, shuffled);
  };

  useEffect(() => {
    startNewGame();
  }, [words]);

  // Click an available word to add to built sentence
  const handleSelectWord = (word: string, index: number) => {
    if (status === 'correct') return;
    setBuiltSentence([...builtSentence, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
    if (status === 'wrong') setStatus('playing');
  };

  // Click placed word to return it to available pool
  const handleRemoveWord = (word: string, index: number) => {
    if (status === 'correct') return;
    setBuiltSentence(builtSentence.filter((_, i) => i !== index));
    setAvailableWords([...availableWords, word]);
    if (status === 'wrong') setStatus('playing');
  };

  // Reset current round to try again from the beginning
  const handleRetryRound = () => {
    if (!targetTokens.length) return;
    setAvailableWords(shuffleList(targetTokens));
    setBuiltSentence([]);
    setStatus('playing');
  };

  const handleCheckSentence = () => {
    if (!currentSentence || !currentWord) return;
    const builtStr = cleanForCompare(builtSentence.join(' '));
    const targetStr = cleanForCompare(currentSentence.sentenceEn);

    if (builtStr === targetStr) {
      setStatus('correct');
      setScore((s) => s + 30);
      setCorrectWords((c) => [...c, currentWord.word]);
      playWordAudio(currentWord.word, currentWord.audioUrl);

      setTimeout(() => {
        if (currentRound >= totalRounds) {
          finishGame(true);
        } else {
          setupRound(currentRound + 1);
        }
      }, 1500);
    } else {
      setStatus('wrong');
      setWrongWords((w) => [...w, currentWord.word]);
    }
  };

  const handleSkipRound = () => {
    if (currentRound >= totalRounds) {
      finishGame(false);
    } else {
      setupRound(currentRound + 1);
    }
  };

  const finishGame = (lastWasCorrect: boolean) => {
    const finalScore = score + (lastWasCorrect ? 30 : 0);
    const correctCount = correctWords.length + (lastWasCorrect ? 1 : 0);
    const accuracy = Math.round((correctCount / totalRounds) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const xp = stars * 50 + finalScore;

    const result: GameScoreResult = {
      gameType: 'sentence_builder',
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

  if (!currentWord || !currentSentence) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
      <GameHeader
        title="Xây Dựng Mẫu Câu"
        emoji="🏗️"
        score={score}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onExit={onExit}
      />

      {/* Target Vietnamese Prompt Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
            Dịch câu tiếng Việt này sang tiếng Anh:
          </span>
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold transition-all"
          >
            <Lightbulb size={14} className={showHint ? 'text-amber-300' : 'text-white'} />
            <span>{showHint ? 'Ẩn Gợi Ý' : 'Xem Gợi Ý'}</span>
          </button>
        </div>

        <h3 className="text-2xl font-black tracking-wide my-1">
          "{currentSentence.sentenceVi}"
        </h3>

        {showHint && (
          <div className="mt-3 pt-3 border-t border-white/20 text-indigo-100 text-sm animate-in fade-in">
            <span className="font-bold text-amber-300">💡 Mẫu câu đúng: </span>
            <span className="font-semibold italic text-white font-mono">{currentSentence.sentenceEn}</span>
          </div>
        )}
      </div>

      {/* Placed Words Drop Zone */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>Câu của bé (Chạm vào từ để bỏ chọn):</span>
          <span>{builtSentence.length}/{targetTokens.length} từ</span>
        </div>

        <div
          className={`min-h-24 p-5 rounded-3xl border-3 flex flex-wrap items-center justify-center gap-2.5 transition-all ${
            status === 'correct'
              ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-200 shadow-md'
              : status === 'wrong'
              ? 'border-rose-400 bg-rose-50/70 shadow-sm'
              : 'border-dashed border-indigo-200 bg-white shadow-sm'
          }`}
        >
          {builtSentence.length === 0 ? (
            <span className="text-slate-400 text-sm font-medium italic">
              Chạm vào các từ bên dưới để ghép thành câu hoàn chỉnh...
            </span>
          ) : (
            builtSentence.map((word, i) => (
              <button
                key={`${word}-${i}`}
                type="button"
                onClick={() => handleRemoveWord(word, i)}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>{word}</span>
                <span className="text-xs opacity-60">✕</span>
              </button>
            ))
          )}
        </div>

        {/* Feedback message when wrong */}
        {status === 'wrong' && (
          <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between animate-in shake">
            <div className="flex items-center gap-2">
              <X size={18} className="text-rose-600" />
              <span>Chưa đúng rồi bé ơi! Bé hãy chạm vào từ để sửa hoặc bấm "Làm lại câu này".</span>
            </div>
            <button
              onClick={handleRetryRound}
              className="px-3 py-1 bg-white text-rose-700 rounded-xl hover:bg-rose-50 shadow-2xs font-black text-xs shrink-0 ml-2"
            >
              Làm lại
            </button>
          </div>
        )}

        {status === 'correct' && (
          <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
            <Check size={18} className="text-emerald-600" />
            <span>Chính xác tuyệt vời! Bé ghép câu rất giỏi! 🎉</span>
          </div>
        )}
      </div>

      {/* Available Word Chips Pool */}
      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 mb-6">
        <div className="text-xs font-bold text-slate-500 mb-3 text-center uppercase tracking-wider">
          Kho từ vựng để ghép câu:
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 min-h-12">
          {availableWords.length === 0 ? (
            <span className="text-xs text-slate-400 italic">
              Bé đã chọn hết các từ! Giờ hãy bấm "Kiểm tra câu" bên dưới nhé.
            </span>
          ) : (
            availableWords.map((word, i) => (
              <button
                key={`${word}-${i}`}
                type="button"
                onClick={() => handleSelectWord(word, i)}
                className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-800 font-bold text-base shadow-2xs transition-all active:scale-95"
              >
                {word}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Action Buttons: Check, Retry, Skip */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleRetryRound}
          disabled={builtSentence.length === 0}
          className="py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-slate-300 disabled:opacity-40 font-bold text-slate-700 text-xs flex items-center justify-center gap-1.5 transition-all bg-white"
        >
          <RotateCcw size={15} />
          Làm Lại
        </button>

        <button
          type="button"
          onClick={handleCheckSentence}
          disabled={builtSentence.length === 0 || status === 'correct'}
          className="flex-1 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-base shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <Check size={18} />
          Kiểm Tra Câu
        </button>

        <button
          type="button"
          onClick={handleSkipRound}
          className="py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-slate-300 font-bold text-slate-500 hover:text-slate-800 text-xs flex items-center justify-center gap-1.5 transition-all bg-white"
        >
          Bỏ Qua
          <ArrowRight size={15} />
        </button>
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
