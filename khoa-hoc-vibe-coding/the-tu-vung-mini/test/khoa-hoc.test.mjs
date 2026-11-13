/* =========================================================
   TEST TỰ ĐỘNG — chạy: node --test test/
   Đây là "người gác cổng": bạn (hoặc AI) sửa code xong, chạy lệnh này.
   Tất cả PASS = chưa làm hỏng chức năng cũ (kiểm thử hồi quy).
   ========================================================= */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BO_TU_MAU,
  BANG_MAU,
  timViTriTiepTheo,
  mauTiepTheo,
  khoiDong,
} from '../script.js';

/**
 * Giả lập tối giản một trang web (chỉ đủ phần code này dùng).
 * Nhờ vậy ta test được nút bấm mà không cần mở Chrome.
 */
function taoDocumentGia() {
  function taoPhanTu(id) {
    const langNghe = [];
    return {
      id,
      textContent: '',
      style: {},
      offsetWidth: 100,
      listeners: langNghe,
      addEventListener(kieu, ham) {
        langNghe.push({ kieu, ham });
      },
      bam() {
        for (const l of langNghe) if (l.kieu === 'click') l.ham();
      },
    };
  }

  const phanTu = {};
  for (const id of [
    'the-tu',
    'emoji',
    'tu-tieng-anh',
    'phien-am',
    'nghia-tieng-viet',
    'vi-tri',
    'nut-tu-tiep-theo',
    'nut-doi-mau',
  ]) {
    phanTu[id] = taoPhanTu(id);
  }

  const body = taoPhanTu('body');
  body.dataset = {};

  return {
    body,
    getElementById: (id) => phanTu[id] ?? null,
    _phanTu: phanTu,
  };
}

test('Bộ từ mẫu có 8 từ và đúng cấu trúc như dự án thật', () => {
  assert.equal(BO_TU_MAU.length, 8);
  for (const tu of BO_TU_MAU) {
    assert.ok(tu.word, 'thiếu word');
    assert.ok(tu.meaningVi, 'thiếu meaningVi');
    assert.ok(tu.phonetic, 'thiếu phonetic');
    assert.ok(tu.emoji, 'thiếu emoji');
  }
});

test('timViTriTiepTheo: sang từ kế tiếp bình thường', () => {
  assert.deepEqual(timViTriTiepTheo(0, 8), { index: 1, quayVong: false });
  assert.deepEqual(timViTriTiepTheo(6, 8), { index: 7, quayVong: false });
});

test('timViTriTiepTheo: ở từ cuối thì quay về từ đầu (bánh xe)', () => {
  assert.deepEqual(timViTriTiepTheo(7, 8), { index: 0, quayVong: true });
});

test('timViTriTiepTheo: dữ liệu rác không làm app sập', () => {
  assert.deepEqual(timViTriTiepTheo(3, 0), { index: 0, quayVong: false });
  assert.deepEqual(timViTriTiepTheo(3, -2), { index: 0, quayVong: false });
  assert.deepEqual(timViTriTiepTheo(3, 2.5), { index: 0, quayVong: false });
});

test('mauTiepTheo: xoay vòng đủ 4 màu rồi quay lại', () => {
  let mau = BANG_MAU[0];
  const daGap = [mau];
  for (let i = 0; i < BANG_MAU.length - 1; i++) {
    mau = mauTiepTheo(mau);
    daGap.push(mau);
  }
  assert.deepEqual(daGap, BANG_MAU);
  assert.equal(mauTiepTheo(mau), BANG_MAU[0]);
});

test('mauTiepTheo: màu lạ -> về màu đầu tiên', () => {
  assert.equal(mauTiepTheo('khong-ton-tai'), BANG_MAU[0]);
});

test('khoiDong: màn hình hiện đúng từ đầu tiên ngay khi mở app', () => {
  const doc = taoDocumentGia();
  khoiDong(doc, BO_TU_MAU);

  assert.equal(doc._phanTu['tu-tieng-anh'].textContent, 'apple');
  assert.equal(doc._phanTu['nghia-tieng-viet'].textContent, 'Quả táo');
  assert.equal(doc._phanTu['vi-tri'].textContent, 'Từ 1 / 8');
  assert.equal(doc.body.dataset.mau, 'hong');
});

test('khoiDong: bấm "Từ tiếp theo" thì đổi sang từ kế tiếp', () => {
  const doc = taoDocumentGia();
  khoiDong(doc, BO_TU_MAU);

  doc._phanTu['nut-tu-tiep-theo'].bam();
  assert.equal(doc._phanTu['tu-tieng-anh'].textContent, 'cat');
  assert.equal(doc._phanTu['vi-tri'].textContent, 'Từ 2 / 8');

  doc._phanTu['nut-tu-tiep-theo'].bam();
  assert.equal(doc._phanTu['tu-tieng-anh'].textContent, 'banana');
});

test('khoiDong: bấm "Từ tiếp theo" đủ 8 lần thì vòng lại từ đầu', () => {
  const doc = taoDocumentGia();
  khoiDong(doc, BO_TU_MAU);

  for (let i = 0; i < BO_TU_MAU.length; i++) {
    doc._phanTu['nut-tu-tiep-theo'].bam();
  }
  assert.equal(doc._phanTu['tu-tieng-anh'].textContent, 'apple');
  assert.equal(doc._phanTu['vi-tri'].textContent, 'Từ 1 / 8');
});

test('khoiDong: bấm "Đổi màu nền" thì đổi màu và ghi vào body', () => {
  const doc = taoDocumentGia();
  khoiDong(doc, BO_TU_MAU);

  doc._phanTu['nut-doi-mau'].bam();
  assert.equal(doc.body.dataset.mau, 'xanh');

  doc._phanTu['nut-doi-mau'].bam();
  assert.equal(doc.body.dataset.mau, 'vang');
});
