<script setup>
import { reactive } from 'vue'
import { setKey } from '../game/input.js'
const on = reactive({})
const left = [{ k: 'left', l: '◀', a: 'Sang trái' }, { k: 'down', l: '▼', a: 'Ngồi / vào ống' }, { k: 'right', l: '▶', a: 'Sang phải' }]
const right = [{ k: 'run', l: 'B', a: 'Chạy / bắn lửa' }, { k: 'jump', l: 'A', a: 'Nhảy' }]
const press = (k, v) => { on[k] = v; setKey(k, v) }
</script>

<template>
  <div class="pad pix">
    <div v-for="(group, i) in [left, right]" :key="i">
      <button v-for="b in group" :key="b.k" :class="{ on: on[b.k] }" :aria-label="b.a"
        @pointerdown.prevent="press(b.k, true)" @pointerup="press(b.k, false)"
        @pointerleave="press(b.k, false)" @pointercancel="press(b.k, false)">{{ b.l }}</button>
    </div>
  </div>
</template>

<style scoped>
.pad { display: none; justify-content: space-between; gap: 10px; margin-top: 12px }
.pad div { display: flex; gap: 8px }
button { width: 56px; height: 56px; border-radius: 50%; border: 3px solid #fff3; background: #ffffff1c; color: #fff; font-size: 18px; touch-action: none }
button.on { background: var(--red) }
@media (pointer: coarse) { .pad { display: flex } }
</style>
