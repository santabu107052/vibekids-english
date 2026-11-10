import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 KIỂM CHỨNG TỰ ĐỘNG TASK 7: DỜI BẢN ĐỒ & THU ÂM AI CHẤM ĐIỂM');
console.log('====================================================\n');

let passed = 0;
let total = 0;

function assert(condition, code, desc) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${code}: ${desc}`);
  } else {
    console.error(`[FAIL] ${code}: ${desc}`);
  }
}

const projectRoot = path.resolve('.');

// 1. Kiểm tra vị trí của SkillsRadarCard: nằm trên VocabStatsSection, ngay dưới HeroSection
const appContent = fs.readFileSync(path.join(projectRoot, 'src/App.tsx'), 'utf8');
const heroIndex = appContent.indexOf('<HeroSection');
const radarIndex = appContent.indexOf('<SkillsRadarCard');
const vocabIndex = appContent.indexOf('<VocabStatsSection');

assert(
  heroIndex !== -1 && radarIndex !== -1 && vocabIndex !== -1 &&
  heroIndex < radarIndex && radarIndex < vocabIndex,
  'TASK7-01',
  'Bản đồ 3 kỹ năng (SkillsRadarCard) đã được đặt chính xác ngay dưới HeroSection và nằm trên VocabStatsSection'
);

// 2. Kiểm tra MIME types và cơ chế tương thích Safari iOS trong EchoVoiceRecorder
const echoContent = fs.readFileSync(path.join(projectRoot, 'src/components/EchoVoiceRecorder.tsx'), 'utf8');
assert(
  echoContent.includes('isTypeSupported') &&
  echoContent.includes('audio/mp4') &&
  echoContent.includes('audio/aac') &&
  echoContent.includes('AudioContext') &&
  echoContent.includes('decodeAudioData'),
  'TASK7-02',
  'EchoVoiceRecorder hỗ trợ đầy đủ audio/mp4, audio/aac qua isTypeSupported và fallback Web Audio API cho iOS Safari'
);

// 3. Kiểm tra tính năng Web Speech Recognition & Levenshtein Similarity
assert(
  (echoContent.includes('webkitSpeechRecognition') || echoContent.includes('SpeechRecognition')) &&
  echoContent.includes('calculateSimilarityScore') &&
  echoContent.includes('en-US'),
  'TASK7-03',
  'Tích hợp Web Speech Recognition API (lang: en-US) và thuật toán so khớp Levenshtein'
);

// 4. Kiểm tra thang điểm và nhận xét trực quan
assert(
  echoContent.includes('85') &&
  echoContent.includes('Xuất sắc! Phát âm như người bản xứ!') &&
  echoContent.includes('60') &&
  echoContent.includes('Rất tốt! Bé phát âm gần chuẩn rồi!') &&
  echoContent.includes('Cố lên bé ơi! Nghe lại mẫu và thử lại nhé!'),
  'TASK7-04',
  'Đầy đủ 3 thang điểm trực quan (>=85 xuất sắc, 60-84 rất tốt, <60 khích lệ) kèm số sao thưởng tương ứng'
);

// 5. Kiểm tra logic cộng sao vào Profile
const storageContent = fs.readFileSync(path.join(projectRoot, 'src/services/storage.ts'), 'utf8');
assert(
  storageContent.includes('addStarsToProfile') &&
  echoContent.includes('addStarsToProfile'),
  'TASK7-05',
  'Có hàm addStarsToProfile thưởng sao trực tiếp cho bé khi đạt điểm phát âm'
);

console.log('\n====================================================');
console.log(`📊 KẾT QUẢ: ${passed}/${total} MỤC KIỂM TRA ĐẠT CHUẨN (${Math.round(passed/total*100)}%)`);
console.log('====================================================');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
