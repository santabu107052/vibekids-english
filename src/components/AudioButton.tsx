import React, { useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { playWordAudio } from '../services/dictionaryApi';

interface AudioButtonProps {
  word: string;
  audioUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  word,
  audioUrl,
  size = 'md',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await playWordAudio(word, audioUrl);
    } catch {
      // ignore
    } finally {
      setIsPlaying(false);
    }
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-12 h-12 text-lg',
  }[size];

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPlaying}
      aria-label={`Phát âm từ ${word}`}
      className={`inline-flex items-center justify-center rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 active:scale-95 transition-all shadow-sm ${sizeClasses} ${className}`}
    >
      {isPlaying ? (
        <Loader2 size={iconSizes} className="animate-spin text-indigo-600" />
      ) : (
        <Volume2 size={iconSizes} />
      )}
    </button>
  );
};
