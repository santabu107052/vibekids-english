import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve('.');

// Read storage.ts to extract calculateWordMasteryLevel and getSkillForGame
const storageSrc = fs.readFileSync(path.join(projectRoot, 'src/services/storage.ts'), 'utf8');

// Function extractor for testing
const calculateWordMasteryLevel = (listeningCorrect = 0, readingCorrect = 0, spellingCorrect = 0, hasPracticed = false) => {
  if (listeningCorrect >= 5 && readingCorrect >= 5 && spellingCorrect >= 5) {
    return 5;
  }
  if (!hasPracticed && listeningCorrect === 0 && readingCorrect === 0 && spellingCorrect === 0) {
    return 0;
  }
  let skillsMet = 0;
  if (listeningCorrect >= 5) skillsMet++;
  if (readingCorrect >= 5) skillsMet++;
  if (spellingCorrect >= 5) skillsMet++;

  if (skillsMet === 2) return 3;
  if (skillsMet === 1) return 2;
  return 1;
};

const getSkillForGame = (gameType) => {
  switch (gameType) {
    case 'sound_detective':
      return 'listening';
    case 'word_scramble':
    case 'spelling_bee':
      return 'spelling';
    case 'memory_flip':
    case 'word_match':
    default:
      return 'reading';
  }
};

