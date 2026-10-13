<script setup>
import { computed } from 'vue'
import { hud, SLOT_IDS } from '../game/state.js'
const props = defineProps({ mode: { type: String, default: 'load' } }) // load: tải/xóa · save: ghi đè ô 1-3
const emit = defineEmits(['load', 'save', 'remove'])
const ids = computed(() => (props.mode === 'save' ? SLOT_IDS.slice(1) : SLOT_IDS))
const label = (id) => (id === 'auto' ? 'Tự động' : 'Ô ' + id)
const levelId = (i) => `${Math.floor(i / 4) + 1}-${i % 4 + 1}`
const FORM = { small: '', big: ' · Mario lớn', fire: ' · Mario lửa' }
const summary = (s) => `Màn ${levelId(s.levelIndex)} · ${s.score.toLocaleString('vi-VN')} điểm · ${s.lives} mạng${FORM[s.form]}${s.assisted ? ' · khám phá' : ''}`
const when = (s) => (s.savedAt ? new Date(s.savedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '')
</script>

<template>
  <ul class="slots">
    <li v-for="id in ids" :key="id">
      <span class="name">{{ label(id) }}</span>
      <span class="info" v-if="hud.slots[id]">{{ summary(hud.slots[id]) }}<small>{{ when(hud.slots[id]) }}</small></span>
      <span class="info empty" v-else>(trống)</span>
      <template v-if="mode === 'load'">
        <button :disabled="!hud.slots[id]" @click="emit('load', id)">Tải</button>
        <button :disabled="!hud.slots[id]" class="del" :aria-label="'Xóa ' + label(id)" @click="emit('remove', id)">✕</button>
      </template>
      <button v-else @click="emit('save', id)">{{ hud.slots[id] ? 'Ghi đè' : 'Lưu' }}</button>
    </li>
  </ul>
</template>

<style scoped>
.slots { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; width: min(100%, 460px); text-align: left; line-height: 1.3 }
li { display: flex; align-items: center; gap: 6px; background: #ffffff10; border-radius: 4px; padding: 5px 8px }
.name { width: 62px; flex: none; font-weight: 600; font-size: 13px }
.info { flex: 1; font-size: 12px; min-width: 0 } .info small { display: block; color: #b9a8e0; font-size: 11px } .empty { color: #8f82b8 }
button { font: inherit; font-size: 12px; color: #fff; background: #ffffff22; border: 1px solid #fff3; border-radius: 3px; padding: 3px 9px; cursor: pointer }
button:disabled { opacity: .35; cursor: not-allowed } .del { padding: 3px 7px }
button:focus-visible { outline: 2px solid var(--gold); outline-offset: 1px }
</style>
