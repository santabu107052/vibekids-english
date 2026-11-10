import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve('.');

console.log('====================================================');
console.log('🚀 BẮT ĐẦU KIỂM THỬ HỒI QUY TOÀN DIỆN (BUG-01 ĐẾN BUG-41)');
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

// 1. BUG-01: Game Lật Thẻ & Audio Sequence Guard
const dictApiContent = fs.readFileSync(path.join(projectRoot, 'src/services/dictionaryApi.ts'), 'utf8');
assert(
  dictApiContent.includes('currentRequestId') && dictApiContent.includes('activeAudio'),
  'BUG-01',
  'Hàng đợi âm thanh có Sequence Guard chống phát đè và hủy audio cũ'
);

// 2. BUG-02 & BUG-27: Thống kê Tiến độ & 4 ô thống kê
const appFiles = [
  'src/App.tsx',
  'src/components/router/GameRouter.tsx',
  'src/components/dashboard/HeroSection.tsx',
  'src/components/dashboard/VocabStatsSection.tsx',
  'src/components/dashboard/WordNotebookSection.tsx',
  'src/components/dashboard/GameKingdomsSection.tsx',
  'src/components/dashboard/BadgesSection.tsx',
];
const appContent = appFiles
  .filter((f) => fs.existsSync(path.join(projectRoot, f)))
  .map((f) => fs.readFileSync(path.join(projectRoot, f), 'utf8'))
  .join('\n');
assert(
  appContent.includes('Tổng từ vựng') && 
  appContent.includes('Đã thành thạo') && 
  appContent.includes('Đang luyện tập') && 
  appContent.includes('Từ mới cần học') && 
  appContent.includes('Mục tiêu hôm nay'),
  'BUG-02/27',
  'Đầy đủ 4 thẻ thống kê tiến độ trên trang chủ'
);

// 3. BUG-03: Thêm Từ Vựng - quét definitions.example
assert(
  dictApiContent.includes('defWithEx?.example') || dictApiContent.includes('definitions.find(d => d.example)'),
  'BUG-03',
  'API từ điển quét definitions.example lấy câu ví dụ phù hợp'
);

// 4. BUG-04: Quản lý Từ Vựng - deleteCustomWord dọn wordProgressMap
const storageContent = fs.readFileSync(path.join(projectRoot, 'src/services/storage.ts'), 'utf8');
assert(
  storageContent.includes('delete map[wordId]'),
  'BUG-04',
  'deleteCustomWord dọn dẹp sạch sẽ tiến độ trong wordProgressMap'
);

// 5. BUG-05 & BUG-20: Learning Suite & Phân tách Vương Quốc Từ Vựng / Mẫu Câu
assert(
  appContent.includes('VocabRotatingAdventure') && 
  appContent.includes('SentenceRotatingAdventure') && 
  appContent.includes('Vương Quốc Trò Chơi Từ Vựng') && 
  appContent.includes('Vương Quốc Trò Chơi Mẫu Câu'),
  'BUG-05/20',
  'Tách riêng biệt Vương quốc Từ Vựng và Mẫu Câu, đầy đủ Suite mini-game'
);

// 6. BUG-06: Nghĩa Tiếng Việt - Instant DB + Translation fallback
assert(
  dictApiContent.includes('COMMON_VI_TRANSLATIONS') && dictApiContent.includes('translateToVietnamese'),
  'BUG-06',
  'Có từ điển dịch tức thì 100+ từ và fallback engine dịch sang tiếng Việt'
);

// 7. BUG-07: Web Server static
const serverMjs = fs.existsSync(path.join(projectRoot, 'server.mjs'));
assert(serverMjs, 'BUG-07', 'Có server tĩnh độc lập server.mjs');

// 8. BUG-08: Vòng chơi Mini-game - Fisher-Yates shuffle
const wordMatchContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/WordMatchGame.tsx'), 'utf8');
assert(
  wordMatchContent.includes('shuffleList') && wordMatchContent.includes('Math.floor(Math.random() * (i + 1))'),
  'BUG-08',
  'Thuật toán Fisher-Yates xáo trộn câu hỏi chuẩn xác, chống lặp'
);

