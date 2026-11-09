import React from 'react';
import { Sparkles, PlusCircle, Trash2 } from 'lucide-react';
import { WordItem } from '../../types';
import { AudioButton } from '../AudioButton';

export interface WordNotebookSectionProps {
  words: WordItem[];
  filterMastery: 'all' | 'mastered' | 'learning' | 'new';
  onSelectFilter: (filter: 'all' | 'mastered' | 'learning' | 'new') => void;
  remainingRecCount: number;
  onBatchAddRecommended: (count?: number) => void;
  onOpenWordManager: () => void;
  onEchoWord: (word: WordItem) => void;
  onDeleteWord: (wordId: string, e: React.MouseEvent) => void;
}

export const WordNotebookSection: React.FC<WordNotebookSectionProps> = ({
  words,
  filterMastery,
  onSelectFilter,
  remainingRecCount,
  onBatchAddRecommended,
  onOpenWordManager,
  onEchoWord,
  onDeleteWord,
}) => {
  const filteredWords = words.filter((w) => {
    const level = w.masteryLevel || 0;
    if (filterMastery === 'mastered') return level >= 4;
    if (filterMastery === 'learning') return level > 0 && level < 4;
    if (filterMastery === 'new') return level === 0;
    return true;
  });

  return (
    <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Sổ Tay Từ Vựng Chi Tiết (Word List Preview) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {filterMastery === 'mastered'
              ? '⭐'
              : filterMastery === 'learning'
              ? '🌱'
              : filterMastery === 'new'
              ? '✨'
              : '📖'}
          </span>
          <div>
            <h3 className="text-base font-black text-slate-900">
              {filterMastery === 'all'
                ? 'Tất cả Từ Vựng Trong Sổ Tay'
                : filterMastery === 'mastered'
                ? 'Từ Đã Thành Thạo'
                : filterMastery === 'learning'
                ? 'Từ Đang Luyện Tập'
                : 'Từ Mới Cần Học'}
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {filteredWords.length} từ
              </span>
            </h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filterMastery !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectFilter('all')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Xem tất cả
            </button>
          )}
          <button
            type="button"
            onClick={() => onBatchAddRecommended(15)}
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
            type="button"
            onClick={onOpenWordManager}
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
                  onClick={() => onEchoWord(w)}
                  title="Luyện phát âm nhại lại"
                  className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                >
                  <span className="text-sm">🎙️</span>
                </button>
                <AudioButton word={w.word} audioUrl={w.audioUrl} size="sm" />
                {w.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => onDeleteWord(w.id, e)}
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
  );
};
