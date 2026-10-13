import { ROWS } from './constants.js'
import { rng } from './rng.js'
// Bộ sinh màn chơi: x-1 mặt đất, x-2 hầm ngầm (2-2 và 7-2 là màn dưới nước), x-3 ngọn cây, x-4 lâu đài + Bowser.
// Độ khó d = 0..31 tăng dần: nhiều kẻ địch, hố rộng, Piranha, Hammer Bro, súng thần công, Lakitu, thanh lửa, Bowser nhiều máu...
const MAX = 260
const NIGHT = new Set(['3-1', '3-3', '6-1', '6-3', '8-1'])
const LAKITU = new Set(['4-1', '6-1', '8-1'])
const CHEEP_LEAP = new Set(['2-3', '5-3', '7-3'])
const WATER = new Set(['2-2', '7-2'])
// Bowser giả ở lâu đài thế giới 1-7 (8-4 mới là Bowser thật)
const FAKES = ['goomba', 'goomba', 'koopa', 'buzzy', 'spiny', 'hammerbro', 'redkoopa']

export function generateLevel(w, l) {
  const id = `${w}-${l}`, d = (w - 1) * 4 + (l - 1), r = rng(w * 977 + l * 131 + 7)
  const lv = WATER.has(id) ? genWater(d, r) : l === 4 ? genCastle(w, d, r) : l === 3 ? genTree(d, r, id) : genGround(l === 2, d, r, id)
  lv.grid = lv.grid.map((row) => row.slice(0, lv.cols))
  if (NIGHT.has(id)) lv.sky = '#10104c'
  return lv
}

function canvas() {
  const g = Array.from({ length: ROWS }, () => Array(MAX).fill(' '))
  return {
    g,
    ground(c0, c1) { for (let c = c0; c <= c1; c++) { g[12][c] = 'G'; g[13][c] = 'G' } },
    ceiling() { for (let c = 0; c < MAX; c++) for (let r = 0; r < 3; r++) g[r][c] = 'B'; for (let r = 3; r < 12; r++) g[r][0] = 'B' },
  }
}
// Phần kết: cầu thang -> cột cờ -> lâu đài
function ending(g, ground, c, sh) {
  ground(c, c + 7); c += 8
  for (let i = 0; i < sh; i++) for (let j = 0; j <= i; j++) g[11 - j][c + i] = 'S'
  ground(c, c + sh)
  for (let j = 0; j < sh; j++) g[11 - j][c + sh] = 'S'
  const f0 = c + sh + 1; ground(f0, f0 + 14)
  const flagCol = f0 + 1; g[11][flagCol] = 'S'
  return { flagCol, castleCol: flagCol + 4, cols: f0 + 15 }
}

