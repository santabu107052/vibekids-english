import { WordItem, AgeGroup } from '../types';

export interface ApiDictionaryResult {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
    }>;
  }>;
}

// Common Vietnamese translations dictionary for instant lookup
const COMMON_VI_TRANSLATIONS: Record<string, { meaning: string; emoji: string; category: string; exampleVi?: string }> = {
  sport: { meaning: 'Thể thao, môn thể thao', emoji: '⚽', category: 'Sports', exampleVi: 'Bé rất thích tham gia các môn thể thao.' },
  sports: { meaning: 'Các môn thể thao', emoji: '🏅', category: 'Sports', exampleVi: 'Chơi thể thao giúp cơ thể khỏe mạnh.' },
  bike: { meaning: 'Xe đạp', emoji: '🚲', category: 'Vehicles', exampleVi: 'Em đạp xe đạp đến trường mỗi ngày.' },
  bicycle: { meaning: 'Xe đạp', emoji: '🚲', category: 'Vehicles', exampleVi: 'Chiếc xe đạp màu xanh rất đẹp.' },
  football: { meaning: 'Bóng đá', emoji: '⚽', category: 'Sports', exampleVi: 'Các bạn nam rất thích đá bóng.' },
  soccer: { meaning: 'Bóng đá', emoji: '⚽', category: 'Sports', exampleVi: 'Bóng đá là môn thể thao vua.' },
  basketball: { meaning: 'Bóng rổ', emoji: '🏀', category: 'Sports', exampleVi: 'Chơi bóng rổ giúp bé phát triển chiều cao.' },
  swimming: { meaning: 'Bơi lội', emoji: '🏊', category: 'Sports', exampleVi: 'Bơi lội vào mùa hè rất sảng khoái.' },
  tennis: { meaning: 'Quần vợt', emoji: '🎾', category: 'Sports', exampleVi: 'Quần vợt rèn luyện sự nhanh nhẹn.' },
  running: { meaning: 'Chạy bộ', emoji: '🏃', category: 'Sports', exampleVi: 'Chạy bộ mỗi sáng rất tốt cho tim mạch.' },
  car: { meaning: 'Xe ô tô', emoji: '🚗', category: 'Vehicles', exampleVi: 'Gia đình em đi du lịch bằng xe ô tô.' },
  bus: { meaning: 'Xe buýt', emoji: '🚌', category: 'Vehicles', exampleVi: 'Xe buýt đón học sinh trước cổng trường.' },
  train: { meaning: 'Tàu hỏa', emoji: '🚆', category: 'Vehicles', exampleVi: 'Tàu hỏa chạy bon bon trên đường ray.' },
  plane: { meaning: 'Máy bay', emoji: '✈️', category: 'Vehicles', exampleVi: 'Máy bay bay lượn trên bầu trời xanh.' },
  airplane: { meaning: 'Máy bay', emoji: '✈️', category: 'Vehicles', exampleVi: 'Máy bay bay qua những đám mây trắng.' },
  apple: { meaning: 'Quả táo', emoji: '🍎', category: 'Food', exampleVi: 'Tôi ăn một quả táo đỏ mỗi sáng.' },
  banana: { meaning: 'Quả chuối', emoji: '🍌', category: 'Food', exampleVi: 'Chú khỉ thích ăn chuối.' },
  orange: { meaning: 'Quả cam', emoji: '🍊', category: 'Food', exampleVi: 'Nước cam rất ngon và tốt cho sức khỏe.' },
  cat: { meaning: 'Con mèo', emoji: '🐱', category: 'Animals', exampleVi: 'Con mèo con đang ngủ trên ghế.' },
  dog: { meaning: 'Con chó', emoji: '🐶', category: 'Animals', exampleVi: 'Con chó vẫy đuôi mừng rỡ.' },
  elephant: { meaning: 'Con voi', emoji: '🐘', category: 'Animals', exampleVi: 'Con voi có một chiếc vòi rất dài.' },
  lion: { meaning: 'Sư tử', emoji: '🦁', category: 'Animals', exampleVi: 'Sư tử là vua của muôn loài.' },
  tiger: { meaning: 'Con hổ', emoji: '🐯', category: 'Animals', exampleVi: 'Hổ chạy rất nhanh trong rừng.' },
  bird: { meaning: 'Con chim', emoji: '🐦', category: 'Animals', exampleVi: 'Con chim hót líu lo trên cành cây.' },
  book: { meaning: 'Quyển sách', emoji: '📚', category: 'School', exampleVi: 'Bé mở sách ra đọc mỗi tối.' },
  pen: { meaning: 'Bút mực', emoji: '🖊️', category: 'School', exampleVi: 'Em dùng bút để viết bài.' },
  pencil: { meaning: 'Bút chì', emoji: '✏️', category: 'School', exampleVi: 'Bút chì dùng để vẽ tranh.' },
  school: { meaning: 'Trường học', emoji: '🏫', category: 'School', exampleVi: 'Mỗi ngày đến trường là một ngày vui.' },
  teacher: { meaning: 'Thầy/Cô giáo', emoji: '👩‍🏫', category: 'School', exampleVi: 'Cô giáo dạy chúng em rất tận tình.' },
  water: { meaning: 'Nước', emoji: '💧', category: 'Food', exampleVi: 'Hãy uống đủ nước mỗi ngày nhé.' },
  milk: { meaning: 'Sữa', emoji: '🥛', category: 'Food', exampleVi: 'Uống sữa giúp xương chắc khỏe.' },
  happy: { meaning: 'Vui vẻ, hạnh phúc', emoji: '😊', category: 'Emotions', exampleVi: 'Hôm nay bé cảm thấy rất vui vẻ.' },
  sun: { meaning: 'Mặt trời', emoji: '☀️', category: 'Nature', exampleVi: 'Mặt trời mọc ở hướng đông.' },
  moon: { meaning: 'Mặt trăng', emoji: '🌙', category: 'Nature', exampleVi: 'Mặt trăng tròn sáng lung linh đêm rằm.' },
  star: { meaning: 'Ngôi sao', emoji: '⭐', category: 'Nature', exampleVi: 'Những vì sao lấp lánh trên bầu trời.' },
  rain: { meaning: 'Cơn mưa', emoji: '🌧️', category: 'Nature', exampleVi: 'Trời đang đổ mưa rào mát mẻ.' },
  friend: { meaning: 'Bạn bè', emoji: '🤝', category: 'Daily Life', exampleVi: 'Họ là những người bạn thân thiết.' },
  family: { meaning: 'Gia đình', emoji: '👨‍👩‍👧‍👦', category: 'Family', exampleVi: 'Gia đình luôn yêu thương đùm bọc nhau.' },
  house: { meaning: 'Ngôi nhà', emoji: '🏡', category: 'Home', exampleVi: 'Ngôi nhà ấm cúng đầy ắp tiếng cười.' },
  tree: { meaning: 'Cái cây', emoji: '🌳', category: 'Nature', exampleVi: 'Cây xanh cho bóng mát râm ran.' },
  flower: { meaning: 'Bông hoa', emoji: '🌸', category: 'Nature', exampleVi: 'Bông hoa hồng nở rộ tỏa hương thơm.' },
  music: { meaning: 'Âm nhạc', emoji: '🎵', category: 'Hobbies', exampleVi: 'Âm nhạc giúp tâm hồn thư thái.' },
  play: { meaning: 'Chơi đùa', emoji: '🎮', category: 'Actions', exampleVi: 'Các bạn nhỏ thích chơi trò chơi ngoài sân.' },
  read: { meaning: 'Đọc sách', emoji: '📖', category: 'Actions', exampleVi: 'Đọc sách giúp mở rộng tri thức.' },
  sleep: { meaning: 'Ngủ', emoji: '😴', category: 'Actions', exampleVi: 'Bé đi ngủ sớm để có sức khỏe tốt.' },
};

