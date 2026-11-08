import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, AlertCircle } from 'lucide-react';
import { exportAllData, importAllData } from '../services/storage';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    const dataStr = exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vibekids-english-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMsg({ type: 'success', text: 'Đã tải xuống file lưu trữ an toàn!' });
  };

  const handleCopy = () => {
    const dataStr = exportAllData();
    navigator.clipboard.writeText(dataStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    if (!importJson.trim()) {
      setMsg({ type: 'error', text: 'Vui lòng dán nội dung JSON sao lưu vào ô dưới.' });
      return;
    }

    const ok = importAllData(importJson.trim());
    if (ok) {
      setMsg({ type: 'success', text: 'Khôi phục dữ liệu thành công! Đang cập nhật ứng dụng...' });
      setTimeout(() => {
        onDataRestored();
        onClose();
      }, 1000);
    } else {
      setMsg({ type: 'error', text: 'Dữ liệu không đúng định dạng. Vui lòng kiểm tra lại!' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-indigo-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💾</span>
            <h2 className="text-xl font-bold text-slate-800">Sao Lưu & Đồng Bộ Dữ Liệu</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-5">
          <p className="text-xs text-slate-500 leading-relaxed">
            Dữ liệu hồ sơ bé và từ vựng được lưu an toàn trên máy. Phụ huynh có thể xuất file để chuyển sang iPad/iPhone hoặc lưu trữ dự phòng.
          </p>

          {msg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <AlertCircle size={16} />
              {msg.text}
            </div>
          )}

          {/* Export section */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Download size={16} />
              1. Xuất Dữ Liệu (Backup)
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download size={14} />
                Tải File .JSON
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? 'Đã sao chép' : 'Sao chép mã'}
              </button>
            </div>
          </div>

          {/* Import section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload size={16} />
              2. Nhập Dữ Liệu (Restore trên iPad/iPhone)
            </h3>
            <textarea
              rows={3}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Dán nội dung JSON đã sao lưu vào đây..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-400 bg-white"
            />
            <button
              type="button"
              onClick={handleImport}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Upload size={14} />
              Khôi Phục Dữ Liệu Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
