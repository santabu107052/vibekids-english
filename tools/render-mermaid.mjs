/**
 * tools/render-mermaid.mjs — Render file .mmd thành PNG bằng Mermaid (không cần cài trình duyệt riêng).
 *
 * Cách hoạt động:
 *   1. Dựng trang HTML tạm (ưu tiên file:// để chạy offline; nếu trình duyệt chặn thì tự chuyển sang http://127.0.0.1)
 *   2. Nạp public/tools/mermaid.min.js (bản sao của node_modules/mermaid, đã commit kèm repo)
 *   3. Gọi Chrome headless qua CDP để render SVG rồi chụp màn hình đúng vùng sơ đồ ở 2x (ảnh nét trên Retina)
 *
 * Dùng:
 *   node tools/render-mermaid.mjs <input.mmd> <output.png> [--width 1600] [--scale 2]
 *
 * Yêu cầu: node ≥ 20, Google Chrome có sẵn trên máy (macOS).
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const DAY = dirname(dirname(fileURLToPath(import.meta.url))); // <dự án>
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];
// Bundle Mermaid được commit kèm repo: không cần thư viện trong node_modules khi render,
// nên máy nào clone repo cũng render được ngay (không phải chạy pnpm install trước).
const MERMAID_PATH = join(DAY, 'public', 'tools', 'mermaid.min.js');

const [, , inputFile, outputFile, ...rest] = process.argv;
if (!inputFile || !outputFile) {
  console.error('Dùng: node tools/render-mermaid.mjs <input.mmd> <output.png> [--width 1600] [--scale 2]');
  process.exit(2);
}
const readFlag = (name, fallback) => {
  const i = rest.indexOf(name);
  return i >= 0 ? Number(rest[i + 1]) : fallback;
};
const VIEWPORT_W = readFlag('--width', 1600);
const VIEWPORT_H = readFlag('--height', 2400);
const SCALE = readFlag('--scale', 2);

const source = readFileSync(inputFile, 'utf8');
const mermaidJs = readFileSync(MERMAID_PATH, 'utf8');

// Nhúng mã Mermaid dạng JSON an toàn. "</script" không được lọt vào block script;
// ký tự xuống dòng được khôi phục lúc chạy vì JSON.stringify biến \n thành hai ký tự '\\n'.
const safeJson = JSON.stringify(source).replace(/<\/script/gi, '<\\/script');
const safeLib = mermaidJs.replace(/<\/script/gi, '<\\/script');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;background:#ffffff;}
  #out{display:inline-block;padding:28px;background:#ffffff;}
</style></head>
<body><div id="out"></div>
<script>${safeLib}</script>
<script>
  window.__ketQua = (async () => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
        themeVariables: {
          fontSize: '19px',
          primaryColor: '#eef2ff',
          primaryBorderColor: '#4f46e5',
          primaryTextColor: '#1e1b4b',
          lineColor: '#6366f1',
          secondaryColor: '#fdf2f8',
          tertiaryColor: '#ecfeff'
        },
        flowchart: { htmlLabels: true, curve: 'basis', nodeSpacing: 40, rankSpacing: 50 },
        mindmap: { padding: 16 }
      });
      const src = (${safeJson}).replace(/\\n/g, String.fromCharCode(10));
      const { svg } = await mermaid.render('hinh', src);
      const holder = document.getElementById('out');
      holder.innerHTML = svg;
      const el = holder.querySelector('svg');
      // Đo theo viewBox (tỉ lệ thật của sơ đồ). KHÔNG dùng getBoundingClientRect ở đây:
      // khi render nền, khung nhìn headless có thể co lại và làm ảnh bị cắt mất một phần.
      const vb = el.viewBox && el.viewBox.baseVal;
      const w = Math.ceil((vb && vb.width) || el.getBoundingClientRect().width);
      const h = Math.ceil((vb && vb.height) || el.getBoundingClientRect().height);
      el.setAttribute('width', w);
      el.setAttribute('height', h);
      el.style.display = 'block';
      return { ok: true, width: w + 56, height: h + 56 };
    } catch (e) {
      return { ok: false, error: String((e && (e.stack || e.message)) || e) };
    }
  })();
</script></body></html>`;

const chrome = CHROME_CANDIDATES.find((p) => {
  try { readFileSync(p); return true; } catch { return false; }
});
if (!chrome) {
  console.error('Không tìm thấy Chrome/Chromium.');
  process.exit(3);
}

const dir = mkdtempSync(join(tmpdir(), 'mermaid-render-'));
const htmlPath = join(dir, 'index.html');
writeFileSync(htmlPath, html, 'utf8');

// Máy chủ tĩnh nhỏ: dùng khi trình duyệt không cho file:// chạy cục bộ
let server = null;
let serverPort = 0;
function startServer() {
  return new Promise((done) => {
    server = createServer((req, res) => {
      if (req.url === '/index.html' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } else {
        res.writeHead(404); res.end();
      }
    });
    server.listen(0, '127.0.0.1', () => { serverPort = server.address().port; done(); });
  });
}

function launch(url) {
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', `--force-device-scale-factor=${SCALE}`,
    `--window-size=${VIEWPORT_W},${VIEWPORT_H}`,
    `--user-data-dir=${join(dir, 'profile')}`,
    '--remote-debugging-port=0',
    url,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d.toString(); });
  return { proc, getStderr: () => stderr };
}

async function waitDevtools(getStderr) {
  const t0 = Date.now();
  while (Date.now() - t0 < 30000) {
    const m = getStderr().match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (m) return m[1];
    await sleep(120);
  }
  throw new Error('Chờ DevTools quá lâu:\n' + getStderr().slice(-600));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });
  return { send, open: new Promise((r) => ws.addEventListener('open', r)), close: () => ws.close() };
}

async function attempt(url) {
  const { proc, getStderr } = launch(url);
  let client = null;
  try {
    const wsUrl = await waitDevtools(getStderr);
    client = cdp(wsUrl);
    await client.open;
    const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });
    await client.send('Page.enable', {}, sessionId);
    await client.send('Page.navigate', { url }, sessionId);

    let res = null;
    for (let i = 0; i < 160; i++) {
      await sleep(200);
      const out = await client.send('Runtime.evaluate', {
        // Lưu ý: KHÔNG dùng await ở top-level trong Runtime.evaluate -> bọc trong IIFE async
        expression: '(async () => (window.__ketQua ? JSON.stringify(await window.__ketQua) : "null"))()',
        awaitPromise: true, returnByValue: true,
      }, sessionId);
      const val = out?.result?.value;
      if (typeof val === 'string' && val !== 'null') { res = JSON.parse(val); break; }
    }
    if (!res) return { ok: false, error: 'Mermaid không phản hồi (trang tải dở hoặc bị chặn).' };
    if (!res.ok) return { ok: false, error: 'Lỗi cú pháp Mermaid:\n' + res.error };

    await sleep(250);
    const shot = await client.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: res.width, height: res.height, scale: SCALE },
    }, sessionId);
    writeFileSync(outputFile, Buffer.from(shot.data, 'base64'));
    return { ok: true, meta: `${res.width}x${res.height} @${SCALE}x` };
  } finally {
    try { client?.close(); } catch {}
    proc.kill('SIGKILL');
  }
}

let lastHtml = html;
try {
  let result = await attempt(`file://${htmlPath}`);
  if (!result.ok) {
    // Trình duyệt có thể chặn script nội tuyến trên file:// -> chuyển sang phục vụ qua localhost
    await startServer();
    await sleep(150);
    result = await attempt(`http://127.0.0.1:${serverPort}/index.html`);
  }
  if (!result.ok) throw new Error(result.error);
  console.log(`OK  ${outputFile}  ${result.meta}`);
} catch (e) {
  console.error('THẤT BẠI:', e.message);
  if (process.env.DEBUG_HTML) writeFileSync(join(tmpdir(), 'render-fail.html'), lastHtml);
  process.exitCode = 1;
} finally {
  server?.close();
  rmSync(dir, { recursive: true, force: true });
}
