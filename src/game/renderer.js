import { TILE, VW, VH, ROWS } from './constants.js'

const R = (ctx, col, a, b, w, h) => { ctx.fillStyle = col; ctx.fillRect(a, b, w, h) }

function hill(ctx, x, w, h) {
  const base = 12 * TILE
  ctx.fillStyle = '#00a800'; ctx.beginPath(); ctx.ellipse(x + w / 2, base, w / 2, h, 0, Math.PI, 0); ctx.fill()
  ctx.fillStyle = '#005800'; ctx.fillRect(x + w / 2 - 6, base - h / 2 - 4, 3, 8); ctx.fillRect(x + w / 2 + 3, base - h / 2 - 4, 3, 8)
}
function bush(ctx, x, n) {
  const base = 12 * TILE
  for (let i = 0; i < n; i++) { ctx.fillStyle = '#00a800'; ctx.beginPath(); ctx.arc(x + 12 + i * 16, base - 2, i % 2 ? 11 : 9, Math.PI, 0); ctx.fill() }
  R(ctx, '#00a800', x + 3, base - 4, n * 16 + 2, 4)
}
function cloud(ctx, x, y, n) {
  ctx.fillStyle = '#fcfcfc'
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(x + 12 + i * 16, y + 12, i % 2 ? 11 : 9, 0, 6.3); ctx.fill() }
  R(ctx, '#fcfcfc', x + 8, y + 12, n * 16 - 6, 8)
}
// Phong cảnh lặp mỗi 48 ô như bản gốc
function scenery(ctx, cam, hills = true) {
  for (let k = 0; k < 6; k++) {
    const o = k * 48 * TILE - cam
    if (o > VW + 100 || o < -48 * TILE) continue
    if (hills) { hill(ctx, o, 80, 36); hill(ctx, o + 16 * TILE, 48, 20); bush(ctx, o + 11 * TILE, 3); bush(ctx, o + 23 * TILE, 1); bush(ctx, o + 41 * TILE, 2) }
    cloud(ctx, o + 8 * TILE, 2 * TILE + 8, 1); cloud(ctx, o + 19 * TILE, TILE + 4, 3); cloud(ctx, o + 27 * TILE, 2 * TILE + 8, 2); cloud(ctx, o + 36 * TILE, TILE + 4, 1)
  }
}

function goal(ctx, g, TS, cam) {
  const px = g.poleX - cam
  R(ctx, '#80d010', px, 3 * TILE, 2, 8 * TILE); R(ctx, '#00a800', px - 1, 2 * TILE + 6, 4, 4); R(ctx, '#fcd000', px - 1, 2 * TILE + 4, 4, 4)
  ctx.fillStyle = '#fcfcfc'; ctx.beginPath(); ctx.moveTo(px, g.flagY); ctx.lineTo(px - 14, g.flagY + 8); ctx.lineTo(px, g.flagY + 16); ctx.fill()
  const cx = g.level.castleCol * TILE - cam, cy = 12 * TILE, pat = ctx.createPattern(TS.B, 'repeat')
  if (pat) { ctx.fillStyle = pat; ctx.fillRect(cx, cy - 48, 80, 48); ctx.fillRect(cx + 16, cy - 80, 48, 32) }
  for (let i = 0; i < 3; i++) R(ctx, '#fcfcfc', cx + 16 + i * 20, cy - 88, 8, 8)
  for (let i = 0; i < 5; i += 2) R(ctx, '#fcfcfc', cx + i * 16, cy - 56, 12, 8)
  R(ctx, '#000', cx + 32, cy - 24, 16, 24); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx + 40, cy - 24, 8, Math.PI, 0); ctx.fill()
}
function lava(ctx, x, y, top) {
  const t = Math.floor(performance.now() / 140)
  R(ctx, '#d82800', x, y, TILE, TILE)
  if (top) for (let i = 0; i < 16; i += 4) R(ctx, '#fc9838', x + i, y + ((i / 4 + t) % 2 ? 0 : 2), 4, 3)
}
function card(ctx, g, S) {
  R(ctx, '#000', 0, 0, VW, VH); ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fcfcfc'
  if (g.card.msg) { g.card.msg.forEach((t, i) => ctx.fillText(t, VW / 2, 96 + i * 16)); return }
  ctx.fillText('WORLD ' + g.card.world, VW / 2, 88); ctx.drawImage(S.mario.small.idle, VW / 2 - 28, 108); ctx.fillText('x  ' + g.card.lives, VW / 2 + 14, 122)
  if (g.card.hint?.length) { ctx.fillStyle = '#d82800'; g.card.hint.forEach((t, i) => ctx.fillText(t, VW / 2, 190 + i * 14)) }
  if (g.card.best) { ctx.fillStyle = '#fcd000'; ctx.fillText('BEST ' + g.card.best, VW / 2, 160) }
}