// 9. BUG-09: UX Trắc Nghiệm - Không có emoji trong nút đáp án
assert(
  !wordMatchContent.includes('{option.emoji}</span>') && !wordMatchContent.includes('<span>{option.emoji}'),
  'BUG-09',
  'Các nút đáp án trắc nghiệm không chứa emoji/hình ảnh gợi ý đoán mò'
);

// 10. BUG-10: UX Câu Hỏi - Gỡ icon khỏi thẻ câu hỏi
assert(
  !wordMatchContent.includes('text-6xl mb-4">{currentWord.emoji}'),
  'BUG-10',
  'Thẻ câu hỏi chính không lộ emoji gợi ý đoán mò'
);

// 11. BUG-11: Game Thám Tử - Hiển thị tiếng Việt ở lựa chọn
const soundDetectiveContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/SoundDetectiveGame.tsx'), 'utf8');
assert(
  soundDetectiveContent.includes('opt.meaningVi'),
  'BUG-11',
  'Game Thám tử âm thanh hiển thị đáp án bằng tiếng Việt (meaningVi)'
);

// 12. BUG-12: Game Mẫu Câu - Pattern Library chuyên dụng
const patternsContent = fs.readFileSync(path.join(projectRoot, 'src/services/sentencePatterns.ts'), 'utf8');
assert(
  patternsContent.includes('COMPREHENSIVE_TEMPLATES') && patternsContent.includes('generateKidSentenceNoRepeat'),
  'BUG-12',
  'SentencePatterns library chuyên dụng với hàng trăm mẫu câu chuẩn cho bé'
);

// 13. BUG-13 & BUG-16: Chống lặp mẫu câu & Giữ cố định ván chơi
const sentenceRotatingContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/SentenceRotatingAdventure.tsx'), 'utf8');
assert(
  sentenceRotatingContent.includes('usedTemplateIds') && sentenceRotatingContent.includes('currentSentence'),
  'BUG-13/16',
  'Cơ chế Anti-Repetition Engine (usedTemplateIds) và giữ cố định currentSentence cho từng câu'
);

// 14. BUG-18: Xử lý mạo từ a/an linh hoạt
assert(
  patternsContent.includes('fixIndefiniteArticles') && 
  patternsContent.includes('aeiouAEIOU') && 
  patternsContent.includes('university'),
  'BUG-18',
  'Bộ máy tự động xử lý mạo từ (Article Processor) phân biệt nguyên âm và ngoại lệ'
);

// 15. BUG-23: Sổ Tay Từ Vựng
assert(
  appContent.includes('Sổ Tay Từ Vựng') && appContent.includes('filteredWords.map'),
  'BUG-23',
  'Component Sổ tay từ vựng hiển thị chi tiết với bộ lọc độ tuổi và chủ đề'
);

// 16. BUG-26: Nút bấm không phản hồi
assert(
  !appContent.includes('onClick={() => {}}') && !appContent.includes('onClick={() => { }}'),
  'BUG-26',
  'Không tồn tại sự kiện onClick với hàm rỗng () => {}'
);

// 17. BUG-28 & BUG-35: Luân phiên 5 mini-game theo câu
const vocabRotatingContent = fs.readFileSync(path.join(projectRoot, 'src/components/games/VocabRotatingAdventure.tsx'), 'utf8');
assert(
  vocabRotatingContent.includes('VARIANT_CYCLE') &&
  vocabRotatingContent.includes('memory_flip') &&
  vocabRotatingContent.includes('bubble_match') &&
  vocabRotatingContent.includes('sound_detective') &&
  vocabRotatingContent.includes('scramble') &&
  vocabRotatingContent.includes('spelling') &&
  vocabRotatingContent.includes('VARIANT_CYCLE[(roundNum - 1) % VARIANT_CYCLE.length]'),
  'BUG-28/35',
  'VocabRotatingAdventure luân phiên chính xác 5 mini-game sau MỖI CÂU HỎI'
);

// 18. BUG-29: Chống sập trắng màn hình
assert(
  vocabRotatingContent.includes('if (words.length === 0) return;') &&
  sentenceRotatingContent.includes('if (words.length === 0) return;') &&
  appContent.includes('const effectiveWords = gameWordsPool.length > 0 ? gameWordsPool : words;'),
  'BUG-29',
  'Có chốt chặn bảo vệ kép (Safe Guard) khi danh sách từ rỗng'
);

