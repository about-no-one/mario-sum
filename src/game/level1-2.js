import { ROWS } from './constants.js'
// World 1-2 (hầm ngầm): bố cục tự thiết kế theo tinh thần bản gốc – trần gạch, ống cống, Koopa/Buzzy Beetle, cầu thang và cột cờ.
export const WIDTH = 140, FLAG_COL = 130, CASTLE_COL = 134

export function buildLevel2() {
  const g = Array.from({ length: ROWS }, () => Array(WIDTH).fill(' '))
  const gaps = [[41, 42], [75, 77]]
  for (let c = 0; c < WIDTH; c++) { g[0][c] = 'B'; g[1][c] = 'B'; g[2][c] = 'B'; if (gaps.some(([a, b]) => c >= a && c <= b)) continue; g[12][c] = 'G'; g[13][c] = 'G' }
  for (let r = 3; r < 12; r++) g[r][0] = 'B'
  const at = (r, c, s) => [...s].forEach((ch, i) => { g[r][c + i] = ch })
  const pipe = (c, h) => { for (let i = 0; i < h; i++) { const r = 12 - h + i; g[r][c] = i ? 'c' : 'a'; g[r][c + 1] = i ? 'd' : 'b' } }
  const stairs = (c, n, up) => { for (let i = 0; i < n; i++) for (let j = 0; j < (up ? i + 1 : n - i); j++) g[11 - j][c + i] = 'S' }

  g[8][11] = 'Q'; at(8, 16, 'BBMBB'); at(4, 17, 'BBB')
  pipe(22, 2); pipe(30, 3); at(8, 36, 'BBBB')
  pipe(48, 2); at(8, 52, 'BQBQB'); g[4][54] = 'Q'
  pipe(60, 3); pipe(66, 4); at(8, 69, 'BBB')
  at(8, 82, 'BBBBBB'); at(8, 84, 'B'); g[8][85] = 'Q'; pipe(92, 2)
  stairs(100, 4, true); stairs(106, 4, false); at(8, 112, 'BQB')
  stairs(116, 6, true); for (let r = 6; r < 12; r++) g[r][122] = 'S' // thấp hơn trần để còn chỗ nhảy
  g[11][FLAG_COL] = 'S'

  const goombas = [14, 19, 26, 33, 45, 51, 56, 58, 69, 71, 85, 88, 96, 98, 111, 114]
  const enemies = [...goombas.map((c) => ({ kind: 'goomba', c, r: 11 })), ...[38, 64, 90].map((c) => ({ kind: 'koopa', c, r: 11 })),
    ...[53, 80, 94].map((c) => ({ kind: 'buzzy', c, r: 11 }))]
  const coins = []
  for (let c = 36; c <= 39; c++) coins.push({ c, r: 7 })
  for (let c = 82; c <= 87; c++) coins.push({ c, r: 7 })
  for (let c = 55; c <= 58; c++) coins.push({ c, r: 10 })
  return { grid: g, cols: WIDTH, enemies, coins, theme: 'under', music: 'under', flagCol: FLAG_COL, castleCol: CASTLE_COL,
    spawn: { x: 40, y: 176 }, pipes: [{ c: 92, r: 10, to: 'warp', worlds: [2, 3, 4] }] } // ống cột 92 = Warp Zone ẩn
}
