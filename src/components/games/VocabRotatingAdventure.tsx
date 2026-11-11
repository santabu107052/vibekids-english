import React, { useState, useEffect } from 'react';
import { WordItem, Profile, GameScoreResult, SkillType } from '../../types';
import { recordGameResult, updateWordProgress } from '../../services/storage';
import { playWordAudio } from '../../services/dictionaryApi';
import { GameHeader } from './GameHeader';
import { GameVictoryModal } from './GameVictoryModal';
import { Check, X, Volume2, Sparkles, ArrowRight, Lightbulb, RotateCcw } from 'lucide-react';
import { soundManager } from '../../services/soundEffects';

interface VocabRotatingAdventureProps {
  words: WordItem[];
  allWords: WordItem[];
  profile: Profile;
  mode: 'review' | 'new' | 'mixed';
  questionCount?: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

export type MiniGameVariant =
  | 'bubble_match'
  | 'sound_detective'
  | 'scramble'
  | 'spelling'
  // 🎮 5 game mới (play-to-learn + chính tả)
  | 'missing_letters'
  | 'spelling_detective'
  | 'secret_animal'
  | 'zoo_feeding'
  | 'bubble_pop'
  | 'word_match'
  | 'mystery_garden'
  | 'candy_builder';

const getSkillForVariant = (variant: MiniGameVariant): SkillType => {
  if (variant === 'sound_detective') return 'listening';
  if (
    variant === 'scramble' ||
    variant === 'spelling' ||
    variant === 'missing_letters' ||
    variant === 'spelling_detective'
  )
    return 'spelling';
  return 'reading';
};


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
  const isInfinite = questionCount >= 9000;
  const [wordQueue, setWordQueue] = useState<WordItem[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = isInfinite ? 9999 : questionCount;

  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [currentVariant, setCurrentVariant] = useState<MiniGameVariant>('bubble_match');
  const [score, setScore] = useState(0);

  // States for Bubble Match & Sound Detective
  const [options, setOptions] = useState<WordItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<WordItem | null>(null);
  // 3 đáp án luôn chứa đáp án đúng (dùng cho game chỉ hiện 3 lựa chọn)
  const [tripleOptions, setTripleOptions] = useState<WordItem[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);

  // States for Word Scramble
  const [scrambleLetters, setScrambleLetters] = useState<{ id: string; char: string; used: boolean }[]>([]);
  const [placedLetters, setPlacedLetters] = useState<{ id: string; char: string }[]>([]);

  // States for Spelling Bee
  const [typingInput, setTypingInput] = useState('');

  // States for Missing Letters (Chữ cái bị mất)
  const [mlMasked, setMlMasked] = useState<{ char: string; isHidden: boolean; filled: string }[]>([]);
  const [mlActive, setMlActive] = useState(0);
  const [mlKeys, setMlKeys] = useState<string[]>([]);
  const [mlShake, setMlShake] = useState<string | null>(null);

  // States for Spelling Detective (Thám tử chính tả)
  const [sdOptions, setSdOptions] = useState<{ text: string; isCorrect: boolean }[]>([]);

  // States for Secret Animal (Vị khách bí mật)
  const [saClues, setSaClues] = useState(0);
  const [saAudioRevealed, setSaAudioRevealed] = useState(false);

  // States for Zoo Feeding (Bữa tiệc sở thú)
  const [zfMood, setZfMood] = useState<'waiting' | 'eating' | 'happy' | 'sad' | 'angry'>('waiting');
  const [zfPlate, setZfPlate] = useState<string | null>(null);
  const [zfWrong, setZfWrong] = useState(0);

  // States for Bubble Pop (Bong bóng từ vựng)
  const [bpMood, setBpMood] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Results
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [roundHasError, setRoundHasError] = useState(false);
  const [gameResult, setGameResult] = useState<GameScoreResult | null>(null);

  // 11 Mini-Games luân phiên (đã loại Lật Thẻ + Bong Bóng Bắt Từ cũ vì trùng cơ chế với Bong Bóng Từ Vựng)
  const VARIANT_CYCLE: MiniGameVariant[] = [
    'sound_detective',
    'scramble',
    'spelling',
    'missing_letters',
    'spelling_detective',
    'secret_animal',
    'zoo_feeding',
    'bubble_pop',
    'word_match',
    'mystery_garden',
    'candy_builder',
  ];

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

    // ✅ Danh sách 2 đáp án riêng cho game chỉ hiển thị 3 nút (bong bóng / vườn / kẹo).
    // TUYỆT ĐỐI không dùng options.slice(0,3) vì có thể CẮT MẤT đáp án đúng!
    const twoDistractors = shuffledOthers.slice(0, 2);
    setTripleOptions(shuffleList([target, ...twoDistractors]));

    // Prepare scramble letters
    const chars = target.word.toLowerCase().split('');
    const tiles = chars.map((ch, idx) => ({ id: `${ch}-${idx}-${Math.random()}`, char: ch.toUpperCase(), used: false }));
    setScrambleLetters(shuffleList(tiles));
    setPlacedLetters([]);

    // Prepare spelling input
    setTypingInput('');

    // ===== Prepare Missing Letters =====
    const mlChars = target.word.toLowerCase().split('');
    const mlHideCount = mlChars.length <= 4 ? 1 : mlChars.length <= 7 ? 2 : 3;
    const mlCandidates: number[] = [];
    for (let i = 1; i < mlChars.length - 1; i++) mlCandidates.push(i);
    if (mlCandidates.length === 0) mlChars.forEach((_, i) => mlCandidates.push(i));
    const mlHidden: number[] = [];
    const mlUsedLetters = new Set<string>();
    for (const idx of shuffleList(mlCandidates)) {
      if (mlHidden.length >= mlHideCount) break;
      if (mlUsedLetters.has(mlChars[idx])) continue;
      mlUsedLetters.add(mlChars[idx]);
      mlHidden.push(idx);
    }
    if (mlHidden.length === 0 && mlCandidates.length > 0) mlHidden.push(mlCandidates[0]);
    setMlMasked(
      mlChars.map((ch, i) => ({ char: ch, isHidden: mlHidden.includes(i), filled: '' }))
    );
    setMlActive(mlHidden[0] ?? 0);
    const mlCorrect = Array.from(new Set(mlHidden.map((i) => mlChars[i])));
    const mlAll = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const mlPool = mlAll.filter((l) => !mlCorrect.includes(l));
    setMlKeys(shuffleList([...mlCorrect, ...shuffleList(mlPool).slice(0, 6)]));
    setMlShake(null);

    // ===== Prepare Spelling Detective (lỗi tinh tế: đổi 1 chữ) =====
    const VOWELS = ['a', 'e', 'i', 'o', 'u'];
    const CONS_GROUPS: string[][] = [
      ['b', 'p', 'd'],
      ['c', 'k', 'g', 'q'],
      ['m', 'n'],
      ['f', 'v'],
      ['s', 'z', 'x'],
      ['t', 'd'],
      ['l', 'r'],
      ['w', 'v'],
    ];
    const makeSubtle = (word: string): string => {
      const base = word.toLowerCase();
      const tryOnce = (): string | null => {
        const L = base.split('');
        const vowelPos = L.map((c, i) => (VOWELS.includes(c) ? i : -1)).filter((i) => i >= 0);
        const canSwap = vowelPos.length >= 2;
        const strategies: Array<'vowel' | 'consonant' | 'swap'> = ['vowel', 'consonant'];
        if (canSwap) strategies.push('swap');
        if (vowelPos.length === 0) {
          const k = strategies.indexOf('vowel');
          if (k >= 0) strategies.splice(k, 1);
        }
        const strat = strategies[Math.floor(Math.random() * strategies.length)];
        if (strat === 'swap' && canSwap) {
          const pairs: Array<[number, number]> = [];
          for (let i = 0; i < vowelPos.length; i++)
            for (let j = i + 1; j < vowelPos.length; j++)
              if (L[vowelPos[i]] !== L[vowelPos[j]]) pairs.push([vowelPos[i], vowelPos[j]]);
          if (pairs.length === 0) return null;
          const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
          [L[a], L[b]] = [L[b], L[a]];
          return L.join('');
        }
        if (strat === 'vowel' && vowelPos.length > 0) {
          const pos = vowelPos[Math.floor(Math.random() * vowelPos.length)];
          const others = VOWELS.filter((v) => v !== L[pos]);
          L[pos] = others[Math.floor(Math.random() * others.length)];
          return L.join('');
        }
        const consPos = L.map((c, i) => (VOWELS.includes(c) ? -1 : i)).filter((i) => i >= 0);
        for (const pos of shuffleList(consPos)) {
          const cur = L[pos];
          const grp = CONS_GROUPS.find((g) => g.includes(cur));
          const cands = grp ? grp.filter((c) => c !== cur) : 'bcdfghjklmnpqrstvwxyz'.split('').filter((c) => c !== cur);
          if (cands.length > 0) {
            L[pos] = cands[Math.floor(Math.random() * cands.length)];
            return L.join('');
          }
        }
        return null;
      };
      for (let i = 0; i < 25; i++) {
        const r = tryOnce();
        if (r && r !== base) return r;
      }
      const L2 = base.split('');
      const vi = L2.findIndex((c) => VOWELS.includes(c));
      if (vi >= 0) {
        L2[vi] = VOWELS.filter((v) => v !== L2[vi])[0];
        return L2.join('');
      }
      return base + 's';
    };
    const wrongA = makeSubtle(target.word);
    let wrongB = makeSubtle(target.word);
    let guardB = 0;
    while (wrongB === wrongA && guardB < 12) {
      wrongB = makeSubtle(target.word);
      guardB++;
    }
    setSdOptions(
      shuffleList([
        { text: target.word, isCorrect: true },
        { text: wrongA, isCorrect: false },
        { text: wrongB, isCorrect: false },
      ])
    );

    // ===== Prepare Secret Animal / Zoo / Bubble =====
    setSaClues(1);
    setSaAudioRevealed(false);
    setZfMood('waiting');
    setZfPlate(null);
    setZfWrong(0);
    setBpMood('idle');

    setSelectedOption(null);
    setIsAnswered(false);
    setRoundHasError(false);
    setCurrentRound(roundNum);

    // Audio cue — CHỈ phát âm tự động ở các game cần nghe.
    // TUYỆT ĐỐI KHÔNG phát âm với 'secret_animal' (sẽ lộ đáp án) hay game chỉ dùng mặt chữ.
    const AUDIO_CUE_VARIANTS: MiniGameVariant[] = ['sound_detective', 'spelling', 'scramble'];
    if (AUDIO_CUE_VARIANTS.includes(variant)) {
      setTimeout(() => {
        playWordAudio(target.word, target.audioUrl);
      }, 250);
    }
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

  // Answer handler
  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isAnswered || !currentWord) return;