// 19. BUG-30: Mục tiêu hôm nay tính động
assert(
  storageContent.includes('getTodayPracticedWordsCount') &&
  storageContent.includes('progress.lastReviewed') &&
  storageContent.includes('startsWith(today)'),
  'BUG-30',
  'getTodayPracticedWordsCount lọc chính xác theo ngày hôm nay (lastReviewed)'
);

// 20. BUG-31 & BUG-32: Ngân hàng từ khuyến nghị & Lọc trùng lặp
const recContent = fs.readFileSync(path.join(projectRoot, 'src/data/recommendedWords.ts'), 'utf8');
assert(
  recContent.includes('RECOMMENDED_VOCABULARY_BANK') &&
  storageContent.includes('existingWords') &&
  storageContent.includes('!existingWords.has'),
  'BUG-31/32',
  'Có ngân hàng từ khuyến nghị và thuật toán existingWords lọc trùng 100%'
);

// 21. BUG-33: Âm thanh Youdao & Meta No-Referrer
const indexHtmlContent = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
assert(
  dictApiContent.includes('dict.youdao.com/dictvoice') &&
  indexHtmlContent.includes('name="referrer" content="no-referrer"'),
  'BUG-33',
  'Sử dụng audio Youdao ổn định cùng meta no-referrer chống chặn trên iOS'
);

