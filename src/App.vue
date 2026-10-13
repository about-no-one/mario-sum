<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import Hud from './components/Hud.vue'
import Overlay from './components/Overlay.vue'
import TouchPad from './components/TouchPad.vue'
import { attachKeyboard } from './game/input.js'
import { hud, toggleGod, persist } from './game/state.js'
import { setMuted } from './game/audio.js'

const game = ref(null)
const idle = () => ['title', 'over', 'win'].includes(hud.status)
function action() { if (hud.paused) game.value.togglePause(); else game.value.start() }
function onSystem(code) {
  if (code === 'Enter' || (code === 'Space' && idle())) { if (idle() || hud.paused) action() }
  else if (code === 'KeyP' || code === 'Escape') game.value.togglePause()
  else if (code === 'KeyM') toggleMute()
  else if (code === 'KeyG') toggleGod()
}
function toggleMute() { hud.muted = !hud.muted; setMuted(hud.muted); persist() }
const menuOpen = () => hud.paused || idle()
const isControl = (e) => ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SUMMARY'].includes(e.target?.tagName)
let detach
onMounted(() => {
  setMuted(hud.muted)
  detach = attachKeyboard(onSystem, (e) => menuOpen() && isControl(e))
  // ?level=5-2 : nhảy thẳng tới một màn (mở khóa tất cả để thử)
  const m = /^(\d)-(\d)$/.exec(new URLSearchParams(location.search).get('level') || '')
  if (m && m[1] >= 1 && m[1] <= 8 && m[2] >= 1 && m[2] <= 4) { hud.pick = (m[1] - 1) * 4 + (m[2] - 1); hud.unlocked = 31 }
})
onBeforeUnmount(() => detach && detach())
</script>

<template>
  <main class="shell">
    <Hud />
    <div class="stage">
      <GameCanvas ref="game" />
      <Overlay @action="action" @continue="(id) => game.continueFrom(id)" @save="(id) => game.saveTo(id)" />
      <div v-if="hud.notice" class="toast" role="status">{{ hud.notice }}</div>
    </div>
    <TouchPad />
    <p class="help">
      Di chuyển: <b>← →</b> / <b>A D</b> · Nhảy (A): <b>Space</b> / <b>↑</b> / <b>W</b> (giữ để nhảy cao) ·
      Chạy &amp; bắn lửa (B): <b>Shift</b> / <b>Z</b> · Ngồi / vào ống cống: <b>↓</b> (ống nằm ngang: <b>→</b>) · Tạm dừng / lưu game: <b>P</b> · Khám phá (bất tử): <b>G</b>
      · <button class="mute" @click="toggleMute">{{ hud.muted ? '🔇 Bật âm thanh' : '🔊 Tắt âm thanh' }} (M)</button>
    </p>
  </main>
</template>

<style scoped>
.shell { width: 100%; max-width: 768px; padding: 12px }
.stage { position: relative; border: 4px solid var(--brick); border-radius: 4px; line-height: 0 }
.toast { position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%); background: #000c; color: #fff; padding: 6px 12px; border-radius: 4px; font-size: 13px; line-height: 1.3; z-index: 2; white-space: nowrap }
.mute { font: inherit; font-size: 13px; color: var(--cream); background: #ffffff1c; border: 1px solid #fff3; border-radius: 4px; padding: 2px 8px; cursor: pointer }
.help { margin: 12px 4px 0; font-size: 14px; color: #cdbfee; line-height: 1.7 }
</style>
