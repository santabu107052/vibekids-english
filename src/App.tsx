import React, { useState } from 'react';
import { useProfileData } from './hooks/useProfileData';
import { useGameRouter } from './hooks/useGameRouter';
import { useModalManager } from './hooks/useModalManager';

import { Navbar } from './components/Navbar';
import { GameRouter } from './components/router/GameRouter';
import { HeroSection } from './components/dashboard/HeroSection';
import { VocabStatsSection } from './components/dashboard/VocabStatsSection';
import { WordNotebookSection } from './components/dashboard/WordNotebookSection';
import { GameKingdomsSection } from './components/dashboard/GameKingdomsSection';
import { BadgesSection } from './components/dashboard/BadgesSection';

import { ProfileModal } from './components/ProfileModal';
import { WordManagerModal } from './components/WordManagerModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { MonetizationModal } from './components/MonetizationModal';
import { GameSetupModal } from './components/GameSetupModal';
import { EchoVoiceRecorder } from './components/EchoVoiceRecorder';

export const App: React.FC = () => {
  // 1. Data & Profile Hook
  const {
    profiles,
    activeProfile,
    words,
    refreshData,
    masteredCount,
    learningCount,
    newCount,
    todayPracticedCount,
    remainingRecCount,
    totalAnswers,
    listeningScore,
    readingScore,
    spellingScore,
    sentenceScore,
    handleBatchAddRecommended,
    handleDeleteWord,
    alertNotice,
    setAlertNotice,
  } = useProfileData();

  // 2. Game Navigation & Routing Hook
  const {
    activeGame,
    gameWordsPool,
    vocabAdventureMode,
    sentenceAdventureMode,
    activeQuestionCount,
    gameSetupConfig,
    openVocabModeSetup,
    openSentenceModeSetup,
    openSingleGameSetup,
    handleConfirmGameSetup,
    closeGameSetup,
    exitActiveGame,
  } = useGameRouter();

  // 3. Modal Manager Hook
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    isWordManagerOpen,
    setIsWordManagerOpen,
    isBackupOpen,
    setIsBackupOpen,
    isMonetizationOpen,
    setIsMonetizationOpen,
    echoWord,
    setEchoWord,
  } = useModalManager();

  // Vocabulary stats & list filter
  const [filterMastery, setFilterMastery] = useState<'all' | 'mastered' | 'learning' | 'new'>('all');

  // Loading state if active profile not ready
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

  // Active Game View Router
  if (activeGame) {
    const effectiveWords = gameWordsPool.length > 0 ? gameWordsPool : words;
    return (
      <GameRouter
        activeGame={activeGame}
        effectiveWords={effectiveWords}
        allWords={words}
        profile={activeProfile}
        vocabAdventureMode={vocabAdventureMode}
        sentenceAdventureMode={sentenceAdventureMode}
        questionCount={activeQuestionCount}
        onExit={exitActiveGame}
        onProfileUpdated={refreshData}
      />
    );
  }

  // Dashboard Main View
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Navigation Bar */}
      <Navbar
        profile={activeProfile}
        onOpenProfiles={() => setIsProfileModalOpen(true)}
        onOpenWordManager={() => setIsWordManagerOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-7">
        {/* Hero Greeting & Daily Target */}
        <HeroSection profile={activeProfile} todayPracticedCount={todayPracticedCount} />

        {/* Section 1: Vocabulary Progress & Radar Skills */}
        <VocabStatsSection
          wordsCount={words.length}
          masteredCount={masteredCount}
          learningCount={learningCount}
          newCount={newCount}
          filterMastery={filterMastery}
          onSelectFilter={setFilterMastery}
          onOpenVocabMode={(mode) => openVocabModeSetup(mode, words, setAlertNotice)}
          onOpenWordManager={() => setIsWordManagerOpen(true)}
          alertNotice={alertNotice}
          onDismissAlert={() => setAlertNotice(null)}
          listeningScore={listeningScore}
          readingScore={readingScore}
          spellingScore={spellingScore}
          sentenceScore={sentenceScore}
          totalAnswers={totalAnswers}
        />

        {/* Word Notebook Section (List Preview & Actions) */}
        <WordNotebookSection
          words={words}
          filterMastery={filterMastery}
          onSelectFilter={setFilterMastery}
          remainingRecCount={remainingRecCount}
          onBatchAddRecommended={() => handleBatchAddRecommended(15)}
          onOpenWordManager={() => setIsWordManagerOpen(true)}
          onEchoWord={setEchoWord}
          onDeleteWord={(wordId) => handleDeleteWord(wordId)}
        />

        {/* Section 2: Mẫu câu giao tiếp (Tạm thời ẩn hoàn toàn theo chỉ đạo người dùng, chỉ giữ phần từ vựng) */}

        {/* Section 3: Game Kingdoms */}
        <GameKingdomsSection onSelectGame={openSingleGameSetup} />

        {/* Section 4: Badges & Achievements Collection */}
        <BadgesSection badges={activeProfile.badges} />
      </main>

      {/* Global Modals */}
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
        onRewardReceived={refreshData}
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

      {/* Game Setup Modal */}
      <GameSetupModal
        isOpen={gameSetupConfig.isOpen}
        onClose={closeGameSetup}
        title={gameSetupConfig.title}
        icon={gameSetupConfig.icon}
        badge={gameSetupConfig.badge}
        fixedMode={gameSetupConfig.fixedMode}
        initialCount={activeQuestionCount}
        reviewedCount={masteredCount + learningCount}
        newCount={newCount}
        onConfirm={(mode, count) => handleConfirmGameSetup(mode, count, words)}
      />
    </div>
  );
};

export default App;
