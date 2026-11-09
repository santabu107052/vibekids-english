import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RotateCcw, Volume2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { playWordAudio } from '../services/dictionaryApi';
import { soundManager } from '../services/soundEffects';

interface EchoVoiceRecorderProps {
  word: string;
  phonetic?: string;
  meaningVi?: string;
  audioUrl?: string;
  onClose?: () => void;
}

export const EchoVoiceRecorder: React.FC<EchoVoiceRecorderProps> = ({
  word,
  phonetic,
  meaningVi,
  audioUrl,
  onClose,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Clean up recorded blob URL on unmount
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordedAudioUrl]);

  // Nghe phát âm mẫu chuẩn US Native
  const handlePlayNative = () => {
    playWordAudio(word, audioUrl);
  };

  // Bắt đầu thu âm giọng của bé
  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        soundManager.playCorrect();

        // Tắt toàn bộ track mic để giải phóng thiết bị
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Đếm ngược tối đa 4 giây rồi tự dừng
      let sec = 0;
      timerRef.current = window.setInterval(() => {
        sec++;
        setRecordingSeconds(sec);
        if (sec >= 4) {
          stopRecording();
        }
      }, 1000);
    } catch {
      setErrorMsg('Vui lòng cho phép quyền truy cập Micro (Microphone) trong trình duyệt để bé thu âm nhé!');
    }
  };

  // Dừng thu âm
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Nghe lại giọng của bé
  const handlePlayUserAudio = () => {
    if (!recordedAudioUrl) return;

    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
    }

    const audio = new Audio(recordedAudioUrl);
    userAudioPlayerRef.current = audio;
    setIsPlayingUser(true);

    audio.onended = () => {
      setIsPlayingUser(false);
    };
    audio.onerror = () => {
      setIsPlayingUser(false);
    };

    audio.play().catch(() => {
      setIsPlayingUser(false);
    });
  };

  return (
    <div className="bg-gradient-to-tr from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-5 border-2 border-indigo-200 shadow-md space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-xs">
            🎙️
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">Luyện Phát Âm Nhại Lại</h4>
            <p className="text-[11px] text-slate-500">Nghe mẫu rồi thu âm giọng bé để đối chiếu</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded-lg hover:bg-white cursor-pointer"
          >
            Đóng
          </button>
        )}
      </div>

      {/* Target Word Display */}
      <div className="text-center py-2 bg-white rounded-2xl border border-indigo-100 shadow-2xs">
        <h3 className="text-2xl font-black text-slate-900 capitalize tracking-wide">{word}</h3>
        {phonetic && <p className="text-xs font-mono text-indigo-600 mt-0.5">{phonetic}</p>}
        {meaningVi && <p className="text-xs text-slate-400 mt-1 italic">{meaningVi}</p>}
      </div>

      {/* 2 Interactive Channels: Mẫu Chuẩn & Giọng Của Bé */}
      <div className="grid grid-cols-2 gap-3">
        {/* Channel 1: Nghe giọng chuẩn */}
        <button
          type="button"
          onClick={handlePlayNative}
          className="p-3.5 rounded-2xl bg-white hover:bg-indigo-50/60 border-2 border-indigo-200 hover:border-indigo-400 transition-all flex flex-col items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Volume2 size={20} />
          </div>
          <span className="text-xs font-black text-slate-800">1. Giọng Chuẩn Mỹ</span>
          <span className="text-[10px] text-indigo-600 font-semibold">Chạm để nghe mẫu</span>
        </button>

        {/* Channel 2: Giọng của bé */}
        <div className="p-3.5 rounded-2xl bg-white border-2 border-purple-200 flex flex-col items-center justify-center gap-1.5 shadow-2xs">
          {!recordedAudioUrl ? (
            <>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200'
                    : 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white hover:scale-105 active:scale-95'
                }`}
              >
                {isRecording ? <Square size={16} /> : <Mic size={20} />}
              </button>
              <span className="text-xs font-black text-slate-800">
                {isRecording ? `Đang thu... ${4 - recordingSeconds}s` : '2. Thu Âm Giọng Bé'}
              </span>
              <span className="text-[10px] text-purple-600 font-semibold">
                {isRecording ? 'Bấm nút vuông để dừng' : 'Chạm Mic để nói'}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayUserAudio}
                  disabled={isPlayingUser}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isPlayingUser
                      ? 'bg-emerald-500 text-white animate-pulse'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                  }`}
                >
                  <Play size={18} className="fill-white" />
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  title="Thu âm lại"
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-all"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Giọng Bé Đã Thu Xong!</span>
              </span>
              <span className="text-[10px] text-slate-400">Bấm Play để nghe lại</span>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {recordedAudioUrl && (
        <div className="p-3 bg-white/80 rounded-2xl border border-indigo-100 text-center text-xs font-bold text-indigo-900 flex items-center justify-center gap-2 animate-in fade-in">
          <Sparkles size={15} className="text-amber-500 fill-amber-400 animate-bounce" />
          <span>Bé phát âm rất tự tin! Hãy nghe lại cả hai giọng để đối chiếu nhé!</span>
        </div>
      )}
    </div>
  );
};
