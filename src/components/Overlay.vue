<script setup>
import { computed, ref } from 'vue'
import { hud, toggleGod, exportText, importText, deleteSlot, notify, fmtTime } from '../game/state.js'
import SaveSlots from './SaveSlots.vue'
import TimeBoard from './TimeBoard.vue'
const emit = defineEmits(['action', 'continue', 'save'])
const idle = computed(() => !hud.paused && ['title', 'over', 'win'].includes(hud.status))
const show = computed(() => hud.paused || idle.value)
const title = computed(() => (hud.paused ? 'PAUSE' : { title: 'SUPER MARIO BROS.', over: 'GAME OVER', win: hud.final ? 'YOU WIN!' : 'COURSE CLEAR!' }[hud.status]))
const label = computed(() => (hud.paused ? 'Tiếp tục' : hud.status === 'title' ? 'Game mới' : 'Chơi lại'))
// chọn màn: 8 thế giới x 4 màn, mở khóa dần theo tiến độ
const world = computed(() => Math.floor(hud.pick / 4) + 1)
const stage = computed(() => (hud.pick % 4) + 1)
const idx = (w, s) => (w - 1) * 4 + (s - 1)
const choose = (w, s) => { hud.pick = Math.min(idx(w, s), hud.unlocked) }
const levelId = (i) => `${Math.floor(i / 4) + 1}-${i % 4 + 1}`
const hasSaves = computed(() => Object.values(hud.slots).some(Boolean))

function exportFile() {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportText()], { type: 'application/json' }))
  a.download = 'mario-vue-save.json'; a.click(); URL.revokeObjectURL(a.href)
}
const fileInput = ref(null)
async function onFile(e) {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
  notify(importText(await f.text()) ? 'Đã nhập dữ liệu lưu' : 'File không hợp lệ')
}
</script>

<template>
  <div v-if="show" class="overlay">
    <div class="inner">
      <h1 class="pix">{{ title }}</h1>
      <p v-if="hud.status === 'title' && !hud.paused">8 thế giới, 32 màn – Vue 3 + Canvas, chỉ frontend.</p>
      <p v-else-if="hud.final && !hud.paused">Cảm ơn bạn, Mario! Bạn đã cứu được công chúa!</p>
      <p v-if="!hud.paused && hud.status !== 'title'">Điểm: <strong>{{ hud.score }}</strong> · Xu: <strong>{{ hud.coins }}</strong>
        <template v-if="hud.assisted"> · <em>chế độ khám phá: không tính điểm cao</em></template></p>
      <p v-if="hud.paused" class="high">Thời gian màn này: <strong>{{ fmtTime(hud.runMs) }}</strong></p>
      <p v-if="idle && hud.high > 0" class="high">Điểm cao nhất: <strong>{{ hud.high.toLocaleString('vi-VN') }}</strong></p>

      <div v-if="idle" class="select pix">
        <div class="row"><span>THẾ GIỚI</span>
          <button v-for="w in 8" :key="w" :class="{ on: world === w }" :disabled="idx(w, 1) > hud.unlocked" @click="choose(w, stage)">{{ w }}</button></div>
        <div class="row"><span>MÀN</span>
          <button v-for="s in 4" :key="s" :class="{ on: stage === s }" :disabled="idx(world, s) > hud.unlocked" @click="choose(world, s)">{{ s }}</button></div>
      </div>

      <div class="actions">
        <button v-if="idle && hud.slots.auto" class="go pix alt" @click="emit('continue', 'auto')">Tiếp tục · {{ levelId(hud.slots.auto.levelIndex) }}</button>
        <button class="go pix" @click="emit('action')">{{ label }}</button>
      </div>

      <label class="god"><input type="checkbox" :checked="hud.god" @change="toggleGod" />
        <span><b>Chế độ khám phá</b> (bất tử, không tính giờ; rơi hố sẽ được đưa về chỗ an toàn)<small>Điểm chơi ở chế độ này không vào điểm cao nhất.</small></span></label>

      <details v-if="idle && hasSaves" class="box"><summary>Tải game đã lưu</summary>
        <SaveSlots mode="load" @load="(id) => emit('continue', id)" @remove="deleteSlot" /></details>
      <details v-if="idle" class="box"><summary>Xếp hạng thời gian</summary><TimeBoard /></details>
      <details v-if="hud.paused" class="box" open><summary>Lưu game (quay lại đầu màn {{ hud.world }})</summary>
        <SaveSlots mode="save" @save="(id) => emit('save', id)" /></details>

      <div class="io">
        <button @click="exportFile">⬇ Xuất file lưu</button>
        <button @click="fileInput.click()">⬆ Nhập file lưu</button>
        <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onFile" />
      </div>
      <p class="hint">Enter: bắt đầu · P: tạm dừng · G: bật/tắt chế độ khám phá</p>
    </div>
  </div>
</template>

<style scoped>
.overlay { position: absolute; inset: 0; display: flex; background: rgba(27, 18, 48, .88); overflow: auto; line-height: 1.4 }
.inner { margin: auto; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 12px; text-align: center; width: 100% }
h1 { margin: 0; font-size: clamp(16px, 4.6vw, 30px); color: var(--gold); text-shadow: 3px 3px 0 var(--red); line-height: 1.5 }
p { margin: 0; font-size: 14px } .hint { font-size: 12px; color: #cdbfee } .high { color: var(--gold) }
.select { display: grid; gap: 8px; font-size: 9px }
.row { display: flex; gap: 6px; align-items: center; justify-content: center } .row span { width: 76px; text-align: right; color: #b9a8e0 }
.row button { width: 28px; height: 28px; font: inherit; color: #fff; background: #ffffff1c; border: 2px solid #fff3; border-radius: 3px; cursor: pointer }
.row button.on { background: var(--red); border-color: #fff } .row button:disabled { opacity: .3; cursor: not-allowed }
.actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center }
.go { font-size: 12px; background: var(--red); color: #fff; border: 0; border-bottom: 5px solid #8a1210; padding: 12px 16px; border-radius: 4px; cursor: pointer }
.go.alt { background: #2a8a2a; border-bottom-color: #14500f }
.go:active { transform: translateY(3px); border-bottom-width: 2px }
.go:focus-visible, .row button:focus-visible, .io button:focus-visible, summary:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px }
.god { display: flex; gap: 8px; align-items: flex-start; text-align: left; font-size: 13px; max-width: 460px; background: #ffffff10; border-radius: 6px; padding: 8px 10px; cursor: pointer }
.god input { margin-top: 3px; accent-color: var(--gold); width: 16px; height: 16px } .god small { display: block; color: #b9a8e0; font-size: 11px }
.box { width: min(100%, 480px); text-align: left; font-size: 13px } summary { cursor: pointer; padding: 4px 0 8px; color: var(--cream) }
.io { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center }
.io button { font: inherit; font-size: 12px; color: var(--cream); background: #ffffff1c; border: 1px solid #fff3; border-radius: 4px; padding: 4px 10px; cursor: pointer }
@media (prefers-reduced-motion: reduce) { .go:active { transform: none } }
</style>
