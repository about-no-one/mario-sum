// Lưu trữ tiến độ trong localStorage (có bộ nhớ tạm dự phòng khi trình duyệt chặn localStorage).
// Cấu trúc: { version, slots: { auto, 1, 2, 3 }, settings: { god, muted }, unlocked, high, times: { [chỉ số màn]: [{ ms, at } x tối đa 5] } }
// Mỗi ô lưu là ảnh chụp tại ĐẦU MÀN: { levelIndex, score, coins, lives, form, savedAt, assisted }.
const KEY = 'mario-vue-save-v1', OLD_UNLOCK = 'mario-vue-unlocked'
let mem = null

export const SLOT_IDS = ['auto', '1', '2', '3']
export const emptySave = () => ({ version: 1, slots: { auto: null, 1: null, 2: null, 3: null }, settings: { god: false, muted: false }, unlocked: 0, high: 0, times: {} })
const clampInt = (v, lo, hi, def) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.floor(n))) : def }

function sanitizeSnap(s) {
  if (!s || typeof s !== 'object') return null
  const n = Number(s.levelIndex); if (!Number.isFinite(n) || n < 0 || n >= 32) return null // chỉ số màn ngoài khoảng = dữ liệu hỏng
  const levelIndex = Math.floor(n)
  return { levelIndex, score: clampInt(s.score, 0, 99999999, 0), coins: clampInt(s.coins, 0, 99, 0), lives: clampInt(s.lives, 1, 99, 3),
    form: ['small', 'big', 'fire'].includes(s.form) ? s.form : 'small', savedAt: clampInt(s.savedAt, 0, 8.64e15, 0), assisted: !!s.assisted }
}
// Xếp hạng thời gian: mỗi màn giữ tối đa 5 thời gian tốt nhất (ms), sắp tăng dần
function sanitizeTimes(raw) {
  const out = {}
  if (raw && typeof raw === 'object') for (let i = 0; i < 32; i++) {
    const arr = raw[i]; if (!Array.isArray(arr)) continue
    const list = arr.map((e) => ({ ms: clampInt(e?.ms, 0, 3600000, 0), at: clampInt(e?.at, 0, 8.64e15, 0) })).filter((e) => e.ms >= 500).sort((a, b) => a.ms - b.ms).slice(0, 5)
    if (list.length) out[i] = list
  }
  return out
}
// Kiểm tra & làm sạch dữ liệu (dùng khi đọc kho lưu trữ hoặc nhập file) – trả về null nếu không hợp lệ
export function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out = emptySave()
  out.unlocked = clampInt(raw.unlocked, 0, 31, 0); out.high = clampInt(raw.high, 0, 99999999, 0)
  out.settings.god = !!raw.settings?.god; out.settings.muted = !!raw.settings?.muted
  for (const k of SLOT_IDS) out.slots[k] = sanitizeSnap(raw.slots?.[k])
  out.times = sanitizeTimes(raw.times)
  return out
}
export function readSave() {
  try {
    const txt = localStorage.getItem(KEY)
    if (txt) return sanitize(JSON.parse(txt)) || emptySave()
    const d = emptySave(); d.unlocked = clampInt(localStorage.getItem(OLD_UNLOCK), 0, 31, 0) // tương thích bản cũ
    return mem ? sanitize(mem) || d : d
  } catch { return mem ? sanitize(mem) || emptySave() : emptySave() }
}
export function writeSave(data) { mem = data; try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* bỏ qua */ } }
