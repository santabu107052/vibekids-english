import React from 'react';
import { Ear, Eye, PenTool, Layers, TrendingUp } from 'lucide-react';

interface SkillsRadarCardProps {
  listeningScore: number;   // 0 - 100
  readingScore: number;     // 0 - 100
  spellingScore: number;    // 0 - 100
  sentenceScore: number;    // 0 - 100
  totalPracticed: number;
}

export const SkillsRadarCard: React.FC<SkillsRadarCardProps> = ({
  listeningScore,
  readingScore,
  spellingScore,
  sentenceScore,
  totalPracticed,
}) => {
  const skills = [
    {
      name: 'Luyện Nghe (Listening)',
      icon: <Ear size={16} className="text-purple-600" />,
      score: Math.min(100, Math.max(10, listeningScore)),
      color: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
      desc: 'Phản xạ âm thanh bản ngữ',
    },
    {
      name: 'Mặt Chữ & Nghĩa (Reading)',
      icon: <Eye size={16} className="text-indigo-600" />,
      score: Math.min(100, Math.max(10, readingScore)),
      color: 'bg-indigo-500',
      textColor: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      desc: 'Nhận diện từ vựng thị giác',
    },
    {
      name: 'Chính Tả (Spelling)',
      icon: <PenTool size={16} className="text-rose-600" />,
      score: Math.min(100, Math.max(10, spellingScore)),
      color: 'bg-rose-500',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      desc: 'Viết từ chính xác từng chữ cái',
    },
    {
      name: 'Mẫu Câu (Grammar)',
      icon: <Layers size={16} className="text-amber-600" />,
      score: Math.min(100, Math.max(10, sentenceScore)),
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      desc: 'Ngữ pháp thực chiến giao tiếp',
    },
  ];

  const overallScore = Math.round(
    (skills[0].score + skills[1].score + skills[2].score + skills[3].score) / 4
  );

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black shadow-xs">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">Bản Đồ Năng Lực 4 Kỹ Năng Của Bé</h3>
            <p className="text-xs text-slate-400">Đánh giá đa chiều dựa trên lịch sử luyện tập</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-400">Điểm tổng hòa: </span>
          <span className="text-lg font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {overallScore}/100
          </span>
        </div>
      </div>

      {/* 4 Skill Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {skills.map((skill, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border border-slate-100 ${skill.bgColor} space-y-2`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-800">
                {skill.icon}
                <span>{skill.name}</span>
              </span>
              <span className={`font-black ${skill.textColor}`}>{skill.score}%</span>
            </div>

            {/* Progress bar track */}
            <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${skill.color}`}
                style={{ width: `${skill.score}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-500 font-medium">{skill.desc}</div>
          </div>
        ))}
      </div>

      {/* Helpful pedagogical advice */}
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
        <span>💡 <strong>Gợi ý sư phạm:</strong> Hãy khuyến khích bé chơi luân phiên cả 2 Vương quốc để phát triển đồng đều 4 kỹ năng.</span>
        <span className="text-indigo-600 font-bold shrink-0 ml-2">Đã luyện {totalPracticed} lượt</span>
      </div>
    </div>
  );
};
