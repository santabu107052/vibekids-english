import React from 'react';
import { GameType, Profile, WordItem } from '../../types';

// Multi-Question Rotating Adventure Games
import { VocabRotatingAdventure } from '../games/VocabRotatingAdventure';
import { SentenceRotatingAdventure } from '../games/SentenceRotatingAdventure';

// Standalone Games
import { MemoryFlipGame } from '../games/MemoryFlipGame';
import { WordMatchGame } from '../games/WordMatchGame';
import { WordScrambleGame } from '../games/WordScrambleGame';
import { SoundDetectiveGame } from '../games/SoundDetectiveGame';
import { SpellingBeeGame } from '../games/SpellingBeeGame';
import { SentenceBuilderGame } from '../games/SentenceBuilderGame';

export interface GameRouterProps {
  activeGame: GameType;
  effectiveWords: WordItem[];
  allWords: WordItem[];
  profile: Profile;
  vocabAdventureMode: 'review' | 'new' | 'mixed';
  sentenceAdventureMode: 'all' | 'review' | 'new' | 'mixed';
  questionCount: number;
  onExit: () => void;
  onProfileUpdated: () => void;
}

export const GameRouter: React.FC<GameRouterProps> = ({
  activeGame,
  effectiveWords,
  allWords,
  profile,
  vocabAdventureMode,
  sentenceAdventureMode,
  questionCount,
  onExit,
  onProfileUpdated,
}) => {
  // Vocab Rotating Adventure (Question-by-Question Game Rotation)
  if (activeGame === 'vocab_adventure') {
    return (
      <VocabRotatingAdventure
        words={effectiveWords}
        allWords={allWords}
        profile={profile}
        mode={vocabAdventureMode}
        questionCount={questionCount}
        onExit={onExit}
        onProfileUpdated={onProfileUpdated}
      />
    );
  }

  // Sentence Rotating Adventure (Question-by-Question Game Rotation)
  if (activeGame === 'sentence_adventure') {
    return (
      <SentenceRotatingAdventure
        words={allWords}
        profile={profile}
        mode={sentenceAdventureMode}
        questionCount={questionCount}
        onExit={onExit}
        onProfileUpdated={onProfileUpdated}
      />
    );
  }

  // Standalone Games Common Props
  const commonProps = {
    words: effectiveWords,
    profile,
    questionCount,
    onExit,
    onProfileUpdated,
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
      return (
        <SentenceBuilderGame
          {...commonProps}
          mode={sentenceAdventureMode}
          questionCount={questionCount}
        />
      );
    default:
      return null;
  }
};
