import { ROWS } from './constants.js'
// Phòng thưởng xu dưới lòng đất (1 màn hình). Mario rơi xuống từ ống trên trần (bên trái);
// lối ra là ống nằm ngang bên phải, đưa về vị trí `ret` (miệng ống) của màn chính.
export function buildUnderground(ret) {
  const W = 16, g = Array.from({ length: ROWS }, () => Array(W).fill(' '))
  for (let c = 0; c < W; c++) { g[12][c] = 'G'; g[13][c] = 'G'; for (let r = 0; r < 3; r++) g[r][c] = 'B' }
  for (let r = 3; r < 12; r++) g[r][0] = 'B'
  for (let r = 3; r < 10; r++) g[r][15] = 'B'
  for (let c = 4; c <= 11; c++) g[9][c] = 'B'                   // bục gạch
  g[3][2] = 'c'; g[3][3] = 'd'; g[4][2] = 'j'; g[4][3] = 'k'     // ống thả Mario xuống (miệng hướng xuống)
  g[10][14] = 'e'; g[11][14] = 'f'; g[10][15] = 'h'; g[11][15] = 'i' // ống ra
  const coins = []
  for (let c = 4; c <= 11; c++) { coins.push({ c, r: 11 }); coins.push({ c, r: 8 }) }
  for (let c = 5; c <= 10; c++) coins.push({ c, r: 5 })
  return { grid: g, cols: W, enemies: [], coins, theme: 'under', music: 'under', pipes: [],
    drop: { x: 48, top: 3 * 16, bottom: 5 * 16 }, exit: { c: 14, r: 10, ret } }
}