export function render(g, ctx, S) {
  ctx.imageSmoothingEnabled = false; ctx.textAlign = 'left'
  if (g.card) return card(ctx, g, S)
  const cam = Math.floor(g.cam), th = g.level.theme, TS = th === 'under' ? S.tilesU : th === 'castle' ? S.tilesC : th === 'water' ? S.tilesW : S.tiles
  R(ctx, g.level.sky || (th === 'over' || th === 'tree' ? '#5c94fc' : th === 'water' ? '#0a5c9c' : '#000'), 0, 0, VW, VH)
  if (g.level.dryFrom != null) R(ctx, '#5c94fc', Math.max(0, g.level.dryFrom * TILE - cam), 0, VW, VH) // phần trên bờ
  const shaking = g.shake > 0
  if (shaking) { ctx.save(); ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4)) } // rung màn hình
  if (th === 'over' || th === 'tree') scenery(ctx, cam, th === 'over')
  for (const i of g.items) i.draw(ctx, cam, S)
  for (const e of g.enemies) e.draw(ctx, cam, S)
  const player = () => { if (!g.player.hidden) g.player.draw(ctx, cam, S) }
  if (g.behind) player() // đang chui vào/ra ống: Mario nằm sau ống

  // tiles (kèm hiệu ứng nảy khi bị đụng từ dưới); 'H' = khối ẩn, không vẽ
  const bumps = new Map(g.bumps.map((b) => [b.r * g.level.cols + b.c, b]))
  const c0 = Math.floor(cam / TILE)
  for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c0 + VW / TILE + 1 && c < g.level.cols; c++) {
    const ch = g.level.grid[r][c]; if (ch === ' ' || ch === 'H') continue
    if (ch === 'L') { lava(ctx, c * TILE - cam, r * TILE, r === 12 || g.level.grid[r - 1][c] !== 'L'); continue }
    const b = bumps.get(r * g.level.cols + c)
    ctx.drawImage(TS[ch], c * TILE - cam, r * TILE + (b ? -Math.round(Math.sin((b.t / 8) * Math.PI) * 5) : 0))
  }
  if (g.level.flagCol != null) goal(ctx, g, TS, cam)
  if (g.level.labels) { ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fcfcfc'; for (const l of g.level.labels) ctx.fillText(l.t, l.x - cam, l.y) }
  if (!g.behind) player()
  for (const f of g.fx) f.draw(ctx, cam, S)
  if (shaking) ctx.restore()
  const bb = g.enemies.find((e) => e.showBar && e.active && e.state !== 'flipped') // thanh máu Bowser thật
  if (bb) {
    ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = bb.rage ? '#fc7400' : '#fcfcfc'; ctx.fillText('BOWSER', VW / 2, 12)
    const w = 12, gap = 2, x0 = Math.round(VW / 2 - (bb.maxHp * (w + gap) - gap) / 2)
    for (let i = 0; i < bb.maxHp; i++) { R(ctx, '#fcfcfc', x0 + i * (w + gap) - 1, 16, w + 2, 7); R(ctx, i < bb.hp ? (bb.rage ? '#fc7400' : '#d82800') : '#3c0000', x0 + i * (w + gap), 17, w, 5) }
  }
}
