import { ROWS } from './constants.js'
// Warp Zone: phòng ẩn có 3 ống cống, mỗi ống dẫn thẳng tới một thế giới (số hiển thị phía trên ống).
export function buildWarpRoom(worlds) {
  const W = 16, g = Array.from({ length: ROWS }, () => Array(W).fill(' '))
  for (let c = 0; c < W; c++) { g[12][c] = 'G'; g[13][c] = 'G'; for (let r = 0; r < 3; r++) g[r][c] = 'B' }
  for (let r = 3; r < 12; r++) { g[r][0] = 'B'; g[r][15] = 'B' }
  g[3][2] = 'c'; g[3][3] = 'd'; g[4][2] = 'j'; g[4][3] = 'k' // ống thả Mario xuống
  const pipes = [], labels = [{ t: 'WELCOME TO WARP ZONE!', x: 128, y: 62 }]
  worlds.forEach((w, i) => {
    const c = 6 + i * 3
    g[10][c] = 'a'; g[10][c + 1] = 'b'; g[11][c] = 'c'; g[11][c + 1] = 'd'
    pipes.push({ c, r: 10, to: 'world', world: w }); labels.push({ t: String(w), x: c * 16 + 16, y: 150 })
  })
  return { grid: g, cols: W, enemies: [], coins: [], theme: 'under', music: 'under', pipes, labels, drop: { x: 48, top: 3 * 16, bottom: 5 * 16 } }
}
