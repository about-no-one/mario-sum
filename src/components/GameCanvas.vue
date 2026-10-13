<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Game } from '../game/engine.js'
import { VW, VH } from '../game/constants.js'

const cv = ref(null)
let game
onMounted(() => { game = new Game(cv.value); game.run() })
onBeforeUnmount(() => game?.stop())
defineExpose({ start: () => game.start(), togglePause: () => game.togglePause() })
</script>

<template>
  <canvas ref="cv" :width="VW" :height="VH" class="screen" />
</template>

<style scoped>
.screen { width: 100%; height: auto; aspect-ratio: 256 / 224; image-rendering: pixelated; display: block; background: #5c94fc }
</style>
