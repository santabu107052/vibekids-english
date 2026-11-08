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
  student: { meaning: 'Học sinh', emoji: '🎒', category: 'School', exampleVi: 'Học sinh chăm chỉ học bài.' },
  desk: { meaning: 'Bàn học', emoji: '🪑', category: 'School', exampleVi: 'Bàn học của em rất ngăn nắp.' },
  chair: { meaning: 'Cái ghế', emoji: '🪑', category: 'School', exampleVi: 'Em ngồi ngay ngắn trên ghế.' },
  table: { meaning: 'Cái bàn', emoji: '🪑', category: 'Home', exampleVi: 'Cả nhà ngồi quây quần bên bàn ăn.' },
  milk: { meaning: 'Sữa tươi', emoji: '🥛', category: 'Food', exampleVi: 'Uống sữa giúp bé cao lớn hơn.' },
  water: { meaning: 'Nước uống', emoji: '💧', category: 'Food', exampleVi: 'Hãy nhớ uống đủ nước mỗi ngày.' },
  bread: { meaning: 'Bánh mì', emoji: '🍞', category: 'Food', exampleVi: 'Bánh mì nóng giòn thơm ngon.' },
  egg: { meaning: 'Quả trứng', emoji: '🥚', category: 'Food', exampleVi: 'Trứng luộc ăn rất bổ dưỡng.' },
  fish: { meaning: 'Con cá', emoji: '🐟', category: 'Animals', exampleVi: 'Đàn cá bơi lội dưới nước.' },
  meat: { meaning: 'Thịt', emoji: '🥩', category: 'Food', exampleVi: 'Mẹ nấu món thịt kho thơm ngon.' },
  rice: { meaning: 'Cơm, gạo', emoji: '🍚', category: 'Food', exampleVi: 'Bữa cơm gia đình ấm cúng.' },
  sun: { meaning: 'Mặt trời', emoji: '☀️', category: 'Nature', exampleVi: 'Mặt trời mọc vào buổi sớm mai.' },
  moon: { meaning: 'Mặt trăng', emoji: '🌙', category: 'Nature', exampleVi: 'Mặt trăng tròn tỏa sáng ban đêm.' },
  star: { meaning: 'Ngôi sao', emoji: '⭐', category: 'Nature', exampleVi: 'Những ngôi sao lấp lánh trên trời cao.' },
  rain: { meaning: 'Cơn mưa', emoji: '🌧️', category: 'Nature', exampleVi: 'Mưa tưới mát cây cối trong vườn.' },
  tree: { meaning: 'Cây cối', emoji: '🌳', category: 'Nature', exampleVi: 'Cây xanh cho bóng mát trong sân.' },
  flower: { meaning: 'Bông hoa', emoji: '🌸', category: 'Nature', exampleVi: 'Những bông hoa nở rộ khoe sắc.' },
  house: { meaning: 'Ngôi nhà', emoji: '🏠', category: 'Home', exampleVi: 'Ngôi nhà thân yêu của gia đình em.' },
  room: { meaning: 'Căn phòng', emoji: '🚪', category: 'Home', exampleVi: 'Phòng của em rất sạch sẽ và gọn gàng.' },
  bed: { meaning: 'Chiếc giường', emoji: '🛏️', category: 'Home', exampleVi: 'Em ngủ ngoan trên chiếc giường êm ái.' },
  door: { meaning: 'Cánh cửa', emoji: '🚪', category: 'Home', exampleVi: 'Em mở cửa đón gió ban mai.' },
  window: { meaning: 'Cửa sổ', emoji: '🪟', category: 'Home', exampleVi: 'Ánh nắng chan hòa chiếu qua cửa sổ.' },
  clock: { meaning: 'Đồng hồ', emoji: '⏰', category: 'Home', exampleVi: 'Đồng hồ báo thức reng reng mỗi sáng.' },
  baby: { meaning: 'Em bé', emoji: '👶', category: 'Family', exampleVi: 'Em bé có nụ cười rất dễ thương.' },
  father: { meaning: 'Bố, cha', emoji: '👨', category: 'Family', exampleVi: 'Bố em là người dũng cảm và yêu thương gia đình.' },
  mother: { meaning: 'Mẹ', emoji: '👩', category: 'Family', exampleVi: 'Mẹ là người nấu ăn ngon nhất trần đời.' },
  brother: { meaning: 'Anh/Em trai', emoji: '👦', category: 'Family', exampleVi: 'Anh trai luôn dạy em học bài.' },
  sister: { meaning: 'Chị/Em gái', emoji: '👧', category: 'Family', exampleVi: 'Chị gái cùng em vui chơi mỗi ngày.' },
  friend: { meaning: 'Bạn bè', emoji: '🤝', category: 'Family', exampleVi: 'Chúng em là những người bạn tốt của nhau.' },
  happy: { meaning: 'Vui vẻ, hạnh phúc', emoji: '😊', category: 'Feelings', exampleVi: 'Bé cảm thấy rất vui vẻ hôm nay.' },
  sad: { meaning: 'Buồn bã', emoji: '😢', category: 'Feelings', exampleVi: 'Đừng buồn nhé, ngày mai trời lại sáng.' },
  big: { meaning: 'To lớn', emoji: '🐘', category: 'Adjectives', exampleVi: 'Con voi có thân hình rất to lớn.' },
  small: { meaning: 'Nhỏ bé', emoji: '🐭', category: 'Adjectives', exampleVi: 'Chú chuột nhỏ chạy thoăn thoắt.' },
  fast: { meaning: 'Nhanh nhẹn', emoji: '⚡', category: 'Adjectives', exampleVi: 'Con báo chạy cực kỳ nhanh.' },
  slow: { meaning: 'Chậm chạp', emoji: '🐢', category: 'Adjectives', exampleVi: 'Chú rùa bò từ từ trên bãi cỏ.' },
  good: { meaning: 'Tốt, giỏi', emoji: '👍', category: 'Adjectives', exampleVi: 'Hôm nay bé làm rất tốt.' },
  sweet: { meaning: 'Ngọt ngào', emoji: '🍭', category: 'Food', exampleVi: 'Kẹo mút có vị ngọt ngào.' },
  warm: { meaning: 'Ấm áp', emoji: '☀️', category: 'Adjectives', exampleVi: 'Ánh nắng mùa xuân ấm áp chan hòa.' },
  red: { meaning: 'Màu đỏ', emoji: '🔴', category: 'Colors', exampleVi: 'Quả dâu tây có màu đỏ tươi.' },
  blue: { meaning: 'Màu xanh dương', emoji: '🔵', category: 'Colors', exampleVi: 'Bầu trời mùa thu xanh biếc.' },
  yellow: { meaning: 'Màu vàng', emoji: '🟡', category: 'Colors', exampleVi: 'Bông hoa cúc vàng rực rỡ.' },
  green: { meaning: 'Màu xanh lá', emoji: '🟢', category: 'Colors', exampleVi: 'Lá cây non xanh mơn mởn.' },
  white: { meaning: 'Màu trắng', emoji: '⚪', category: 'Colors', exampleVi: 'Những đám mây trắng bồng bềnh.' },
  black: { meaning: 'Màu đen', emoji: '⚫', category: 'Colors', exampleVi: 'Màn đêm đen lung linh ánh sao.' },
  pink: { meaning: 'Màu hồng', emoji: '🌸', category: 'Colors', exampleVi: 'Chiếc váy màu hồng xinh xắn.' },
  one: { meaning: 'Số một (1)', emoji: '1️⃣', category: 'Numbers', exampleVi: 'Bé có một quả bóng đỏ.' },
  two: { meaning: 'Số hai (2)', emoji: '2️⃣', category: 'Numbers', exampleVi: 'Hai chú chim hót trên cành.' },
  three: { meaning: 'Số ba (3)', emoji: '3️⃣', category: 'Numbers', exampleVi: 'Có ba bạn nhỏ cùng đọc sách.' },
  four: { meaning: 'Số bốn (4)', emoji: '4️⃣', category: 'Numbers', exampleVi: 'Chiếc xe hơi có bốn bánh tròn.' },
  five: { meaning: 'Số năm (5)', emoji: '5️⃣', category: 'Numbers', exampleVi: 'Bàn tay xinh có năm ngón nhỏ.' },
};

