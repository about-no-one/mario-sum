import { buildLevel } from './level1-1.js'
import { buildLevel2 } from './level1-2.js'
import { buildLevel4 } from './level1-4.js'
import { generateLevel } from './levelgen.js'
// 8 thế giới x 4 màn = 32 màn. 1-1, 1-2, 1-4 thiết kế tay; còn lại do bộ sinh màn tạo (cố định theo số màn).
const AUTHORED = { '1-1': buildLevel, '1-2': buildLevel2, '1-4': buildLevel4 }
export const LEVELS = []
for (let w = 1; w <= 8; w++) for (let l = 1; l <= 4; l++) { const id = `${w}-${l}`; LEVELS.push({ id, build: AUTHORED[id] || (() => generateLevel(w, l)) }) }
export const levelIndex = (w, l) => (w - 1) * 4 + (l - 1)
