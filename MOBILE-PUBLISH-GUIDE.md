# Hướng dẫn Xuất Bản Ứng Dụng Di Động & Kiếm Tiền (AdMob)

Chào bạn, hệ thống VibeKids English hiện đã được cấu hình hoàn thiện để đóng gói thành ứng dụng di động thực thụ (Native Mobile App).

## 1. Hướng dẫn AdMob (Kiếm tiền)
Để nhận được tiền từ quảng cáo, bạn cần có tài khoản AdMob chính thức:
1. **Đăng ký**: Truy cập [Google AdMob](https://admob.google.com/) và tạo tài khoản.
2. **Tạo App**: Trong trang quản trị AdMob, chọn "Add App" cho cả nền tảng **Android** và **iOS**.
3. **Tạo Unit ID**:
   - Tạo 1 **Banner Ad Unit ID** (lưu lại).
   - Tạo 1 **Interstitial Ad Unit ID** (lưu lại).
   - Tạo 1 **Rewarded Ad Unit ID** (lưu lại).
4. **Cấu hình**: Thay thế các `TEST_ID` trong tệp `src/services/adService.ts` bằng các `ID` thực của bạn (sau khi đã kiểm tra thử thành công bằng ID mẫu).
5. **Đặc biệt**: Trong AdMob, hãy đánh dấu ứng dụng của bạn là **"Child-Directed" (Dành cho trẻ em)** để Google tự động lọc quảng cáo an toàn theo đúng luật COPPA.

## 2. Xuất bản ứng dụng (Build File)

### Đối với Android (.apk / .aab)
1. Cài đặt **Android Studio** trên máy tính của bạn.
2. Mở thư mục `english-for-kids/android` bằng Android Studio.
3. Chờ Gradle sync xong.
4. Chọn menu **Build > Build Bundle(s) / APK(s) > Build APK(s)** để xuất file `.apk` cài đặt trực tiếp.
5. Để up lên Play Store, chọn **Build Bundle(s) > Build App Bundle (.aab)**.

### Đối với iOS (.ipa - Cần máy Mac)
1. Cài đặt **Xcode** trên máy Mac.
2. Mở file `App.xcworkspace` trong thư mục `english-for-kids/ios`.
3. Cấu hình **Signing & Capabilities** bằng tài khoản Apple Developer của bạn (cần phí 99$/năm).
4. Chọn menu **Product > Archive**.
5. Xcode sẽ tạo file `.ipa` để bạn gửi lên App Store qua **TestFlight** (để test) hoặc **App Store Connect** (để phát hành).

## 3. Các bước cập nhật hàng ngày
Mỗi khi bạn sửa code web, hãy chạy:
1. `pnpm run build`
2. `pnpm cap sync`
3. Mở Android Studio hoặc Xcode và nhấn **Run** (để test) hoặc **Archive** (để xuất bản).

Chúc bạn thành công với việc đưa VibeKids English lên store!