/**
 * Fetch knowledge from Free Dictionary API (audio, phonetic, definitions, examples)
 */
export async function fetchWordKnowledge(rawWord: string): Promise<Partial<WordItem>> {
  const word = rawWord.trim().toLowerCase();
  if (!word) {
    throw new Error('Vui lòng nhập từ vựng hợp lệ.');
  }

  const result: Partial<WordItem> = {
    word,
    emoji: '📝',
    category: 'Chung',
    partOfSpeech: 'noun',
    masteryLevel: 0,
    correctCount: 0,
    incorrectCount: 0,
  };

  // Check built-in quick dictionary
  if (COMMON_VI_TRANSLATIONS[word]) {
    const info = COMMON_VI_TRANSLATIONS[word];
    result.meaningVi = info.meaning;
    result.emoji = info.emoji;
    result.category = info.category;
    result.exampleVi = info.exampleVi;
  }

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (response.ok) {
      const data: ApiDictionaryResult[] = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        
        // Find phonetic
        result.phonetic = entry.phonetic || entry.phonetics.find(p => p.text)?.text || '';

        // Find native audio
        const audioObj = entry.phonetics.find(p => p.audio && p.audio.trim().length > 0);
        if (audioObj && audioObj.audio) {
          result.audioUrl = audioObj.audio;
        }

        // Find primary meaning & example
        if (entry.meanings && entry.meanings.length > 0) {
          const firstMeaning = entry.meanings[0];
          result.partOfSpeech = firstMeaning.partOfSpeech || 'noun';
          
          if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
            const firstDef = firstMeaning.definitions[0];
            result.definitionEn = firstDef.definition;
            if (firstDef.example) {
              result.exampleSentence = firstDef.example;
            }
          }

// Re-add the loop because I removed it by mistake in the previous edit.
          // If first definition didn't have example, look in others
          if (!result.exampleSentence) {
            for (const m of entry.meanings) {
              const defWithEx = m.definitions.find(d => d.example);
              if (defWithEx && defWithEx.example) {
                result.exampleSentence = defWithEx.example;
                break;
              }
            }
          }

          // Fallback example if still empty
          if (!result.exampleSentence) {
             result.exampleSentence = `I am learning the word "${word}" today.`;
          }
        }
      }
    }
  } catch (error) {
    console.warn(`[DictionaryAPI] Không kết nối được online cho từ "${word}", dùng fallback.`, error);
  }

  // 2. Fetch reliable Vietnamese translation if not found in built-in
  if (!result.meaningVi) {
    result.meaningVi = await translateWordToVi(word);
  }

  // Fallbacks if still empty
  if (!result.definitionEn) result.definitionEn = `A word to learn: ${word}.`;
  if (!result.exampleSentence) result.exampleSentence = `I am learning the word ${word} today.`;
  if (!result.meaningVi) result.meaningVi = `${word}`;
  if (!result.phonetic) result.phonetic = `/${word}/`;

  return result;
}

