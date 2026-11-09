import React from 'react';
import { Target } from 'lucide-react';
import { Profile } from '../../types';

export interface HeroSectionProps {
  profile: Profile;
  todayPracticedCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ profile, todayPracticedCount }) => {
  const dailyGoal = profile.dailyGoal || 5;
  const progressPercent = Math.min(100, (todayPracticedCount / dailyGoal) * 100);

  return (
    <section className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="text-6xl p-2 bg-white/20 backdrop-blur-md rounded-3xl shadow-inner border border-white/30">
            {profile.avatar}
          </span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold backdrop-blur-xs">
                Cấp Độ {profile.level} • {profile.age} Tuổi
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black">
                {profile.xp} XP
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Chào {profile.name}! Sẵn sàng khám phá chưa?
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
              Rèn luyện phản xạ từ vựng, luyện nghe bản ngữ và ngữ pháp câu chuẩn xác mỗi ngày!
            </p>
          </div>
        </div>

        {/* Daily Goal Card */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 w-full md:w-64">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <Target size={14} className="text-amber-300" />
              Mục tiêu hôm nay
            </span>
            <span>
              {todayPracticedCount}/{dailyGoal} từ
            </span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-white/70 mt-1.5 text-right font-medium">
            {todayPracticedCount >= dailyGoal
              ? '🎉 Đã hoàn thành xuất sắc mục tiêu hôm nay!'
              : `Cố lên! Đã học ${todayPracticedCount}/${dailyGoal} từ hôm nay.`}
          </p>
        </div>
      </div>
    </section>
  );
};
