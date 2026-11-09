# 🤝 SỔ TAY TRI THỨC BỀN VỮNG & BIÊN BẢN BÀN GIAO DỰ ÁN VIBEKIDS ENGLISH
**Dự án**: VibeKids English (Web & iOS/iPad PWA & Mobile Native)  
**Cơ quan quản trị**: Chief Memory & Operational Knowledge Officer (Chief Secretary / CKO)  
**Thời gian thiết lập**: 2026-11-10  
**Tình trạng hiện hành**: 🟢 Production Live & Clean Working Tree  
**Địa chỉ trực tuyến (Live)**: [https://santabu107052.github.io/vibekids-english/](https://santabu107052.github.io/vibekids-english/)

---

## 1. NGUYÊN TẮC VẬN HÀNH BẮT BUỘC (CORE OPERATIONAL DIRECTIVES)

### 1.1. Nguyên tắc Không Gánh Nặng Thủ Công (Zero Manual Burden & Agent-First Automation)
- **Tự động hóa tuyệt đối**: Mọi thao tác lập trình, build, test, refactor, dọn dẹp, cấu hình hệ thống, sửa lỗi và triển khai phải do Agent chủ động thực thi 100% bằng công cụ của hệ thống.
- **Không đùn đẩy cho người dùng**: Tuyệt đối không bao giờ yêu cầu hoặc hướng dẫn người dùng tự mở terminal, copy/paste lệnh hay thao tác thủ công.
- **Phương án duyệt sẵn**: Khi gặp thao tác đòi hỏi quyền hạn đặc biệt, phê duyệt chiến lược hoặc lựa chọn kinh doanh, Agent phải chuẩn bị sẵn phương án tối ưu nhất, trình bày ngắn gọn và báo người dùng **duyệt/xác nhận**.

### 1.2. Nguyên tắc Không Đoán Mò & Không Bịa Đặt (Zero Guesswork & Zero Hallucination)
- Mọi dữ liệu, thông số, API, thư viện, trạng thái tệp phải được kiểm chứng bằng công cụ thực tế (`read`, `grep`, `bash`, `qc_inspect.py`, `secretary_helper.py`).
- Nếu có bất kỳ điều gì chưa rõ ràng hoặc thiếu dữ kiện: **BẮT BUỘC PHẢI HỎI LẠI NGƯỜI DÙNG** (1–3 câu ngắn gọn kèm giả định hợp lý nhất để duyệt nhanh). Tuyệt đối không tự suy diễn sai lệch.

### 1.3. Quy trình Đồng Bộ Kép Triển Khai (Dual-Sync Deployment Protocol)
Mỗi khi hoàn tất chỉnh sửa code trong thư mục `english-for-kids/`:
1. **Bước 1 - Đồng bộ Mã Nguồn (GitHub Repository)**:
   ```bash
   git add . && git commit -m "..." && git push origin main
   ```
2. **Bước 2 - Đồng bộ Bản Phát Hành Web Live (GitHub Pages)**:
   ```bash
   pnpm run deploy
   ```
   *(Lệnh này tự động biên dịch TypeScript `tsc -b`, build Vite `vite build`, nhân bản `dist/index.html` thành `dist/404.html` để phục vụ SPA trên GitHub Pages, và đẩy lên nhánh `gh-pages`)*.

---

## 2. KIẾN TRÚC KỸ THUẬT TOÀN DIỆN (SYSTEM ARCHITECTURE)

| Phân hệ | Công nghệ / Giải pháp | Chi tiết kỹ thuật & Vai trò |
|---|---|---|
| **Core Framework** | React 19.3.1 + TypeScript 7.0.2 | Kiến trúc SPA hiện đại, kiểm soát kiểu dữ liệu nghiêm ngặt không `any`. |
| **Bundler & Build** | Vite 8.3.6 + Rolldown | Tối ưu hóa `manualChunks`, tách riêng `vendor-react` và `vendor-ui`. |
| **Styling** | Tailwind CSS v4.3.5 | Tiện ích CSS tinh gọn, tối ưu hiệu ứng chuyển động và tương phản WCAG 2.1. |
| **Mobile Native** | Capacitor 8.6.0 (iOS & Android) | Lớp vỏ Native sẵn sàng xuất bản App Store / Google Play (`capacitor.config.json`). |
| **PWA Standalone** | Web App Manifest + Service Worker | Chạy tràn màn hình trên iPad/iPhone khi "Thêm vào MH chính" (Fix BUG-37: `start_url: "./"`). |
| **Quảng cáo & Thu phí** | `@capacitor-community/admob` | Cấu hình AdMob tuân thủ COPPA (an toàn cho trẻ nhỏ), banner & interstitial. |
| **Âm thanh Phát âm** | Youdao Audio Stream | `https://dict.youdao.com/dictvoice?type=0&audio={word}` + `<meta name="referrer" content="no-referrer">` (khắc phục chặn CORS/Referrer trên iOS Safari). |
| **Âm thanh Tương tác** | Web Audio API SFX Synthesizer | Bộ phát âm thanh tự tạo (`soundManager`): Ting (Đô-Mi-Sol khi đúng), Buzz nhẹ (khi sai), Fanfare (khi hoàn thành). Không phụ thuộc asset ngoài. |
| **Ghi âm Giọng Bé** | MediaRecorder API | Component `EchoVoiceRecorder.tsx`: Bé thu âm giọng nhại lại và phát đối chiếu song song với giọng bản ngữ Mỹ. |
| **Phân tích Năng lực** | SVG Radar Chart | Component `SkillsRadarCard.tsx`: Trực quan hóa 4 kỹ năng (Nghe, Đọc, Chính tả, Mẫu câu) dựa trên dữ liệu học tập thực tế. |

---

## 3. TÀI NGUYÊN SƯ PHẠM ĐÃ CHUẨN HÓA (PEDAGOGICAL ASSETS)

### 3.1. Ngân Hàng 301 Từ Vựng Chuẩn Quốc Tế
- **26 từ vựng cốt lõi khởi tạo (`curatedWords.ts`)**: Nạp sẵn tự động ngay khi phụ huynh tạo hồ sơ bé mới (chủ đề gần gũi: động vật, đồ dùng, thiên nhiên).
- **275 từ vựng mở rộng khuyến nghị (`recommendedWords.ts`)**:
  - **Nhóm 6–8 tuổi (Pre-A1/A1 Starter)**: Từ vựng đơn giản, phát âm cơ bản, hình ảnh trực quan.
  - **Nhóm 9–11 tuổi (A1/A2 Mover)**: Mở rộng từ vựng trường lớp, sinh hoạt, mô tả tính chất.
  - **Nhóm 12–15 tuổi (A2/B1 Flyer)**: Từ vựng nâng cao, trừu tượng, tư duy giao tiếp mở rộng.
- **Tính năng mở rộng**: Tích hợp Free Dictionary API tự động lấy phiên âm IPA, nghĩa tiếng Việt, câu ví dụ khi phụ huynh tra cứu thêm từ mới; cơ chế kiểm tra lọc trùng `existingWordSet` (BUG-32).

### 3.2. Ngân Hàng 145 Mẫu Câu & Động Cơ Ngữ Pháp (`sentencePatterns.ts`)
- **145 Templates mẫu câu**: Bao phủ 7 từ loại (*Noun, Verb, Adjective, Adverb, Preposition, Pronoun, Determiner*) chia theo 3 cấp độ tuổi.
- **Cơ chế Chống Lặp (Anti-Repetition Engine - BUG-16)**: Hàng đợi xáo trộn tự động, đảm bảo dùng hết toàn bộ ngân hàng câu trước khi lặp lại.
- **Xử lý Mạo Từ Tự Động (Article Processor - BUG-18)**: Tự động đổi mạo từ `a` thành `an` khi danh từ bắt đầu bằng nguyên âm (*u, e, o, a, i*), tránh lỗi "a apple".

### 3.3. Bộ 8 Trò Chơi & Chế Độ Phiêu Lưu Toàn Diện
1. 🃏 **Memory Flip Game (`MemoryFlipGame.tsx`)**: Lật thẻ ghép đôi từ vựng và nghĩa/phiên âm, rèn luyện trí nhớ thị giác.
2. 🎈 **Word Match Game (`WordMatchGame.tsx`)**: Bong bóng bắt từ, rèn luyện phản xạ nhanh nối từ tiếng Anh với nghĩa tiếng Việt.
3. 🚂 **Word Scramble Game (`WordScrambleGame.tsx`)**: Xếp chữ cái xáo trộn thành từ vựng hoàn chỉnh, rèn trật tự chính tả.
4. 🕵️ **Sound Detective Game (`SoundDetectiveGame.tsx`)**: Thám tử nghe âm thanh chuẩn phát âm, chọn nghĩa tiếng Việt chính xác.
5. 🐝 **Spelling Bee Game (`SpellingBeeGame.tsx`)**: Thử thách gõ chính tả hoàn chỉnh từ vựng từ gợi ý âm thanh/nghĩa.
6. 🔄 **Vocab Rotating Adventure (`VocabRotatingAdventure.tsx`)**: Chế độ phiêu lưu luân phiên đổi trò chơi sau **mỗi câu hỏi** (Memory Flip ➔ Bubble Match ➔ Sound Detective ➔ Scramble ➔ Spelling), kích thích trí tò mò không gây nhàm chán.
7. 🏗️ **Sentence Builder Game (`SentenceBuilderGame.tsx`)**: Xếp các mảnh ghép từ thành câu hoàn chỉnh theo ngữ pháp.
8. 🚀 **Sentence Rotating Adventure (`SentenceRotatingAdventure.tsx`)**: Phiêu lưu mẫu câu luân phiên đa dạng cấp độ.

### 3.4. Cơ Chế Điều Khiển Vòng Chơi (Game Setup & Accuracy Guard)
- **Hộp thoại Tùy biến (`GameSetupModal.tsx`)**:
  - Chọn Chế độ: Ôn từ cũ / Học từ mới / Kết hợp cả hai.
  - Chọn Số câu hỏi: 10 câu, 15 câu, 20 câu, hoặc **Vô Tận (∞)**.
- **Chế độ Vô Tận (BUG-39)**: Không bị chặn ở câu thứ 10; hiển thị `Câu X/∞`; xoay vòng ngân hàng từ; chỉ kết thúc khi bé bấm "Thoát Game".
- **Đo lường Độ chính xác Thực tế (BUG-40)**: Khi thoát game sớm, mẫu số tính tỷ lệ chính xác `%` căn cứ trên **tổng số câu đã thực sự trả lời** (`totalAttempted = correctCount + wrongCount`), không tính câu đang mở dở.

---

## 4. LỊCH SỬ GIÁM ĐỊNH LỖI TOÀN DIỆN (BUG-01 ĐẾN BUG-41)

| Mã Lỗi | Hạng mục / Phân hệ | Mức độ | Nguyên nhân cốt lõi | Giải pháp khắc phục triệt để | Trạng thái |
|:---:|:---|:---:|:---|:---|:---:|
| **BUG-01** | Game Lật Thẻ | Major | Xung đột hàng đợi audio khi lật nhanh | Chuyển sang Google TTS (sau này là Youdao), thêm Sequence Guard | 🟢 ĐÃ SỬA |
| **BUG-02** | Thống kê Tiến độ | Major | Bố cục CSS bị đẩy xuống dưới | Đưa danh sách từ vựng lên dưới 4 thẻ thống kê | 🟢 ĐÃ SỬA |
| **BUG-03** | Thêm Từ Vựng | Minor | Lặp câu ví dụ mặc định | Bổ sung vòng lặp quét `definitions.example` đa tầng | 🟢 ĐÃ SỬA |
| **BUG-04** | Quản lý Từ Vựng | Major | Dọn dẹp thiếu `wordProgressMap` khi xoá từ | Viết lại hàm `deleteCustomWord` dọn sạch ID mồ côi | 🟢 ĐÃ SỬA |
| **BUG-05** | Trang Chủ | Critical | Script thế code lệch làm mất mini-game | Khôi phục trọn vẹn Learning Suite & routing | 🟢 ĐÃ SỬA |
| **BUG-06** | Dịch Nghĩa | Major | Lỗi CORS khi gọi dịch trực tiếp | Tích hợp từ điển nội bộ & fallback Google Translate | 🟢 ĐÃ SỬA |
| **BUG-07** | Kết Nối Web | Critical | Server phụ thuộc tiến trình agent tắt | Chuyển sang static deploy độc lập | 🟢 ĐÃ SỬA |
| **BUG-08** | Mini-Game Loop | Major | Lặp từ do thiếu hàng đợi queue | Áp dụng thuật toán Fisher-Yates xáo trộn toàn cục | 🟢 ĐÃ SỬA |
| **BUG-09** | UX Trắc Nghiệm | Minor | Emoji trong đáp án gây đoán mò | Gỡ toàn bộ icon/emoji khỏi phương án đáp án | 🟢 ĐÃ SỬA |
| **BUG-10** | UX Câu Hỏi | Minor | Thẻ câu hỏi chứa hình gợi ý | Gỡ icon khỏi thẻ câu hỏi, tập trung mặt chữ & IPA | 🟢 ĐÃ SỬA |
| **BUG-11** | Game Thám Tử | Minor | Nút đáp án hiển thị tiếng Anh | Đổi sang hiển thị `meaningVi`, chỉ đối chiếu sau khi chọn | 🟢 ĐÃ SỬA |
| **BUG-12** | Game Mẫu Câu | Major | Từ vựng lạ/nghĩa sai từ từ điển thô | Dùng Pattern Library chuyên dụng cho trẻ em | 🟢 ĐÃ SỬA |
| **BUG-13** | Logic Mẫu Câu | Critical | Bất đồng bộ `Math.random()` giữa các render | Lưu cố định `currentSentence` cho từng ván chơi | 🟢 ĐÃ SỬA |
| **BUG-14** | Hiển Thị Nghĩa | Minor | Font size tiếng Việt bị tràn viền card | Thêm `truncate` và dynamic font scaling theo độ dài chữ | 🟢 ĐÃ SỬA |
| **BUG-15** | Nhập Ký Tự | Minor | Bàn phím ảo trên mobile bị che nút nộp | Thêm scroll padding và fixed action container | 🟢 ĐÃ SỬA |
| **BUG-16** | Tần Suất Mẫu Câu | Major | Chọn ngẫu nhiên gây trùng mẫu câu liên tục | Xây dựng Anti-Repetition Engine dùng hết 140+ mẫu câu mới lặp | 🟢 ĐÃ SỬA |
| **BUG-17** | Trạng Thái Sao | Minor | Reset sao khi reload trang | Chuẩn hóa sync `localStorage` ngay khi cộng sao | 🟢 ĐÃ SỬA |
| **BUG-18** | Mạo Từ Tiếng Anh | Major | Lỗi ngữ pháp "a apple", "a elephant" | Xây dựng Article Processor tự động chuyển `a` -> `an` theo nguyên âm | 🟢 ĐÃ SỬA |
| **BUG-19** | Animation Lật Thẻ | Minor | Thẻ bị kẹt trạng thái xoay khi bấm nhanh | Thêm throttle click và CSS `pointer-events-none` trong lúc xoay | 🟢 ĐÃ SỬA |
| **BUG-20** | Phân Loại Mục | Enhancement | Gom chung Từ vựng và Mẫu câu | Tách 2 vương quốc riêng: Từ vựng (6 game) và Mẫu câu (2 game) | 🟢 ĐÃ SỬA |
| **BUG-21** | Đổi Hồ Sơ Bé | Major | State từ vựng không re-render khi đổi profile | Đưa Profile context/hook vào dependency của các danh sách từ | 🟢 ĐÃ SỬA |
| **BUG-22** | Modal Sao Lưu | Minor | Thiếu nút copy nhanh mã JSON | Bổ sung nút Copy Clipboard kèm thông báo Toast phản hồi | 🟢 ĐÃ SỬA |
| **BUG-23** | Sổ Tay Từ Vựng | Critical | Script ghi đè làm mất component Sổ tay | Khôi phục 100% Component Sổ Tay Từ Vựng và bộ lọc độ tuổi | 🟢 ĐÃ SỬA |
| **BUG-24** | Âm Lượng Phát Âm | Minor | Âm lượng không đồng đều giữa các từ | Chuẩn hóa Web Audio gain node / volume mức 1.0 cố định | 🟢 ĐÃ SỬA |
| **BUG-25** | Thanh Tiến Độ | Minor | Tiến độ % nhảy vượt quá 100% | Giới hạn `Math.min(100, Math.max(0, percentage))` | 🟢 ĐÃ SỬA |
| **BUG-26** | Nút Bấm Không Phản Hồi | Critical | Nút gán hàm rỗng `() => {}` sau khi refactor | Khôi phục 100% Game Router và kết nối Modal chức năng | 🟢 ĐÃ SỬA |
| **BUG-27** | Khuyết Thiếu Tổng Quan | Critical | Mất 4 ô thống kê và danh sách chi tiết | Khôi phục vĩnh viễn: 4 ô thống kê + Sổ tay chi tiết | 🟢 ĐÃ SỬA |
| **BUG-28** | Luân Phiên Game | Major | Game chỉ đổi sau cả ván chơi dài | Xây dựng `VocabRotatingAdventure`: Đổi game sau MỖI CÂU HỎI | 🟢 ĐÃ SỬA |
| **BUG-29** | Lỗi Trắng Màn Hình | Critical | Bấm mục Mẫu câu trang trắng do pool rỗng | Thêm cơ chế fallback bảo vệ kép + `SentenceRotatingAdventure` | 🟢 ĐÃ SỬA |
| **BUG-30** | Lệch Mục Tiêu Hôm Nay | Major | Hiển thị 2/10 từ dù chưa học do seed tĩnh | Hàm tính động `getTodayPracticedWordsCount` theo `lastReviewed` | 🟢 ĐÃ SỬA |
| **BUG-31** | Thiếu Từ Khuyến Nghị | Enhancement | Thiếu ngân hàng từ chuẩn theo độ tuổi | Bổ sung ngân hàng 150+ từ, nút nạp tự động, lọc trùng | 🟢 ĐÃ SỬA |
| **BUG-32** | Trùng Lặp Từ Vựng | Major | Cho phép thêm lại từ đã có sẵn trong kho | Thêm cơ chế kiểm tra `existingWordSet` chuẩn hóa lowercase | 🟢 ĐÃ SỬA |
| **BUG-33** | Lỗi Loa Audio (iOS) | Critical | Server Google TTS chặn domain lạ trên Safari | Chuyển sang Youdao Audio Stream + Meta No-Referrer | 🟢 ĐÃ SỬA |
| **BUG-34** | Thư Viện Từ Bị Rút Gọn | Major | Hiển thị 2 từ do xung đột build thử nghiệm | Khôi phục 105+ từ vựng chuẩn quốc tế | 🟢 ĐÃ SỬA |
| **BUG-35** | Thiếu Game Lật Thẻ | Major | Thiếu game Memory Flip trong menu chính | Tích hợp game Memory Flip, mở rộng kho 275+ từ vựng | 🟢 ĐÃ SỬA |
| **BUG-36** | Đóng Gói Mobile | Enhancement | Chưa có native layer để đóng gói app | Cấu hình Capacitor 8, tích hợp AdMob, tài liệu phát hành | 🟢 ĐÃ SỬA |
| **BUG-37** | Lỗi 404 Màn Hình Chính | Critical (PWA) | `start_url: "/"` trỏ sai subfolder GitHub Pages | Chuẩn hóa `start_url: "./"`, tạo `dist/404.html` tự động nhân bản | 🟢 ĐÃ SỬA & LIVE |
| **BUG-38** | Thiếu Setup Modal | Major (UX) | Vào game chơi ngay không được chọn chế độ | Thiết kế `GameSetupModal.tsx`: chọn chế độ và số lượng câu (10, 15, 20, Vô Tận) | 🟢 ĐÃ SỬA & LIVE |
| **BUG-39** | Vô Tận Bị Dừng Ở Câu 10 | Critical (Logic) | `totalRounds` bị trần ở độ dài mảng từ ban đầu | Thiết lập cờ `isInfinite = questionCount >= 9000`, hiển thị `Câu X/∞` | 🟢 ĐÃ SỬA & LIVE |
| **BUG-40** | Lệch % Chính Xác Khi Thoát | Major (Math) | Lấy mẫu số cả câu chưa trả lời khi thoát sớm | Chuẩn hóa mẫu số: chỉ tính các câu đã thực sự trả lời `totalAttempted` | 🟢 ĐÃ SỬA & LIVE |
| **BUG-41** | Nâng Cấp Đột Phá Toàn Diện | Enhancement | Thiếu âm thanh SFX, bản đồ radar, thu âm | Web Audio SFX Synthesizer, Echo Voice Recorder, Skills Radar Card, nạp 20 từ | 🟢 ĐÃ SỬA & LIVE |

---

## 5. BẢN TIẾP SỨC BỐI CẢNH TINH GỌN THEO VAI TRÒ (JUST-IN-TIME BRIEFINGS)

### 💻 Dành cho Principal Dev Engineer (`principal-dev`)
- **Vị trí làm việc**: `english-for-kids/src/`
- **Tình trạng mã nguồn**: Working tree sạch sẽ, nhánh `main` khớp `origin/main`.
- **Cấu trúc trọng yếu**:
  - `App.tsx`: Hiện đang chứa State điều phối chính, thanh Navbar, các tab, modal và bộ chọn game. Khi refactor module hóa, cần giữ vững tính tương thích ngược và không làm gãy router.
  - `services/`: `storage.ts` (LocalStorage CRUD cho Profiles & Word Progress), `soundEffects.ts` (Web Audio API Synthesizer), `sentencePatterns.ts` (145 mẫu câu).
  - `components/games/`: 8 game components. Đảm bảo tất cả đều nhận `onExit`, `isInfinite`, tính đúng `totalAttempted`.
- **Quy tắc vàng**: Không cài thêm thư viện npm lạ nếu không cần thiết; sau khi sửa code phải test build `pnpm run build` không lỗi trước khi commit; tuân thủ quy trình đồng bộ kép.

### ⚖️ Dành cho Omni-QC Lead (`omni-qc-lead`)
- **Tài liệu kiểm định**: `QC-AUDIT-DEFECT-LOG.md`
- **Tiêu chuẩn nghiệm thu**: Thang điểm 100/100; tuân thủ Exhaustive Remediation Protocol (khắc phục triệt để, không để người dùng chỉ lỗi lại).
- **Trọng tâm kiểm tra**:
  - Kiểm thử hồi quy không tái phát từ BUG-01 đến BUG-41.
  - Đảm bảo âm thanh phát mượt mà trên iOS Safari (không dính lỗi CORS/Referrer).
  - Đảm bảo chế độ Vô Tận chạy liên tục qua câu 10, hiển thị `Câu X/∞`.
  - Tính chính xác tỷ lệ `%` khi thoát game sớm.

### 🛠️ Dành cho Maintenance & Performance Architect (`maintenance-architect`)
- **Mục tiêu giám sát**:
  - Tối ưu hóa kích thước build: Rolldown chunks (`vendor-react`, `vendor-ui`).
  - Kiểm tra tính toàn vẹn của thư mục Native: `english-for-kids/ios` và `english-for-kids/android`.
  - Theo dõi dung lượng LocalStorage lưu trữ hồ sơ và tiến độ học tập của các bé, đảm bảo không bị tràn dữ liệu.
  - Bảo đảm file `dist/404.html` luôn hiện diện sau mỗi đợt deploy để bảo vệ định tuyến SPA trên GitHub Pages.

### 🎯 Dành cho Team Lead (`lead`)
- **Hiện trạng tổng quát**: Toàn bộ hệ thống VibeKids English đã hoàn thiện ổn định, đang vận hành mượt mà trên môi trường Web Live.
- **Tiến độ Task**:
  - Task 1 (Sổ tay tri thức & Bàn giao): Đã hoàn thành 100%, đồng bộ đầy đủ vào `english-for-kids/HANDOVER.md`, root `HANDOVER.md` và `MEMORY.md`.
  - Sẵn sàng cung cấp bối cảnh cho các Agent kế tiếp thực thi Task 2 (Dev), Task 3 (Maintenance), Task 4 (QC).
