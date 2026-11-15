/**
 * BẢN THỬ NGHIỆM cho bài tập D (chưa nằm trong app chính).
 * Nhiệm vụ: nút thứ ba "Quay lại từ trước" — lùi 1 từ, ở từ đầu thì nhảy về từ cuối.
 * Dùng: node _bai-tap-d/nghiem-thu.mjs   (từ thư mục the-tu-vung-mini)
 *
 * Đây là "bảng nghiệm thu trước khi viết code" — kỹ thuật của người làm nghề:
 * viết test (mong muốn) TRƯỚC, rồi mới bảo AI viết code cho test xanh.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Hàm này CHƯA CÓ trong script.js — test sẽ FAIL cho tới khi AI viết xong.
import { timViTriTruoc, khoiDong } from '../../script.js';

test('timViTriTruoc: từ giữa lùi 1 bước (5 -> 4)', () => {
  assert.deepEqual(timViTriTruoc(5, 8), { index: 4, quayVong: false });
});

test('timViTriTruoc: đang ở từ đầu (0) thì nhảy về từ cuối (8 từ -> 7)', () => {
  assert.deepEqual(timViTriTruoc(0, 8), { index: 7, quayVong: true });
});

test('timViTriTruoc: dữ liệu rác không làm app sập', () => {
  assert.deepEqual(timViTriTruoc(3, 0), { index: 0, quayVong: false });
  assert.deepEqual(timViTriTruoc(3, -1), { index: 0, quayVong: false });
});

/** Trang giả để thử bấm nút thật — giống bộ test gốc */
function taoDocumentGia() {
  function taoPhanTu(id) {
    const langNghe = [];
    return {
      id, textContent: '', style: {}, offsetWidth: 100, listeners: langNghe,
      addEventListener(kieu, ham) { langNghe.push({ kieu, ham }); },
      bam() { for (const l of langNghe) if (l.kieu === 'click') l.ham(); },
    };
  }
  const phanTu = {};
  for (const id of ['the-tu', 'emoji', 'tu-tieng-anh', 'phien-am', 'nghia-tieng-viet', 'vi-tri', 'nut-tu-tiep-theo', 'nut-doi-mau', 'nut-tu-truoc']) {
    phanTu[id] = taoPhanTu(id);
  }
  const body = taoPhanTu('body');
  body.dataset = {};
  return { body, getElementById: (id) => phanTu[id] ?? null, _phanTu: phanTu };
}

test('bấm "Quay lại từ trước" sau 2 lần "Từ tiếp theo" thì về lại từ đầu', () => {
  const doc = taoDocumentGia();
  khoiDong(doc, [
    { emoji: '🍎', word: 'apple', phonetic: '/a/', meaningVi: 'Quả táo' },
    { emoji: '🐱', word: 'cat', phonetic: '/k/', meaningVi: 'Con mèo' },
    { emoji: '🍌', word: 'banana', phonetic: '/b/', meaningVi: 'Quả chuối' },
  ]);
  doc._phanTu['nut-tu-tiep-theo'].bam();
  doc._phanTu['nut-tu-tiep-theo'].bam();
  assert.equal(doc._phanTu['tu-tieng-anh'].textContent, 'banana');
  doc._phanTu['nut-tu-truoc'].bam();
  assert.equal(doc._phanTu['tu-tieng-anh'].textContent, 'cat');
  assert.equal(doc._phanTu['vi-tri'].textContent, 'Từ 2 / 3');
});

test('bấm "Quay lại từ trước" khi đang ở từ đầu thì nhảy về từ cuối', () => {
  const doc = taoDocumentGia();
  khoiDong(doc, [
    { emoji: '🍎', word: 'apple', phonetic: '/a/', meaningVi: 'Quả táo' },
    { emoji: '🐱', word: 'cat', phonetic: '/k/', meaningVi: 'Con mèo' },
    { emoji: '🍌', word: 'banana', phonetic: '/b/', meaningVi: 'Quả chuối' },
  ]);
  doc._phanTu['nut-tu-truoc'].bam();
  assert.equal(doc._phanTu['tu-tieng-anh'].textContent, 'banana');
  assert.equal(doc._phanTu['vi-tri'].textContent, 'Từ 3 / 3');
});
