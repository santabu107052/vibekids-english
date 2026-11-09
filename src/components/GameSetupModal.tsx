import React, { useState } from 'react';
import { X, Sparkles, Target, RotateCcw, Play, Check, Infinity as InfinityIcon } from 'lucide-react';

export type GameLearningMode = 'review' | 'new' | 'mixed';

interface GameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  badge?: string;
  // If mode is predefined (such as when clicked from 3 buttons), mode is fixed and we only pick question count
  fixedMode?: GameLearningMode;
  initialCount?: number;
  reviewedCount: number;
  newCount: number;
  onConfirm: (mode: GameLearningMode, count: number) => void;
}

export const GameSetupModal: React.FC<GameSetupModalProps> = ({
  isOpen,
  onClose,
  title,
  icon = '🎮',
  badge,
  fixedMode,
  initialCount = 10,
  reviewedCount,
  newCount,
  onConfirm,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameLearningMode>(fixedMode || 'mixed');
  const [questionCount, setQuestionCount] = useState<number>(Math.max(10, initialCount));

  if (!isOpen) return null;

  // Options: 10, 15, 20, 25, or 9999 (Không giới hạn)
  const countOptions = [
    { value: 10, label: '10 câu' },
    { value: 15, label: '15 câu' },
    { value: 20, label: '20 câu' },
    { value: 9999, label: 'Vô tận ∞' },
  ];

  const handleStart = () => {
    onConfirm(selectedMode, questionCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-indigo-100 flex flex-col space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-indigo-50 rounded-2xl">{icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-800">{title}</h3>
                {badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Tùy chỉnh chế độ & số lượng câu hỏi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Chọn Chế Độ Học (Nếu không bị cố định) */}
        {!fixedMode && (
          <div className="space-y-2.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <span>1. Chọn Chế Độ Học:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMode('review')}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
                  selectedMode === 'review'
                    ? 'border-amber-500 bg-amber-50/80 ring-3 ring-amber-100'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <RotateCcw size={16} className="text-amber-500" />
                  {selectedMode === 'review' && <Check size={14} className="text-amber-600 font-bold" />}
                </div>
                <div className="font-black text-xs text-slate-800">Ôn Từ Cũ</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{reviewedCount} từ đã học</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('new')}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
                  selectedMode === 'new'
                    ? 'border-indigo-600 bg-indigo-50/80 ring-3 ring-indigo-100'
                    : 'border-slate-200 hover:border-indigo-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Sparkles size={16} className="text-indigo-600" />
                  {selectedMode === 'new' && <Check size={14} className="text-indigo-600 font-bold" />}
                </div>
                <div className="font-black text-xs text-slate-800">Học Từ Mới</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{newCount} từ chưa học</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('mixed')}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
                  selectedMode === 'mixed'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-3 ring-emerald-100'
                    : 'border-slate-200 hover:border-emerald-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Target size={16} className="text-emerald-600" />
                  {selectedMode === 'mixed' && <Check size={14} className="text-emerald-600 font-bold" />}
                </div>
                <div className="font-black text-xs text-slate-800">Vừa Ôn + Học</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Kết hợp phản xạ</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Chọn Số Lượng Câu Hỏi (Có lựa chọn Không Giới Hạn) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {fixedMode ? 'Số Lượng Câu Hỏi:' : '2. Số Lượng Câu Hỏi:'}
            </label>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Tối thiểu 10 câu
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {countOptions.map((opt) => {
              const isSelected = questionCount === opt.value;
              const isInfinite = opt.value >= 9000;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQuestionCount(opt.value)}
                  className={`py-3 px-1 rounded-2xl font-black text-xs sm:text-sm transition-all border-2 flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                    isSelected
                      ? isInfinite
                        ? 'bg-gradient-to-tr from-purple-600 to-pink-600 border-purple-600 text-white shadow-md shadow-purple-200 scale-102'
                        : 'bg-gradient-to-tr from-indigo-600 to-purple-600 border-indigo-600 text-white shadow-md shadow-indigo-200 scale-102'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-white'
                  }`}
                >
                  {isInfinite ? (
                    <>
                      <InfinityIcon size={20} className={isSelected ? 'text-white' : 'text-purple-600'} />
                      <span className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                        Vô tận
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-base font-black leading-none">{opt.value}</span>
                      <span className={`text-[10px] font-semibold mt-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        câu
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {questionCount >= 9000 && (
            <p className="text-[11px] text-purple-700 bg-purple-50 p-2.5 rounded-2xl border border-purple-200 text-center font-medium animate-in fade-in">
              ✨ <strong>Chế độ Vô Tận:</strong> Bé có thể chơi thỏa thích cho đến khi bấm nút <strong>Thoát (x)</strong> để dừng lại và nhận thưởng!
            </p>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-95 text-white font-black text-base shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <Play size={18} className="fill-white" />
          <span>
            {questionCount >= 9000
              ? 'Bắt Đầu Chơi (Chế Độ Vô Tận ∞)'
              : `Bắt Đầu Chơi Ngay (${questionCount} Câu)`}
          </span>
        </button>
      </div>
    </div>
  );
};