export async function fetchWordKnowledge(word: string): Promise<Partial<WordItem>> {
  const cleanWord = word.trim().toLowerCase();
  
  // 1. Check built-in instant database
  if (COMMON_VI_TRANSLATIONS[cleanWord]) {
    const item = COMMON_VI_TRANSLATIONS[cleanWord];
    return {
      word: cleanWord,
      meaningVi: item.meaning,
      category: item.category,
      emoji: item.emoji,
      exampleSentence: `I see a ${cleanWord}.`,
      exampleVi: item.exampleVi || `Tôi nhìn thấy ${item.meaning}.`,
      phonetic: `/${cleanWord}/`,
      audioUrl: getReliableAudioUrl(cleanWord),
    };
  }

  // 2. Fetch from Dictionary API
  let phonetic = '';
  let audioUrl = '';
  let definitionEn = '';
  let exampleSentence = '';
  let partOfSpeech = 'noun';

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    if (res.ok) {
      const data: ApiDictionaryResult[] = await res.json();
      if (data && data[0]) {
        const entry = data[0];
        phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
        
        // Find phonetic audio if valid
        const validAudio = entry.phonetics?.find(p => p.audio && p.audio.startsWith('http') && !p.audio.includes('api.dictionaryapi.dev/media'));
        if (validAudio?.audio) {
          audioUrl = validAudio.audio;
        }

        // Meanings & Examples
        if (entry.meanings && entry.meanings.length > 0) {
          const m = entry.meanings[0];
          partOfSpeech = m.partOfSpeech || 'noun';
          if (m.definitions && m.definitions.length > 0) {
            definitionEn = m.definitions[0].definition || '';
            const defWithEx = m.definitions.find(d => d.example);
            if (defWithEx?.example) {
              exampleSentence = defWithEx.example;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Dictionary] Free Dictionary API failed, using fallback TTS...', err);
  }

  // Fallback TTS
  if (!audioUrl) {
    audioUrl = getReliableAudioUrl(cleanWord);
  }

  // 3. Multi-Engine Translation to Vietnamese
  const meaningVi = await translateToVietnamese(cleanWord);

  return {
    word: cleanWord,
    phonetic: phonetic || `/${cleanWord}/`,
    audioUrl,
    partOfSpeech,
    meaningVi,
    definitionEn,
    exampleSentence: exampleSentence || `The ${cleanWord} is very nice.`,
    exampleVi: `Từ "${cleanWord}" có nghĩa là: ${meaningVi}.`,
    category: 'Chủ đề chung',
    emoji: '📖',
  };
}

/**
 * High-reliability multi-engine translator to Vietnamese
 */
export async function translateToVietnamese(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';

  const lower = clean.toLowerCase();
  if (COMMON_VI_TRANSLATIONS[lower]) {
    return COMMON_VI_TRANSLATIONS[lower].meaning;
  }

  // Engine 1: Google Translate Extension Endpoint (Fast, High CORS compatibility)
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=vi&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data) && data[0]) {
        const translated = String(data[0]).trim();
        if (translated && translated.toLowerCase() !== lower) {
          return translated;
        }
      }
    }
  } catch (e) {
    console.warn('[Translate] Google Clients5 API failed...', e);
  }

  // Engine 2: Google Translate Single endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translated = String(data[0][0][0]).trim();
        if (translated && translated.toLowerCase() !== lower) {
          return translated;
        }
      }
    }
  } catch (e) {
    console.warn('[Translate] Google Translate single API failed...', e);
  }

  // Engine 3: MyMemory API Fallback
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|vi`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.responseData?.translatedText) {
        const trans = data.responseData.translatedText.trim();
        if (trans && trans.toLowerCase() !== lower && !trans.includes('MYMEMORY WARNING')) {
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
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      let ended = false;
      const safeEnd = () => {
        if (!ended) {
          ended = true;
          if (onEnd) onEnd();
        }
      };

      const fallbackTimer = setTimeout(safeEnd, 1500);

      utterance.onend = () => {
        clearTimeout(fallbackTimer);
        safeEnd();
      };
      utterance.onerror = () => {
        clearTimeout(fallbackTimer);
        safeEnd();
      };

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

  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = () => {
      if (!resolved) {
        resolved = true;
        activeAudio = null;
        resolve();
      }
    };

    // Timeout an toàn tuyệt đối: tối đa 1.8 giây là bắt buộc phải dừng icon xoay
    const timer = setTimeout(safeResolve, 1800);

    const cleanup = () => {
      clearTimeout(timer);
      safeResolve();
    };

    const isBrokenMediaHost = audioUrl && (audioUrl.includes('api.dictionaryapi.dev/media') || audioUrl.includes('commons.wikimedia.org'));
    const primaryUrl = (audioUrl && !isBrokenMediaHost)
      ? audioUrl
      : getReliableAudioUrl(targetWord);

    try {
      const audio = new Audio();
      audio.referrerPolicy = 'no-referrer';
      audio.crossOrigin = 'anonymous';
      audio.src = primaryUrl;
      activeAudio = audio;

      audio.onended = () => {
        if (thisRequestId !== currentRequestId) return;
        cleanup();
      };

      audio.onerror = () => {
        if (thisRequestId !== currentRequestId) return;
        speakWithBrowser(targetWord, cleanup);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (thisRequestId !== currentRequestId) return;
          speakWithBrowser(targetWord, cleanup);
        });
      }
    } catch {
      speakWithBrowser(targetWord, cleanup);
    }
  });
}