function genGround(under, d, r, id) {
  const { g, ground, ceiling } = canvas(); if (under) ceiling()
  const enemies = [], coins = [], pipes = []
  let c = 0, mush = 0, star = d % 3 === 1 && !under
  const flat = (n) => { ground(c, c + n - 1); const s = [c, c + n - 1]; c += n; return s }
  const kinds = () => { const k = ['goomba', 'goomba', 'koopa']; if (d >= 6) k.push('redkoopa'); if (under || d >= 12) k.push('buzzy'); return k }
  const addEnemies = (s, n) => {
    const used = new Set()
    for (let i = 0; i < n; i++) { const col = s[0] + 1 + r.int(0, Math.max(0, s[1] - s[0] - 2)); if (!used.has(col)) { used.add(col); enemies.push({ kind: r.pick(kinds()), c: col, r: 11 }) } }
  }
  const stairs = (n, up) => { ground(c, c + n - 1); for (let i = 0; i < n; i++) for (let j = 0; j < (up ? i + 1 : n - i); j++) g[11 - j][c + i] = 'S'; c += n }
  const blocks = (s) => {
    const len = 3 + r.int(0, 2), c0 = s[0] + 1, pat = []
    for (let i = 0; i < len; i++) pat.push(r() < 0.35 ? 'Q' : 'B')
    if (mush < 2) { pat[r.int(0, len - 1)] = 'M'; mush++ } else pat[r.int(0, len - 1)] = 'Q'
    if (star && r() < 0.5) { const bi = pat.indexOf('B'); if (bi >= 0) { pat[bi] = 'T'; star = false } }
    pat.forEach((ch, i) => { g[8][c0 + i] = ch })
    if (r() < 0.3) for (let i = 1; i < len - 1; i++) g[4][c0 + i] = r() < 0.5 ? 'B' : 'Q'
  }
  // danh sách đoạn: [trọng số, hàm dựng]; Hammer Bro từ d>=10, súng thần công từ d>=6
  const segs = [
    [0.28, () => { const s = flat(5 + r.int(0, 4)); addEnemies(s, r() < 0.55 + d * 0.012 ? 1 + (r() < d / 36 ? 1 : 0) : 0) }],
    [0.15, () => { flat(3); c += 2 + (d >= 8 && r() < 0.5 ? 1 : 0); flat(3) }],
    [0.17, () => {
      flat(2); const h = 2 + (r() < 0.4 ? 1 : 0)
      for (let i = 0; i < h; i++) { const rr = 12 - h + i; g[rr][c] = i ? 'c' : 'a'; g[rr][c + 1] = i ? 'd' : 'b' }
      ground(c, c + 1); pipes.push({ c, h }); c += 2; flat(3)
    }],
    [0.2, () => blocks(flat(6 + r.int(0, 3)))],
    [0.12, () => { flat(2); const n = 3 + r.int(0, 1); stairs(n, true); stairs(n, false); flat(2) }],
    [0.08, () => { const s = flat(7); for (let i = 0; i < 5; i++) coins.push({ c: s[0] + 1 + i, r: i === 0 || i === 4 ? 8 : 7 }); addEnemies(s, 1) }],
  ]
  if (d >= 6) segs.push([0.1, () => { // súng thần công cao 1-3 ô
    flat(3); const h = 1 + r.int(0, 2); ground(c, c)
    for (let i = 0; i < h; i++) g[11 - i][c] = i === h - 1 ? 'Y' : 'y'
    c += 1; flat(3)
  }])
  if (d >= 10) segs.push([0.08, () => { const s = flat(8); enemies.push({ kind: 'hammerbro', c: s[0] + 4, r: 11 }); if (d >= 20) enemies.push({ kind: 'hammerbro', c: s[0] + 6, r: 11 }) }])
  const total = segs.reduce((a, s) => a + s[0], 0)

  flat(14)
  const target = 120 + d * 2
  while (c < target) { let t = r() * total; for (const [wgt, fn] of segs) { if ((t -= wgt) < 0) { fn(); break } } }
  const preEnd = c
  // ống vào hầm thưởng (màn mặt đất): ống ở ~25% màn dẫn tới miệng ống gần cuối
  let special = []
  if (!under && pipes.length >= 3) {
    const A = pipes[Math.floor(pipes.length * 0.25)], B = pipes[pipes.length - 2]; A.no = B.no = true
    special = [{ c: A.c, r: 12 - A.h, to: 'bonus', ret: { c: B.c, r: 12 - B.h } }]
  }
  if (id === '4-2' && pipes.length >= 2) { // Warp Zone ẩn: tới thế giới 6, 7, 8
    const W = pipes[Math.floor(pipes.length * 0.6)]; W.no = true
    special.push({ c: W.c, r: 12 - W.h, to: 'warp', worlds: [6, 7, 8] })
  }
  for (const p of pipes) if (!p.no && d >= 2 && r() < 0.3 + d * 0.015) enemies.push({ kind: 'piranha', c: p.c, r: 12 - p.h })
  if (LAKITU.has(id)) enemies.push({ kind: 'lakitu', c: 40, r: 2, to: preEnd })
  const end = ending(g, ground, c, under ? 6 : 8)
  return { grid: g, cols: end.cols, enemies, coins, things: [], theme: under ? 'under' : 'over', music: under ? 'under' : 'over',
    flagCol: end.flagCol, castleCol: end.castleCol, spawn: { x: 32, y: 176 }, pipes: special }
}

// Màn dưới nước: bơi bằng nút nhảy, san hô mọc từ đáy / thòng từ mặt nước, Cheep Cheep; cuối màn lên bờ
function genWater(d, r) {
  const { g, ground } = canvas(), enemies = [], coins = []
  const target = 110 + d, dry = target + 6
  for (let c = 0; c < dry; c++) { g[0][c] = 'B'; g[1][c] = 'B' }
  ground(0, dry - 1)
  let c = 12
  while (c < target) {
    const t = r()
    if (t < 0.4) { const h = 2 + r.int(0, Math.min(5, 2 + (d >> 3))); for (let i = 0; i < 2; i++) for (let j = 0; j < h; j++) g[11 - j][c + i] = 'B'; c += 2 + r.int(5, 7) }
    else if (t < 0.75) { const h = 2 + r.int(0, 3); for (let i = 0; i < 2; i++) for (let j = 0; j < h; j++) g[2 + j][c + i] = 'B'; c += 2 + r.int(5, 7) }
    else { for (let i = 0; i < 5; i++) coins.push({ c: c + i, r: 5 + r.int(0, 4) }); c += 7 }
    if (r() < 0.6 + d * 0.01) enemies.push({ kind: r() < 0.4 ? 'cheepR' : 'cheep', c: c + r.int(2, 6), r: r.int(3, 10) })
  }
  for (let i = 0, n = 1 + (d >> 2); i < n; i++) { // mực: nhiều hơn ở thế giới sau; chỉ đặt ở chỗ nước trống (không nằm trong san hô)
    for (let tries = 0; tries < 20; tries++) {
      const col = r.int(22, Math.max(23, target - 6)), row = r.int(3, 8)
      if (g[row][col] === ' ' && g[row + 1][col] === ' ' && g[row][col + 1] === ' ') { enemies.push({ kind: 'blooper', c: col, r: row }); break }
    }
  }
  const end = ending(g, ground, dry, 6)
  return { grid: g, cols: end.cols, enemies, coins, things: [], theme: 'water', water: true, dryFrom: dry, music: 'water',
    flagCol: end.flagCol, castleCol: end.castleCol, spawn: { x: 32, y: 176 }, pipes: [] }
}

