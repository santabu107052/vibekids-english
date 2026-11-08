import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, Sparkles, RotateCcw, Home } from 'lucide-react';
import { GameScoreResult } from '../../types';

interface GameVictoryModalProps {
  isOpen: boolean;
  result: GameScoreResult;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const GameVictoryModal: React.FC<GameVictoryModalProps> = ({
  isOpen,
  result,
  onPlayAgain,
  onHome,
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in zoom-in-95">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-4 border-amber-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-500" />

        <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-300 text-amber-500 mx-auto flex items-center justify-center shadow-lg my-2">
          <Trophy size={42} className="animate-bounce" />
        </div>

        <h3 className="text-2xl font-black text-slate-900 mt-2">Tuyệt Vời Lắm Bé Ơi! 🎉</h3>
        <p className="text-xs text-slate-500 mt-1">
          Bé đã hoàn thành xuất sắc thử thách học từ vựng.
        </p>

        {/* Stars and Rewards summary */}
        <div className="grid grid-cols-3 gap-2 my-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <div>
            <div className="flex items-center justify-center text-amber-500">
              <Star size={20} className="fill-amber-400" />
            </div>
            <div className="text-lg font-black text-slate-800 mt-1">+{result.starsEarned}</div>
            <div className="text-[11px] font-semibold text-slate-400">Sao Thưởng</div>
          </div>

          <div>
            <div className="flex items-center justify-center text-indigo-500">
              <Sparkles size={20} />
            </div>
            <div className="text-lg font-black text-slate-800 mt-1">+{result.xpEarned}</div>
            <div className="text-[11px] font-semibold text-slate-400">Kinh Nghiệm</div>
          </div>

          <div>
            <div className="text-lg font-black text-emerald-600 mt-1">{result.accuracy}%</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">Độ Chính Xác</div>
          </div>
        </div>

        {/* Words reviewed */}
        {result.correctWords.length > 0 && (
          <div className="text-left text-xs text-slate-600 mb-4 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
            <span className="font-bold text-emerald-800">Từ vựng bé đã thành thạo:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {result.correctWords.map((w, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-white text-emerald-700 font-semibold border border-emerald-200 shadow-2xs">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onHome}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Home size={15} />
            Về Trang Chủ
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 transition-all"
          >
            <RotateCcw size={15} />
            Chơi Lại Tiếp
          </button>
        </div>
      </div>
    </div>
  );
};
