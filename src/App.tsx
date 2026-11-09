import React, { useState, useEffect } from 'react';
import { 
  getProfiles, 
  getActiveProfileId, 
  getWordsForProfile, 
  deleteCustomWord,
  getTodayPracticedWordsCount,
  getRemainingRecommendedWords,
  addRecommendedWordsBatch,
  setActiveProfileId as setStorageActiveProfileId
} from './services/storage';
import { Profile, WordItem, GameType } from './types';
import { Navbar } from './components/Navbar';
import { ProfileModal } from './components/ProfileModal';
import { WordManagerModal } from './components/WordManagerModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { MonetizationModal } from './components/MonetizationModal';
import { GameSetupModal, GameLearningMode } from './components/GameSetupModal';
import { SentencePatternSection } from './components/SentencePatternSection';
import { EchoVoiceRecorder } from './components/EchoVoiceRecorder';
import { SkillsRadarCard } from './components/SkillsRadarCard';
import { AudioButton } from './components/AudioButton';

// Standalone Games
import { MemoryFlipGame } from './components/games/MemoryFlipGame';
import { WordMatchGame } from './components/games/WordMatchGame';
import { WordScrambleGame } from './components/games/WordScrambleGame';
import { SoundDetectiveGame } from './components/games/SoundDetectiveGame';
import { SpellingBeeGame } from './components/games/SpellingBeeGame';
import { SentenceBuilderGame } from './components/games/SentenceBuilderGame';

// Multi-Question Rotating Adventure Games
import { VocabRotatingAdventure } from './components/games/VocabRotatingAdventure';
import { SentenceRotatingAdventure } from './components/games/SentenceRotatingAdventure';

import { 
  Compass, 
  Zap, 
  RotateCcw, 
  Sparkles, 
  Target, 
  PlusCircle, 
  Trash2, 
  ChevronRight, 
  Play, 
  Award,
  BookOpen
} from 'lucide-react';

