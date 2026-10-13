import { TILE, ROWS, SOLID } from './constants.js'

export const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

export function solidAt(level, c, r) {
  if (c < 0 || c >= level.cols) return true  // tường vô hình hai bên
  if (r < 0 || r >= ROWS) return false       // trần mở, hố sâu
  return SOLID.includes(level.grid[r][c])
}
export function tilesHit(level, e) {
  const out = [], c0 = Math.floor(e.x / TILE), c1 = Math.floor((e.x + e.w - 0.001) / TILE)
  const r0 = Math.floor(e.y / TILE), r1 = Math.floor((e.y + e.h - 0.001) / TILE)
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solidAt(level, c, r)) out.push([c, r])
  return out
}
// Di chuyển theo từng trục. Trả về true nếu đụng tường.
export function moveX(e, level) {
  e.x += e.vx
  const h = tilesHit(level, e); if (!h.length) return false
  e.x = e.vx > 0 ? Math.min(...h.map((t) => t[0])) * TILE - e.w : (Math.max(...h.map((t) => t[0])) + 1) * TILE
  return true
}
// Trả về 'landed' khi chạm đất, mảng tile khi đụng trần, null nếu không va chạm.
export function moveY(e, level) {
  e.y += e.vy; e.ground = false
  const h = tilesHit(level, e); if (!h.length) return null
  if (e.vy >= 0) { e.y = Math.min(...h.map((t) => t[1])) * TILE - e.h; e.vy = 0; e.ground = true; return 'landed' }
  const r = Math.max(...h.map((t) => t[1]))
  e.y = (r + 1) * TILE; e.vy = 0
  return h.filter((t) => t[1] === r)
}
