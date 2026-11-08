import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2, AlertTriangle, ShieldCheck, Play, Sparkles } from 'lucide-react';
import { adService, ADMOB_TEST_IDS } from '../services/adService';

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardReceived?: (stars: number) => void;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
  isOpen,
  onClose,
  onRewardReceived,
}) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleTestBanner = async () => {
    setIsProcessing(true);
    setStatusMessage('Đang gọi hiển thị Banner AdMob ở chân trang...');
    try {
      await adService.showBanner();
      setStatusMessage('✅ Lệnh hiển thị Banner đã gửi thành công!');
    } catch {
      setStatusMessage('❌ Không thể hiển thị banner.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestInterstitial = async () => {
    setIsProcessing(true);
    setStatusMessage('Đang gọi quảng cáo toàn màn hình (Interstitial)...');
    try {
      const res = await adService.showInterstitial();
      if (res) {
        setStatusMessage('✅ Đã hiển thị quảng cáo Interstitial!');
      } else {
        setStatusMessage('ℹ️ Không có quảng cáo sẵn sàng hoặc đang chạy trên Web.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestReward = async () => {
    setIsProcessing(true);
    setStatusMessage('Đang phát quảng cáo có thưởng (Rewarded Video)...');
    try {
      await adService.showRewardVideo((amount) => {
        setStatusMessage(`🎉 Chúc mừng! Bạn nhận được +${amount} Sao thưởng!`);
        if (onRewardReceived) onRewardReceived(amount);
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-emerald-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <DollarSign size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Cấu Hình Kiếm Tiền (AdMob)</h2>
              <p className="text-xs text-slate-500">Mô hình quảng cáo thân thiện với trẻ em (COPPA)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          {/* COPPA Safety Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Đảm bảo an toàn 100% cho trẻ em (COPPA & Google Families):</span>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                Ứng dụng được cấu hình chuẩn chế độ <strong>Child-Directed</strong>. AdMob sẽ tự động chặn mọi quảng cáo không phù hợp lứa tuổi (rượu bia, bạo lực, cờ bạc).
              </p>
            </div>
          </div>

          {/* Test Action Buttons */}
          <div className="space-y-2">
            <div className="font-bold text-slate-700">Thử nghiệm các định dạng quảng cáo:</div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={handleTestBanner}
                disabled={isProcessing}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border-2 border-slate-200 hover:border-emerald-400 text-slate-800 transition-all flex items-center justify-between font-bold cursor-pointer active:scale-98"
              >
                <div className="text-left">
                  <div className="text-xs">1. Banner Chân Trang (Footer Banner)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Hiển thị cố định ở đáy màn hình không che game</div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px]">Thử nghiệm</span>
              </button>

              <button
                type="button"
                onClick={handleTestInterstitial}
                disabled={isProcessing}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border-2 border-slate-200 hover:border-indigo-400 text-slate-800 transition-all flex items-center justify-between font-bold cursor-pointer active:scale-98"
              >
                <div className="text-left">
                  <div className="text-xs">2. Quảng Cáo Toàn Màn Hình (Interstitial)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Xuất hiện sau khi hoàn thành 1 chu kỳ học</div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 text-[10px]">Thử nghiệm</span>
              </button>

              <button
                type="button"
                onClick={handleTestReward}
                disabled={isProcessing}
                className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-300 text-amber-950 transition-all flex items-center justify-between font-bold cursor-pointer active:scale-98"
              >
                <div className="text-left">
                  <div className="text-xs flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-600 fill-amber-500" />
                    <span>3. Xem Video Nhận Thưởng (Rewarded Video)</span>
                  </div>
                  <div className="text-[10px] text-amber-800/80 font-normal">Bé xem 15-30s nhận ngay +50 Sao thưởng</div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white text-[10px]">Nhận +50 ⭐</span>
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-[11px] animate-in fade-in">
              {statusMessage}
            </div>
          )}

          {/* Ad Unit IDs Reference */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[10px]">
            <div className="font-bold text-slate-700 font-sans text-xs">Mã Đơn Vị Thử Nghiệm Chuẩn:</div>
            <div className="truncate text-slate-500">Android Banner: {ADMOB_TEST_IDS.android.banner}</div>
            <div className="truncate text-slate-500">iOS Banner: {ADMOB_TEST_IDS.ios.banner}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
