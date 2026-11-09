# 📋 BẢNG THEO DÕI & GIÁM ĐỊNH LỖI (OMNI-QC DEFECT LOG)
**Dự án**: VibeKids English (Web & iOS/iPad PWA)  
**Đơn vị phụ trách**: Omni-QC Lead & Principal Dev Engineer  
**Quy ước**: Tuân thủ nghiêm ngặt Giao thức Khắc phục Triệt để (Exhaustive Remediation Protocol).

## 1. Danh Sách Lỗi & Tình Trạng Khắc Phục (Defect Register)

| Mã Lỗi | Hạng mục / Vị trí | Mức độ | Vấn đề phát hiện | Nguyên nhân gốc rễ | Giải pháp khắc phục triệt để | Trạng thái |
|:---:|:---|:---:|:---|:---|:---|:---:|
| **BUG-01** | Game Lật Thẻ | **Major** | Lỗi âm thanh trễ/nhầm | Xung đột hàng đợi audio | Chuyển sang Google TTS, thêm Sequence Guard | 🟢 **ĐÃ SỬA** |
| **BUG-02** | Thống kê Tiến độ | **Major** | Giao diện layout sai | Bố cục CSS không tối ưu | Đưa danh sách từ vựng lên dưới 4 thẻ thống kê | 🟢 **ĐÃ SỬA** |
| **BUG-03** | Thêm Từ Vựng | **Minor** | Lặp câu ví dụ mặc định | Thiếu cơ chế duyệt tầng API | Bổ sung vòng lặp quét `definitions.example` | 🟢 **ĐÃ SỬA** |
| **BUG-04** | Quản lý Từ Vựng | **Major** | Không xóa được từ | Dọn dẹp thiếu `wordProgressMap` | Viết lại hàm `deleteCustomWord` | 🟢 **ĐÃ SỬA** |
| **BUG-05** | Giao diện Trang chủ | **Critical** | Mini-game biến mất | Script thay thế code bị lệch | Khôi phục trọn vẹn Learning Suite | 🟢 **ĐÃ SỬA** |
| **BUG-06** | Nghĩa Tiếng Việt | **Major** | Dịch sai/lỗi CORS | API dự phòng lỗi | Tích hợp từ điển nội bộ & Google Translation API | 🟢 **ĐÃ SỬA** |
| **BUG-07** | Kết Nối Web Server | **Critical** | `Can't connect` | Server phụ thuộc AI Agent | Chuyển sang server static độc lập (node `nohup`) | 🟢 **ĐÃ SỬA** |
| **BUG-08** | Vòng Chơi Mini-Game | **Major** | Lặp từ (pencil liên tục) | Thiếu hàng đợi (queue) | Dùng thuật toán Fisher-Yates xáo trộn toàn cục | 🟢 **ĐÃ SỬA** |
| **BUG-09** | UX Trắc Nghiệm | **Minor** | Có icon gây đoán mò | Đáp án kèm icon/emoji | Gỡ toàn bộ icon/emoji khỏi đáp án | 🟢 **ĐÃ SỬA** |
| **BUG-10** | UX Câu Hỏi | **Minor** | Icon gây đoán mò | Thẻ câu hỏi chứa emoji | Gỡ icon khỏi thẻ câu hỏi, tập trung chữ & IPA | 🟢 **ĐÃ SỬA** |
| **BUG-11** | Game Thám Tử | **Minor** | Đáp án là tiếng Anh | Nút đáp án hiển thị `opt.word` | Đổi sang hiển thị `meaningVi`, đối chiếu sau khi chọn | 🟢 **ĐÃ SỬA** |
| **BUG-12** | Game Mẫu Câu | **Major** | Từ vựng lạ/nghĩa sai | Lấy dữ liệu từ điển thô | Dùng Pattern Library chuyên dụng cho bé | 🟢 **ĐÃ SỬA** |
| **BUG-13** | Logic & UX Mẫu Câu | **Critical** | Sai logic đề bài, lỗi dịch | Bất đồng bộ Math.random() | Lưu cố định `currentSentence` cho 1 ván | 🟢 **ĐÃ SỬA** |
| **BUG-16** | Lặp lại mẫu câu quá nhiều | **Major** | Lặp lại mẫu câu sau vài câu | Chọn ngẫu nhiên (`Math.random()`) xác suất cao | Cơ chế Chống lặp (Anti-Repetition Engine) dùng hết 140+ mẫu câu mới lặp | 🟢 **ĐÃ SỬA** |
| **BUG-18** | Lỗi mạo từ "a/an" | **Major** | Sai mạo từ "a apple" | Templates mạo từ "a" cố định | Tự động hóa bộ máy xử lý mạo từ (Article Processor) | 🟢 **ĐÃ SỬA** |
| **BUG-20** | Cấu trúc Danh mục | **Enhancement** | Game Xây dựng câu ở chung mục | Chưa phân chia Category | Tách 2 vương quốc: Từ vựng (6 game) và Mẫu câu (2 game) | 🟢 **ĐÃ SỬA** |
| **BUG-23** | Mất Sổ Tay Từ Vựng | **Critical** | Mất hiển thị từ vựng | Script lỗi cắt mất code render | Khôi phục 100% Component Sổ Tay Từ Vựng | 🟢 **ĐÃ SỬA** |
| **BUG-26** | Các Nút Bấm Không Phản Hồi | **Critical** | Nút bấm không có phản hồi | Gán hàm rỗng `() => {}` | Khôi phục 100% Game Router và kết nối Modal | 🟢 **ĐÃ SỬA** |
| **BUG-27** | Khuyết Thiếu Khối Tổng Quan | **Critical** | Mất 4 ô thống kê & DS chi tiết | Khối bị ghi đè rút gọn | Khôi phục vĩnh viễn: 4 ô thống kê + Sổ tay chi tiết | 🟢 **ĐÃ SỬA** |
| **BUG-28** | Luân Phiên Game Theo Câu | **Major** | Không đổi game sau mỗi câu | Chỉ đổi sau cả ván chơi | Xây dựng `VocabRotatingAdventure`: Đổi game sau MỖI CÂU HỎI | 🟢 **ĐÃ SỬA** |
| **BUG-29** | Lỗi Trắng Màn Hình | **Critical** | Bấm mục Mẫu câu trang trắng | GameWordsPool bị rỗng | Thêm cơ chế bảo vệ kép + `SentenceRotatingAdventure` | 🟢 **ĐÃ SỬA** |
| **BUG-30** | Lệch Logic Số Liệu "Mục Tiêu Hôm Nay" | **Major** | Hiển thị 2/10 từ dù chưa học | Dùng giá trị seed tĩnh | Hàm tính động `getTodayPracticedWordsCount` theo `lastReviewed` | 🟢 **ĐÃ SỬA** |
| **BUG-31** | Thiếu Từ Khuyến Nghị | **Enhancement** | Thiếu ngân hàng từ theo độ tuổi | Chưa có ngân hàng riêng | Ngân hàng 150+ từ, nút nạp tự động, lọc trùng | 🟢 **ĐÃ SỬA** |
| **BUG-32** | Lỗi thêm trùng lặp từ | **Major** | Cho phép thêm lại từ đã có | Thiếu `existingWordSet` | Thêm cơ chế kiểm tra `existingWordSet` khi lưu | 🟢 **ĐÃ SỬA** |
| **BUG-33** | Icon loa không phát âm (iOS) | **Critical** | Không phát được âm thanh | Server Google TTS chặn domain lạ | Chuyển sang Youdao Audio Stream + Meta No-Referrer | 🟢 **ĐÃ SỬA** |
| **BUG-34** | Thư viện từ bị rút gọn | **Major** | Hiển thị 2 từ do xung đột build | Dữ liệu bị tạm thu nhỏ để cô lập lỗi | Khôi phục 105+ từ vựng chuẩn quốc tế | 🟢 **ĐÃ SỬA** |
| **BUG-35** | Mở rộng bank & Thiếu Game Lật Thẻ | **Major** | Bank từ hẹp, thiếu game lật thẻ | Bank từ cũ, thiếu cấu trúc 5 mini-game | Mở rộng 275+ từ vựng, tích hợp game Memory Flip | 🟢 **ĐÃ SỬA** |
| **BUG-36** | Đóng gói Mobile & AdMob | **Enhancement** | Cần đưa lên store, kiếm tiền | Chưa có native layer | Cấu hình Capacitor, tích hợp AdMob, hướng dẫn xuất bản | 🟢 **ĐÃ SỬA** |
| **BUG-37** | Lỗi 404 khi mở App từ Màn hình chính (PWA Standalone trên iOS Safari) | **Critical (PWA)** | Mở trong Safari bình thường nhưng khi "Thêm vào MH chính" (Add to Home Screen) và bấm mở icon ngoài màn hình thì bị lỗi 404 từ GitHub Pages. | Trong `public/manifest.json`, thuộc tính `start_url: "/"` trỏ thẳng về trang chủ domain gốc `https://santabu107052.github.io/` (thay vì subfolder `/vibekids-english/`), khiến GitHub Pages báo 404 File Not Found. | 1. Chuẩn hóa `start_url: "./"` và `scope: "./"` trong `manifest.json`.<br>2. Chuyển đường dẫn `<link rel="manifest">` sang đường dẫn tương đối an toàn.<br>3. Tạo file `dist/404.html` tự động nhân bản từ `index.html` trong script deploy để luôn điều hướng đúng Single Page App. | 🟢 **ĐÃ SỬA & ĐÃ DEPLOY** |
| **BUG-38** | Thêm Hộp Thoại Tùy Biến Chế Độ Học & Số Lượng Câu Hỏi (Có chế độ Vô Tận) | **Major (UX / Sư phạm)** | 1. Bấm vào bất kỳ game đơn lẻ nào chưa có bước hỏi chọn chế độ học (Ôn từ / Học mới / Học + Ôn).<br>2. Chưa cho người chơi tự chọn số lượng câu hỏi mỗi phiên (yêu cầu tối thiểu 10 câu hoặc chơi không giới hạn). | 1. Thiết kế component `GameSetupModal.tsx` trực quan và hiện đại.<br>2. Khi bấm 1 trong 3 nút thông minh: Hỏi ngay số lượng câu hỏi (10, 15, 20 hoặc Vô Tận ∞).<br>3. Khi bấm vào 1 game bất kỳ: Hỏi trước Chế độ học ➔ Sau đó chọn Số lượng câu hỏi (tối thiểu 10 câu hoặc Vô tận ∞).<br>4. Đồng bộ vào toàn bộ 6 game đơn lẻ và 2 chế độ phiêu lưu luân phiên. | 🟢 **ĐÃ HOÀN TẤT & ĐÃ DEPLOY** |

