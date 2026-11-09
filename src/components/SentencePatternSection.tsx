import React, { useState } from 'react';
import { Volume2, Sparkles, BookOpen, ChevronRight, Play, RotateCcw, Target, Zap, CheckCircle2 } from 'lucide-react';
import { COMPREHENSIVE_TEMPLATES, fixIndefiniteArticles } from '../services/sentencePatterns';
import { playWordAudio } from '../services/dictionaryApi';
import { getSentenceProgressMap } from '../services/storage';

interface SentencePatternSectionProps {
  profileId: string;
  userLevel: number;
  dailyGoal: number;
  onPlaySentenceGame: (mode?: 'all' | 'review' | 'new' | 'mixed', questionCount?: number) => void;
}

export const SentencePatternSection: React.FC<SentencePatternSectionProps> = ({
  profileId,
  userLevel,
  dailyGoal,
  onPlaySentenceGame,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(
    userLevel >= 4 ? 3 : userLevel >= 2 ? 2 : 1
  );
  const [selectedType, setSelectedType] = useState<'all' | 'affirmative' | 'negative' | 'question' | 'complex'>('all');
  const [filterMastery, setFilterMastery] = useState<'all' | 'mastered' | 'learning' | 'new'>('all');
  const [playingId, setPlayingId] = useState<number | null>(null);

  // Load progress for all templates
  const progressMap = getSentenceProgressMap(profileId);

  // Sample vocabulary words to render concrete example sentences
  const sampleWords: Record<string, string> = {
    apple: 'quả táo',
    pencil: 'cây bút chì',
    bike: 'chiếc xe đạp',
    cat: 'chú mèo',
    happy: 'vui vẻ',
    run: 'chạy bộ',
    quickly: 'nhanh nhẹn',
    sport: 'môn thể thao',
    book: 'quyển sách',
    table: 'cái bàn',
  };

  // Calculate mastery counts across templates
  const masteredCount = COMPREHENSIVE_TEMPLATES.filter(
    (t) => (progressMap[t.id]?.masteryLevel || 0) >= 3
  ).length;

  const learningCount = COMPREHENSIVE_TEMPLATES.filter(
    (t) => (progressMap[t.id]?.masteryLevel || 0) >= 1 && (progressMap[t.id]?.masteryLevel || 0) < 3
  ).length;

  const newCount = COMPREHENSIVE_TEMPLATES.filter(
    (t) => (progressMap[t.id]?.masteryLevel || 0) === 0
  ).length;

  // Filter templates by level, type, and mastery
  const filteredTemplates = COMPREHENSIVE_TEMPLATES.filter((t) => {
    if (t.level !== selectedLevel) return false;
    if (selectedType !== 'all' && t.type !== selectedType) return false;

    const mastery = progressMap[t.id]?.masteryLevel || 0;
    if (filterMastery === 'mastered') return mastery >= 3;
    if (filterMastery === 'learning') return mastery >= 1 && mastery < 3;
    if (filterMastery === 'new') return mastery === 0;

    return true;
  });

  const handlePlaySentenceAudio = async (templateId: number, sentenceText: string) => {
    if (playingId === templateId) return;
    setPlayingId(templateId);
    try {
      await playWordAudio(sentenceText);
    } catch {
      // ignore
    } finally {
      setPlayingId(null);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'affirmative':
        return { label: 'Khẳng định', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'negative':
        return { label: 'Phủ định (not)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'question':
        return { label: 'Câu hỏi (?)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'complex':
        return { label: 'Cấu trúc nâng cao', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: 'Mẫu câu', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-indigo-100 shadow-sm space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-md shadow-indigo-100">
            💬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900">
                Góc Học Mẫu Câu Giao Tiếp
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                140+ Mẫu Câu
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Học các mẫu câu chuẩn theo lộ trình, theo dõi tiến độ thành thạo và luyện tập thực chiến!
            </p>
          </div>
        </div>

        {/* Practice CTA Button (Phương án 1) */}
        <button
          type="button"
          onClick={() => onPlaySentenceGame('all')}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Play size={14} className="fill-white" />
          <span>Chơi Game Ghép Câu ➔</span>
        </button>
      </div>

      {/* 4 Stats Cards for Sentence Patterns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setFilterMastery('all')}
          className={`p-3.5 sm:p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
            filterMastery === 'all'
              ? 'bg-indigo-50/90 border-indigo-600 ring-4 ring-indigo-200 shadow-md scale-102'
              : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg shadow-xs">
            💬
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-800">
              {COMPREHENSIVE_TEMPLATES.length}
            </div>
            <div className="text-xs font-bold text-slate-500">Tổng mẫu câu</div>
          </div>
        </div>

        <div
          onClick={() => setFilterMastery('mastered')}
          className={`p-3.5 sm:p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
            filterMastery === 'mastered'
              ? 'bg-amber-50/90 border-amber-600 ring-4 ring-amber-200 shadow-md scale-102'
              : 'bg-white border-slate-200/90 hover:border-amber-300 hover:bg-slate-50'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-lg shadow-xs">
            ⭐
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-600">
              {masteredCount}
            </div>
            <div className="text-xs font-bold text-slate-500">Đã thành thạo</div>
          </div>
        </div>

        <div
          onClick={() => setFilterMastery('learning')}
          className={`p-3.5 sm:p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
            filterMastery === 'learning'
              ? 'bg-emerald-50/90 border-emerald-600 ring-4 ring-emerald-200 shadow-md scale-102'
              : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg shadow-xs">
            🌱
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600">
              {learningCount}
            </div>
            <div className="text-xs font-bold text-slate-500">Đang luyện tập</div>
          </div>
        </div>

        <div
          onClick={() => setFilterMastery('new')}
          className={`p-3.5 sm:p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-3 shadow-2xs ${
            filterMastery === 'new'
              ? 'bg-rose-50/90 border-rose-600 ring-4 ring-rose-200 shadow-md scale-102'
              : 'bg-white border-slate-200/90 hover:border-rose-300 hover:bg-slate-50'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-lg shadow-xs">
            ✨
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-600">
              {newCount}
            </div>
            <div className="text-xs font-bold text-slate-500">Mẫu câu mới</div>
          </div>
        </div>
      </div>

      {/* 3 Smart Learning Mode Buttons for Sentence Patterns */}
      <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-1">
          <Zap size={16} className="text-amber-500 fill-amber-500" />
          <span>Chế độ học mẫu câu hôm nay:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-2xl">
          {/* Button 1: Ôn mẫu câu đã học */}
          <button
            type="button"
            onClick={() => onPlaySentenceGame('review')}
            className="p-3 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 text-slate-800 transition-all flex items-center justify-center gap-2 shadow-2xs active:scale-98 group"
          >
            <RotateCcw size={16} className="text-amber-500 group-hover:rotate-[-45deg] transition-transform" />
            <div className="text-left">
              <div className="text-xs font-black">Ôn mẫu câu đã học</div>
              <div className="text-[10px] text-slate-400 font-medium">{masteredCount + learningCount} mẫu đã học</div>
            </div>
          </button>

          {/* Button 2: Học mẫu câu mới */}
          <button
            type="button"
            onClick={() => onPlaySentenceGame('new')}
            className="p-3 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-800 transition-all flex items-center justify-center gap-2 shadow-2xs active:scale-98 group"
          >
            <Sparkles size={16} className="text-indigo-600 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="text-xs font-black">Học mẫu câu mới</div>
              <div className="text-[10px] text-indigo-600 font-bold">Tối đa {dailyGoal} mẫu/ngày</div>
            </div>
          </button>

          {/* Button 3: Vừa ôn vừa học */}
          <button
            type="button"
            onClick={() => onPlaySentenceGame('mixed')}
            className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100 active:scale-98"
          >
            <Target size={16} className="text-amber-300" />
            <div className="text-left">
              <div className="text-xs font-black">Vừa ôn vừa học</div>
              <div className="text-[10px] text-indigo-200 font-medium">Kết hợp phản xạ</div>
            </div>
          </button>
        </div>
      </div>

      {/* Level & Type Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setSelectedLevel(1)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedLevel === 1
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌟 Cấp 1: Vỡ Lòng (6-8t)
          </button>

          <button
            type="button"
            onClick={() => setSelectedLevel(2)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedLevel === 2
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚀 Cấp 2: Mở Rộng (9-11t)
          </button>

          <button
            type="button"
            onClick={() => setSelectedLevel(3)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedLevel === 3
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏆 Cấp 3: Nâng Cao (12-15t)
          </button>
        </div>

        {/* Sentence Type Filter */}
        <div className="flex gap-1 flex-wrap">
          {(['all', 'affirmative', 'negative', 'question', 'complex'] as const).map((type) => {
            const labels = {
              all: 'Tất cả',
              affirmative: 'Khẳng định',
              negative: 'Phủ định',
              question: 'Câu hỏi (?)',
              complex: 'Nâng cao (so sánh)',
            };
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                  selectedType === type
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter status label */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Đang hiển thị:{' '}
          <span className="font-bold text-slate-800">
            {filterMastery === 'all'
              ? 'Tất cả mẫu câu'
              : filterMastery === 'mastered'
              ? 'Mẫu câu đã thành thạo'
              : filterMastery === 'learning'
              ? 'Mẫu câu đang luyện tập'
              : 'Mẫu câu mới cần học'}
          </span>{' '}
          ({filteredTemplates.length} mẫu)
        </span>
        {filterMastery !== 'all' && (
          <button
            type="button"
            onClick={() => setFilterMastery('all')}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Xem tất cả
          </button>
        )}
      </div>

      {/* Sentence Cards Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs">
          Không có mẫu câu nào trong mục này. Bé hãy tham gia trò chơi để tăng tiến độ nhé!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredTemplates.map((item, idx) => {
            const nounPool = ['apple', 'pencil', 'bike', 'cat', 'orange', 'book'];
            const sampleNoun = nounPool[idx % nounPool.length];
            const sampleEn =
              item.pos === 'noun'
                ? sampleNoun
                : item.pos === 'verb'
                ? 'run'
                : item.pos === 'adjective'
                ? 'happy'
                : item.pos === 'adverb'
                ? 'quickly'
                : item.pos === 'preposition'
                ? 'on'
                : item.pos === 'pronoun'
                ? 'she'
                : 'two';
            const sampleVi = sampleWords[sampleEn] || (sampleEn === 'orange' ? 'quả cam' : sampleEn);
            const sampleViCap = sampleVi.charAt(0).toUpperCase() + sampleVi.slice(1);
            const sampleEnCap = sampleEn.charAt(0).toUpperCase() + sampleEn.slice(1);

            const rawSentenceEn = item.templateEn.replace('{wordCapitalized}', sampleEnCap).replace('{word}', sampleEn);
            const sentenceEn = fixIndefiniteArticles(rawSentenceEn);
            const sentenceVi = item.templateVi.replace('{meaningCapitalized}', sampleViCap).replace('{meaning}', sampleVi);
            const badge = getTypeBadge(item.type);

            // Mastery status for this card
            const mastery = progressMap[item.id]?.masteryLevel || 0;
            const masteryBadge =
              mastery >= 3
                ? { label: '⭐ Đã thành thạo', color: 'bg-amber-50 text-amber-700 border-amber-200' }
                : mastery >= 1
                ? { label: '🌱 Đang luyện tập', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                : { label: '✨ Mẫu mới', color: 'bg-slate-50 text-slate-600 border-slate-200' };

            const formulaLabel = item.templateEn
              .replace(/\b(a|an)\s+\{word\}/gi, 'a/an [NOUN]')
              .replace('{word}', `[${item.pos.toUpperCase()}]`);

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/20 bg-white transition-all shadow-2xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${masteryBadge.color}`}>
                        {masteryBadge.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Mẫu #{item.id}
                    </span>
                  </div>

                  {/* English Sentence */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {sentenceEn}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handlePlaySentenceAudio(item.id, sentenceEn)}
                      disabled={playingId === item.id}
                      className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-2xs"
                      title="Nghe phát âm cả câu"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  {/* Vietnamese Meaning */}
                  <p className="text-xs text-slate-600 mt-1 font-medium italic">
                    "{sentenceVi}"
                  </p>
                </div>

                {/* Grammar Formula Tag */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 text-slate-600 text-[10px]">
                    {formulaLabel}
                  </span>
                  <span className="text-[10px] text-indigo-500 font-semibold group-hover:underline flex items-center gap-0.5">
                    Tập đọc câu <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
