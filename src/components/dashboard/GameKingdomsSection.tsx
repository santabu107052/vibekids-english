import React from 'react';
import { Compass, Play, ChevronRight } from 'lucide-react';
import { GameType } from '../../types';

export interface GameItem {
  id: GameType;
  title: string;
  desc: string;
  icon: string;
  color: string;
  badge: string;
}

export interface GameKingdomsSectionProps {
  onSelectGame: (game: { id: GameType; title: string; icon: string; badge: string }) => void;
}

const vocabGamesList: GameItem[] = [
  {
    id: 'memory_flip',
    title: 'Lật Thẻ Mặt Chữ & Nghĩa',
    desc: 'Rèn luyện trí nhớ thị giác, nối từ tiếng Anh với nghĩa tiếng Việt.',
    icon: '🃏',
    color: 'from-amber-400 to-orange-500',
    badge: 'Quen chữ',
  },
  {
    id: 'word_match',
    title: 'Bắt Từ Nhanh (Bong Bóng)',
    desc: 'Phản xạ chọn nghĩa tiếng Việt chính xác của từ vựng.',
    icon: '🎈',
    color: 'from-blue-400 to-indigo-500',
    badge: 'Nhớ nghĩa',
  },
  {
    id: 'word_scramble',
    title: 'Xếp Chữ Thần Tốc',
    desc: 'Ghép từng ký tự để rèn luyện thói quen viết đúng chính tả.',
    icon: '🚂',
    color: 'from-emerald-400 to-teal-500',
    badge: 'Chính tả',
  },
  {
    id: 'sound_detective',
    title: 'Thám Tử Âm Thanh',
    desc: 'Nghe phát âm chuẩn bản ngữ và chọn nghĩa tiếng Việt.',
    icon: '🕵️',
    color: 'from-purple-400 to-pink-500',
    badge: 'Luyện nghe',
  },
  {
    id: 'spelling_bee',
    title: 'Thử Thách Chính Tả (Spelling)',
    desc: 'Nghe phát âm rồi gõ lại từ vựng hoàn chỉnh.',
    icon: '🐝',
    color: 'from-rose-400 to-red-500',
    badge: 'Viết chuẩn',
  },
];

const sentenceGamesList: GameItem[] = [
  {
    id: 'sentence_builder',
    title: 'Xây Dựng Mẫu Câu',
    desc: 'Sắp xếp các từ vựng thành câu hoàn chỉnh đúng ngữ pháp 100%.',
    icon: '🏗️',
    color: 'from-indigo-500 to-purple-600',
    badge: 'Ngữ pháp thực chiến',
  },
];

export const GameKingdomsSection: React.FC<GameKingdomsSectionProps> = ({ onSelectGame }) => {
  return (
    <div className="space-y-6 pt-2">
      {/* Trò chơi từ vựng */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Compass className="text-indigo-600" />
              Vương Quốc Trò Chơi Từ Vựng
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Luyện tập phản xạ, mặt chữ, nghe phát âm và chính tả với từng trò chơi riêng lẻ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vocabGamesList.map((g) => (
            <div
              key={g.id}
              onClick={() => onSelectGame(g)}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden active:scale-98"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${g.color} flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform`}
                  >
                    {g.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {g.badge}
                  </span>
                </div>

                <h4 className="text-base font-black text-slate-900 mt-4 group-hover:text-indigo-600 transition-colors">
                  {g.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{g.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span className="flex items-center gap-1">
                  <Play size={13} className="fill-indigo-600" />
                  Chơi Ngay
                </span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trò chơi mẫu câu */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Compass className="text-purple-600" />
              Vương Quốc Trò Chơi Mẫu Câu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thực hành cấu trúc câu hoàn chỉnh, rèn luyện tư duy ngữ pháp tự nhiên
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sentenceGamesList.map((g) => (
            <div
              key={g.id}
              onClick={() => onSelectGame(g)}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden active:scale-98"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${g.color} flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform`}
                  >
                    {g.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                    {g.badge}
                  </span>
                </div>

                <h4 className="text-base font-black text-slate-900 mt-4 group-hover:text-purple-600 transition-colors">
                  {g.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{g.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                <span className="flex items-center gap-1">
                  <Play size={13} className="fill-purple-600" />
                  Chơi Ngay
                </span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
