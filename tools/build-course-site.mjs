/**
 * tools/build-course-site.mjs — Đóng gói bài giảng .md thành website tĩnh, trực quan.
 *
 * Vì sao KHÔNG dùng Cloudflare: bài học đã có sẵn hosting GitHub Pages của dự án
 * (xem script `deploy`). Chỉ cần sinh trang HTML tĩnh -> miễn phí, không cần đăng nhập,
 * không cần cài wrangler, chạy được cả khi mất mạng. Nếu sau này cần Cloudflare Pages,
 * chỉ việc trỏ `--out` của script này vào thư mục build của Pages.
 *
 * Kết quả: public/khoa-hoc-vibe-coding/  gồm index.html + buoi-N.html + hinh/ + the-on-tap/
 *
 * Dùng:  node tools/build-course-site.mjs
 */
import MarkdownIt from 'markdown-it';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DAY = dirname(dirname(fileURLToPath(import.meta.url)));
const COURSE = join(DAY, 'khoa-hoc-vibe-coding');
const SRC_DOCS = join(COURSE, 'tai-lieu');
const SRC_IMG = join(COURSE, 'hinh');
const SRC_CARDS = join(COURSE, 'the-on-tap');
const APP_DIR = join(COURSE, 'the-tu-vung-mini');

const OUT = join(DAY, 'public', 'khoa-hoc-vibe-coding');
const OUT_DOCS = join(OUT, 'tai-lieu');
const OUT_IMG = join(OUT, 'hinh');

// ---------- 1. Đọc danh sách bài ----------
const docFiles = readdirSync(SRC_DOCS).filter((f) => f.startsWith('buoi-') && f.endsWith('.md')).sort();
const lessons = docFiles.map((file) => {
  const m = file.match(/^buoi-(\d+)-/);
  return {
    file,
    order: Number(m ? m[1] : 99),
    raw: readFileSync(join(SRC_DOCS, file), 'utf8'),
  };
});

