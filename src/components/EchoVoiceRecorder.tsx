import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Star,
  Award,
} from 'lucide-react';
import { playWordAudio } from '../services/dictionaryApi';
import { soundManager } from '../services/soundEffects';
import { addStarsToProfile } from '../services/storage';
import { Profile } from '../types';

interface EchoVoiceRecorderProps {
  word: string;
  phonetic?: string;
  meaningVi?: string;
  audioUrl?: string;
  profile?: Profile | null;
  onProfileUpdated?: () => void;
  onClose?: () => void;
}

interface ScoreResult {
  score: number;
  starsEarned: number;
  feedbackText: string;
  feedbackLevel: 'perfect' | 'good' | 'encourage';
  recognizedText: string;
}

/**
 * Chuẩn hoá text trước khi so khớp:
 * - bỏ dấu câu, đưa về chữ thường
 * - bỏ mạo từ ("a", "an", "the") — bé nói "the cat" phải tính là đúng "cat"
 * - gộp khoảng trắng
 */
function normalizeWord(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\b(a|an|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Nhóm phụ âm/nguyên âm dễ lẫn với người Việt học tiếng Anh.
 * Nếu bé lẫn trong cùng nhóm thì phạt nặng hơn so với khác nhóm.
 */
const CONFUSABLE_GROUPS: string[][] = [
  ['th', 'tr', 't', 'd'],
  ['v', 'w', 'f'],
  ['s', 'sh', 'z', 'zh'],
  ['ch', 'tr', 'j'],
  ['l', 'r', 'n'],
  ['b', 'p'],
  ['g', 'k', 'c', 'q'],
  ['m', 'n'],
  ['i', 'ee', 'ea', 'y'],
  ['u', 'oo', 'ou'],
  ['e', 'a'],
];

function sameConfusableGroup(x: string, y: string): boolean {
  return CONFUSABLE_GROUPS.some((g) => g.includes(x) && g.includes(y));
}

/**
 * Khoảng cách âm vị — trả về số "cú sốc" cần để biến a thành b.
 * Khác Levenshtein ở chỗ: thay thế 2 ký tự thuộc cùng nhóm dễ lẫn
 * (th↔tr, v↔w, b↔p) bị phạt NẶNG hơn thay thế khác nhóm, vì đó là
 * đúng lỗi phát âm mà giáo viên cần bắt.
 */
function phonemeDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i * 1.15; // xoá âm
  for (let j = 0; j <= n; j++) dp[0][j] = j * 1.15; // chèn âm

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const ca = a[i - 1];
      const cb = b[j - 1];
      let subCost: number;
      if (ca === cb) subCost = 0;
      else if (sameConfusableGroup(ca, cb)) subCost = 1.6; // lẫn âm dễ nhầm → phạt nặng
      else subCost = 1.0;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1.15,
        dp[i][j - 1] + 1.15,
        dp[i - 1][j - 1] + subCost
      );
    }
  }
  return dp[m][n];
}

/**
 * Tính điểm phát âm (0–100).
 *
 * Khác bản cũ:
 * - bỏ mạo từ trước khi so
 * - KHÔNG còn tặng điểm khi một chuỗi chứa chuỗi kia (trước đây nói
 *   nửa từ vẫn được ~92%)
 * - phạt nặng khi lẫn phụ âm/nguyên âm dễ nhầm
 */
export function calculateSimilarityScore(recognized: string, target: string): number {
  const a = normalizeWord(recognized);
  const b = normalizeWord(target);

  if (!a.length || !b.length) return 0;
  if (a === b) return 100;

  // Nếu bé nói cả câu, lấy cụm khớp nhất với từ đích.
  // Dùng vòng lặp trên từng token (không đệ quy) để tránh gọi lại chính nó.
  const words = a.split(' ');
  if (words.length > 1) {
    const bLen = b.length;
    const longestWord = b.includes(' ')
      ? b.split(' ').length
      : 1;
    let best = 0;
    for (let i = 0; i < words.length; i++) {
      // thử cụm 1, 2, 3 từ liên tiếp
      for (let span = 1; span <= Math.min(3, bLen + 1); span++) {
        if (i + span > words.length) break;
        const candidate = words.slice(i, i + span).join(' ');
        const maxLen = Math.max(candidate.length, bLen);
        const dist = phonemeDistance(candidate, b);
        const sc = Math.max(0, Math.round(((maxLen * 1.15 - dist) / (maxLen * 1.15)) * 100));
        if (sc > best) best = sc;
      }
    }
    void longestWord;
    return best;
  }

  const maxLen = Math.max(a.length, b.length);
  const dist = phonemeDistance(a, b);
  const raw = ((maxLen * 1.15 - dist) / (maxLen * 1.15)) * 100;
  return Math.max(0, Math.round(raw));
}

