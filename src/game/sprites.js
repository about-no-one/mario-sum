// Sprite pixel-art 16 px dựng từ chuỗi ký tự -> canvas ngoài màn hình (không cần file ảnh).
const COLORS = { r: '#d82800', u: '#2038ec', b: '#6b3a0c', s: '#fc9838', y: '#fcd000', w: '#fcfcfc', k: '#000000',
  n: '#a05020', d: '#5c2a00', g: '#00a800', o: '#fc7400', t: '#f8d8a0' }

function sprite(rows, pal) {
  const col = { ...COLORS, ...pal }, c = document.createElement('canvas')
  c.width = 16; c.height = rows.length
  const x = c.getContext('2d')
  rows.forEach((row, y) => { for (let i = 0; i < 16; i++) { const v = col[row[i]]; if (v) { x.fillStyle = v; x.fillRect(i, y, 1, 1) } } })
  return c
}
export function drawSprite(ctx, img, x, y, flipX = false, flipY = false) {
  if (!flipX && !flipY) return ctx.drawImage(img, x, y)
  ctx.save(); ctx.translate(x + (flipX ? img.width : 0), y + (flipY ? img.height : 0))
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1); ctx.drawImage(img, 0, 0); ctx.restore()
}

const HEAD = ['....rrrrr.......', '...rrrrrrrrr....', '...bbbssbs......', '..bsbsssbsss....', '..bsbbsssbsss...', '..bbsssssbbbb...', '....sssssss.....']
const BODY = ['...rrurrr.......', '..rrrurrurrr....', '.rrrruuuuurrrr..', '.ssruyuuyurrss..', '.sssuuuuuuusss..', '.ssuuuuuuuuuss..']
const LEGS = {
  idle: ['...uuu....uuu...', '..bbb......bbb..', '.bbbb......bbbb.'],
  w1: ['...uuuu.uuu.....', '..bbbb..bbbb....', '.bbbbb...bbb....'],
  w2: ['....uuuuuu......', '...bbbbbbb......', '...bbbbbb.......'],
  jump: ['..uuu.....uuu...', '.bbbb......bbbb.', 'bbbbb.......bbbb'],
}

// ---- Mario lớn: vẽ tay 16x32 = đầu 8 + thân 12 + chân 12 hàng ----
const HEAD_B = [...HEAD, '....sssss.......']
const TORSO_B = ['...rrrrurrr.....', '..rrrrruurrrr...', '.rrrrruuuurrrr..', '.rrrrruuuuurrr..', '.sssruyuuyursss.', '.sssuuuuuuuusss.',
  '..ssuuuuuuuuss..', '...uuuuuuuuuu...', '...uuuuuuuuuu...', '..uuuuuuuuuuuu..', '..uuuuuuuuuuuu..', '..uuuuu..uuuuu..']
const LEGS_B = {
  idle: ['..uuuuu..uuuuu..', '..uuuuu..uuuuu..', '..uuuuu..uuuuu..', '..uuuuu..uuuuu..', '..uuuuu..uuuuu..', '..uuuuu..uuuuu..', '..uuuuu..uuuuu..',
    '..uuuu....uuuu..', '.bbbbb....bbbbb.', 'bbbbbbb..bbbbbbb', 'bbbbbbb..bbbbbbb', 'bbbbbb....bbbbbb'],
  w1: ['..uuuuuuuuuuuu..', '..uuuuu..uuuuu..', '..uuuuu...uuuuu.', '.uuuuu.....uuuu.', '.uuuu.......uuu.', 'uuuuu.......uuu.', 'uuuu.........uu.',
    'bbbb.........bb.', 'bbbbb.......bbbb', 'bbbbbb.....bbbbb', 'bbbbbb.....bbbbb', '.bbbb.......bbb.'],
  w2: ['..uuuuuuuuuuuu..', '..uuuuuuuuuuuu..', '...uuuuuuuuuu...', '...uuuuu.uuuuu..', '...uuuuu.uuuuu..', '...uuuuu.uuuuu..', '...uuuu...uuuu..',
    '...uuuu...uuuu..', '..bbbbb...bbbb..', '.bbbbbb...bbbbb.', '.bbbbbb...bbbbb.', '..bbbb.....bbb..'],
  jump: ['..uuuuuuuuuuuu..', '.uuuuuuuuuuuuuu.', '.uuuuu....uuuuuu', 'uuuuu......uuuuu', 'uuuuu.......uuuu', 'bbbbb.......uuuu', 'bbbbbb......bbbb',
    '.bbbbb......bbbb', '................', '................', '................', '................'],
}
const CROUCH_B = [...HEAD, '..rrrrurrrr.....', '.rrrrruuurrrr...', '.sssruyuuyursss.', '.sssuuuuuuuusss.', '..ssuuuuuuuuss..',
  '..uuuuuuuuuuuu..', '.bbbbbuuuuubbbb.', 'bbbbbbb..bbbbbbb', 'bbbbbbb..bbbbbbb']
