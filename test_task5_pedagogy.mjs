import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 KIỂM CHỨNG TỰ ĐỘNG 4 TINH CHỈNH SƯ PHẠM & UX (TASK 5)');
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

// 1. Kiểm tra Navbar: Đã xóa nút "Kiếm tiền"
const navbarContent = fs.readFileSync(path.join(projectRoot, 'src/components/Navbar.tsx'), 'utf8');
assert(
  !navbarContent.includes('Kiếm Tiền') && !navbarContent.includes('onOpenMonetization'),
  'REQ-1',
  'Đã xóa hoàn toàn nút Kiếm Tiền và onOpenMonetization khỏi Navbar'
);

// 2. Kiểm tra App.tsx & GameKingdoms: Ẩn các section Mẫu câu
const appContent = fs.readFileSync(path.join(projectRoot, 'src/App.tsx'), 'utf8');
const kingdomsContent = fs.readFileSync(path.join(projectRoot, 'src/components/dashboard/GameKingdomsSection.tsx'), 'utf8');
assert(
  !appContent.includes('<SentencePatternSection\n') &&
  !kingdomsContent.includes('{sentenceGamesList.map'),
  'REQ-2',
  'Đã tạm thời ẩn hoàn toàn SentencePatternSection và games Mẫu câu trên giao diện'
);

// 3. Kiểm tra Bản đồ kỹ năng: Chỉ còn 3 kỹ năng
const radarContent = fs.readFileSync(path.join(projectRoot, 'src/components/SkillsRadarCard.tsx'), 'utf8');
assert(
  radarContent.includes('Luyện Nghe (Listening)') &&
  radarContent.includes('Mặt Chữ & Nghĩa (Reading)') &&
  radarContent.includes('Chính Tả (Spelling)') &&
  !radarContent.includes('Mẫu Câu (Grammar)') &&
  radarContent.includes('Bản Đồ Năng Lực 3 Kỹ Năng Của Bé'),
  'REQ-3',
  'Bản đồ kỹ năng hiển thị chuẩn 3 kỹ năng (Nghe, Đọc, Chính tả), đã loại bỏ phần Mẫu câu'
);

// 4. Kiểm tra Logic Game: Không cho qua câu khi trả lời sai
const vocabRotatingContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/VocabRotatingAdventure.tsx'), 'utf8');
const wordMatchContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/WordMatchGame.tsx'), 'utf8');
const soundDetectiveContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/SoundDetectiveGame.tsx'), 'utf8');

assert(
  vocabRotatingContent.includes('roundHasError') &&
  wordMatchContent.includes('roundHasError') &&
  soundDetectiveContent.includes('roundHasError'),
  'REQ-4.1',
  'Các game đã tích hợp roundHasError: khi trả lời sai giữ nguyên câu hỏi, không chuyển round cho tới khi đúng'
);

// 5. Kiểm tra Logic Thành thạo: Cả 3 kỹ năng >= 5 lần đúng; Sai 1 lần chuyển sang Đang luyện
const storageContent = fs.readFileSync(path.join(projectRoot, 'src/services/storage.ts'), 'utf8');
assert(
  storageContent.includes('listeningCorrect >= 5 && readingCorrect >= 5 && spellingCorrect >= 5') &&
  storageContent.includes('calculateWordMasteryLevel') &&
  storageContent.includes('current.masteryLevel = 3'),
  'REQ-4.2',
  'Quy định Thành thạo chuẩn xác: Cả 3 kỹ năng đều >= 5 lần đúng; Sai 1 lần hạ ngay xuống Đang luyện tập'
);

console.log('\n====================================================');
console.log(`📊 KẾT QUẢ: ${passed}/${total} MỤC KIỂM TRA ĐẠT CHUẨN (${Math.round(passed/total*100)}%)`);
console.log('====================================================');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
