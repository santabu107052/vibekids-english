/* =========================================================
   FILE BỘ NÃO (LOGIC) — quyết định "app chạy thế nào".
   Ở khóa học này, ~90% thời gian bạn sửa CHÍNH FILE NÀY.
   ========================================================= */

/*
 * PHẦN THUẦN LOGIC (không đụng tới màn hình).
 * Nhờ tách riêng, phần này TEST ĐƯỢC tự động bằng Node — xem test/khoa-hoc.test.mjs
 */
export function taoBoTu(words) {
  return words.slice();
}

/**
 * Tính vị trí từ tiếp theo.
 * Luật khung số 1: đi hết bộ từ thì quay lại từ đầu ("bánh xe").
 * @returns {{index: number, quayVong: boolean}}
 */
export function timViTriTiepTheo(viTriHienTai, tongSoTu) {
  if (!Number.isInteger(tongSoTu) || tongSoTu <= 0) {
    return { index: 0, quayVong: false };
  }
  const keTiep = viTriHienTai + 1;
  if (keTiep >= tongSoTu) {
    return { index: 0, quayVong: true };
  }
  return { index: keTiep, quayVong: false };
}

/** Đổi màu nền: xoay vòng qua bảng màu khai báo ở đây. */
export const BANG_MAU = ['hong', 'xanh', 'vang', 'tim'];

export function mauTiepTheo(mauHienTai) {
  const thuTu = BANG_MAU.indexOf(mauHienTai);
  // Nếu màu lạ/không có trong bảng -> về màu đầu tiên
  return BANG_MAU[(thuTu + 1) % BANG_MAU.length];
}

/*
 * PHẦN DỰNG GIAO DIỆN — dùng mẫu 8 từ vựng dễ,
 * lấy cùng cấu trúc dữ liệu với dự án thật (word, phonetic, meaningVi, emoji).
 * Ở buổi sau ta sẽ thay bằng src/data/curatedWords.ts của VibeKids.
 */
export const BO_TU_MAU = [
  { emoji: '🍎', word: 'apple', phonetic: '/ˈæp.əl/', meaningVi: 'Quả táo' },
  { emoji: '🐱', word: 'cat', phonetic: '/kæt/', meaningVi: 'Con mèo' },
  { emoji: '🍌', word: 'banana', phonetic: '/bəˈnɑː.nə/', meaningVi: 'Quả chuối' },
  { emoji: '🐶', word: 'dog', phonetic: '/dɒɡ/', meaningVi: 'Con chó' },
  { emoji: '🐦', word: 'bird', phonetic: '/bɜːd/', meaningVi: 'Con chim' },
  { emoji: '🌙', word: 'moon', phonetic: '/muːn/', meaningVi: 'Mặt trăng' },
  { emoji: '⭐', word: 'star', phonetic: '/stɑːr/', meaningVi: 'Ngôi sao' },
  { emoji: '🍚', word: 'rice', phonetic: '/raɪs/', meaningVi: 'Cơm' },
];

/**
 * Gắn toàn bộ nút bấm vào trang.
 * Tách thành 1 hàm để TEST GIẢ LẬP được (giả một "document" nhỏ) — không cần mở trình duyệt.
 */
export function khoiDong(doc, boTu) {
  const tim = (id) => doc.getElementById(id);

  const theTu = tim('the-tu');
  const nutTuTiepTheo = tim('nut-tu-tiep-theo');
  const nutDoiMau = tim('nut-doi-mau');

  let viTri = 0;
  let mau = 'hong';

  function veLaiThe() {
    const tu = boTu[viTri];
    tim('emoji').textContent = tu.emoji;
    tim('tu-tieng-anh').textContent = tu.word;
    tim('phien-am').textContent = tu.phonetic;
    tim('nghia-tieng-viet').textContent = tu.meaningVi;
    tim('vi-tri').textContent = `Từ ${viTri + 1} / ${boTu.length}`;
    // Khởi động lại hiệu ứng xuất hiện (nhỏ nhặt nhưng làm app "có cảm giác sống")
    theTu.style.animation = 'none';
    void theTu.offsetWidth;
    theTu.style.animation = '';
  }

  nutTuTiepTheo.addEventListener('click', () => {
    viTri = timViTriTiepTheo(viTri, boTu.length).index;
    veLaiThe();
  });

  nutDoiMau.addEventListener('click', () => {
    mau = mauTiepTheo(mau);
    doc.body.dataset.mau = mau;
  });

  doc.body.dataset.mau = mau;
  veLaiThe();
}

/* Nếu file này được mở như một trang web (không phải import để test) -> tự khởi động */
if (typeof document !== 'undefined' && document.getElementById('the-tu')) {
  khoiDong(document, BO_TU_MAU);
}