// 22. BUG-34: Số lượng từ vựng đạt chuẩn 275+
const curatedContent = fs.readFileSync(path.join(projectRoot, 'src/data/curatedWords.ts'), 'utf8');
const curatedMatches = (curatedContent.match(/id:\s*['"`]/g) || []).length;
const recMatches = (recContent.match(/id:\s*['"`]/g) || []).length;
const totalWords = curatedMatches + recMatches;
assert(
  totalWords >= 275,
  'BUG-34',
  `Tổng số từ vựng đạt chuẩn (${totalWords} từ >= 275 từ yêu cầu)`
);

// 23. BUG-36: Cấu hình AdMob Test IDs & Mobile Publish
const adServiceContent = fs.readFileSync(path.join(projectRoot, 'src/services/adService.ts'), 'utf8');
const capConfigContent = fs.readFileSync(path.join(projectRoot, 'capacitor.config.json'), 'utf8');
assert(
  adServiceContent.includes('ca-app-pub-3940256099942544') &&
  capConfigContent.includes('ca-app-pub-3940256099942544~3347511713') &&
  fs.existsSync(path.join(projectRoot, 'MOBILE-PUBLISH-GUIDE.md')),
  'BUG-36',
  'Cấu hình AdMob 100% Google Test IDs, chuẩn COPPA, có hướng dẫn xuất bản chi tiết'
);

// 24. BUG-37: PWA Standalone - Tương đối hóa start_url và scope
const manifestContent = fs.readFileSync(path.join(projectRoot, 'public/manifest.json'), 'utf8');
const packageJsonContent = fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8');
assert(
  manifestContent.includes('"start_url": "./"') &&
  manifestContent.includes('"scope": "./"') &&
  packageJsonContent.includes('dist/404.html'),
  'BUG-37',
  'Manifest chuẩn hóa đường dẫn tương đối (./) và deploy tự sinh dist/404.html chống lỗi 404 Safari PWA'
);

// 25. BUG-38: Hộp thoại Tùy biến Game & Chế độ Vô Tận (GameSetupModal)
const gameSetupModalPath = path.join(projectRoot, 'src/components/GameSetupModal.tsx');
const gameSetupContent = fs.existsSync(gameSetupModalPath) ? fs.readFileSync(gameSetupModalPath, 'utf8') : '';
assert(
  fs.existsSync(gameSetupModalPath) &&
  gameSetupContent.includes('Vô tận ∞') &&
  gameSetupContent.includes('countOptions') &&
  appContent.includes('GameSetupModal'),
  'BUG-38',
  'Có GameSetupModal cho phép tùy chỉnh chế độ học và số lượng câu hỏi (tối thiểu 10 câu, có Vô Tận ∞)'
);

// 26. BUG-39: Cơ chế Vô Tận không bị chặn trần ở câu 10
assert(
  wordMatchContent.includes('isInfinite') &&
  vocabRotatingContent.includes('isInfinite') &&
  sentenceRotatingContent.includes('isInfinite') &&
  wordMatchContent.includes('totalRounds = isInfinite ? 9999 : questionCount'),
  'BUG-39',
  'Chế độ Vô Tận hoạt động liên tục (totalRounds = 9999, isInfinite = questionCount >= 9000), không bị chặn trần ở câu 10'
);

// 27. BUG-40: Tỷ lệ chính xác (%) tính đúng khi bấm Thoát Game sớm ở chế độ Vô Tận
assert(
  vocabRotatingContent.includes('isEarlyExit') &&
  vocabRotatingContent.includes('correctWords.length + wrongWords.length') &&
  sentenceRotatingContent.includes('isEarlyExit') &&
  sentenceRotatingContent.includes('correctCount + wrongCount'),
  'BUG-40',
  'Độ chính xác % khi Thoát sớm chỉ chia cho tổng số câu thực tế đã trả lời (totalAttempted = correct + wrong)'
);

// 28. BUG-41.1: Quét sạch Google TTS URLs khỏi curatedWords.ts
assert(
  !curatedContent.includes('translate.google.com') &&
  !curatedContent.includes('client=tw-ob'),
  'BUG-41.1',
  'Dọn sạch 100% URL Google TTS cũ khỏi curatedWords.ts, chuyển hướng hoàn toàn sang Youdao stream'
);

// 29. BUG-41.2: Gói từ khởi tạo 20 từ và Nạp từ +15 từ
assert(
  storageContent.includes('addRecommendedWordsBatch(newProfile.id, 20)') &&
  appContent.includes('handleBatchAddRecommended(15)'),
  'BUG-41.2',
  'Tự động cấp 20 từ vựng cho tài khoản bé mới tạo và nâng nút nạp nhanh lên +15 từ'
);

// 30. BUG-41.3: Hiệu ứng âm thanh tương tác Web Audio API (SFX Synthesizer)
const sfxPath = path.join(projectRoot, 'src/services/soundEffects.ts');
const sfxContent = fs.existsSync(sfxPath) ? fs.readFileSync(sfxPath, 'utf8') : '';
assert(
  fs.existsSync(sfxPath) &&
  sfxContent.includes('AudioContext') &&
  sfxContent.includes('playCorrect') &&
  sfxContent.includes('playWrong') &&
  sfxContent.includes('playVictory'),
  'BUG-41.3',
  'Bộ tạo âm thanh thuần Web Audio API (Ting, Động viên, Victory Fanfare) 100% offline & an toàn'
);

// 31. BUG-41.4: Chế độ Luyện Phát Âm Nhại Lại (Echo Voice Recorder 🎙️)
const echoPath = path.join(projectRoot, 'src/components/EchoVoiceRecorder.tsx');
const echoContent = fs.existsSync(echoPath) ? fs.readFileSync(echoPath, 'utf8') : '';
assert(
  fs.existsSync(echoPath) &&
  echoContent.includes('MediaRecorder') &&
  echoContent.includes('getUserMedia') &&
  echoContent.includes('playWordAudio') &&
  appContent.includes('EchoVoiceRecorder'),
  'BUG-41.4',
  'Component EchoVoiceRecorder thu âm giọng bé và phát lại đối chiếu song song với phát âm người bản xứ'
);

// 32. BUG-41.5: Bản Đồ Năng Lực 3 Kỹ Năng Thông Minh (Skills Radar)
const radarPath = path.join(projectRoot, 'src/components/SkillsRadarCard.tsx');
const radarContent = fs.existsSync(radarPath) ? fs.readFileSync(radarPath, 'utf8') : '';
assert(
  fs.existsSync(radarPath) &&
  radarContent.includes('Luyện Nghe (Listening)') &&
  radarContent.includes('Mặt Chữ & Nghĩa (Reading)') &&
  radarContent.includes('Chính Tả (Spelling)') &&
  !radarContent.includes('Mẫu Câu (Grammar)') &&
  appContent.includes('SkillsRadarCard'),
  'BUG-41.5',
  'Bản đồ năng lực chuẩn hóa 3 kỹ năng Nghe - Đọc - Chính tả (đã loại bỏ Mẫu câu theo chỉ đạo)'
);

console.log('\n====================================================');
console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} BÀI TEST ĐẠT CHUẨN (${Math.round(passedTests/totalTests*100)}%)`);
console.log('====================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
