import React from 'react';
import { Star, Flame, Sparkles, BookPlus, Users, Database, Award } from 'lucide-react';
import { Profile } from '../types';

interface NavbarProps {
  profile: Profile;
  onOpenProfiles: () => void;
  onOpenWordManager: () => void;
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onOpenProfiles,
  onOpenWordManager,
  onOpenBackup,
}) => {
  const ageLabel = profile.age <= 8 ? 'Nhi đồng (6-8t)' : profile.age <= 11 ? 'Tiểu học (9-11t)' : 'Thiếu niên (12-15t)';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* App Title & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-200">
            V
          </div>
          <div>
            <h1 className="text-lg font-black bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-none">
              VibeKids English
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Học Tiếng Anh Qua Game Vui Nhộn
            </p>
          </div>
        </div>

        {/* User Status / Streaks / Stars */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <Star size={16} className="fill-amber-400 text-amber-500 animate-pulse" />
            <span>{profile.stars}</span>
            <span className="hidden sm:inline text-amber-600 font-medium">sao</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold">
            <Flame size={16} className="text-orange-500 fill-orange-400 animate-bounce" />
            <span>{profile.streak}</span>
            <span className="hidden sm:inline text-orange-600 font-medium">ngày</span>
          </div>

          {/* Active Profile Pill */}
          <button
            type="button"
            onClick={onOpenProfiles}
            title="Nhấp để đổi hồ sơ bé"
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all text-left"
          >
            <span className="text-xl">{profile.avatar}</span>
            <div className="hidden md:block leading-tight">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                {profile.name}
                <span className="text-[10px] px-1 rounded-sm bg-indigo-100 text-indigo-700 font-semibold">
                  Lv.{profile.level}
                </span>
              </div>
              <div className="text-[10px] text-slate-500">{ageLabel}</div>
            </div>
            <Users size={14} className="text-slate-400 hidden sm:block ml-1" />
          </button>

          {/* Quick Action: Add words */}
          <button
            type="button"
            onClick={onOpenWordManager}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-100 active:scale-95 transition-all"
          >
            <BookPlus size={15} />
            <span className="hidden sm:inline">Từ Vựng</span>
          </button>

          {/* Quick Action: Backup */}
          <button
            type="button"
            onClick={onOpenBackup}
            title="Sao lưu & Đồng bộ"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all cursor-pointer"
          >
            <Database size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
