import React from 'react';
import { Star } from 'lucide-react';

interface MasteryBadgeProps {
  level: number; // 0 to 5
  showLabel?: boolean;
}

export const MasteryBadge: React.FC<MasteryBadgeProps> = ({ level, showLabel = true }) => {
  const getLabel = () => {
    switch (level) {
      case 0: return 'Mới học';
      case 1: return 'Làm quen';
      case 2: return 'Nhớ từ';
      case 3: return 'Hiểu nghĩa';
      case 4: return 'Thành thạo';
      case 5: return 'Bậc thầy';
      default: return 'Mới học';
    }
  };

  const getColor = () => {
    switch (level) {
      case 0: return 'bg-slate-100 text-slate-600 border-slate-200';
      case 1: return 'bg-blue-50 text-blue-700 border-blue-200';
      case 2: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 3: return 'bg-amber-50 text-amber-700 border-amber-200';
      case 4: return 'bg-purple-50 text-purple-700 border-purple-200';
      case 5: return 'bg-gradient-to-r from-amber-400 to-rose-400 text-white border-transparent font-bold shadow-sm';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${getColor()}`}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={11}
            className={i <= level ? 'fill-current' : 'text-slate-300 dark:text-slate-500'}
          />
        ))}
      </div>
      {showLabel && <span>{getLabel()}</span>}
    </div>
  );
};