/**
 * Translate English word to Vietnamese using multiple high-reliability engines
 */
export async function translateWordToVi(rawWord: string): Promise<string> {
  const clean = rawWord.trim().toLowerCase();
  if (!clean) return '';

  // 1. Built-in vocabulary check (instant & 100% accurate)
  if (COMMON_VI_TRANSLATIONS[clean]?.meaning) {
    return COMMON_VI_TRANSLATIONS[clean].meaning;
  }

  // 2. Primary Engine: Google Chrome Translate API (CORS enabled, clean output e.g. ["thể thao"])
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=vi&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0] && typeof data[0] === 'string') {
        const trans = data[0].trim();
        if (trans.toLowerCase() !== clean) {
          return trans;
        }
      }
    }
  } catch (e) {
    console.warn('[Translate] clients5 API failed, trying fallback...', e);
  }

  // 3. Secondary Engine: Google Translate gtx single endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const trans = data[0][0][0].trim();
        if (trans.toLowerCase() !== clean) {
          return trans;
        }
      }
    }
  } catch (e) {
    console.warn('[Translate] translate.googleapis.com failed, trying fallback...', e);
  }

  // 4. Tertiary Engine: MyMemory API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|vi`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        const trans = data.responseData.translatedText.trim();
        if (trans.toLowerCase() !== clean) {
          return trans;
        }
      }
    }
  } catch (e) {
    console.warn('[Translate] MyMemory API failed...', e);
  }

  return clean;
}

let activeAudio: HTMLAudioElement | null = null;
let currentRequestId = 0;

/**
 * Get guaranteed reliable high-quality native audio URL for any English word or sentence
 */
export function getReliableAudioUrl(word: string): string {
  const clean = word.trim().toLowerCase();
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(clean)}`;
}

/**
 * Text-to-Speech using browser native Web Speech API with strict safety guards
 */
export function speakWithBrowser(text: string, onEnd?: () => void, lang = 'en-US'): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.85; // Slightly slower for kids to hear clearly
      utterance.pitch = 1.05; // Friendly tone
      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  } else {
    if (onEnd) onEnd();
  }
}

/**
 * Play authentic audio with strict sequence guard to prevent any overlap or delayed speech
 */
export function playWordAudio(word: string, audioUrl?: string): Promise<void> {
  const targetWord = word.trim();
  if (!targetWord) return Promise.resolve();

  // Cancel any ongoing speech or audio immediately
  currentRequestId++;
  const thisRequestId = currentRequestId;

  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = '';
    } catch {
      // ignore
    }
    activeAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  return new Promise((resolve) => {
    // If audioUrl is provided and not from the broken dictionaryapi media host, use it;
    // Otherwise use Google Translate TTS which is 100% accurate, fast, and native
    const isBrokenMediaHost = audioUrl && (audioUrl.includes('api.dictionaryapi.dev/media') || audioUrl.includes('commons.wikimedia.org'));
    const primaryUrl = (audioUrl && !isBrokenMediaHost)
      ? audioUrl
      : getReliableAudioUrl(targetWord);

    const audio = new Audio(primaryUrl);
    activeAudio = audio;

    const cleanup = () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
      resolve();
    };

    audio.onended = () => {
      if (thisRequestId !== currentRequestId) return;
      cleanup();
    };

    audio.onerror = () => {
      if (thisRequestId !== currentRequestId) return;
      // Fallback to browser Web Speech API
      speakWithBrowser(targetWord, cleanup);
    };

    // Đối với iOS, ưu tiên Speech API nếu audio không tải được nhanh
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
       // Chỉ phát Speech API cho iOS và hủy bỏ mọi nỗ lực tải audio từ nguồn bên ngoài
       speakWithBrowser(targetWord, cleanup);
       return;
    }

    audio.play().catch(() => {
      if (thisRequestId !== currentRequestId) return;
      speakWithBrowser(targetWord, cleanup);
    });
  });
}
