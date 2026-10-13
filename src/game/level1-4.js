import { ROWS } from './constants.js'
// World 1-4 (lâu đài): hố dung nham, thanh lửa xoay, cầu + Bowser, rìu, Toad.
// Màn rộng 100 cột => camera dừng đúng khi cầu (cột 84-96) lọt vừa màn hình.
export const WIDTH = 100, BRIDGE = { c0: 84, c1: 96, row: 12 }

export function buildLevel4() {
  const g = Array.from({ length: ROWS }, () => Array(WIDTH).fill(' '))
  const lava = [[16, 18], [27, 30], [38, 41], [53, 56], [66, 69]]
  for (let c = 0; c < WIDTH; c++) {
    for (let r = 0; r < 3; r++) g[r][c] = 'B'
    if (c >= 84) for (let r = 3; r < 5; r++) g[r][c] = 'B'
    if (lava.some(([a, b]) => c >= a && c <= b)) { g[12][c] = 'L'; g[13][c] = 'L'; continue }
    if (c >= BRIDGE.c0 && c <= BRIDGE.c1) { g[12][c] = 'R'; g[13][c] = 'L'; continue }
    g[12][c] = 'G'; g[13][c] = 'G'
  }
  for (let r = 3; r < 12; r++) g[r][0] = 'B'
  const blocks = (r, c0, c1) => { for (let c = c0; c <= c1; c++) g[r][c] = 'S' }
  blocks(10, 28, 29); blocks(9, 39, 40); blocks(10, 54, 55); blocks(10, 67, 68) // bậc đá giúp nhảy qua hố
  g[7][23] = 'U'; g[6][47] = 'U'; g[8][61] = 'U'; g[6][33] = 'U'                  // gốc thanh lửa
  const things = [{ kind: 'firebar', c: 23, r: 7, a: 0, dir: 1 }, { kind: 'firebar', c: 33, r: 6, a: 1.5, dir: -1 },
    { kind: 'firebar', c: 47, r: 6, a: 0.5, dir: 1 }, { kind: 'firebar', c: 61, r: 8, a: 2, dir: -1 },
    { kind: 'axe', c: 97, r: 11 }, { kind: 'toad', c: 99, r: 11 }]
  return { grid: g, cols: WIDTH, enemies: [{ kind: 'bowser', c: 90, r: 11, hp: 2, fake: 'goomba' }], coins: [], things, theme: 'castle', music: 'castle',
    spawn: { x: 32, y: 176 }, pipes: [], bridge: BRIDGE, boss: true }
}
