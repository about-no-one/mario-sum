import { ROWS } from './constants.js'
// Bố cục World 1-1 (xấp xỉ bản gốc). Ký tự: G đất, B gạch, Q hộp xu, M hộp power-up,
// C gạch nhiều xu, T hộp Starman, H khối ẩn 1-Up, U hộp đã dùng, S bậc thang, a/b/c/d ống cống (trên-trái, trên-phải, thân-trái, thân-phải).
export const WIDTH = 212, FLAG_COL = 198, CASTLE_COL = 202

export function buildLevel() {
  const g = Array.from({ length: ROWS }, () => Array(WIDTH).fill(' '))
  const gaps = [[69, 70], [86, 88], [152, 153]]
  for (let c = 0; c < WIDTH; c++) { if (gaps.some(([a, b]) => c >= a && c <= b)) continue; g[12][c] = 'G'; g[13][c] = 'G' }
  const at = (r, c, s) => [...s].forEach((ch, i) => { g[r][c + i] = ch })
  const pipe = (c, h) => { for (let i = 0; i < h; i++) { const r = 12 - h + i; g[r][c] = i ? 'c' : 'a'; g[r][c + 1] = i ? 'd' : 'b' } }
  const stairs = (c, n, up) => { for (let i = 0; i < n; i++) for (let j = 0; j < (up ? i + 1 : n - i); j++) g[11 - j][c + i] = 'S' }

  g[8][16] = 'Q'; at(8, 20, 'BMBQB'); g[4][22] = 'Q'; g[8][64] = 'H' // H = khối ẩn chứa 1-Up (chỉ hiện khi đội đầu từ dưới lên)
  pipe(28, 2); pipe(38, 3); pipe(46, 4); pipe(57, 4)
  at(8, 77, 'BMB'); at(4, 80, 'BBBBBBBB'); at(4, 91, 'BBBQ'); g[8][94] = 'C' // C = gạch 10 xu
  at(8, 100, 'BT'); at(8, 106, 'Q'); at(8, 109, 'Q'); at(8, 112, 'Q'); g[4][109] = 'M'
  at(8, 168, 'BBQB'); at(8, 118, 'B'); at(4, 121, 'BBB'); at(4, 128, 'BQQB'); at(8, 129, 'BB')
  stairs(134, 4, true); stairs(140, 4, false); stairs(148, 4, true); stairs(154, 4, false)
  pipe(163, 2); pipe(179, 2)
  stairs(181, 8, true); for (let r = 4; r < 12; r++) g[r][189] = 'S'
  g[11][FLAG_COL] = 'S'

  const goombas = [22, 40, 51, 53, 80, 82, 97, 99, 114, 116, 124, 126, 128, 130, 174, 176]
  const enemies = [...goombas.map((c) => ({ kind: 'goomba', c, r: 11 })), { kind: 'koopa', c: 107, r: 11 }]
  // pipes: ống cống đi vào được (bấm ↓ khi đứng trên miệng ống)
  return { grid: g, cols: WIDTH, enemies, coins: [], theme: 'over', music: 'over', flagCol: FLAG_COL, castleCol: CASTLE_COL,
    spawn: { x: 40, y: 176 }, pipes: [{ c: 57, r: 8, to: 'bonus', ret: { c: 163, r: 10 } }] }
}
