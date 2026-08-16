/**
 * 图形验证码工具
 * - 4 位字符（去除易混淆的 0/O/1/I/l）
 * - SVG 渲染（轻量、客户端可直接展示）
 * - 内存存储 (key -> 答案 + 过期时间)，5 分钟自动失效
 */

import { randomBytes } from 'crypto';

// 字符集（去除易混淆字符）
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;
const EXPIRY_MS = 5 * 60 * 1000; // 5 分钟
const MAX_ENTRIES = 5000; // 防止内存无限增长

interface CaptchaEntry {
  code: string;
  expiresAt: number;
}

// 内存存储（生产环境建议用 Redis）
const store = new Map<string, CaptchaEntry>();

/** 定期清理过期 captcha */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) {
      store.delete(key);
    }
  }
}, 60 * 1000);

/** 生成一个 captcha 及其 SVG，返回给前端 */
export function generateCaptcha(): { key: string; svg: string; expiresAt: number } {
  // 防止 store 无限增长
  if (store.size > MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (v.expiresAt < now) store.delete(k);
    }
  }

  let code = '';
  const bytes = randomBytes(CODE_LENGTH);
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }

  const key = randomBytes(16).toString('hex');
  const expiresAt = Date.now() + EXPIRY_MS;
  store.set(key, { code, expiresAt });

  return { key, svg: renderSvg(code), expiresAt };
}

/** 校验 captcha（成功校验后立即删除，防止重放） */
export function verifyCaptcha(key: string, answer: string): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return false;
  }
  const ok = entry.code.toLowerCase() === (answer || '').trim().toLowerCase();
  // 验证后立即删除（一次性）
  store.delete(key);
  return ok;
}

/** 渲染 SVG 验证码（扭曲 + 干扰线 + 噪点） */
function renderSvg(code: string): string {
  const width = 120;
  const height = 40;
  const chars = code.split('');

  // 每个字符的随机位置和旋转
  const charElements = chars
    .map((ch, i) => {
      const x = 16 + i * 24;
      const y = 16 + Math.floor(Math.random() * 8);
      const rotate = -25 + Math.floor(Math.random() * 50);
      const fontSize = 22 + Math.floor(Math.random() * 4);
      const color = pickColor();
      return `<text x="${x}" y="${y + fontSize * 0.7}" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="600" fill="${color}" transform="rotate(${rotate} ${x} ${y + fontSize * 0.7})">${ch}</text>`;
    })
    .join('');

  // 干扰线（3 条）
  const lines = Array.from({ length: 3 }, () => {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${pickColor()}" stroke-width="1" opacity="0.5"/>`;
  }).join('');

  // 噪点（20 个）
  const dots = Array.from({ length: 20 }, () => {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    return `<circle cx="${cx}" cy="${cy}" r="1" fill="${pickColor()}" opacity="0.5"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f8fafc"/>${lines}${dots}${charElements}</svg>`;
}

const COLORS = ['#1e3a8a', '#9333ea', '#0d9488', '#b91c1c', '#a16207', '#1d4ed8'];
function pickColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}
