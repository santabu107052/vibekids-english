import React, { useState } from 'react';
import { X, UserPlus, Check, Trash2, Award, Flame, Star, Sparkles } from 'lucide-react';
import { Profile } from '../types';
import { AVATAR_OPTIONS, createProfile, deleteProfile, setActiveProfileId } from '../services/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  activeProfile: Profile | null;
  onProfileChanged: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfile,
  onProfileChanged,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(7);
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0].emoji);
  const [dailyGoal, setDailyGoal] = useState<number>(5);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    onProfileChanged();
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên cho bé.');
      return;
    }
    if (age < 5 || age > 18) {
      setError('Độ tuổi phù hợp từ 5 đến 18 tuổi.');
      return;
    }
    createProfile(name, age, avatar, dailyGoal);
    setIsCreating(false);
    setName('');
    setError('');
    onProfileChanged();
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      alert('Cần giữ ít nhất 1 hồ sơ học tập.');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa hồ sơ này và toàn bộ lịch sử học tập?')) {
      deleteProfile(id);
      onProfileChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-indigo-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👦👧</span>
            <h2 className="text-xl font-bold text-slate-800">
              {isCreating ? 'Tạo Hồ Sơ Bé Mới' : 'Chọn Hồ Sơ Học Tập'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {!isCreating ? (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profiles.map((p) => {
                const isActive = activeProfile?.id === p.id;
                const ageLabel = p.age <= 8 ? '6-8 tuổi' : p.age <= 11 ? '9-11 tuổi' : '12-15 tuổi';
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p.id)}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/60 shadow-md ring-2 ring-indigo-300'
                        : 'border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl p-1 bg-white rounded-2xl shadow-xs border border-slate-100">
                          {p.avatar}
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-800 text-base">{p.name}</h3>
                          <div className="text-xs text-indigo-600 font-medium">
                            {p.age} tuổi • {ageLabel}
                          </div>
                        </div>
                      </div>
                      {profiles.length > 1 && (
                        <button
                          onClick={(e) => handleDelete(e, p.id)}
                          title="Xóa hồ sơ"
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100/80 pt-2">
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star size={13} className="fill-amber-400 text-amber-500" />
                        {p.stars} sao
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-orange-600">
                        <Flame size={13} className="text-orange-500" />
                        {p.streak} ngày
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-indigo-600">
                        <Award size={13} />
                        Cấp {p.level}
                      </span>
                    </div>

                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-indigo-600 font-bold flex items-center justify-center gap-2 transition-all mt-4"
            >
              <UserPlus size={18} />
              Thêm Hồ Sơ Cho Bé Khác
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tên hoặc Biệt danh của bé</label>
              <input
                type="text"
                placeholder="Ví dụ: Bé Bơ, Minh Khôi, Anna..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-base"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Tuổi của bé: <span className="text-indigo-600 font-bold">{age} tuổi</span>
              </label>
              <input
                type="range"
                min={6}
                max={15}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
                <span>6 tuổi (Vỡ lòng)</span>
                <span>10 tuổi (Tiểu học)</span>
                <span>15 tuổi (Cấp 2)</span>
              </div>
              <p className="mt-1.5 text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg">
                💡 Lộ trình học: {age <= 8 ? 'Nhóm 6-8 tuổi (Phonics & Nhận diện cơ bản)' : age <= 11 ? 'Nhóm 9-11 tuổi (Từ vựng tiểu học & Giao tiếp)' : 'Nhóm 12-15 tuổi (Từ vựng chuyên sâu & Mẫu câu phản xạ)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn Linh vật Đại diện (Avatar)</label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAvatar(opt.emoji)}
                    className={`text-2xl p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                      avatar === opt.emoji
                        ? 'border-indigo-600 bg-indigo-50 scale-105 shadow-xs'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <span>{opt.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mục tiêu từ vựng mỗi ngày</label>
              <div className="flex gap-2">
                {[3, 5, 10, 15].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setDailyGoal(g)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${
                      dailyGoal === g
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {g} từ
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Tạo Hồ Sơ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