/** Xếp hạng sao theo điểm */
export function starsForScore(score: number): number {
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  return 1;
}

/**
 * Lựa chọn MIME type phù hợp nhất theo trình duyệt (đặc biệt hỗ trợ iOS Safari không hỗ trợ audio/webm)
 */
function getSupportedMimeType(): string {
  const candidates = [
    'audio/mp4',
    'audio/aac',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];
  if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
  }
  return '';
}

// Kiểu an toàn cho Web Speech Recognition API
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  onstart?: (() => void) | null;
  onaudiostart?: (() => void) | null;
  onspeechend?: (() => void) | null;
}

export const EchoVoiceRecorder: React.FC<EchoVoiceRecorderProps> = ({
  word,
  phonetic,
  meaningVi,
  audioUrl,
  profile,
  onProfileUpdated,
  onClose,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const [recognitionReady, setRecognitionReady] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<ScoreResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recognitionReadyAtRef = useRef<number>(0);
  const recognitionErrorRef = useRef<string>('');
  const recognitionEndedRef = useRef<boolean>(false);
  const recognizedTranscriptRef = useRef<string>('');
  // VAD (Voice Activity Detection) — tự dừng khi bé nói xong
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadFrameRef = useRef<number | null>(null);
  const vadStartRef = useRef<number>(0);
  const vadHeardSpeechRef = useRef<boolean>(false);
  const vadSilenceStartRef = useRef<number>(0);
  const vadVolumeRef = useRef<number>(0);
  // Callback chấm điểm — được onend gọi BẤT CỨ LÚC NÀO (kể cả trước khi onstop chạy)
  const finishScoringRef = useRef<(() => void) | null>(null);

  // Clean up recorded blob URL on unmount
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Giải phóng VAD (AudioContext + animation frame) tránh rò rỉ bộ nhớ
      if (vadFrameRef.current !== null) {
        cancelAnimationFrame(vadFrameRef.current);
        vadFrameRef.current = null;
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [recordedAudioUrl]);

  // Nghe phát âm mẫu chuẩn US Native
  const handlePlayNative = () => {
    playWordAudio(word, audioUrl);
  };

  // Tính điểm và nhận xét sau khi thu âm xong
  const evaluatePronunciation = useCallback(
    (transcript: string) => {
      let score = 0;
      const cleanTranscript = transcript.trim();

      // KHÔNG còn điểm ngẫu nhiên. Bé không nói gì thì được 0 điểm thật.
      const saidSomething = cleanTranscript.length > 0;
      score = saidSomething ? calculateSimilarityScore(cleanTranscript, word) : 0;

      let starsEarned = 1;
      let feedbackText = '💪 Cố lên bé ơi! Nghe lại mẫu và thử lại nhé!';
      let feedbackLevel: 'perfect' | 'good' | 'encourage' = 'encourage';

      if (!saidSomething) {
        // Bé chưa nói gì (hoặc micro không thu được tiếng): không khen, mời thử lại
        starsEarned = 0;
        const errType = recognitionErrorRef.current;
        if (errType === 'no-speech') {
          feedbackText = '🎤 Máy chưa nghe thấy giọng bé. Bé nói TO và RÕ hơn, sát micro hơn nhé!';
        } else if (errType === 'network') {
          feedbackText = '📡 Mất kết nối Internet nên chưa nhận dạng được. Kiểm tra mạng rồi thử lại nhé!';
        } else if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          feedbackText = '🔒 Trình duyệt chưa được cấp quyền Micro. Bé bấm vào ổ khoá 🔒 trên thanh địa chỉ để bật cho phép nhé!';
        } else if (errType === 'audio-capture') {
          feedbackText = '🎙️ Không tìm thấy Micro. Kiểm tra lại micro của máy nhé!';
        } else if (speechUnavailable) {
          feedbackText = '⚠️ Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Bé vẫn nghe lại được bản ghi âm — hãy thử trên iPad hoặc Chrome nhé!';
        } else {
          feedbackText = '🎤 Bé chưa nói gì cả. Thử nói to và rõ hơn nhé!';
        }
        feedbackLevel = 'encourage';
      } else if (score >= 90) {
        starsEarned = 3;
        feedbackText = '🌟 Xuất sắc! Phát âm như người bản xứ!';
        feedbackLevel = 'perfect';
        soundManager.playVictory();
      } else if (score >= 75) {
        starsEarned = 2;
        feedbackText = '👏 Rất tốt! Bé phát âm gần chuẩn rồi!';
        feedbackLevel = 'good';
        soundManager.playCorrect();
      } else {
        starsEarned = 1;
        feedbackText = '💪 Cố lên bé ơi! Nghe lại mẫu và thử lại nhé!';
        feedbackLevel = 'encourage';
        soundManager.playCorrect();
      }

      setEvaluation({
        score,
        starsEarned,
        feedbackText,
        feedbackLevel,
        recognizedText: cleanTranscript || word,
      });

      // Thưởng sao cho profile bé (không thưởng khi bé chưa nói gì)
      if (profile && starsEarned > 0) {
        addStarsToProfile(profile.id, starsEarned);
        onProfileUpdated?.();
      }
    },
    [word, profile, onProfileUpdated, speechUnavailable]
  );

  // Bắt đầu thu âm giọng của bé
  const startRecording = async () => {
    setErrorMsg(null);
    setEvaluation(null);
    recognizedTranscriptRef.current = '';
    audioChunksRef.current = [];

    // Dọn bản ghi âm cũ: trước đây không dọn nên nút "ghi âm lại" bị kẹt
    if (userAudioPlayerRef.current) {
      try {
        userAudioPlayerRef.current.pause();
      } catch {
        /* ignore */
      }
      userAudioPlayerRef.current = null;
    }
    setIsPlayingUser(false);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setRecordedAudioBlob(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Chọn MIME type tương thích (hỗ trợ Safari iOS)
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMime = mediaRecorder.mimeType || mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        setRecordedAudioBlob(audioBlob);

        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // ⚠️ QUAN TRỌNG: Web Speech Recognition trả kết quả BẤT ĐỒNG BỘ qua server
        // (thường 300ms–2s sau khi dừng). Trên macOS/Chrome, onstop của MediaRecorder
        // chạy TRƯỚC khi onresult về → nếu chấm điểm ngay sẽ luôn ra 0/100 dù bé có nói.
        // => Chờ tối đa 2.5s cho tới khi có transcript (hoặc biết chắc recognition xong).
        const streamRef = stream;
        const recognition = recognitionRef.current;
        let scored = false;

        // Chấm điểm đúng 1 lần duy nhất
        const scoreNow = () => {
          if (scored) return;
          scored = true;
          // Chặn onend gọi lại lần nữa
          finishScoringRef.current = null;
          evaluatePronunciation(recognizedTranscriptRef.current);
          // Giải phóng mic + reset tham chiếu để lần "thu lại" không bị kẹt
          streamRef.getTracks().forEach((track) => track.stop());
          mediaRecorderRef.current = null;
          recognitionRef.current = null;
        };

        // Cho onend (đã gắn sẵn từ lúc tạo recognition) biết cần chấm điểm.
        // onend có thể đã/đang/sẽ bắn — đều xử lý được vì handler gắn 1 lần duy nhất.
        finishScoringRef.current = scoreNow;

        if (recognition) {
          // Nếu recognition đã kết thúc rồi (onend đã bắn trước khi ta kịp gán callback)
          // thì chấm ngay, không chờ.
          if (recognitionEndedRef.current) {
            window.setTimeout(() => scoreNow(), 150);
          } else {
            // Yêu cầu recognition dừng & trả kết quả cuối.
            // LƯU Ý: stop() sẽ ném InvalidStateError nếu recognition đã dừng sẵn —
            // điều này KHÔNG sao, vì onend đã bắn hoặc sẽ bắn ngay sau đó.
            try {
              recognition.stop();
            } catch {
              // Đã dừng sẵn → onend đã bắn → finishScoringRef sẽ được gọi trong 400ms tới
            }
          }
          // Dự phòng tuyệt đối: chấm sau 2500ms dù onend không bắn
          window.setTimeout(() => {
            scoreNow();
          }, 2500);
        } else {
          // Trình duyệt không hỗ trợ Speech Recognition → chấm ngay
          scoreNow();
        }
      };

      // Khởi động Web Speech Recognition nếu trình duyệt hỗ trợ
      const SpeechRecognitionCtor =
        (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

      if (SpeechRecognitionCtor) {
        try {
          const recognition = new SpeechRecognitionCtor();
          recognition.lang = 'en-US';
          // continuous = true: recognition nghe LIÊN TỤC suốt thời gian thu.
          // Với false, nó tự dừng ngay khi bé ngừng nói → có thể dừng TRƯỚC mediaRecorder.onstop,
          // khiến transcript bị mất và game chấm 0 điểm.
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.maxAlternatives = 3;

          recognition.onresult = (event) => {
            // Với continuous=true, onresult có thể bắn nhiều lần → ghép tất cả transcript
            let combined = '';
            for (let i = 0; i < event.results.length; i++) {
              const alt = event.results[i]?.[0];
              if (alt?.transcript) combined += ' ' + alt.transcript;
            }
            const text = combined.trim();
            if (text) recognizedTranscriptRef.current = text;
          };

          // ⚠️ macOS/Chrome cần ~1-2s để khởi động speech service (tải model ngôn ngữ).
          // Nếu bé nói ngay lúc bấm mic, âm thanh rơi vào lúc recognition CHƯA sẵn sàng → mất trắng.
          // Ghi nhận thời điểm recognition thực sự sẵn sàng để cảnh báo / tính lại thời gian thu.
          recognition.onstart = () => {
            recognitionReadyAtRef.current = Date.now();
            setRecognitionReady(true);
          };
          recognition.onaudiostart = () => {
            recognitionReadyAtRef.current = Date.now();
            setRecognitionReady(true);
          };

          recognition.onerror = (event) => {
            // event.error có thể là: 'no-speech', 'network', 'not-allowed', 'aborted', 'service-not-allowed'
            const errType = (event as unknown as { error?: string })?.error;
            recognitionErrorRef.current = errType || 'unknown';
            if (errType !== 'no-speech' && errType !== 'aborted') {
              setSpeechUnavailable(true);
            }
          };

          // onend được gắn DUY NHẤT MỘT LẦN ở đây, không bao giờ bị ghi đè sau này.
          // Khi recognition kết thúc (do bé ngừng nói, do hết giờ, hoặc do stop()),
          // ta chờ 400ms cho onresult kịp gán transcript rồi mới chấm điểm.
          recognition.onend = () => {
            recognitionEndedRef.current = true;
            const finish = finishScoringRef.current;
            if (finish) {
              window.setTimeout(() => finish(), 400);
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          // Bỏ qua nếu SpeechRecognition bị chặn
          setSpeechUnavailable(true);
        }
      } else {
        // Trình duyệt không hỗ trợ Web Speech API
        setSpeechUnavailable(true);
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecognitionReady(false);
      recognitionErrorRef.current = '';
      recognitionEndedRef.current = false;

      // ===== VAD: TỰ DỪNG KHI BÉ NÓI XONG =====
      // Máy đo âm lượng micro liên tục:
      //  - Bé bắt đầu nói (âm lượng vượt ngưỡng) → đánh dấu đã nghe thấy giọng
      //  - Bé ngừng nói liên tục 900ms → tự dừng ngay (không phải chờ đủ 6s)
      //  - Không nói gì trong 3.5s → dừng (tránh treo)
      //  - Trần tuyệt đối 8s để chắc chắn không kẹt
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      const micSource = audioCtx.createMediaStreamSource(stream);
      micSource.connect(analyser);
      audioCtxRef.current = audioCtx;
      const vadData = new Uint8Array(analyser.frequencyBinCount);

      vadStartRef.current = Date.now();
      vadHeardSpeechRef.current = false;
      vadSilenceStartRef.current = 0;
      let frameCount = 0;

      const SPEECH_THRESHOLD = 12; // mức âm lượng coi là "đang nói"
      const SILENCE_MS = 900; // ngừng nói bao lâu thì coi là xong
      const NO_SPEECH_TIMEOUT_MS = 3500; // không nói gì quá 3.5s thì dừng
      const MAX_MS = 8000; // trần tuyệt đối

      const vadLoop = () => {
        analyser.getByteTimeDomainData(vadData);
        let peak = 0;
        for (let i = 0; i < vadData.length; i++) {
          const v = Math.abs(vadData[i] - 128);
          if (v > peak) peak = v;
        }
        vadVolumeRef.current = peak;

        // Cập nhật vòng sáng micro (giới hạn ~12fps để không lag)
        if (frameCount++ % 5 === 0) {
          setMicLevel(Math.min(100, Math.round((peak / 60) * 100)));
        }

        const now = Date.now();
        const elapsed = now - vadStartRef.current;

        if (peak >= SPEECH_THRESHOLD) {
          // Đang nói
          vadHeardSpeechRef.current = true;
          vadSilenceStartRef.current = 0;
        } else if (vadHeardSpeechRef.current) {
          // Đã từng nói, giờ im → bắt đầu tính thời gian im lặng
          if (vadSilenceStartRef.current === 0) {
            vadSilenceStartRef.current = now;
          } else if (now - vadSilenceStartRef.current >= SILENCE_MS) {
            // Im đủ lâu → bé đã nói xong
            stopRecording();
            return;
          }
        } else if (elapsed >= NO_SPEECH_TIMEOUT_MS) {
          // Chưa nói gì quá lâu
          stopRecording();
          return;
        }

        if (elapsed >= MAX_MS) {
          stopRecording();
          return;
        }

        vadFrameRef.current = requestAnimationFrame(vadLoop);
      };
      vadFrameRef.current = requestAnimationFrame(vadLoop);

      // Cập nhật số giây hiển thị trên nút
      let sec = 0;
      timerRef.current = window.setInterval(() => {
        sec++;
        setRecordingSeconds(sec);
      }, 1000);
    } catch {
      setErrorMsg('Vui lòng cho phép quyền truy cập Micro (Microphone) trong trình duyệt để bé thu âm nhé!');
    }
  };

  // Dừng thu âm
  /** Dừng & giải phóng bộ đo âm lượng VAD */
  const stopVad = () => {
    if (vadFrameRef.current !== null) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const stopRecording = () => {
    stopVad();
    setMicLevel(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // ⚠️ KHÔNG gọi recognition.stop() ở đây.
    // MediaRecorder.onstop sẽ tự stop() recognition sau khi đã đăng ký xong
    // handler chấm điểm — tránh race "stop trước khi kịp gắn onend/onresult".
  };

  // Nghe lại giọng của bé (Tương thích 100% iOS Safari với Web Audio API fallback)
  const handlePlayUserAudio = async () => {
    if (!recordedAudioUrl && !recordedAudioBlob) return;

    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
    }

    setIsPlayingUser(true);

    try {
      if (recordedAudioUrl) {
        const audio = new Audio(recordedAudioUrl);
        (audio as unknown as { playsInline?: boolean }).playsInline = true;
        userAudioPlayerRef.current = audio;

        audio.onended = () => setIsPlayingUser(false);
        audio.onpause = () => setIsPlayingUser(false);
        audio.onerror = async () => {
          // Fallback phát qua Web Audio API cho Safari
          await playViaWebAudioFallback();
        };

        await audio.play();
      } else {
        await playViaWebAudioFallback();
      }
    } catch {
      await playViaWebAudioFallback();
    }
  };

  const playViaWebAudioFallback = async () => {
    if (!recordedAudioBlob) {
      setIsPlayingUser(false);
      return;
    }
    try {
      const arrayBuffer = await recordedAudioBlob.arrayBuffer();
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlayingUser(false);
        void ctx.close();
      };
      source.start(0);
    } catch {
      setIsPlayingUser(false);
    }
  };

  return (
    <div className="bg-gradient-to-tr from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-5 sm:p-6 border-2 border-indigo-200 shadow-xl space-y-4 animate-in fade-in max-w-lg mx-auto">
      {/* Header Modal */}
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-lg shadow-xs">
            🎙️
          </div>
          <div>
            <h4 className="text-base font-black text-slate-800">Luyện Phát Âm & AI Chấm Điểm</h4>
            <p className="text-xs text-slate-500">Nghe mẫu rồi thu âm giọng bé để AI đánh giá</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2.5 py-1 rounded-xl hover:bg-white cursor-pointer transition-all"
          >
            Đóng
          </button>
        )}
      </div>

      {/* Target Word Card */}
      <div className="text-center py-3 bg-white rounded-2xl border border-indigo-100 shadow-2xs">
        <h3 className="text-3xl font-black text-slate-900 capitalize tracking-wide">{word}</h3>
        {phonetic && <p className="text-xs font-mono text-indigo-600 mt-0.5">{phonetic}</p>}
        {meaningVi && <p className="text-xs text-slate-500 mt-1 italic">{meaningVi}</p>}
      </div>

      {/* 2 Interactive Channels: Giọng Chuẩn & Thu Âm Bé */}
      <div className="grid grid-cols-2 gap-3">
        {/* Channel 1: Nghe giọng chuẩn */}
        <button
          type="button"
          onClick={handlePlayNative}
          className="p-3.5 rounded-2xl bg-white hover:bg-indigo-50/70 border-2 border-indigo-200 hover:border-indigo-400 transition-all flex flex-col items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
            <Volume2 size={22} />
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
                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  isRecording
                    ? 'bg-rose-500 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white hover:scale-105 active:scale-95'
                }`}
                style={
                  isRecording
                    ? {
                        boxShadow: `0 0 0 ${Math.round(3 + (micLevel / 100) * 10)}px rgba(244,63,94,${
                          0.15 + (micLevel / 100) * 0.45
                        })`,
                        transform: `scale(${1 + (micLevel / 100) * 0.12})`,
                        transition: 'box-shadow 80ms linear, transform 80ms linear',
                      }
                    : undefined
                }
              >
                {isRecording ? <Square size={18} /> : <Mic size={22} />}
              </button>
              <span className="text-xs font-black text-slate-800">
                {isRecording ? `Đang thu... ${Math.max(0, 6 - recordingSeconds)}s` : '2. Thu Âm Giọng Bé'}
              </span>
              <span className="text-[10px] font-semibold text-purple-600">
                {isRecording
                  ? micLevel > 15
                    ? `🔊 Đang nghe... ${Math.round(micLevel)}%`
                    : recognitionReady
                    ? '🎤 Bé nói đi — nói xong sẽ tự dừng!'
                    : '⏳ Đang bật micro... chờ 1 giây'
                  : 'Chạm Mic để nói'}
              </span>
              {/* Thanh đo âm lượng thời gian thực — giúp xác định micro có thu được tiếng không */}
              {isRecording && (
                <div className="w-full px-1 mt-0.5">
                  <div className="h-1.5 w-full rounded-full bg-purple-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75"
                      style={{ width: `${Math.min(100, micLevel)}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayUserAudio}
                  disabled={isPlayingUser}
                  aria-label="Nghe lại giọng bé"
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isPlayingUser
                      ? 'bg-emerald-500 text-white animate-pulse ring-4 ring-emerald-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                  }`}
                >
                  <Play size={20} className="fill-white" />
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  aria-label="Thu âm lại"
                  className="px-3 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <RotateCcw size={14} />
                  <span>Thu lại</span>
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

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* AI Pronunciation Evaluation Card (Bảng Chấm Điểm) */}
      {evaluation && (
        <div className="bg-white rounded-2xl p-4 border-2 border-indigo-200 shadow-md space-y-3 animate-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm ${
                  evaluation.feedbackLevel === 'perfect'
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-500'
                    : evaluation.feedbackLevel === 'good'
                    ? 'bg-gradient-to-tr from-indigo-500 to-purple-500'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500'
                }`}
              >
                {evaluation.score}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Điểm phát âm của bé</div>
                <div className="text-sm font-black text-slate-900">{evaluation.score} / 100 Điểm</div>
              </div>
            </div>

            {/* Stars reward */}
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200 shadow-2xs">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < evaluation.starsEarned
                      ? 'fill-amber-400 text-amber-500 animate-bounce'
                      : 'text-slate-300'
                  }
                />
              ))}
              <span className="text-xs font-black text-amber-800 ml-1">+{evaluation.starsEarned} sao</span>
            </div>
          </div>

          {/* Feedback Banner */}
          <div
            className={`p-2.5 rounded-xl text-center text-xs font-black flex items-center justify-center gap-1.5 ${
              evaluation.feedbackLevel === 'perfect'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : evaluation.feedbackLevel === 'good'
                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <Sparkles size={14} className="shrink-0" />
            <span>{evaluation.feedbackText}</span>
          </div>

          {/* Action buttons to replay and practice again */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePlayUserAudio}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Play size={13} />
              <span>Giọng bé vừa nói</span>
            </button>
            <button
              type="button"
              onClick={handlePlayNative}
              className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Volume2 size={14} />
              <span>Giọng mẫu chuẩn</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EchoVoiceRecorder;