    const skill = getSkillForVariant(currentVariant);

    if (isCorrect) {
      setIsAnswered(true);
      soundManager.playCorrect();
      setScore((prev) => prev + (roundHasError ? 10 : 20));
      setCorrectWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, true, skill);

      setTimeout(() => {
        if (isInfinite || currentRound < totalRounds) {
          setupRound(currentRound + 1);
        } else {
          finishGame(isCorrect);
        }
      }, 1200);
    } else {
      // Khi bé trả lời sai, không cho phép qua câu sau. Ghi nhận câu đó là trả lời sai, nhưng chỉ cho qua câu khi bé chọn/gõ được đáp án đúng.
      setRoundHasError(true);
      soundManager.playWrong();
      setWrongWords((prev) => [...prev, currentWord.word]);
      updateWordProgress(profile.id, currentWord.id, currentWord.word, false, skill);

      if (currentVariant === 'scramble') {
        setTimeout(() => {
          const chars = currentWord.word.toLowerCase().split('');
          const tiles = chars.map((ch, idx) => ({ id: `${ch}-${idx}-${Math.random()}`, char: ch.toUpperCase(), used: false }));
          setScrambleLetters(shuffleList(tiles));
          setPlacedLetters([]);
        }, 800);
      } else if (currentVariant === 'spelling') {
        setTimeout(() => {
          setTypingInput('');
        }, 800);
      } else {
        setTimeout(() => {
          setSelectedOption(null);
          setIsAnswered(false);
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

  const finishGame = (lastIsCorrect: boolean, isEarlyExit = false) => {
    const finalScore = score + (lastIsCorrect ? 20 : 0);
    const finalCorrectCount = correctWords.length + (lastIsCorrect ? 1 : 0);
    const totalAttempted = isEarlyExit ? (correctWords.length + wrongWords.length) : (isInfinite ? Math.max(1, currentRound) : totalRounds);
    const accuracy = totalAttempted > 0 ? Math.min(100, Math.round((finalCorrectCount / totalAttempted) * 100)) : 100;

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
      case 'bubble_match':
        return { name: 'Bong Bóng Bắt Từ', icon: '🎈', instruction: 'Chọn nghĩa tiếng Việt chính xác của từ vựng:' };
      case 'sound_detective':
        return { name: 'Thám Tử Âm Thanh', icon: '🕵️', instruction: 'Lắng nghe phát âm và chọn nghĩa tiếng Việt:' };
      case 'scramble':
        return { name: 'Xếp Chữ Thần Tốc', icon: '🚂', instruction: 'Chạm các chữ cái để ghép thành từ tiếng Anh:' };
      case 'spelling':
        return { name: 'Thử Thách Chính Tả', icon: '🐝', instruction: 'Nghe phát âm và gõ lại từ vựng chính xác:' };
      case 'missing_letters':
        return { name: 'Chữ Cái Bị Mất', icon: '🔤', instruction: 'Điền các chữ cái còn thiếu để hoàn thành từ:' };
      case 'spelling_detective':
        return { name: 'Thám Tử Chính Tả', icon: '⭐', instruction: 'Tìm ra từ được viết ĐÚNG chính tả:' };
      case 'secret_animal':
        return { name: 'Vị Khách Bí Mật', icon: '🕵️‍♀️', instruction: 'Dùng gợi ý để đoán từ bí ẩn:' };
      case 'zoo_feeding':
        return { name: 'Bữa Tiệc Sở Thú', icon: '🍽️', instruction: 'Dịch nghĩa và cho bạn thú ăn đúng món:' };
      case 'bubble_pop':
        return { name: 'Bong Bóng Từ Vựng', icon: '🫧', instruction: 'Chạm bong bóng có từ tiếng Anh khớp nghĩa:' };
      case 'word_match':
        return { name: 'Bắt Từ Nhanh', icon: '⚡', instruction: 'Chọn nghĩa tiếng Việt chính xác của từ vựng:' };
      case 'mystery_garden':
        return { name: 'Khu Vườn Bí Ẩn', icon: '🌻', instruction: 'Chọn từ tiếng Anh đúng nghĩa để trồng hoa:' };
      case 'candy_builder':
        return { name: 'Nhà Thiết Kế Kẹo Ngọt', icon: '🍬', instruction: 'Chọn từ đúng nghĩa để xây tháp kẹo:' };
      default:
        return { name: 'Trò Chơi', icon: '🎮', instruction: 'Chọn đáp án đúng:' };
    }
  };

  const variantInfo = getVariantTitle();

  const handleExitGame = () => {
    // If playing in infinite mode and user answered at least 1 question, record result and reward!
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
        title={`Chinh Phục Từ Vựng (${modeLabel})`}
        emoji="⚡"
        score={score}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onExit={handleExitGame}
      />

      {/* Dynamic Mini-Game Indicator Banner */}
      <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 mb-5 text-xs font-bold shadow-2xs">
        <span className="flex items-center gap-1.5">
          <span className="text-base">{variantInfo.icon}</span>
          <span>Câu {currentRound}: <strong className="text-indigo-700">{variantInfo.name}</strong></span>
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[11px]">
          Luân phiên 11 Game 🔄
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

      {/* ======================================================== */}
      {/* VARIANT 5: MISSING LETTERS (Chữ cái bị mất)                */}
      {/* ======================================================== */}
      {currentVariant === 'missing_letters' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-5 border-4 border-violet-100 shadow-xl text-center">
            <div className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">
              {mlMasked.some((c) => c.isHidden) ? 'Điền chữ cái còn thiếu' : 'Từ đã hoàn chỉnh'}
            </div>
            <h3 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2">
              <span>{currentWord.emoji}</span>
              <span>{currentWord.meaningVi}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">{currentWord.phonetic}</p>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {mlMasked.map((c, i) => {
              const isActive = i === mlActive && !isAnswered;
              const display = c.isHidden ? c.filled : c.char;
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (!isAnswered && c.isHidden && !c.filled) setMlActive(i);
                  }}
                  className={`flex items-center justify-center rounded-2xl border-3 font-black transition-all ${
                    c.isHidden
                      ? isAnswered
                        ? 'w-10 h-13 sm:w-11 sm:h-15 text-xl bg-emerald-500 border-emerald-600 text-white'
                        : isActive
                        ? 'w-10 h-13 sm:w-11 sm:h-15 text-xl bg-amber-50 border-amber-500 text-slate-900 ring-4 ring-amber-200 animate-pulse cursor-pointer'
                        : 'w-10 h-13 sm:w-11 sm:h-15 text-xl bg-white border-violet-300 text-slate-900 cursor-pointer'
                      : 'w-8 h-11 sm:w-9 sm:h-13 text-lg bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  {display || (c.isHidden ? '_' : '')}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {mlKeys.map((key) => {
              const slots = mlMasked.filter((c) => c.isHidden && c.char === key);
              const fullyUsed = slots.length > 0 && slots.every((c) => c.filled === key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isAnswered || fullyUsed}
                  onClick={() => {
                    let slot = mlActive;
                    if (!mlMasked[slot]?.isHidden || mlMasked[slot]?.filled) {
                      const empty = mlMasked.findIndex((c) => c.isHidden && !c.filled);
                      if (empty === -1) return;
                      slot = empty;
                      setMlActive(empty);
                    }
                    if (mlMasked[slot].char === key) {
                      const updated = mlMasked.map((c, i) => (i === slot ? { ...c, filled: key } : c));
                      setMlMasked(updated);
                      const next = updated.findIndex((c) => c.isHidden && !c.filled);
                      if (next === -1) {
                        handleAnswerSubmit(true);
                      } else {
                        setMlActive(next);
                      }
                    } else {
                      setMlShake(key);
                      setTimeout(() => setMlShake(null), 600);
                      handleAnswerSubmit(false);
                    }
                  }}
                  className={`py-3 rounded-2xl font-black text-lg uppercase transition-all shadow-sm active:scale-95 cursor-pointer ${
                    fullyUsed
                      ? 'bg-slate-100 border-2 border-slate-200 text-slate-300'
                      : mlShake === key
                      ? 'bg-rose-100 border-2 border-rose-400 text-rose-700 animate-shake'
                      : 'bg-white border-2 border-violet-200 text-violet-900 hover:border-violet-400 hover:bg-violet-50'
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400">{variantInfo.instruction}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 6: SPELLING DETECTIVE (Thám tử chính tả)           */}
      {/* ======================================================== */}
      {currentVariant === 'spelling_detective' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-5 border-4 border-amber-100 shadow-xl text-center">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              Từ nào viết ĐÚNG chính tả?
            </div>
            <h3 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2">
              <span>{currentWord.emoji}</span>
              <span>{currentWord.meaningVi}</span>
            </h3>
            <button
              onClick={() => playWordAudio(currentWord.word, currentWord.audioUrl)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold transition-all cursor-pointer"
            >
              <Volume2 size={14} /> Nghe phát âm
            </button>
          </div>

          <div className="space-y-3">
            {sdOptions.map((opt) => {
              const showCorrect = isAnswered && opt.isCorrect;
              const showWrong = isAnswered && !opt.isCorrect;
              return (
                <button
                  key={opt.text}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleAnswerSubmit(opt.isCorrect)}
                  className={`w-full p-4 rounded-3xl border-3 font-black text-xl tracking-wide transition-all shadow-sm flex items-center justify-between active:scale-98 cursor-pointer ${
                    showCorrect
                      ? 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200'
                      : showWrong
                      ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                      : 'bg-white border-amber-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50'
                  }`}
                >
                  <span className="capitalize">
                    {showCorrect && <span className="mr-1.5">✓</span>}
                    {opt.text}
                  </span>
                  {showCorrect && <span className="text-xl">⭐</span>}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400">{variantInfo.instruction}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 7: SECRET ANIMAL (Vị khách bí mật)                 */}
      {/* ======================================================== */}
      {currentVariant === 'secret_animal' && (
        <div className="space-y-4">
          <div className="bg-linear-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-5 text-white text-center shadow-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
              🎭 Từ bí ẩn cần tìm
            </div>
            <div className="text-3xl mb-1">🔍</div>
            <div className="text-[11px] text-purple-100">
              Đã mở {saClues}/3 gợi ý{saAudioRevealed ? ' + âm thanh' : ''}
            </div>
          </div>

          <div className="space-y-2.5">
            {saClues >= 1 && (
              <div className="bg-white rounded-2xl p-3.5 border-2 border-purple-100 flex items-start gap-3">
                <span className="text-lg">🗂️</span>
                <div>
                  <div className="text-[10px] font-black text-purple-600 uppercase">Gợi ý 1 — Chủ đề</div>
                  <div className="text-sm font-semibold text-slate-700">{currentWord.category}</div>
                </div>
              </div>
            )}
            {saClues >= 2 && (
              <div className="bg-white rounded-2xl p-3.5 border-2 border-purple-100 flex items-start gap-3">
                <span className="text-lg">📖</span>
                <div>
                  <div className="text-[10px] font-black text-purple-600 uppercase">Gợi ý 2 — Câu ví dụ</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {currentWord.exampleSentence.replace(new RegExp(currentWord.word, 'gi'), '_____')}
                  </div>
                </div>
              </div>
            )}
            {saClues >= 3 && (
              <div className="bg-white rounded-2xl p-3.5 border-2 border-purple-100 flex items-start gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <div className="text-[10px] font-black text-purple-600 uppercase">Gợi ý 3 — Định nghĩa</div>
                  <div className="text-sm font-semibold text-slate-700">{currentWord.definitionEn}</div>
                </div>
              </div>
            )}
          </div>

          {!saAudioRevealed && (
            <button
              type="button"
              onClick={() => {
                if (saClues < 3) {
                  setSaClues(saClues + 1);
                } else {
                  setSaAudioRevealed(true);
                  playWordAudio(currentWord.word, currentWord.audioUrl);
                }
              }}
              className="w-full py-2.5 rounded-2xl border-2 border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Lightbulb size={14} />
              {saClues < 3 ? 'Mở thêm gợi ý' : 'Mở gợi ý phát âm (cuối cùng)'}
            </button>
          )}

          {saAudioRevealed && (
            <button
              onClick={() => playWordAudio(currentWord.word, currentWord.audioUrl)}
              className="w-full py-2.5 rounded-2xl bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Volume2 size={14} /> Nghe lại phát âm
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => {
              const isTarget = opt.id === currentWord.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleAnswerSubmit(isTarget)}
                  className={`p-4 rounded-3xl border-3 font-black text-sm transition-all shadow-sm active:scale-95 cursor-pointer capitalize ${
                    isAnswered
                      ? isTarget
                        ? 'bg-emerald-500 border-emerald-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                      : 'bg-white border-purple-200 text-purple-950 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                >
                  {opt.word}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400">{variantInfo.instruction}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 8: ZOO FEEDING (Bữa tiệc sở thú)                   */}
      {/* ======================================================== */}
      {currentVariant === 'zoo_feeding' && (
        <div className="space-y-5">
          <div className="rounded-3xl border-4 border-amber-200 bg-linear-to-b from-amber-50 to-orange-100 p-5 text-center relative overflow-hidden">
            <div
              className={`text-6xl mb-2 ${
                zfMood === 'happy' ? 'animate-bounce' : zfMood === 'sad' || zfMood === 'angry' ? 'animate-shake' : 'animate-soft-bounce'
              }`}
            >
              {zfMood === 'happy' ? '🥳' : zfMood === 'eating' ? '😋' : zfMood === 'sad' ? '😢' : zfMood === 'angry' ? '😠' : '🐻'}
            </div>
            <div className="text-xs font-black text-amber-800 mb-2">
              {zfMood === 'happy' ? 'Ngon quá! Cảm ơn bạn!' : zfMood === 'eating' ? 'Nhai nhai...' : zfMood === 'sad' ? 'Huhu... không đúng rồi...' : zfMood === 'angry' ? 'Mình vẫn chưa được ăn!' : 'Mình đang đói bụng...'}
            </div>
            <div className="inline-flex items-center justify-center w-24 h-12 rounded-full bg-white border-3 border-slate-300 shadow">
              {zfPlate ? (
                <span className="text-2xl animate-in zoom-in">{zfPlate}</span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400">dĩa trống</span>
              )}
            </div>
          </div>

          <div className="bg-linear-to-r from-emerald-500 to-teal-500 rounded-3xl p-4 text-white text-center shadow-lg">
            <div className="text-[11px] font-bold uppercase text-emerald-100 mb-1">
              Để bạn thú được ăn, bé hãy dịch từ sau sang tiếng Anh:
            </div>
            <h3 className="text-xl font-black flex items-center justify-center gap-2">
              <span>{currentWord.emoji}</span>
              <span>{currentWord.meaningVi}</span>
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {options.map((opt) => {
              const isTarget = opt.id === currentWord.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isAnswered || zfMood === 'eating' || zfMood === 'happy'}
                  onClick={() => {
                    if (isTarget) {
                      setZfPlate('🍎');
                      setZfMood('eating');
                      setTimeout(() => setZfMood('happy'), 700);
                      handleAnswerSubmit(true);
                    } else {
                      const next = zfWrong + 1;
                      setZfWrong(next);
                      setZfMood(next >= 2 ? 'angry' : 'sad');
                      setTimeout(() => setZfMood('waiting'), 1300);
                      handleAnswerSubmit(false);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border-3 font-black text-sm transition-all shadow-sm active:scale-95 cursor-pointer capitalize min-h-[62px] ${
                    isAnswered
                      ? isTarget
                        ? 'bg-emerald-500 border-emerald-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                      : 'bg-white border-amber-300 text-amber-950 hover:border-amber-500 hover:bg-amber-50'
                  }`}
                >
                  {opt.word}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400">{variantInfo.instruction}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 9: BUBBLE POP (Bong bóng từ vựng)                  */}
      {/* ======================================================== */}
      {currentVariant === 'bubble_pop' && (
        <div className="space-y-4">
          <div className="bg-linear-to-r from-sky-500 to-cyan-500 rounded-3xl p-5 text-white text-center shadow-lg">
            <div className="text-[11px] font-bold uppercase text-cyan-100 mb-1">
              Chạm bong bóng từ tiếng Anh có nghĩa:
            </div>
            <h3 className="text-xl font-black flex items-center justify-center gap-2">
              <span>{currentWord.emoji}</span>
              <span>{currentWord.meaningVi}</span>
            </h3>
          </div>

          <div
            className={`relative rounded-3xl overflow-hidden border-4 h-[240px] ${
              bpMood === 'wrong' ? 'border-rose-300' : bpMood === 'correct' ? 'border-emerald-300' : 'border-sky-200'
            }`}
            style={{
              background:
                bpMood === 'wrong'
                  ? 'radial-gradient(circle at 30% 20%, #ffe4e6, #fda4af)'
                  : bpMood === 'correct'
                  ? 'radial-gradient(circle at 30% 20%, #d1fae5, #6ee7b7)'
                  : 'radial-gradient(circle at 25% 18%, #f0f9ff, #93c5fd)',
            }}
          >
            {tripleOptions.map((opt, i) => {
              const isTarget = opt.id === currentWord.id;
              const isCorrectBubble = bpMood === 'correct' && isTarget;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => {
                    if (isTarget) {
                      setBpMood('correct');
                      handleAnswerSubmit(true);
                    } else {
                      setBpMood('wrong');
                      setTimeout(() => setBpMood('idle'), 700);
                      handleAnswerSubmit(false);
                    }
                  }}
                  className="absolute rounded-full flex items-center justify-center font-black cursor-pointer select-none border-0 p-0"
                  style={{
                    left: `${26 + i * 24}%`,
                    top: `${34 + (i % 2) * 22}%`,
                    width: '86px',
                    height: '86px',
                    transform: `translate(-50%, -50%) scale(${isCorrectBubble ? 1.15 : 1})`,
                    background: isCorrectBubble
                      ? 'radial-gradient(circle at 32% 26%, #fff, #d1fae5 12%, #34d399 45%, #059669 78%, #047857)'
                      : 'radial-gradient(circle at 32% 26%, #fff, #e0f2fe 12%, #60a5fa 46%, #3b82f6 76%, #1d4ed8)',
                    boxShadow:
                      'inset -8px -10px 20px rgba(29,78,216,0.5), inset 6px 6px 14px rgba(255,255,255,0.85), 0 10px 20px rgba(59,130,246,0.35)',
                  }}
                >
                  <span
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      top: '12%',
                      left: '20%',
                      width: '32%',
                      height: '24%',
                      background:
                        'radial-gradient(ellipse at center, rgba(255,255,255,0.98), rgba(255,255,255,0))',
                    }}
                  />
                  <span
                    className="relative z-10 px-1.5 text-center leading-tight capitalize text-white"
                    style={{
                      fontSize: opt.word.length > 8 ? '11px' : opt.word.length > 5 ? '13px' : '15px',
                      textShadow: '0 2px 4px rgba(0,0,0,0.35)',
                    }}
                  >
                    {opt.word}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400">{variantInfo.instruction}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 10: WORD MATCH (Bắt từ nhanh)                     */}
      {/* ======================================================== */}
      {currentVariant === 'word_match' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-4 border-indigo-100 shadow-xl text-center relative">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
              Chọn nghĩa tiếng Việt chính xác của từ:
            </div>
            <h3 className="text-3xl font-black text-slate-800 capitalize flex items-center justify-center gap-2">
              <span>{currentWord.emoji}</span>
              <span>{currentWord.word}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">{currentWord.phonetic}</p>
            <button
              onClick={() => playWordAudio(currentWord.word, currentWord.audioUrl)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold transition-all cursor-pointer"
            >
              <Volume2 size={14} /> Nghe phát âm
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt) => {
              const isTarget = opt.id === currentWord.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleAnswerSubmit(isTarget)}
                  className={`p-4 rounded-3xl border-3 font-black text-base transition-all shadow-sm active:scale-95 cursor-pointer ${
                    isAnswered
                      ? isTarget
                        ? 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                      : 'bg-white border-indigo-200 text-indigo-950 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                >
                  {opt.meaningVi}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400">{variantInfo.instruction}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 11: MYSTERY GARDEN (Khu vườn bí ẩn)                */}
      {/* ======================================================== */}
      {currentVariant === 'mystery_garden' && (
        <div className="space-y-5">
          <div className="rounded-3xl border-4 border-green-200 bg-linear-to-b from-sky-100 via-emerald-50 to-lime-100 p-4">
            <div className="text-xs font-black text-emerald-700 mb-2">
              🌱 Vườn hoa của bé ({correctWords.length} bông)
            </div>
            <div className="flex flex-wrap items-end gap-1.5 min-h-[48px]">
              {correctWords.length === 0 ? (
                <span className="text-xs text-emerald-600 italic">
                  Chọn đúng từ để trồng bông hoa đầu tiên!
                </span>
              ) : (
                Array.from({ length: Math.min(correctWords.length, 24) }).map((_, i) => (
                  <span key={i} className="text-2xl animate-bloom">
                    {['🌸', '🌻', '🌷', '🌹', '🌺', '🌼'][i % 6]}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border-4 border-emerald-100 shadow-lg text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
              🌱 Hạt giống bí ẩn — chọn từ tiếng Anh đúng nghĩa:
            </div>
            <h3 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2">
              <span className="text-2xl">{currentWord.emoji}</span>
              <span>{currentWord.meaningVi}</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tripleOptions.map((opt) => {
              const isTarget = opt.id === currentWord.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleAnswerSubmit(isTarget)}
                  className={`p-4 rounded-3xl border-3 font-black text-base transition-all shadow-sm active:scale-95 cursor-pointer capitalize ${
                    isAnswered
                      ? isTarget
                        ? 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                      : 'bg-white border-emerald-200 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  {opt.word}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400">{variantInfo.instruction}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 12: CANDY BUILDER (Nhà thiết kế kẹo ngọt)          */}
      {/* ======================================================== */}
      {currentVariant === 'candy_builder' && (
        <div className="space-y-5">
          <div className="rounded-3xl border-4 border-pink-200 bg-linear-to-b from-pink-50 via-rose-50 to-amber-50 p-4 min-h-[150px] relative overflow-hidden">
            <div className="text-xs font-black text-pink-600 mb-2">
              🍭 Tháp kẹo của bé ({correctWords.length} tầng)
            </div>
            <div className="flex flex-col-reverse items-center gap-0.5">
              {correctWords.length === 0 ? (
                <span className="text-xs text-pink-400 italic">Chọn đúng để xây viên kẹo đầu tiên!</span>
              ) : (
                correctWords.slice(0, 20).map((_, idx) => (
                  <div
                    key={idx}
                    className={`rounded-md bg-linear-to-b ${
                      ['from-pink-400 to-rose-500', 'from-amber-300 to-orange-400', 'from-lime-300 to-green-400', 'from-cyan-300 to-blue-400', 'from-violet-400 to-purple-500'][idx % 5]
                    } flex items-center justify-center shadow-sm animate-bloom`}
                    style={{ width: `${Math.max(28, 88 - idx * 3)}%`, height: '20px' }}
                  >
                    <span className="text-xs">{['🍬', '🍭', '🧁', '🍩', '🍪', '🎂'][idx % 6]}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-linear-to-r from-pink-500 to-fuchsia-500 rounded-3xl p-4 text-white text-center shadow-lg">
            <div className="text-[11px] font-bold uppercase text-pink-100 mb-1">
              Chọn từ đúng nghĩa để xây tầng kẹo mới:
            </div>
            <h3 className="text-xl font-black flex items-center justify-center gap-2">
              <span>{currentWord.emoji}</span>
              <span>{currentWord.meaningVi}</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tripleOptions.map((opt) => {
              const isTarget = opt.id === currentWord.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleAnswerSubmit(isTarget)}
                  className={`p-4 rounded-3xl border-3 font-black text-base transition-all shadow-sm active:scale-95 cursor-pointer capitalize ${
                    isAnswered
                      ? isTarget
                        ? 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                      : 'bg-white border-pink-200 text-pink-950 hover:border-pink-400 hover:bg-pink-50'
                  }`}
                >
                  {opt.word}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400">{variantInfo.instruction}</p>
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