// Tiêu đề bài = dòng "# ..." đầu tiên, bỏ emoji đầu dòng thành nhãn ngắn
const titleOf = (raw) => {
  const line = raw.split('\n').find((l) => l.startsWith('# '));
  if (!line) return 'Bài học';
  return line.replace(/^#\s+/, '').replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s*—\s*/g, ': ').trim();
};
const shortTitleOf = (raw) => {
  const full = titleOf(raw);
  const after = full.split(':').slice(1).join(':').trim();
  const nh = after || full;
  // Chỉ viết hoa chữ đầu — tránh tiêu đề TOÀN CHỮ HOA trông nặng mắt trên web
  return nh.charAt(0).toUpperCase() + nh.slice(1).toLowerCase();
};
for (const l of lessons) {
  l.title = titleOf(l.raw);
  l.short = shortTitleOf(l.raw);
}

// ---------- 2. Markdown -> HTML ----------
const md = new MarkdownIt({ html: true, linkify: true, typographer: false });

/** Đổi link .md thành .html, link tương đối tới ../the-tu-vung-mini -> ../the-tu-vung-mini/index.html */
function chuanHoaLink(html) {
  return html
    .replace(/href="([^"]+?)\.md(#[^"]*)?"/g, 'href="$1.html$2"')
    .replace(/href="(\.\.\/the-tu-vung-mini)"/g, 'href="$1/index.html"');
}

const asset = '&#9664;'; // mũi tên nhỏ dùng ở nav

function trangHtml({ title, body, nav, kind }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="stylesheet" href="../style.css">
</head>
<body class="trang-bai">
${nav}
<main class="noi-dung">
${body}
</main>
<footer class="chan-trang">
  <p>Khoá học Vibe Coding — Tutor tự động đóng gói từ Markdown. Sửa bài gốc trong <code>khoa-hoc-vibe-coding/tai-lieu/</code> rồi chạy lại <code>node tools/build-course-site.mjs</code>.</p>
</footer>
</body>
</html>`;
}

function navHtml(lessonIndex) {
  const prev = lessons[lessonIndex - 1];
  const next = lessons[lessonIndex + 1];
  const link = (l, nhan) => l
    ? `<a class="nut-nav" href="${l.file.replace(/\.md$/, '.html')}">${asset} ${nhan}: ${l.short}</a>`
    : '<span class="nut-nav nut-nav-tat"></span>';
  return `<nav class="nav-bai">
  <a class="nut-nav nut-nav-chu" href="../index.html">🏠 Trang chủ khoá học</a>
  ${next ? link(next, 'Bài tiếp') : '<span class="nut-nav nut-nav-tat"></span>'}
  ${prev ? link(prev, 'Bài trước') : '<span class="nut-nav nut-nav-tat"></span>'}
</nav>`;
}

// ---------- 3. Ghi ra public/ ----------
mkdirSync(OUT, { recursive: true });
mkdirSync(OUT_DOCS, { recursive: true });
rmSync(OUT_IMG, { recursive: true, force: true });
mkdirSync(OUT_IMG, { recursive: true });

// 3a. Hình ảnh
for (const f of readdirSync(SRC_IMG)) {
  if (/\.(png|jpe?g|webp)$/i.test(f)) copyFileSync(join(SRC_IMG, f), join(OUT_IMG, f));
}

// 3b. Bài giảng
lessons.forEach((l, i) => {
  const body = chuanHoaLink(md.render(l.raw));
  const outName = l.file.replace(/\.md$/, '.html');
  writeFileSync(join(OUT_DOCS, outName), trangHtml({
    title: `${l.title} | Khoá học Vibe Coding`,
    body,
    nav: navHtml(i),
    kind: 'bai',
  }), 'utf8');
});

// Hướng dẫn chấm điểm khả thi: nếu có file .md khác trong tai-lieu/ thì build luôn
for (const f of readdirSync(SRC_DOCS).filter((x) => x.endsWith('.md') && !x.startsWith('buoi-'))) {
  const raw = readFileSync(join(SRC_DOCS, f), 'utf8');
  writeFileSync(join(OUT_DOCS, f.replace(/\.md$/, '.html')), trangHtml({
    title: `${titleOf(raw)} | Khoá học Vibe Coding`,
    body: chuanHoaLink(md.render(raw)),
    nav: '<nav class="nav-bai"><a class="nut-nav nut-nav-chu" href="../index.html">🏠 Trang chủ khoá học</a></nav>',
    kind: 'phu',
  }), 'utf8');
}

// 3c. Trang chủ: danh sách bài + thẻ ôn tập + app
const theOnTap = existsSync(SRC_CARDS) ? readdirSync(SRC_CARDS).filter((f) => f.endsWith('.txt')) : [];
const dsBai = lessons.map((l) => `
      <a class="the-bai" href="./tai-lieu/${l.file.replace(/\.md$/, '.html')}">
        <span class="the-bai-so">Buổi ${l.order}</span>
        <span class="the-bai-ten">${l.short}</span>
        <span class="the-bai-mo">${l.raw.includes('SƯ PHẠM') ? 'Lộ trình & hợp đồng học tập' : 'Bài giảng tương tác'}</span>
      </a>`).join('\n');

const trangChu = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Khoá học Vibe Coding — Trang chủ</title>
<link rel="stylesheet" href="./style.css">
</head>
<body class="trang-chu-body">
<main class="trang-chu">
  <h1>🎓 Khoá học Vibe Coding 7 buổi</h1>
  <p class="mo-ta">Mỗi bài là một trang web có sơ đồ màu, hình vẽ và bài tập thật.</p>

  <h2 class="muc">📚 Bài giảng</h2>
  <ul class="danh-sach-bai">
${dsBai}
  </ul>

  <h2 class="muc">🎮 Sản phẩm thực hành</h2>
  <ul class="danh-sach">
    <li>
      <a class="the" id="link-buoi-1" href="./the-tu-vung-mini/index.html">
        <span class="the-so">App</span>
        <span class="the-ten">Bé Vui Học Từ Vựng (buổi 1)</span>
        <span class="the-mo-ta">Bấm "Từ tiếp theo" và "Đổi màu nền"</span>
      </a>
    </li>
  </ul>

  <h2 class="muc">🃏 Thẻ ôn tập ngắt quãng</h2>
  <ul class="danh-sach">
    ${theOnTap.map((f) => `<li><a class="the the-nho" href="./the-on-tap/${f}"><span class="the-ten">${f.replace(/^bo-the-on-tap-|\.txt$/g, '')}</span><span class="the-mo-ta">Tải bộ thẻ, import vào Anki: File ➔ Import</span></a></li>`).join('\n    ') || '<li class="the-mo-ta">Chưa có thẻ.</li>'}
  </ul>

  <p class="loi-nhac">Bài mới: Tutor viết Markdown ➔ render sơ đồ thành ảnh ➔ chạy <code>node tools/build-course-site.mjs</code> ➔ deploy.</p>
</main>
<script type="module" src="./script.js"></script>
</body>
</html>`;
writeFileSync(join(OUT, 'index.html'), trangChu, 'utf8');

// 3d. Thẻ ôn tập
const OUT_CARDS = join(OUT, 'the-on-tap');
mkdirSync(OUT_CARDS, { recursive: true });
for (const f of theOnTap) copyFileSync(join(SRC_CARDS, f), join(OUT_CARDS, f));

// 3e. Bản sao app + trang giới thiệu
const OUT_APP = join(OUT, 'the-tu-vung-mini');
for (const f of ['index.html', 'script.js', 'style.css', 'preview-buoi-1.png']) {
  const p = join(APP_DIR, f);
  if (existsSync(p)) copyFileSync(p, join(OUT_APP, f));
}

// 3f. Sao chép style/script của site (do Tutor biên soạn trong project, không sinh tự động)
const siteDir = join(DAY, 'tools', 'khoa-hoc-site');
for (const f of ['style.css', 'script.js']) copyFileSync(join(siteDir, f), join(OUT, f));

console.log(`OK  ${relative(DAY, OUT)}`);
console.log(`    ${lessons.length} bài giảng, ${readdirSync(OUT_IMG).length} hình, ${theOnTap.length} bộ thẻ`);
