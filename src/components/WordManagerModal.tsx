import React, { useState } from 'react';
import { X, Plus, Search, Loader2, Sparkles, Trash2, BookOpen, Volume2, CheckCircle2, Check, ArrowRight } from 'lucide-react';
import { WordItem, Profile } from '../types';
import { fetchWordKnowledge } from '../services/dictionaryApi';
import { 
  addCustomWord, 
  deleteCustomWord, 
  getRemainingRecommendedWords, 
  addRecommendedWordsBatch 
} from '../services/storage';
import { RECOMMENDED_VOCABULARY_BANK } from '../data/recommendedWords';
import { AudioButton } from './AudioButton';
import { MasteryBadge } from './MasteryBadge';

interface WordManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  words: WordItem[];
  onWordsUpdated: () => void;
}

export const WordManagerModal: React.FC<WordManagerModalProps> = ({
  isOpen,
  onClose,
  profile,
  words,
  onWordsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'recommended' | 'add' | 'list'>('recommended');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'custom' | 'curated'>('all');

  // Input states for custom lookup
  const [inputWord, setInputWord] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Partial<WordItem> | null>(null);
  const [meaningVi, setMeaningVi] = useState('');
  const [category, setCategory] = useState('Chủ đề chung');
  const [exampleSentence, setExampleSentence] = useState('');
  const [exampleVi, setExampleVi] = useState('');
  const [emoji, setEmoji] = useState('📖');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Existing words set for zero-duplicate checking
  const existingWordSet = new Set(words.map((w) => w.word.trim().toLowerCase()));

  // Recommended words for this child's age group
  const ageRecommendedWords = RECOMMENDED_VOCABULARY_BANK.filter(
    (w) => w.ageGroup === profile.ageGroup || w.ageGroup === 'all'
  );

  const remainingRecommended = ageRecommendedWords.filter(
    (w) => !existingWordSet.has(w.word.trim().toLowerCase())
  );

  // Batch Add Handler
  const handleBatchAdd = (batchSize: number) => {
    setErrorMsg('');
    const res = addRecommendedWordsBatch(profile.id, batchSize);
    if (res.added.length > 0) {
      setSuccessMsg(`🎉 Đã nạp thành công ${res.added.length} từ khuyến nghị (${res.added.map(w => w.word).join(', ')}) vào sổ tay!`);
      onWordsUpdated();
    } else {
      setErrorMsg('Bé đã nạp hết toàn bộ từ vựng khuyến nghị cho độ tuổi này rồi!');
    }
  };

  // Add individual recommended word
  const handleAddSingleRecWord = (recWord: WordItem) => {
    if (existingWordSet.has(recWord.word.trim().toLowerCase())) return;
    addCustomWord(profile.id, {
      ...recWord,
      id: `rec-${profile.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isCustom: true,
    });
    setSuccessMsg(`Đã thêm từ "${recWord.word}" vào sổ tay!`);
    onWordsUpdated();
  };

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputWord.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await fetchWordKnowledge(inputWord.trim());
      setSearchResult(data);
      setMeaningVi(data.meaningVi || '');
      setCategory(data.category || 'Chủ đề chung');
      setExampleSentence(data.exampleSentence || '');
      setExampleVi(data.exampleVi || '');
      setEmoji(data.emoji || '📖');
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tra cứu từ vựng.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveCustomWord = () => {
    if (!searchResult?.word) {
      setErrorMsg('Vui lòng tra cứu từ vựng trước khi lưu.');
      return;
    }
    if (!meaningVi.trim()) {
      setErrorMsg('Vui lòng nhập nghĩa tiếng Việt cho từ.');
      return;
    }

    const newWordItem: WordItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      word: searchResult.word.toLowerCase(),
      phonetic: searchResult.phonetic || '',
      audioUrl: searchResult.audioUrl,
      partOfSpeech: searchResult.partOfSpeech || 'noun',
      meaningVi: meaningVi.trim(),
      definitionEn: searchResult.definitionEn || '',
      exampleSentence: exampleSentence.trim() || 'This is an example sentence.',
      exampleVi: exampleVi.trim() || 'Đây là câu ví dụ mẫu.',
      ageGroup: profile.ageGroup,
      category: category.trim() || 'Chủ đề chung',
      isCustom: true,
      emoji: emoji.trim() || '📖',
      masteryLevel: 0,
      correctCount: 0,
      incorrectCount: 0,
    };

    if (existingWordSet.has(newWordItem.word.trim().toLowerCase())) {
      setErrorMsg('Từ vựng này đã có trong sổ tay của bé rồi!');
      return;
    }

    addCustomWord(profile.id, newWordItem);
    setSuccessMsg(`Đã thêm thành công từ "${newWordItem.word}" vào sổ tay của bé!`);
    setInputWord('');
    setSearchResult(null);
    setMeaningVi('');
    setExampleSentence('');
    setExampleVi('');
    onWordsUpdated();
  };

  const handleDeleteCustom = (wordId: string) => {
    if (confirm('Bạn có chắc muốn xóa từ vựng này khỏi sổ tay của bé?')) {
      deleteCustomWord(profile.id, wordId);
      onWordsUpdated();
    }
  };

  const filteredWords = words.filter((w) => {
    if (filterSource === 'custom' && !w.isCustom) return false;
    if (filterSource === 'curated' && w.isCustom) return false;
    if (filterCategory !== 'all' && w.category !== filterCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(words.map((w) => w.category)));

  const ageTitle = profile.age <= 8 ? 'Nhi đồng (6-8 tuổi)' : profile.age <= 11 ? 'Tiểu học (9-11 tuổi)' : 'Thiếu niên (12-15 tuổi)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-4 border-indigo-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Quản Lý Sổ Tay Từ Vựng</h2>
              <p className="text-xs text-slate-500">
                Hồ sơ: <span className="font-semibold text-indigo-600">{profile.name}</span> ({profile.age} tuổi • {words.length} từ hiện có)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Tab Switchers */}
        <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl mt-4 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('recommended'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'recommended'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={15} className="text-amber-500 fill-amber-500" />
            <span>Từ Khuyến Nghị ({remainingRecommended.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('add'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus size={15} />
            <span>Tra Cứu Online</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('list'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen size={15} />
            <span>Sổ Tay ({words.length})</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1">
          {/* ======================================================== */}
          {/* TAB 1: THƯ VIỆN TỪ KHUYẾN NGHỊ THEO ĐỘ TUỔI             */}
          {/* ======================================================== */}
          {activeTab === 'recommended' && (
            <div className="space-y-4">
              {/* Batch Action Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-amber-950">
                      Kho Từ Chuẩn Khuyến Nghị Cho {ageTitle}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                      Còn {remainingRecommended.length} từ mới
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/80 mt-0.5">
                    Hệ thống tự động lọc trùng 100%, bảo đảm không trùng với từ đã có trong sổ tay của bé.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleBatchAdd(5)}
                    disabled={remainingRecommended.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Nạp +5 Từ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBatchAdd(10)}
                    disabled={remainingRecommended.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Nạp +10 Từ</span>
                  </button>
                </div>
              </div>

              {/* Recommended Words List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500">
                  Danh sách từ khuyến nghị ({ageRecommendedWords.length} từ chuẩn):
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {ageRecommendedWords.map((rec) => {
                    const isAdded = existingWordSet.has(rec.word.trim().toLowerCase());

                    return (
                      <div
                        key={rec.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 shadow-2xs ${
                          isAdded
                            ? 'bg-slate-50/70 border-slate-200 opacity-60'
                            : 'bg-white border-amber-100 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl shrink-0">{rec.emoji}</span>
                          <div className="truncate">
                            <div className="font-bold text-slate-900 text-sm capitalize truncate">
                              {rec.word}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{rec.meaningVi}</div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          <AudioButton word={rec.word} audioUrl={rec.audioUrl} size="sm" />
                          {isAdded ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Check size={11} /> Đã có
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddSingleRecWord(rec)}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
                            >
                              <Plus size={12} /> Thêm
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TRA CỨU TỰ THÊM TỪ ONLINE (CUSTOM SEARCH)         */}
          {/* ======================================================== */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
                <span className="font-bold">✨ Tra cứu thông minh:</span> Nhập bất kỳ từ tiếng Anh nào bé được học ở trường, app sẽ tự động kết nối từ điển quốc tế lấy phiên âm chuẩn, phát âm bản ngữ và nghĩa tiếng Việt!
              </div>

              {/* Search input */}
              <form onSubmit={handleLookup} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputWord}
                    onChange={(e) => setInputWord(e.target.value)}
                    placeholder="Ví dụ: butterfly, rainbow, astronaut..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-hidden text-sm font-semibold"
                  />
                  <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !inputWord.trim()}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Tra Từ
                </button>
              </form>

              {/* Search result card */}
              {searchResult && (
                <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{emoji}</span>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg capitalize">{searchResult.word}</h4>
                        <span className="text-xs text-indigo-600 font-mono font-semibold">{searchResult.phonetic}</span>
                      </div>
                    </div>
                    {searchResult.word && (
                      <AudioButton word={searchResult.word} audioUrl={searchResult.audioUrl} size="md" />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nghĩa tiếng Việt chuẩn:</label>
                    <input
                      type="text"
                      value={meaningVi}
                      onChange={(e) => setMeaningVi(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:border-indigo-600 focus:outline-hidden"
                      placeholder="Nhập nghĩa tiếng Việt cho bé..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Chủ đề:</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs focus:border-indigo-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Emoji minh họa:</label>
                      <input
                        type="text"
                        value={emoji}
                        onChange={(e) => setEmoji(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs text-center focus:border-indigo-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCustomWord}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Lưu Vào Sổ Tay Của Bé
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: DANH SÁCH TẤT CẢ TỪ VỰNG TRONG SỔ TAY            */}
          {/* ======================================================== */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Tổng số: <strong className="text-slate-800">{filteredWords.length}</strong> từ</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="p-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="all">Tất cả chủ đề</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredWords.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0">{w.emoji}</span>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 text-sm capitalize truncate">
                          {w.word}
                          {w.isCustom && (
                            <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              Tự thêm
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{w.meaningVi}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <AudioButton word={w.word} audioUrl={w.audioUrl} size="sm" />
                      {w.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(w.id)}
                          className="w-7 h-7 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
