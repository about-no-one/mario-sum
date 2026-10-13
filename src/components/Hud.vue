<script setup>
import { hud } from '../game/state.js'
const pad = (n, l) => String(Math.max(0, n)).padStart(l, '0')
</script>

<template>
  <header class="hud pix">
    <div><span>MARIO</span><b>{{ pad(hud.score, 6) }}</b></div>
    <div><span>COINS</span><b>x{{ pad(hud.coins, 2) }}</b></div>
    <div><span>WORLD</span><b>{{ hud.world }}</b></div>
    <div><span>TIME</span><b>{{ pad(hud.time, 3) }}</b></div>
    <div><span>LIVES</span><b>{{ hud.lives }}</b></div>
    <div v-if="hud.god" class="god"><span>MODE</span><b>EXPLORE</b></div>
  </header>
</template>

<style scoped>
.hud { display: flex; justify-content: space-between; gap: 8px; padding: 6px 4px 10px; font-size: 11px; line-height: 1.7 }
span { display: block; color: #b9a8e0 }
b { font-weight: normal; color: #fff }
.god b { color: var(--gold) }
</style>
