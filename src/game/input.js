export const keys = { left: false, right: false, down: false, run: false, jump: false }
export const edge = { jumpPressed: false, firePressed: false }
let latchJ = false, latchF = false

const MAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyX: 'jump', KeyK: 'jump',
  ShiftLeft: 'run', ShiftRight: 'run', KeyZ: 'run', KeyJ: 'run', // B = chạy + bắn lửa
}

export function setKey(k, v) {
  if (v && k === 'jump' && !keys.jump) latchJ = true
  if (v && k === 'run' && !keys.run) latchF = true
  keys[k] = v
}
// Gọi mỗi bước logic để biết phím vừa được nhấn trong khung này.
export function pollEdges() { edge.jumpPressed = latchJ; edge.firePressed = latchF; latchJ = latchF = false }

export function attachKeyboard(onSystem, ignore = () => false) {
  const down = (e) => {
    // đang thao tác trong menu (nút/ô chọn): để trình duyệt xử lý Enter/Space, các phím hệ thống khác vẫn hoạt động
    if (ignore(e)) { if (!e.repeat && e.code !== 'Enter' && e.code !== 'Space') onSystem(e.code); return }
    if (!e.repeat) onSystem(e.code)
    const k = MAP[e.code]; if (!k) return
    e.preventDefault(); if (!e.repeat) setKey(k, true)
  }
  const up = (e) => { const k = MAP[e.code]; if (k) setKey(k, false) }
  const blur = () => Object.keys(keys).forEach((k) => (keys[k] = false))
  addEventListener('keydown', down); addEventListener('keyup', up); addEventListener('blur', blur)
  return () => { removeEventListener('keydown', down); removeEventListener('keyup', up); removeEventListener('blur', blur) }
}