const rep = (a, n) => a.flatMap((r) => Array(n).fill(r))
const big = (rows) => [...rows.slice(0, 7), rows[6], ...rep(rows.slice(7, 13), 3), ...rep(rows.slice(13), 2)] // 16 -> 32 hàng
const mirror = (r) => [...r.padEnd(16, '.')].reverse().join('')

const GOOMBA = ['.....nnnnnn.....', '...nnnnnnnnnn...', '..nnnnnnnnnnnn..', '.nnkknnnnnnkknn.', '.nwwwknnnnkwwwn.', '.nwwwwnnnnwwwwn.',
  'nnnwwknnnnkwwnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', '.nnnnttttttnnnn.', '..nnttttttttnn..', '....tttttttt....']
const G_FEET = ['...dddd..dddd...', '..dddddd.dddddd.', '..dddddd..ddddd.', '...dddd....dddd.']
const G_SQUISH = ['....nnnnnnnn....', '..nnnnnnnnnnnn..', '.nnwwknnnnkwwnn.', 'nnnnnnnnnnnnnnnn', '.nnttttttttttnn.', '..ddddttttdddd..', '..dddd....dddd..', '................']
const KOOPA = ['......tttt......', '.....tttttt.....', '.....tttkkt.....', '.....tttkwt.....', '......tttttt....', '.......ttt......', '....gggggg......',
  '...ggwwwwgg.....', '..gggwwwwggg....', '.gggwgwwgwggg...', '.ggwwwwwwwwgg...', 'gggwwgwwgwwggg..', 'gggwwwwwwwwggg..', 'ggggwwwwwwgggg..',
  '.ggggggggggggt..', '..gggggggggttt..', '...ttttttttt....', '...tttttttt.....', '..ttt....ttt....', '..ttt....ttt....']
const K_FEET_A = ['..tttt...tttt...', '.ttt.....ttt....', '.ttt.....ttt....', '.kkkk....kkkk...']
const K_FEET_B = ['...ttt.ttt......', '....ttttttt.....', '....ttt.ttt.....', '...kkkk.kkkk....']
const SHELL = ['................', '.....gggggg.....', '...gggwwwwggg...', '..ggwwwwwwwwgg..', '.gggwwgwwgwwggg.', '.ggwwwwwwwwwwgg.', 'gggwwgwwwwgwwggg',
  'ggwwwwwwwwwwwwgg', 'gggwwgwwwwgwwggg', '.ggggwwwwwwgggg.', '.ggggggggggggtt.', '..gggggggggtttt.', '...tttttttttt...', '....tttttttt....', '................', '................']
const MUSH = ['.....rrrrrr.....', '...rrrrrrrrrr...', '..rrwwrrrrwwrr..', '.rrwwwwrrwwwwrr.', '.rrwwwwrrwwwwrr.', 'rrrrwwrrrrwwrrrr', 'rrrrrrrrrrrrrrrr',
  'rrrrrrrrrrrrrrrr', '..ttkttttkttt...', '..ttkttttkttt...', '...tttttttttt...', '....ttttttt.....', '................', '................', '................', '................']
const FLOWER = ['.....oooooo.....', '....orrrrrro....', '...orryyyyrro...', '...oryyyyyyro...', '...orryyyyrro...', '....orrrrrro....', '.....oooooo.....',
  '.g....gg....g...', '.gg...gg...gg...', '..gg..gg..gg....', '...gggggggg.....', '.....gggg.......', '......gg........', '......gg........', '................', '................']

// ---- tile procedural (16x16) ----
const tc = (fn) => { const c = document.createElement('canvas'); c.width = c.height = 16; fn(c.getContext('2d')); return c }
const R = (x, col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h) }
const QM = ['..kkkk..', '.kkkkkk.', 'kk....kk', '.....kk.', '...kkk..', '...kk...', '........', '...kk...']
const box = (x, base, hi, lo) => { R(x, base, 0, 0, 16, 16); R(x, hi, 0, 0, 16, 1); R(x, hi, 0, 0, 1, 16); R(x, lo, 0, 15, 16, 1); R(x, lo, 15, 0, 1, 16) }
const CROUCH = [...HEAD, '...rrurrr.......', '..rrrurrurrr....', '.rrrruuuuurrrr..', '.ssruyuuyurrss..', '.sssuuuuuuusss..', '..uuuuuuuuuuu...',
  '..uuu....uuu....', '.bbbb....bbbb...', 'bbbbb....bbbbb..']
