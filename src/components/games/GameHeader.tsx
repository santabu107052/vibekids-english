import React from 'react';
import { ArrowLeft, Star, Heart, Volume2 } from 'lucide-react';

interface GameHeaderProps {
  title: string;
  emoji: string;
  score: number;
  lives?: number;
  currentRound?: number;
  totalRounds?: number;
  onExit: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  emoji,
  score,
  lives,
  currentRound,
  totalRounds,
  onExit,
}) => {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-6">
      <button
        onClick={onExit}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
      >
        <ArrowLeft size={16} />
        Thoát Game
      </button>

      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <h2 className="text-base font-black text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {lives !== undefined && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                size={18}
                className={i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}
              />
            ))}
          </div>
        )}

        {currentRound !== undefined && totalRounds !== undefined && (
          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {currentRound}/{totalRounds}
          </span>
        )}

        <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold">
          <Star size={14} className="fill-amber-400 text-amber-500" />
          <span>{score}</span>
        </div>
      </div>
    </div>
  );
};
