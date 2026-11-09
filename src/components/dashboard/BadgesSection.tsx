import React from 'react';
import { Award } from 'lucide-react';

export interface BadgesSectionProps {
  badges: string[];
}

export const BadgesSection: React.FC<BadgesSectionProps> = ({ badges }) => {
  return (
    <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <Award className="text-amber-500" size={24} />
        <h3 className="text-base font-black text-slate-900">Huy Hiệu & Danh Hiệu Của Bé</h3>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {badges.map((b, i) => (
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
  );
};