function genTree(d, r, id) {
  const { g, ground } = canvas(), enemies = [], coins = []
  ground(0, 8); let c = 9, top = 10
  const target = 100 + d * 2
  while (c < target) {
    const gap = 2 + (d >= 6 && r() < 0.5 ? 1 : 0)
    const nt = Math.max(7, Math.min(10, top + r.pick([-2, -1, -1, 0, 0, 1, 2])))   // hàng mặt nền mới (nhỏ hơn = cao hơn)
    const w = Math.max(3, 7 - Math.floor(d / 6)) + r.int(0, 2)
    coins.push({ c: c + Math.floor(gap / 2), r: Math.min(top, nt) - 3 })
    c += gap
    for (let i = 0; i < w; i++) g[nt][c + i] = 'P'
    const mid = c + Math.floor(w / 2); for (let rr = nt + 1; rr < 14; rr++) g[rr][mid] = 'N'
    if (w >= 4 && r() < 0.55 + d * 0.01) enemies.push({ kind: d >= 6 && r() < 0.5 ? 'redkoopa' : 'koopa', c: c + 1 + r.int(0, w - 3), r: nt - 1 })
    if (r() < 0.3) for (let i = 0; i < w; i++) coins.push({ c: c + i, r: nt - 2 })
    c += w; top = nt
  }
  const preEnd = c; c += 2
  const end = ending(g, ground, c, 6)
  return { grid: g, cols: end.cols, enemies, coins, things: [], theme: 'tree', music: 'over', flagCol: end.flagCol, castleCol: end.castleCol,
    spawn: { x: 32, y: 176 }, pipes: [], cheep: CHEEP_LEAP.has(id) ? { c0: 14, c1: preEnd } : undefined }
}

function genCastle(w, d, r) {
  const { g, ground, ceiling } = canvas(); ceiling()
  const things = [], final = w === 8
  ground(0, 11); let c = 12
  const bar = (col, row, dir) => { g[row][col] = 'U'; things.push({ kind: 'firebar', c: col, r: row, a: r() * 6, dir }) }
  for (let i = 0, n = 3 + Math.floor(d / 8); i < n; i++) {
    const t = r()
    if (t < 0.45) { // hố dung nham
      ground(c, c + 2); c += 3; const n2 = 2 + (r() < 0.5 ? 1 : 0)
      for (let k = 0; k < n2; k++) { g[12][c + k] = 'L'; g[13][c + k] = 'L' }
      if (d >= 8 && r() < 0.6) bar(c + Math.floor(n2 / 2), 5, r() < 0.5 ? 1 : -1)
      c += n2; ground(c, c + 2); c += 3
    } else if (t < 0.8) { // đoạn bằng có thanh lửa
      ground(c, c + 8); bar(c + 4, r() < 0.5 ? 7 : 8, r() < 0.5 ? 1 : -1)
      if (d >= 16) bar(c + 7, 6, 1)
      c += 9
    } else { // bậc đá
      ground(c, c + 1); c += 2
      for (let k = 0; k < 3; k++) { ground(c + k, c + k); for (let j = 0; j <= k; j++) g[11 - j][c + k] = 'S' }
      c += 3
      for (let k = 0; k < 3; k++) { ground(c + k, c + k); for (let j = 0; j < 3 - k; j++) g[11 - j][c + k] = 'S' }
      c += 3
    }
  }
  ground(c, c + 5); c += 6
  const b0 = c
  if (final) { g[8][b0 - 5] = 'M'; g[8][b0 - 3] = 'M' } // khối Hoa Lửa/nấm ngay trước đấu trường
  for (let k = 0; k < 13; k++) { g[12][b0 + k] = 'R'; g[13][b0 + k] = 'L' }
  ground(b0 + 13, b0 + 15)
  for (let k = b0; k < b0 + 16; k++) { g[3][k] = 'B'; g[4][k] = 'B' }
  things.push({ kind: 'axe', c: b0 + 13, r: 11 }, { kind: final ? 'peach' : 'toad', c: b0 + 15, r: 11 })
  return { grid: g, cols: b0 + 16, enemies: [{ kind: 'bowser', c: b0 + 6, r: 11, hp: final ? 8 : 2, fake: final ? undefined : FAKES[w - 1], real: final, rate: final ? 120 : 170 - w * 5 }],
    coins: [], things, theme: 'castle', music: final ? 'boss' : 'castle', spawn: { x: 32, y: 176 }, pipes: [], bridge: { c0: b0, c1: b0 + 12, row: 12 }, boss: true, final }
}