export const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);

  // Active game navigation
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [gameWordsPool, setGameWordsPool] = useState<WordItem[]>([]);
  const [vocabAdventureMode, setVocabAdventureMode] = useState<'review' | 'new' | 'mixed'>('mixed');
  const [sentenceAdventureMode, setSentenceAdventureMode] = useState<'all' | 'review' | 'new' | 'mixed'>('all');
  const [activeQuestionCount, setActiveQuestionCount] = useState<number>(10);

  // Game Setup Modal Configuration
  const [gameSetupConfig, setGameSetupConfig] = useState<{
    isOpen: boolean;
    targetGame: GameType;
    title: string;
    icon: string;
    badge?: string;
    fixedMode?: GameLearningMode;
  }>({
    isOpen: false,
    targetGame: 'vocab_adventure',
    title: 'Cấu hình trò chơi',
    icon: '🎮',
  });

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWordManagerOpen, setIsWordManagerOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isMonetizationOpen, setIsMonetizationOpen] = useState(false);
  const [echoWord, setEchoWord] = useState<WordItem | null>(null);

  // Vocabulary stats & list filter
  const [filterMastery, setFilterMastery] = useState<'all' | 'mastered' | 'learning' | 'new'>('all');
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  const refreshData = () => {
    const allProfiles = getProfiles();
    setProfiles(allProfiles);
    const activeId = getActiveProfileId();
    const current = allProfiles.find((p) => p.id === activeId) || allProfiles[0] || null;
    setActiveProfile(current);
    if (current) {
      const profileWords = getWordsForProfile(current.id);
      setWords(profileWords);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-3">🐱</div>
          <div className="text-lg font-black text-slate-800">Đang khởi động VibeKids English...</div>
        </div>
      </div>
    );
  }

  // Stats calculation
  const masteredWords = words.filter((w) => (w.masteryLevel || 0) >= 4);
  const learningWords = words.filter((w) => (w.masteryLevel || 0) > 0 && (w.masteryLevel || 0) < 4);
  const newWords = words.filter((w) => (w.masteryLevel || 0) === 0);

  const masteredCount = masteredWords.length;
  const learningCount = learningWords.length;
  const newCount = newWords.length;

  // Live today's practiced words calculation
  const todayPracticedCount = getTodayPracticedWordsCount(activeProfile.id);
  const remainingRecCount = getRemainingRecommendedWords(activeProfile.id).length;

  // Calculate 4 skill radar scores
  const totalCorrect = words.reduce((acc, w) => acc + (w.correctCount || 0), 0);
  const totalIncorrect = words.reduce((acc, w) => acc + (w.incorrectCount || 0), 0);
  const totalAnswers = totalCorrect + totalIncorrect;
  const baseAccuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 75;

  const listeningScore = Math.min(100, Math.max(30, baseAccuracy + (masteredCount * 2)));
  const readingScore = Math.min(100, Math.max(40, Math.round(((masteredCount + learningCount) / Math.max(1, words.length)) * 100)));
  const spellingScore = Math.min(100, Math.max(25, baseAccuracy - 5 + (activeProfile.level * 5)));
  const sentenceScore = Math.min(100, Math.max(20, (activeProfile.level * 15)));

  const handleBatchAddRecommended = (count: number = 5) => {
    setAlertNotice(null);
    const res = addRecommendedWordsBatch(activeProfile.id, count);
    if (res.added.length > 0) {
      setAlertNotice(`🎉 Đã nạp thành công ${res.added.length} từ vựng mới (${res.added.map(w => w.word).join(', ')}) cho lứa tuổi bé!`);
      refreshData();
    } else {
      setAlertNotice(`Bé đã nạp hết tất cả từ vựng khuyến nghị phù hợp cho độ tuổi này rồi!`);
    }
  };

  // Filtered vocabulary words for Sổ tay
  const filteredWords = words.filter((w) => {
    const level = w.masteryLevel || 0;
    if (filterMastery === 'mastered') return level >= 4;
    if (filterMastery === 'learning') return level > 0 && level < 4;
    if (filterMastery === 'new') return level === 0;
    return true;
  });

  const handleDeleteWord = (wordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa từ vựng này khỏi sổ tay của bé?')) {
      deleteCustomWord(activeProfile.id, wordId);
      refreshData();
    }
  };

  // 1. Triggered when clicking 1 of 3 smart buttons for vocabulary:
  // Asks how many questions the player wants (minimum 10, or infinite)
  const openVocabModeSetup = (mode: 'review' | 'new' | 'mixed') => {
    setAlertNotice(null);
    if (mode === 'review') {
      const reviewed = words.filter((w) => (w.masteryLevel || 0) >= 1);
      if (reviewed.length === 0) {
        setAlertNotice('Bé chưa có từ vựng nào đã học. Hãy bắt đầu với "Học Từ Mới" nhé!');
        return;
      }
    } else if (mode === 'new') {
      const unlearned = words.filter((w) => (w.masteryLevel || 0) === 0);
      if (unlearned.length === 0) {
        setAlertNotice('Bé đã học hết tất cả từ mới hiện có! Hãy bấm "Ôn Từ" hoặc thêm từ vựng mới nhé!');
        return;
      }
    }

    setGameSetupConfig({
      isOpen: true,
      targetGame: 'vocab_adventure',
      title: mode === 'review' ? 'Ôn Từ Đã Học' : mode === 'new' ? 'Học Từ Mới' : 'Vừa Ôn Vừa Học',
      icon: mode === 'review' ? '🔄' : mode === 'new' ? '✨' : '🎯',
      badge: 'Luân phiên 5 game',
      fixedMode: mode,
    });
  };

  // 2. Triggered when clicking 1 of 3 smart buttons for sentence patterns:
  const openSentenceModeSetup = (mode: 'all' | 'review' | 'new' | 'mixed' = 'all') => {
    setGameSetupConfig({
      isOpen: true,
      targetGame: 'sentence_adventure',
      title: mode === 'review' ? 'Ôn Mẫu Câu Đã Học' : mode === 'new' ? 'Học Mẫu Câu Mới' : 'Mẫu Câu Vừa Ôn Vừa Học',
      icon: '💬',
      badge: 'Luân phiên 3 game',
      fixedMode: mode === 'all' ? 'mixed' : mode,
    });
  };

  // 3. Triggered when clicking any individual game from the Kingdoms:
  // Asks BOTH: which mode (review / new / mixed) AND how many questions!
  const openSingleGameSetup = (game: { id: GameType; title: string; icon: string; badge: string }) => {
    setGameSetupConfig({
      isOpen: true,
      targetGame: game.id,
      title: game.title,
      icon: game.icon,
      badge: game.badge,
      fixedMode: undefined, // Allows user to pick mode!
    });
  };

  // 4. Executed when player confirms setup modal:
  const handleConfirmGameSetup = (selectedMode: GameLearningMode, count: number) => {
    setActiveQuestionCount(count);

    // Filter words pool based on selected learning mode
    let pool: WordItem[] = [];
    if (selectedMode === 'review') {
      const reviewed = words.filter((w) => (w.masteryLevel || 0) >= 1);
      pool = reviewed.length > 0 ? reviewed : words;
    } else if (selectedMode === 'new') {
      const unlearned = words.filter((w) => (w.masteryLevel || 0) === 0);
      pool = unlearned.length > 0 ? unlearned : words;
    } else {
      // Mixed mode
      const unlearned = words.filter((w) => (w.masteryLevel || 0) === 0);
      const reviewed = words.filter((w) => (w.masteryLevel || 0) >= 1);
      pool = [...unlearned, ...reviewed];
      if (pool.length === 0) pool = words;
    }

    setGameWordsPool(pool);
    setVocabAdventureMode(selectedMode);
    setSentenceAdventureMode(selectedMode);
    setActiveGame(gameSetupConfig.targetGame);
  };

  // ========================================================
  // ACTIVE GAME ROUTER VIEW
  // ========================================================
  if (activeGame) {
    const effectiveWords = gameWordsPool.length > 0 ? gameWordsPool : words;

    // Vocab Rotating Adventure (Question-by-Question Game Rotation)
    if (activeGame === 'vocab_adventure') {
      return (
        <VocabRotatingAdventure
          words={effectiveWords}
          allWords={words}
          profile={activeProfile}
          mode={vocabAdventureMode}
          questionCount={activeQuestionCount}
          onExit={() => setActiveGame(null)}
          onProfileUpdated={refreshData}
        />
      );
    }

    // Sentence Rotating Adventure (Question-by-Question Game Rotation)
    if (activeGame === 'sentence_adventure') {
      return (
        <SentenceRotatingAdventure
          words={words}
          profile={activeProfile}
          mode={sentenceAdventureMode}
          questionCount={activeQuestionCount}
          onExit={() => setActiveGame(null)}
          onProfileUpdated={refreshData}
        />
      );
    }

    // Standalone Games
    const commonProps = {
      words: effectiveWords,
      profile: activeProfile,
      questionCount: activeQuestionCount,
      onExit: () => setActiveGame(null),
      onProfileUpdated: refreshData,
    };

    switch (activeGame) {
      case 'memory_flip':
        return <MemoryFlipGame {...commonProps} />;
      case 'word_match':
        return <WordMatchGame {...commonProps} />;
      case 'word_scramble':
        return <WordScrambleGame {...commonProps} />;
      case 'sound_detective':
        return <SoundDetectiveGame {...commonProps} />;
      case 'spelling_bee':
        return <SpellingBeeGame {...commonProps} />;
      case 'sentence_builder':
        return <SentenceBuilderGame {...commonProps} mode={sentenceAdventureMode} questionCount={activeQuestionCount} />;
      default:
        setActiveGame(null);
    }
  }

  // Games definition for Kingdom cards
  const vocabGamesList = [
    {
      id: 'memory_flip' as GameType,
      title: 'Lật Thẻ Mặt Chữ & Nghĩa',
      desc: 'Rèn luyện trí nhớ thị giác, nối từ tiếng Anh với nghĩa tiếng Việt.',
      icon: '🃏',
      color: 'from-amber-400 to-orange-500',
      badge: 'Quen chữ',
    },
    {
      id: 'word_match' as GameType,
      title: 'Bắt Từ Nhanh (Bong Bóng)',
      desc: 'Phản xạ chọn nghĩa tiếng Việt chính xác của từ vựng.',
      icon: '🎈',
      color: 'from-blue-400 to-indigo-500',
      badge: 'Nhớ nghĩa',
    },
    {
      id: 'word_scramble' as GameType,
      title: 'Xếp Chữ Thần Tốc',
      desc: 'Ghép từng ký tự để rèn luyện thói quen viết đúng chính tả.',
      icon: '🚂',
      color: 'from-emerald-400 to-teal-500',
      badge: 'Chính tả',
    },
    {
      id: 'sound_detective' as GameType,
      title: 'Thám Tử Âm Thanh',
      desc: 'Nghe phát âm chuẩn bản ngữ và chọn nghĩa tiếng Việt.',
      icon: '🕵️',
      color: 'from-purple-400 to-pink-500',
      badge: 'Luyện nghe',
    },
    {
      id: 'spelling_bee' as GameType,
      title: 'Thử Thách Chính Tả (Spelling)',
      desc: 'Nghe phát âm rồi gõ lại từ vựng hoàn chỉnh.',
      icon: '🐝',
      color: 'from-rose-400 to-red-500',
      badge: 'Viết chuẩn',
    },
  ];

  const sentenceGamesList = [
    {
      id: 'sentence_builder' as GameType,
      title: 'Xây Dựng Mẫu Câu',
      desc: 'Sắp xếp các từ vựng thành câu hoàn chỉnh đúng ngữ pháp 100%.',
      icon: '🏗️',
      color: 'from-indigo-500 to-purple-600',
      badge: 'Ngữ pháp thực chiến',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Navbar */}
      <Navbar
        profile={activeProfile}
        onOpenProfiles={() => setIsProfileModalOpen(true)}
        onOpenWordManager={() => setIsWordManagerOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenMonetization={() => setIsMonetizationOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-7">
        {/* Hero Greeting & Daily Target */}
        <section className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-6xl p-2 bg-white/20 backdrop-blur-md rounded-3xl shadow-inner border border-white/30">
                {activeProfile.avatar}
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold backdrop-blur-xs">
                    Cấp Độ {activeProfile.level} • {activeProfile.age} Tuổi
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black">
                    {activeProfile.xp} XP
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">
                  Chào {activeProfile.name}! Sẵn sàng khám phá chưa?
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
                  Rèn luyện phản xạ từ vựng, luyện nghe bản ngữ và ngữ pháp câu chuẩn xác mỗi ngày!
                </p>
              </div>
            </div>

            {/* Daily Goal Card */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 w-full md:w-64">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Target size={14} className="text-amber-300" />
                  Mục tiêu hôm nay
                </span>
                <span>{todayPracticedCount}/{activeProfile.dailyGoal} từ</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (todayPracticedCount / (activeProfile.dailyGoal || 5)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-white/70 mt-1.5 text-right font-medium">
                {todayPracticedCount >= activeProfile.dailyGoal
                  ? '🎉 Đã hoàn thành xuất sắc mục tiêu hôm nay!'
                  : `Cố lên! Đã học ${todayPracticedCount}/${activeProfile.dailyGoal} từ hôm nay.`}
              </p>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 1: TIẾN ĐỘ TỪ VỰNG TIẾNG ANH (VOCABULARY)        */}
        {/* ======================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="text-indigo-600" />
              Tiến Độ Từ Vựng Tiếng Anh
            </h3>
            <button
              onClick={() => setIsWordManagerOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle size={14} />
              Quản lý sổ tay từ
            </button>
          </div>

          {/* 4 Stats Cards (Clickable) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div 
              onClick={() => setFilterMastery('all')} 
              className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
                filterMastery === 'all'
                  ? 'bg-indigo-50/90 border-indigo-600 ring-4 ring-indigo-200 shadow-md scale-102'
                  : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl shadow-xs">📚</div>
              <div>
                <div className="text-2xl font-black text-slate-800">{words.length}</div>
                <div className="text-xs font-bold text-slate-500">Tổng từ vựng</div>
              </div>
            </div>

            <div 
              onClick={() => setFilterMastery('mastered')} 
              className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
                filterMastery === 'mastered'
                  ? 'bg-amber-50/90 border-amber-600 ring-4 ring-amber-200 shadow-md scale-102'
                  : 'bg-white border-slate-200/90 hover:border-amber-300 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xl shadow-xs">⭐</div>
              <div>
                <div className="text-2xl font-black text-amber-600">{masteredCount}</div>
                <div className="text-xs font-bold text-slate-500">Đã thành thạo</div>
              </div>
            </div>

            <div 
              onClick={() => setFilterMastery('learning')} 
              className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
                filterMastery === 'learning'
                  ? 'bg-emerald-50/90 border-emerald-600 ring-4 ring-emerald-200 shadow-md scale-102'
                  : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xl shadow-xs">🌱</div>
              <div>
                <div className="text-2xl font-black text-emerald-600">{learningCount}</div>
                <div className="text-xs font-bold text-slate-500">Đang luyện tập</div>
              </div>
            </div>

            <div 
              onClick={() => setFilterMastery('new')} 
              className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
                filterMastery === 'new'
                  ? 'bg-rose-50/90 border-rose-600 ring-4 ring-rose-200 shadow-md scale-102'
                  : 'bg-white border-slate-200/90 hover:border-rose-300 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xl shadow-xs">✨</div>
              <div>
                <div className="text-2xl font-black text-rose-600">{newCount}</div>
                <div className="text-xs font-bold text-slate-500">Từ mới cần học</div>
              </div>
            </div>
          </div>

          {/* 3 Smart Buttons for Vocabulary (Rotates games across questions!) */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-1">
              <Zap size={16} className="text-amber-500 fill-amber-500" />
              <span>Chế độ học từ vựng (Luân phiên game sau mỗi câu hỏi):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-2xl">
              {/* Nút 1: Ôn từ đã học */}
              <button
                type="button"
                onClick={() => openVocabModeSetup('review')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border-2 border-slate-200 hover:border-amber-400 text-slate-800 transition-all flex items-center justify-center gap-2 active:scale-98 group cursor-pointer"
              >
                <RotateCcw size={16} className="text-amber-500 group-hover:rotate-[-45deg] transition-transform" />
                <div className="text-left">
                  <div className="text-xs font-black">Ôn từ đã học</div>
                  <div className="text-[10px] text-slate-400 font-medium">{masteredCount + learningCount} từ đã học</div>
                </div>
              </button>

              {/* Nút 2: Học từ vựng mới */}
              <button
                type="button"
                onClick={() => openVocabModeSetup('new')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border-2 border-slate-200 hover:border-indigo-400 text-slate-800 transition-all flex items-center justify-center gap-2 active:scale-98 group cursor-pointer"
              >
                <Sparkles size={16} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-xs font-black">Học từ mới</div>
                  <div className="text-[10px] text-indigo-600 font-bold">Khám phá từ mới</div>
                </div>
              </button>

              {/* Nút 3: Vừa ôn vừa học */}
              <button
                type="button"
                onClick={() => openVocabModeSetup('mixed')}
                className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100 active:scale-98 cursor-pointer"
              >
                <Target size={16} className="text-amber-300" />
                <div className="text-left">
                  <div className="text-xs font-black">Vừa ôn vừa học</div>
                  <div className="text-[10px] text-indigo-200 font-medium">Kết hợp phản xạ</div>
                </div>
              </button>
            </div>
          </div>

          {/* Alert Notice if empty */}
          {alertNotice && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
              <span>⚠️ {alertNotice}</span>
              <button onClick={() => setAlertNotice(null)} className="text-xs underline text-amber-700 cursor-pointer">Đóng</button>
            </div>
          )}

          {/* Bản Đồ 4 Kỹ Năng Thông Minh Của Bé */}
          <SkillsRadarCard
            listeningScore={listeningScore}
            readingScore={readingScore}
            spellingScore={spellingScore}
            sentenceScore={sentenceScore}
            totalPracticed={totalAnswers}
          />

          {/* Sổ Tay Từ Vựng Chi Tiết (Word List Preview) */}
          <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {filterMastery === 'mastered' ? '⭐' : filterMastery === 'learning' ? '🌱' : filterMastery === 'new' ? '✨' : '📖'}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {filterMastery === 'all' ? 'Tất cả Từ Vựng Trong Sổ Tay' : 
                     filterMastery === 'mastered' ? 'Từ Đã Thành Thạo' : 
                     filterMastery === 'learning' ? 'Từ Đang Luyện Tập' : 'Từ Mới Cần Học'}
                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {filteredWords.length} từ
                    </span>
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {filterMastery !== 'all' && (
                  <button 
                    onClick={() => setFilterMastery('all')} 
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Xem tất cả
                  </button>
                )}
                <button
                  onClick={() => handleBatchAddRecommended(15)}
                  className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles size={14} className="fill-white" />
                  <span>Nạp từ khuyến nghị (+15)</span>
                  {remainingRecCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-white/25 rounded-md text-[10px] font-mono">
                      còn {remainingRecCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsWordManagerOpen(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <PlusCircle size={14} />
                  Tra cứu tự thêm
                </button>
              </div>
            </div>

            {filteredWords.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Không có từ vựng nào trong mục này. Bé hãy tham gia trò chơi để thăng cấp nhé!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredWords.map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0">{w.emoji}</span>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 text-sm capitalize truncate">
                          {w.word}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{w.meaningVi}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEchoWord(w)}
                        title="Luyện phát âm nhại lại"
                        className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                      >
                        <span className="text-sm">🎙️</span>
                      </button>
                      <AudioButton word={w.word} audioUrl={w.audioUrl} size="sm" />
                      {w.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteWord(w.id, e)}
                          title="Xóa từ tự thêm"
                          className="w-7 h-7 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>

        {/* ======================================================== */}
        {/* SECTION 2: MẪU CÂU GIAO TIẾP (SENTENCE PATTERNS SECTION) */}
        {/* ======================================================== */}
        <SentencePatternSection
          profileId={activeProfile.id}
          userLevel={activeProfile.level}
          dailyGoal={activeProfile.dailyGoal}
          onPlaySentenceGame={openSentenceModeSetup}
        />

        {/* ======================================================== */}
        {/* SECTION 3: VƯƠNG QUỐC TRÒ CHƠI HỌC TẬP (GAME KINGDOMS)    */}
        {/* ======================================================== */}
        <div className="space-y-6 pt-2">
          {/* Trò chơi từ vựng */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Compass className="text-indigo-600" />
                  Vương Quốc Trò Chơi Từ Vựng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Luyện tập phản xạ, mặt chữ, nghe phát âm và chính tả với từng trò chơi riêng lẻ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vocabGamesList.map((g) => (
                <div
                  key={g.id}
                  onClick={() => openSingleGameSetup(g)}
                  className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden active:scale-98"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className={`w-14 h-14 rounded-2xl bg-linear-to-tr ${g.color} flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform`}>
                        {g.icon}
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {g.badge}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 mt-4 group-hover:text-indigo-600 transition-colors">
                      {g.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {g.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                    <span className="flex items-center gap-1">
                      <Play size={13} className="fill-indigo-600" />
                      Chơi Ngay
                    </span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Trò chơi mẫu câu */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Compass className="text-purple-600" />
                  Vương Quốc Trò Chơi Mẫu Câu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thực hành cấu trúc câu hoàn chỉnh, rèn luyện tư duy ngữ pháp tự nhiên
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sentenceGamesList.map((g) => (
                <div
                  key={g.id}
                  onClick={() => openSingleGameSetup(g)}
                  className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden active:scale-98"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className={`w-14 h-14 rounded-2xl bg-linear-to-tr ${g.color} flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform`}>
                        {g.icon}
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                        {g.badge}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 mt-4 group-hover:text-purple-600 transition-colors">
                      {g.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {g.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                    <span className="flex items-center gap-1">
                      <Play size={13} className="fill-purple-600" />
                      Chơi Ngay
                    </span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Badges / Achievements Collection */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-amber-500" size={24} />
            <h3 className="text-base font-black text-slate-900">Huy Hiệu & Danh Hiệu Của Bé</h3>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {activeProfile.badges.map((b, i) => (
              <span
                key={i}
                className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <span>🏆</span>
                <span>{b}</span>
              </span>
            ))}
            <span className="px-3.5 py-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-medium flex items-center gap-1.5">
              <span>🔒</span>
              <span>Học giả nhí (Cần 100 sao)</span>
            </span>
          </div>
        </section>
      </main>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfile={activeProfile}
        onProfileChanged={refreshData}
      />

      <WordManagerModal
        isOpen={isWordManagerOpen}
        onClose={() => setIsWordManagerOpen(false)}
        profile={activeProfile}
        words={words}
        onWordsUpdated={refreshData}
      />

      <BackupRestoreModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataRestored={refreshData}
      />

      <MonetizationModal
        isOpen={isMonetizationOpen}
        onClose={() => setIsMonetizationOpen(false)}
        onRewardReceived={() => {
          refreshData();
        }}
      />

      {/* Echo Voice Recorder Modal */}
      {echoWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full">
            <EchoVoiceRecorder
              word={echoWord.word}
              phonetic={echoWord.phonetic}
              meaningVi={echoWord.meaningVi}
              audioUrl={echoWord.audioUrl}
              onClose={() => setEchoWord(null)}
            />
          </div>
        </div>
      )}

      {/* Game Setup Modal (Chế độ học + Số lượng câu hỏi >= 10 hoặc Vô tận) */}
      <GameSetupModal
        isOpen={gameSetupConfig.isOpen}
        onClose={() => setGameSetupConfig((prev) => ({ ...prev, isOpen: false }))}
        title={gameSetupConfig.title}
        icon={gameSetupConfig.icon}
        badge={gameSetupConfig.badge}
        fixedMode={gameSetupConfig.fixedMode}
        initialCount={activeQuestionCount}
        reviewedCount={masteredCount + learningCount}
        newCount={newCount}
        onConfirm={handleConfirmGameSetup}
      />
    </div>
  );
};
export default App;