## 2. Quy Trình Kiểm Thử Hồi Quy (Regression Testing Checklist)
- [x] **TC-01** - **TC-26**: Đạt.
- [x] **TC-27**: Kiểm định chất lượng toàn diện (4 ô thống kê, Sổ tay từ vựng, luân phiên game, chống sập trắng).
- [x] **TC-30**: "Mục tiêu hôm nay" (Đúng thực tế); Nạp từ khuyến nghị (Lọc trùng 100%).
- [x] **TC-33**: Âm thanh phát mượt mà trên iPhone/iPad (Luồng Youdao).
- [x] **TC-34**: Thư viện từ vựng khuyến nghị đầy đủ 275+ từ (Phân cấp 6-8, 9-11, 12-15t).
- [x] **TC-35**: Game luân phiên đủ 5 trò chơi (Memory Flip ➔ Bubble Match ➔ Sound Detective ➔ Scramble ➔ Spelling).
- [x] **TC-36**: Đóng gói Mobile & AdMob: Đã tích hợp sẵn sàng, cấu hình chuẩn an toàn trẻ em (COPPA). Hướng dẫn xuất file native tại `MOBILE-PUBLISH-GUIDE.md`.
- [x] **TC-37**: Thêm vào Màn hình chính (Add to Home Screen) mở app tràn viền mượt mà không còn bị lỗi 404.
- [x] **TC-38**: Popup tùy chỉnh xuất hiện mượt mà khi bấm bất kỳ game nào (hỏi chế độ + số câu hỏi) hoặc khi bấm 3 nút (hỏi số câu hỏi). Có tùy chọn "Vô tận ∞" chơi thỏa thích.
