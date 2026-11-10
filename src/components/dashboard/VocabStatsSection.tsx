import React from 'react';
import { BookOpen, PlusCircle, Zap, RotateCcw, Sparkles, Target } from 'lucide-react';

export interface VocabStatsSectionProps {
  wordsCount: number;
  masteredCount: number;
  learningCount: number;
  newCount: number;
  filterMastery: 'all' | 'mastered' | 'learning' | 'new';
  onSelectFilter: (filter: 'all' | 'mastered' | 'learning' | 'new') => void;
  onOpenVocabMode: (mode: 'review' | 'new' | 'mixed') => void;
  onOpenWordManager: () => void;
  alertNotice: string | null;
  onDismissAlert: () => void;
}

export const VocabStatsSection: React.FC<VocabStatsSectionProps> = ({
  wordsCount,
  masteredCount,
  learningCount,
  newCount,
  filterMastery,
  onSelectFilter,
  onOpenVocabMode,
  onOpenWordManager,
  alertNotice,
  onDismissAlert,
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="text-indigo-600" />
          Tiến Độ Từ Vựng Tiếng Anh
        </h3>
        <button
          type="button"
          onClick={onOpenWordManager}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <PlusCircle size={14} />
          Quản lý sổ tay từ
        </button>
      </div>

      {/* 4 Stats Cards (Clickable) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => onSelectFilter('all')}
          className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
            filterMastery === 'all'
              ? 'bg-indigo-50/90 border-indigo-600 ring-4 ring-indigo-200 shadow-md scale-102'
              : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl shadow-xs">
            📚
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{wordsCount}</div>
            <div className="text-xs font-bold text-slate-500">Tổng từ vựng</div>
          </div>
        </div>

        <div
          onClick={() => onSelectFilter('mastered')}
          className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
            filterMastery === 'mastered'
              ? 'bg-amber-50/90 border-amber-600 ring-4 ring-amber-200 shadow-md scale-102'
              : 'bg-white border-slate-200/90 hover:border-amber-300 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xl shadow-xs">
            ⭐
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">{masteredCount}</div>
            <div className="text-xs font-bold text-slate-500">Đã thành thạo</div>
          </div>
        </div>

        <div
          onClick={() => onSelectFilter('learning')}
          className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
            filterMastery === 'learning'
              ? 'bg-emerald-50/90 border-emerald-600 ring-4 ring-emerald-200 shadow-md scale-102'
              : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xl shadow-xs">
            🌱
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{learningCount}</div>
            <div className="text-xs font-bold text-slate-500">Đang luyện tập</div>
          </div>
        </div>

        <div
          onClick={() => onSelectFilter('new')}
          className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
            filterMastery === 'new'
              ? 'bg-rose-50/90 border-rose-600 ring-4 ring-rose-200 shadow-md scale-102'
              : 'bg-white border-slate-200/90 hover:border-rose-300 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xl shadow-xs">
            ✨
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">{newCount}</div>
            <div className="text-xs font-bold text-slate-500">Từ mới cần học</div>
          </div>
        </div>
      </div>

      {/* 3 Smart Buttons for Vocabulary (Rotates games across questions) */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-1">
          <Zap size={16} className="text-amber-500 fill-amber-500" />
          <span>Chế độ học từ vựng (Luân phiên game sau mỗi câu hỏi):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-2xl">
          {/* Nút 1: Ôn từ đã học */}
          <button
            type="button"
            onClick={() => onOpenVocabMode('review')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border-2 border-slate-200 hover:border-amber-400 text-slate-800 transition-all flex items-center justify-center gap-2 active:scale-98 group cursor-pointer"
          >
            <RotateCcw size={16} className="text-amber-500 group-hover:rotate-[-45deg] transition-transform" />
            <div className="text-left">
              <div className="text-xs font-black">Ôn từ đã học</div>
              <div className="text-[10px] text-slate-400 font-medium">
                {masteredCount + learningCount} từ đã học
              </div>
            </div>
          </button>

          {/* Nút 2: Học từ vựng mới */}
          <button
            type="button"
            onClick={() => onOpenVocabMode('new')}
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
            onClick={() => onOpenVocabMode('mixed')}
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
          <button
            type="button"
            onClick={onDismissAlert}
            className="text-xs underline text-amber-700 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}
    </section>
  );
};