const STAR = ['.......yy.......', '.......yy.......', '......yyyy......', '.....yyyyyy.....', 'yyyyyyyyyyyyyyyy', '.yyyyykyykyyyyy.', '..yyyykyykyyyy..',
  '...yyyyyyyyyy...', '....yyyyyyyy....', '...yyyyyyyyyy...', '...yyyyyyyyyy...', '..yyyyy..yyyyy..', '..yyyy....yyyy..', '.yyyy......yyyy.', '.yyy........yyy.', '................']
const STAR_PALS = [{ r: '#000000', u: '#fcfcfc' }, { r: '#fc9838', u: '#d82800' }, { r: '#fcd000', u: '#00a800' }]

// bộ tile theo chủ đề: mặt đất (cam) / hầm ngầm (xanh)
function tiles(base, hi, line) {
  const T = {}
  T.G = tc((x) => { R(x, base, 0, 0, 16, 16); R(x, hi, 0, 0, 16, 1); R(x, line, 0, 7, 16, 1); R(x, line, 0, 15, 16, 1)
    R(x, line, 7, 0, 1, 7); R(x, line, 3, 8, 1, 7); R(x, line, 11, 8, 1, 7) })
  T.B = tc((x) => { R(x, base, 0, 0, 16, 16); for (const y of [3, 7, 11, 15]) R(x, line, 0, y, 16, 1)
    ;[[7, 0], [3, 4], [11, 4], [7, 8], [3, 12], [11, 12]].forEach(([a, b]) => R(x, line, a, b, 1, 3)); R(x, hi, 0, 0, 16, 1) })
  T.Q = tc((x) => { box(x, '#fc9838', '#fcd000', '#a04000'); R(x, '#000', 1, 1, 1, 1); R(x, '#000', 14, 1, 1, 1); R(x, '#000', 1, 14, 1, 1); R(x, '#000', 14, 14, 1, 1)
    QM.forEach((row, j) => [...row].forEach((ch, i) => ch === 'k' && R(x, '#7c3800', 4 + i, 4 + j, 1, 1))) })
  T.M = T.Q; T.T = T.Q
  T.U = tc((x) => { box(x, '#a05020', '#d08040', '#5c2a00') })
  T.S = tc((x) => { box(x, '#d8a860', '#fce8b0', '#785018'); R(x, '#785018', 14, 1, 1, 14) })
  const pipeBase = (x) => { R(x, '#00a800', 0, 0, 16, 16) }
  T.a = tc((x) => { pipeBase(x); R(x, '#80d010', 3, 1, 3, 15); R(x, '#000', 0, 0, 16, 1); R(x, '#000', 0, 0, 1, 16); R(x, '#000', 0, 15, 16, 1) })
  T.b = tc((x) => { pipeBase(x); R(x, '#005800', 11, 1, 4, 15); R(x, '#000', 0, 0, 16, 1); R(x, '#000', 15, 0, 1, 16); R(x, '#000', 0, 15, 16, 1) })
  T.c = tc((x) => { R(x, '#00a800', 1, 0, 15, 16); R(x, '#80d010', 4, 0, 3, 16); R(x, '#000', 1, 0, 1, 16) })
  T.d = tc((x) => { R(x, '#00a800', 0, 0, 14, 16); R(x, '#005800', 10, 0, 4, 16); R(x, '#000', 14, 0, 1, 16) })
  // ống nằm ngang (lối ra hầm ngầm): e/f = miệng ống trên/dưới, h/i = thân ống trên/dưới
  T.e = tc((x) => { pipeBase(x); R(x, '#80d010', 1, 3, 15, 3); R(x, '#000', 0, 0, 16, 1); R(x, '#000', 0, 0, 1, 16) })
  T.f = tc((x) => { pipeBase(x); R(x, '#005800', 1, 10, 15, 5); R(x, '#000', 0, 15, 16, 1); R(x, '#000', 0, 0, 1, 16) })
  T.h = tc((x) => { pipeBase(x); R(x, '#80d010', 0, 3, 16, 3); R(x, '#000', 0, 0, 16, 1) })
  T.i = tc((x) => { pipeBase(x); R(x, '#005800', 0, 10, 16, 5); R(x, '#000', 0, 15, 16, 1) })
  T.j = tc((x) => { pipeBase(x); R(x, '#80d010', 3, 0, 3, 15); R(x, '#000', 0, 15, 16, 1); R(x, '#000', 0, 0, 1, 16) })
  T.k = tc((x) => { pipeBase(x); R(x, '#005800', 11, 0, 4, 15); R(x, '#000', 0, 15, 16, 1); R(x, '#000', 15, 0, 1, 16) })
  T.C = T.B
  T.Y = tc((x) => { R(x, '#000', 0, 0, 16, 16); R(x, '#505050', 0, 0, 16, 2); R(x, '#505050', 0, 14, 16, 2); R(x, '#bcbcbc', 3, 5, 5, 6); R(x, '#000', 4, 7, 3, 3); R(x, '#bcbcbc', 9, 4, 4, 2); R(x, '#bcbcbc', 9, 10, 4, 2) })
  T.y = tc((x) => { R(x, '#000', 0, 0, 16, 16); R(x, '#505050', 0, 0, 16, 1); R(x, '#505050', 3, 3, 10, 2); R(x, '#505050', 3, 9, 10, 2); R(x, '#505050', 0, 15, 16, 1) })
  T.P = tc((x) => { R(x, '#00a800', 0, 0, 16, 16); R(x, '#80d010', 0, 0, 16, 3); R(x, '#005800', 0, 13, 16, 3); R(x, '#005800', 4, 6, 3, 3); R(x, '#005800', 10, 6, 3, 3) })
  T.N = tc((x) => { R(x, '#a05020', 5, 0, 6, 16); R(x, '#5c2a00', 5, 0, 1, 16); R(x, '#5c2a00', 10, 0, 1, 16); R(x, '#d08040', 7, 0, 1, 16) })
  T.R = tc((x) => { R(x, '#a0a0a0', 0, 0, 16, 16); R(x, '#fcfcfc', 0, 0, 16, 2); R(x, '#000', 0, 2, 16, 1); R(x, '#505050', 0, 13, 16, 3)
    for (let i = 0; i < 16; i += 8) { R(x, '#000', i, 5, 4, 1); R(x, '#000', i + 4, 8, 4, 1) } })
  return T
}

