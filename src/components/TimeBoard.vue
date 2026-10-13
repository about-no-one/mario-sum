<script setup>
import { computed } from 'vue'
import { hud, fmtTime, clearTimes } from '../game/state.js'
const levelId = (i) => `${Math.floor(i / 4) + 1}-${i % 4 + 1}`
const list = computed(() => hud.times[hud.pick] || [])
const date = (at) => (at ? new Date(at).toLocaleDateString('vi-VN', { dateStyle: 'short' }) : '')
const best = (i) => hud.times[i]?.[0]?.ms
const total = computed(() => { let s = 0, n = 0; for (let i = 0; i < 32; i++) { const b = best(i); if (b) { s += b; n++ } } return { s, n } })
const select = (i) => { if (i <= hud.unlocked) hud.pick = i }
const clear = () => { if (typeof confirm !== 'function' || confirm('Xóa toàn bộ bảng xếp hạng thời gian?')) clearTimes() }
</script>

<template>
  <div class="board">
    <h3>Màn {{ levelId(hud.pick) }} – Top 5 thời gian nhanh nhất</h3>
    <ol v-if="list.length" class="top">
      <li v-for="(e, i) in list" :key="i" :class="{ gold: i === 0 }">
        <span class="rk">#{{ i + 1 }}</span><b>{{ fmtTime(e.ms) }}</b><small>{{ date(e.at) }}</small>
      </li>
    </ol>
    <p v-else class="empty">Chưa có thời gian nào cho màn này. Hãy hoàn thành màn (không dùng chế độ khám phá) để lên bảng!</p>

    <h3>Kỷ lục từng màn</h3>
    <table class="grid" aria-label="Kỷ lục từng màn">
      <thead><tr><th></th><th v-for="s in 4" :key="s">{{ s }}</th></tr></thead>
      <tbody>
        <tr v-for="w in 8" :key="w">
          <th scope="row">W{{ w }}</th>
          <td v-for="s in 4" :key="s" :class="{ sel: hud.pick === (w - 1) * 4 + s - 1, lock: (w - 1) * 4 + s - 1 > hud.unlocked }">
            <button :disabled="(w - 1) * 4 + s - 1 > hud.unlocked" @click="select((w - 1) * 4 + s - 1)">{{ best((w - 1) * 4 + s - 1) ? fmtTime(best((w - 1) * 4 + s - 1)) : '—' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="sum" v-if="total.n">{{ total.n }}/32 màn có kỷ lục · tổng thời gian tốt nhất: <b>{{ fmtTime(total.s) }}</b></p>
    <p class="note">Chỉ tính lượt chơi không dùng chế độ khám phá. Thời gian không tính lúc tạm dừng, màn giới thiệu hay khi bị mất mạng.</p>
    <button class="clear" :disabled="!total.n" @click="clear">Xóa xếp hạng</button>
  </div>
</template>

<style scoped>
.board { text-align: left; font-size: 13px; display: grid; gap: 6px }
h3 { margin: 4px 0 0; font-size: 13px; color: var(--gold) }
.top { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px }
.top li { display: flex; align-items: baseline; gap: 10px; background: #ffffff10; border-radius: 4px; padding: 4px 8px }
.top .gold { background: #fcd00030 } .rk { width: 26px; color: #b9a8e0 } .top b { font-variant-numeric: tabular-nums; min-width: 72px } small { color: #b9a8e0; margin-left: auto }
.empty, .note { margin: 0; color: #b9a8e0; font-size: 12px } .sum { margin: 0; font-size: 12px }
.grid { border-collapse: collapse; width: 100%; font-size: 12px; font-variant-numeric: tabular-nums }
th, td { padding: 1px 2px; text-align: center } th { color: #b9a8e0; font-weight: 600; width: 34px }
td button { width: 100%; font: inherit; color: var(--cream); background: #ffffff12; border: 1px solid transparent; border-radius: 3px; padding: 3px 2px; cursor: pointer }
td.sel button { border-color: var(--gold); background: #fcd00026 } td button:disabled { opacity: .3; cursor: not-allowed }
.clear { justify-self: start; font: inherit; font-size: 12px; color: var(--cream); background: #ffffff1c; border: 1px solid #fff3; border-radius: 4px; padding: 3px 10px; cursor: pointer }
.clear:disabled { opacity: .35; cursor: not-allowed }
button:focus-visible { outline: 2px solid var(--gold); outline-offset: 1px }
</style>