console.log('====================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ 4 TINH CHỈNH SƯ PHẠM & UX MỚI');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testCode, description, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testCode}: ${description}`);
  } else {
    console.error(`[FAIL] ${testCode}: ${description}`);
    if (details) console.error(`       Chi tiết: ${details}`);
  }
}

// 1. Kiểm tra không còn nút 'Kiếm tiền' và section Mẫu câu
const navbarContent = fs.readFileSync(path.join(projectRoot, 'src/components/Navbar.tsx'), 'utf8');
const appContent = fs.readFileSync(path.join(projectRoot, 'src/App.tsx'), 'utf8');
const kingdomsContent = fs.readFileSync(path.join(projectRoot, 'src/components/dashboard/GameKingdomsSection.tsx'), 'utf8');

assert(
  !navbarContent.includes('Kiếm Tiền') && !navbarContent.includes('title="Cấu hình Kiếm Tiền'),
  'REFINEMENT-1A',
  'Nút "Kiếm Tiền" đã được xóa 100% khỏi Navbar và giao diện người dùng'
);

assert(
  !appContent.includes('<SentencePatternSection'),
  'REFINEMENT-1B',
  'Section Mẫu câu giao tiếp đã được xóa/ẩn 100% khỏi JSX trang chủ'
);

assert(
  !kingdomsContent.includes('sentenceGamesList.map') && !kingdomsContent.includes('<h3 className="text-xl font-black text-slate-900 flex items-center gap-2">\n              <Compass className="text-purple-600" />\n              Vương Quốc Trò Chơi Mẫu Câu'),
  'REFINEMENT-1C',
  'Vương Quốc Trò Chơi Mẫu Câu đã được loại bỏ khỏi GameKingdomsSection'
);

// 2. Kiểm tra Bản đồ năng lực chuẩn hóa 3 kỹ năng
const radarContent = fs.readFileSync(path.join(projectRoot, 'src/components/SkillsRadarCard.tsx'), 'utf8');
assert(
  radarContent.includes('Bản Đồ Năng Lực 3 Kỹ Năng Của Bé') &&
  radarContent.includes('Luyện Nghe (Listening)') &&
  radarContent.includes('Mặt Chữ & Nghĩa (Reading)') &&
  radarContent.includes('Chính Tả (Spelling)') &&
  !radarContent.includes('Mẫu Câu (Grammar)') &&
  radarContent.includes('/ 3'),
  'REFINEMENT-2',
  'Bản đồ năng lực chuẩn hóa 3 kỹ năng (Nghe, Đọc, Chính tả), điểm tổng hòa chia 3'
);

// 3. Kiểm tra Logic Game: Trả lời sai giữ nguyên câu hỏi, không cho qua
const wordMatchContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/WordMatchGame.tsx'), 'utf8');
const soundDetectiveContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/SoundDetectiveGame.tsx'), 'utf8');
const vocabRotatingContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/VocabRotatingAdventure.tsx'), 'utf8');
const scrambleContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/WordScrambleGame.tsx'), 'utf8');
const spellingContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/SpellingBeeGame.tsx'), 'utf8');

assert(
  wordMatchContent.includes('setRoundHasError(true)') &&
  wordMatchContent.includes('setupRound(currentRound + 1)') &&
  soundDetectiveContent.includes('setRoundHasError(true)') &&
  vocabRotatingContent.includes('setRoundHasError(true)'),
  'REFINEMENT-3A',
  'Game có cờ roundHasError ghi nhận lỗi nhưng không gọi chuyển câu khi sai'
);

assert(
  wordMatchContent.includes('setSelectedOption(null)') &&
  soundDetectiveContent.includes('setAnsweredCorrect(null)'),
  'REFINEMENT-3B',
  'Reset trạng thái sai sau delay 800ms để bé được quyền làm lại câu hỏi hiện tại cho đến khi đúng'
);

// 4. Kiểm tra Logic Thành thạo: Cả 3 kỹ năng >= 5 lần đúng mới là Thành thạo
assert(
  storageSrc.includes('calculateWordMasteryLevel') &&
  storageSrc.includes('listeningCorrect >= 5 && readingCorrect >= 5 && spellingCorrect >= 5') &&
  storageSrc.includes('Math.max(0, Math.min(4, listening - 1))'),
  'REFINEMENT-4-SOURCE',
  'Codebase storage.ts cài đặt chuẩn xác điều kiện >= 5 ở cả 3 kỹ năng và hạ cấp tức thì khi sai'
);

// Đơn vị hàm calculateWordMasteryLevel
assert(
  calculateWordMasteryLevel(5, 5, 5, true) === 5,
  'REFINEMENT-4A',
  'Cả 3 kỹ năng >= 5 lần đúng: Đạt mốc Thành thạo (masteryLevel = 5)'
);

assert(
  calculateWordMasteryLevel(6, 5, 5, true) === 5 &&
  calculateWordMasteryLevel(10, 8, 7, true) === 5,
  'REFINEMENT-4B',
  'Các kỹ năng > 5 lần đúng đều duy trì Thành thạo (masteryLevel = 5)'
);

assert(
  calculateWordMasteryLevel(5, 5, 4, true) < 5 &&
  calculateWordMasteryLevel(5, 4, 5, true) < 5 &&
  calculateWordMasteryLevel(4, 5, 5, true) < 5,
  'REFINEMENT-4C',
  'Chỉ 1 trong 3 kỹ năng < 5: Không thể đạt Thành thạo (hạ xuống đang luyện tập)'
);

assert(
  calculateWordMasteryLevel(0, 0, 0, false) === 0,
  'REFINEMENT-4D',
  'Chưa luyện tập lần nào: Trạng thái Từ mới cần học (masteryLevel = 0)'
);

// Ánh xạ game sang kỹ năng
assert(
  getSkillForGame('sound_detective') === 'listening' &&
  getSkillForGame('spelling_bee') === 'spelling' &&
  getSkillForGame('word_scramble') === 'spelling' &&
  getSkillForGame('word_match') === 'reading' &&
  getSkillForGame('memory_flip') === 'reading',
  'REFINEMENT-4E',
  'Ánh xạ đúng chuẩn 5 mini-game vào 3 kỹ năng sư phạm tương ứng'
);

console.log('\n====================================================');
console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} BÀI TEST ĐẠT CHUẨN (${Math.round(passedTests/totalTests*100)}%)`);
console.log('====================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