const buildMario = (form, pal) => {
  const o = {}
  for (const [pose, legs] of Object.entries(LEGS)) {
    o[pose] = sprite(form === 'small' ? [...HEAD, ...BODY, ...legs] : [...HEAD_B, ...TORSO_B, ...LEGS_B[pose]], pal)
  }
  if (form !== 'small') o.crouch = sprite(CROUCH_B, pal)
  return o
}

let cache
export function getSprites() {
  if (cache) return cache
  cache = {
    mario: { small: buildMario('small', {}), big: buildMario('big', {}), fire: buildMario('big', { r: '#fcfcfc', u: '#d82800' }) },
    // Mario bất tử: đổi bảng màu liên tục
    marioStar: STAR_PALS.map((pal) => ({ small: buildMario('small', pal), big: buildMario('big', pal), fire: buildMario('big', pal) })),
    tiles: tiles('#c84c0c', '#fc9838', '#000'), tilesU: tiles('#0058f8', '#3cbcfc', '#001868'), tilesC: tiles('#7c7c7c', '#bcbcbc', '#000'), tilesW: tiles('#127a6a', '#5cd8c8', '#04382c'),
    koopaR: [sprite([...KOOPA, ...K_FEET_A], { g: '#d82800' }), sprite([...KOOPA, ...K_FEET_B], { g: '#d82800' })], shellR: sprite(SHELL, { g: '#d82800' }),
    buzzy: sprite(SHELL, { g: '#1c2c8c', w: '#7cb4fc' }),
    goomba: [sprite([...GOOMBA, ...G_FEET]), sprite([...GOOMBA, ...G_FEET.map(mirror)])], goombaSquish: sprite(G_SQUISH),
    koopa: [sprite([...KOOPA, ...K_FEET_A]), sprite([...KOOPA, ...K_FEET_B])], shell: sprite(SHELL),
    mushroom: sprite(MUSH), oneup: sprite(MUSH, { r: '#00a800' }), flower: sprite(FLOWER),
    star: [sprite(STAR), sprite(STAR, { y: '#fc7400' })],
  }
  return cache
}
