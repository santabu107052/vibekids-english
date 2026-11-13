/* Trang chủ khoá học: kiểm tra nhanh môi trường và in ra kết quả cho học viên thấy */

export function kiemTraThe(link) {
  // Ở khung đơn giản này chỉ đảm bảo thẻ có đường dẫn hợp lệ
  return Boolean(link && link.getAttribute('href'));
}

if (typeof document !== 'undefined') {
  const linkBuoi1 = document.getElementById('link-buoi-1');
  if (linkBuoi1) {
    const ok = kiemTraThe(linkBuoi1);
    console.log(ok ? '[khoa-hoc] Trang chủ sẵn sàng.' : '[khoa-hoc] Cảnh báo: thẻ Buổi 1 thiếu đường dẫn.');
  }
}
