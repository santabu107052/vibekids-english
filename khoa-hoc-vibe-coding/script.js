// Trang khoá học: bấm vào ảnh sơ đồ để phóng to toàn màn hình, bấm lần nữa để thu lại.
// Không phụ thuộc thư viện ngoài — chạy được cả trên GitHub Pages lẫn khi mở file local.

function ganPhongTo() {
  const anh = Array.from(document.querySelectorAll('.noi-dung img'));
  if (anh.length === 0) return;

  const dong = () => {
    const dangMo = document.querySelector('.anh-phong-to');
    if (dangMo) dangMo.classList.remove('anh-phong-to');
    document.body.classList.remove('dang-phong-to');
  };

  for (const img of anh) {
    img.setAttribute('loading', img.getAttribute('loading') || 'lazy');
    img.setAttribute('decoding', 'async');
    img.setAttribute('alt', img.getAttribute('alt') || 'Sơ đồ minh hoạ');
    img.addEventListener('click', (e) => {
      e.preventDefault();
      const daMo = img.classList.contains('anh-phong-to');
      dong();
      if (!daMo) {
        img.classList.add('anh-phong-to');
        document.body.classList.add('dang-phong-to');
      }
    });
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dong(); });
  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('dang-phong-to') && e.target.tagName !== 'IMG') dong();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ganPhongTo);
} else {
  ganPhongTo();
}
