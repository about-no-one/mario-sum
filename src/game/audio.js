let ac = null, muted = false
const A = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)() } catch { /* không có audio */ } } return ac }
export const audioCtx = A
export const unlockAudio = () => A()?.resume?.()
export const setMuted = (m) => { muted = m }
export const isMuted = () => muted

// Phát một nốt tại thời điểm tuyệt đối t (dùng cho cả SFX lẫn nhạc nền)
export function toneAbs(f0, f1, t, dur, type = 'square', vol = 0.05) {
  const a = A(); if (!a || muted) return
  const o = a.createOscillator(), g = a.createGain()
  o.type = type; o.frequency.setValueAtTime(f0, t)
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur)
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur)
}
function tone(f0, f1, dur, type = 'square', vol = 0.05, delay = 0) { const a = A(); if (a) toneAbs(f0, f1, a.currentTime + delay, dur, type, vol) }
const seq = (notes, step, type) => notes.forEach((f, i) => tone(f, f, step * 1.4, type || 'square', 0.05, i * step))

const SFX = {
  jump: () => tone(300, 760, 0.2), jumpBig: () => tone(200, 560, 0.22),
  coin: () => { tone(988, 988, 0.07); tone(1319, 1319, 0.4, 'square', 0.05, 0.07) },
  swim: () => tone(380, 640, 0.12, 'sine', 0.07),
  stomp: () => tone(220, 70, 0.12), kick: () => tone(160, 80, 0.12),
  bump: () => tone(120, 90, 0.08, 'triangle', 0.12), break: () => tone(320, 50, 0.25, 'sawtooth', 0.04),
  fire: () => tone(900, 300, 0.1), appear: () => tone(200, 900, 0.35, 'triangle', 0.1),
  powerup: () => seq([523, 659, 784, 1047, 784, 1047], 0.07), shrink: () => tone(700, 100, 0.45, 'triangle', 0.1),
  pipe: () => tone(520, 130, 0.4, 'triangle', 0.1),
  oneup: () => seq([659, 784, 1319, 1047, 1175, 1568], 0.08), tick: () => tone(1300, 1300, 0.03),
  flag: () => tone(1600, 180, 1.3, 'triangle', 0.07), die: () => seq([494, 392, 330, 262, 196], 0.14),
  win: () => seq([523, 659, 784, 1047, 784, 1047, 1319], 0.12),
}
export const sfx = (name) => SFX[name]?.()
