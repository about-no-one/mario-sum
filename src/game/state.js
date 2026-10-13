import { reactive } from 'vue'
import { readSave, writeSave, sanitize, SLOT_IDS } from './save.js'

// Trạng thái hiển thị (HUD + màn hình + tiến độ) – Vue theo dõi, engine ghi vào.
export const hud = reactive({
  status: 'title', // title | intro | playing | dying | flag | castle | count | message | win | over ...
  score: 0, coins: 0, lives: 3, time: 400, world: '1-1', paused: false, muted: false, final: false, pick: 0,
  unlocked: 0, high: 0, god: false, assisted: false, notice: '', times: {}, runMs: 0,
  slots: { auto: null, 1: null, 2: null, 3: null },
})

export function applySaveData(d) {
  hud.unlocked = d.unlocked; hud.high = d.high; hud.god = d.settings.god; hud.muted = d.settings.muted
  hud.slots = JSON.parse(JSON.stringify(d.slots)); hud.times = JSON.parse(JSON.stringify(d.times))
}
const toData = () => ({ version: 1, slots: JSON.parse(JSON.stringify(hud.slots)), settings: { god: hud.god, muted: hud.muted }, unlocked: hud.unlocked, high: hud.high, times: JSON.parse(JSON.stringify(hud.times)) })
export function persist() { writeSave(toData()) }
applySaveData(readSave())

let noticeTimer = 0
export function notify(text) { hud.notice = text; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { hud.notice = '' }, 2600) }
export function deleteSlot(id) { hud.slots[id] = null; persist() }
// Chế độ khám phá: bật giữa chừng thì ván này không được tính điểm cao
export function toggleGod() { hud.god = !hud.god; if (hud.god && hud.status !== 'title') hud.assisted = true; persist() }
// ---- xếp hạng thời gian hoàn thành từng màn ----
export function fmtTime(ms) {
  const s = ms / 1000; if (s < 60) return s.toFixed(2) + 's'
  const m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(2).padStart(5, '0')}`
}
export const bestTime = (idx) => hud.times[idx]?.[0]?.ms ?? null
// Ghi một thời gian; trả về { rank (1-5, hoặc 0 nếu ngoài top 5), record (phá kỷ lục cá nhân) }
export function recordTime(idx, ms) {
  const prev = bestTime(idx) ?? Infinity, entry = { ms, at: Date.now() }, list = [...(hud.times[idx] || []), entry].sort((a, b) => a.ms - b.ms)
  const rank = list.indexOf(entry) + 1
  if (rank <= 5) { hud.times[idx] = list.slice(0, 5); persist() }
  return { rank: rank <= 5 ? rank : 0, record: ms < prev }
}
export function clearTimes() { hud.times = {}; persist() }
export const exportText = () => JSON.stringify(toData(), null, 2)
export function importText(text) {
  try { const d = sanitize(JSON.parse(text)); if (!d) return false; applySaveData(d); persist(); return true } catch { return false }
}
export { SLOT_IDS }
