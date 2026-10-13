import { TILE, VW } from './constants.js'
import { LEVELS } from './levels.js'
import { buildWarpRoom } from './level-warp.js'
import { buildUnderground } from './level-under.js'
import { Player } from './player.js'
import { Goomba, Koopa, RedKoopa, Buzzy, Piranha, Bowser, HammerBro, Lakitu, CheepCheep, Cannon, Blooper } from './enemies.js'
import { Mushroom, Flower, OneUp, Starman, Coin, FireBar, Axe, Toad, Peach } from './items.js'
import { Debris, CoinPop, Popup } from './fx.js'
import { moveX, moveY, overlap, solidAt } from './physics.js'
import { getSprites } from './sprites.js'
import { render } from './renderer.js'
import { pollEdges, keys } from './input.js'
import { sfx, unlockAudio } from './audio.js'
import { music } from './music.js'
import { hud, persist, notify, recordTime, fmtTime, bestTime } from './state.js'

// ---- đăng ký nội dung: thêm màn / kẻ địch / vật thể mới tại đây ----
const ENEMIES = { goomba: Goomba, koopa: Koopa, redkoopa: RedKoopa, buzzy: Buzzy, piranha: Piranha, bowser: Bowser,
  hammerbro: HammerBro, lakitu: Lakitu, blooper: Blooper, cheep: CheepCheep, cheepR: CheepCheep }
const THINGS = { firebar: (d) => new FireBar(d.c, d.r, d.a, d.dir), axe: (d) => new Axe(d.c, d.r), toad: (d) => new Toad(d.c, d.r), peach: (d) => new Peach(d.c, d.r) }
const STOMP = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000]
const STEP = 1000 / 60
const HAZARDS = new Set(['bfire', 'hammer', 'shock', 'rock']) // đòn của Bowser: bị xóa khi Bowser gục / chạm rìu
const RUN_STATES = new Set(['playing', 'pipein', 'pipeout', 'axe']) // các trạng thái được tính vào thời gian hoàn thành màn

export class Game {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d'); this.S = getSprites(); this.paused = false; this.raf = 0; this.levelIndex = 0; this.carryForm = 'small'; this.safeList = []
    this.load()
  }
  // ---------- vòng đời ----------
  load() {
    const def = LEVELS[this.levelIndex]; hud.world = def.id
    this.level = def.build(); this.main = this.level; this.subArea = false; this.saved = null; this.pipe = null; this.behind = false; this.card = null
    this.enemies = this.level.enemies.map((d) => new ENEMIES[d.kind](d.c, d.r, d))
    this.items = [...this.coinItems(this.level), ...(this.level.things || []).map((d) => THINGS[d.kind](d)), ...this.cannonItems(this.level)]
    this.timers = []; this.cheepT = 0
    this.toad = this.items.find((i) => i.type === 'toad'); this.fx = []; this.bumps = []
    this.player = new Player(this.level.spawn.x, this.level.spawn.y)
    if (this.carryForm !== 'small') this.player.setForm(this.carryForm) // giữ dạng Mario giữa các màn
    this.safeList = []
    Object.assign(this, { cam: 0, frame: 0, freeze: 0, t: 0, deadT: 0, flagPhase: 0, flagY: 3 * TILE, rescued: false, runFrames: 0, levelAssisted: false, finished: false, shake: 0, supplyT: 0 })
    this.poleX = (this.level.flagCol ?? 0) * TILE + 7
    hud.time = 400
  }
  cannonItems(lv) { const o = []; lv.grid.forEach((row, r) => row.forEach((ch, c) => { if (ch === 'Y') o.push(new Cannon(c, r)) })); return o }
  later(frames, fn) { this.timers.push({ t: frames, fn }) }
  spawnLakitu(to) { const l = new Lakitu(0, 2, { to }); l.x = this.cam + VW + 24; l.active = true; this.enemies.push(l) }
  coinItems(lv) { return (lv.coins || []).map((d) => new Coin(d.c, d.r)) }
  unlock() { if (this.levelIndex > hud.unlocked) { hud.unlocked = this.levelIndex; persist() } }
  beginLevel() { this.unlock(); this.load(); this.card = { world: hud.world, lives: hud.lives, best: bestTime(this.levelIndex) === null ? '' : fmtTime(bestTime(this.levelIndex)), hint: this.level.final ? ['BOWSER GUARDS THE AXE!', 'DEFEAT HIM WITH FIREBALLS'] : [] }; this.t = 0; hud.status = 'intro'; music.stop() }
  start() {
    unlockAudio(); Object.assign(hud, { score: 0, coins: 0, lives: 3, paused: false, final: false, assisted: hud.god }); this.paused = false; this.carryForm = 'small'
    this.levelIndex = Math.min(hud.pick, LEVELS.length - 1); this.beginLevel()
  }
  // ---------- lưu / tải ----------
  snapshot(form) { return { levelIndex: this.levelIndex, score: hud.score, coins: hud.coins, lives: hud.lives, form, savedAt: Date.now(), assisted: hud.assisted } }
  autoSave() { hud.slots.auto = this.snapshot(this.carryForm); persist() }
  saveTo(id) { hud.slots[id] = this.snapshot(this.player.form); persist(); notify(`Đã lưu vào ô ${id} (đầu màn ${LEVELS[this.levelIndex].id})`) }
  continueFrom(id) {
    const s = hud.slots[id]; if (!s) return false
    unlockAudio(); Object.assign(hud, { score: s.score, coins: s.coins, lives: s.lives, paused: false, final: false, assisted: s.assisted || hud.god })
    this.paused = false; this.carryForm = s.form; this.levelIndex = s.levelIndex; this.beginLevel(); return true
  }
  commitHigh() { if (!hud.assisted && hud.score > hud.high) { hud.high = hud.score; notify('Điểm cao mới!') } persist() }
  advance() { this.carryForm = this.player.form; this.levelIndex++; this.autoSave(); this.beginLevel() } // sang màn kế, lưu tự động
  togglePause() {
    if (hud.status !== 'playing') return
    this.paused = !this.paused; hud.paused = this.paused; hud.runMs = Math.round(this.runFrames * 1000 / 60)
    this.paused ? music.pause() : music.resume()
  }
  run() {
    let last = performance.now(), acc = 0
    const loop = (t) => {
      acc += Math.min(t - last, 100); last = t
      while (acc >= STEP) { this.step(); acc -= STEP }
      render(this, this.ctx, this.S)
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }
  stop() { cancelAnimationFrame(this.raf); music.stop() }

  step() {
    pollEdges()
    if (this.paused) return
    if (this.shake > 0) this.shake--
    if (RUN_STATES.has(hud.status)) { this.runFrames++; if (hud.god) this.levelAssisted = true } // đồng hồ hoàn thành màn (60 khung = 1 giây)
    ;({ intro: () => this.introStep(), playing: () => this.playStep(), dying: () => this.dyingStep(), flag: () => this.flagStep(),
      castle: () => this.castleStep(), count: () => this.countStep(), pipein: () => this.pipeInStep(), pipeout: () => this.pipeOutStep(),
      axe: () => this.axeStep(), message: () => this.messageStep() })[hud.status]?.()
  }
  introStep() { if (++this.t > 110) { this.card = null; hud.status = 'playing'; music.play(this.level.music) } }
  areaMusic() { return this.player.starT > 0 ? 'star' : this.subArea ? 'under' : this.main.music }

  // ---------- chơi ----------
  playStep() {
    const p = this.player, L = this.level
    if (this.freeze > 0) { this.freeze--; return } // đóng băng khi lớn lên / thu nhỏ
    this.frame++
    if (!hud.god && this.frame % 24 === 0 && --hud.time <= 0) return this.killPlayer()
    if (p.starT > 0 && --p.starT === 0) music.play(this.areaMusic())
    p.update(this)
    if (hud.status !== 'playing') return
    if (p.ground && this.frame % 10 === 0) this.noteSafe()
    if (L.theme === 'castle') { // rơi xuống dung nham
      const cc = Math.floor((p.x + p.w / 2) / TILE)
      if (p.y + p.h > 12 * TILE + 6 && (L.grid[12][cc] === 'L' || L.grid[13][cc] === 'L')) return this.killPlayer()
    }
    if (p.invuln > 0) p.invuln--
    for (const e of this.enemies) e.update(this)
    for (const i of this.items) i.update(this)
    const ch = L.cheep // Cheep Cheep phóng vọt lên từ vực trong một đoạn của màn
    if (ch && p.x >= ch.c0 * TILE && p.x <= ch.c1 * TILE && --this.cheepT <= 0) {
      this.cheepT = 45 + Math.random() * 50
      const e = new CheepCheep(0, 0, { leap: true, kind: 'cheepR' })
      Object.assign(e, { x: this.cam + 16 + Math.random() * (VW - 32), y: 234, vx: (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.8), vy: -(4.8 + Math.random() * 1.4), active: true })
      this.enemies.push(e)
    }
    if (L.final && L.boss) { // trận Bowser thật: nếu Mario không còn dạng lửa, thả một Hoa Lửa bên trái đấu trường sau ~2.5 giây
      const live = this.enemies.some((e) => e.real && !e.dead && e.state !== 'flipped')
      if (live && p.form !== 'fire' && !this.items.some((i) => i.type === 'flower' || i.type === 'mushroom')) {
        if (++this.supplyT > 150) { this.supplyT = 0; const c = Math.floor((this.cam + 24) / TILE); this.items.push(new Flower(c, 12)); sfx('appear'); this.fx.push(new Popup(c * TILE + 8, 150, 'FLOWER!')) }
      } else this.supplyT = 0
    }
    this.timers = this.timers.filter((t) => (--t.t > 0 ? true : (t.fn(), false)))
    for (const f of this.fx) f.update()
    for (const b of this.bumps) b.t++
    this.enemies = this.enemies.filter((e) => !e.dead); this.items = this.items.filter((i) => !i.dead)
    this.fx = this.fx.filter((f) => !f.dead); this.bumps = this.bumps.filter((b) => b.t < 9)
    if (hud.status !== 'playing') return
    if (!this.subArea && L.flagCol != null && p.x + p.w >= L.flagCol * TILE - 0.5) this.touchFlag() // chạm mép khối đế cột cờ
    else if (keys.down && p.ground) this.tryEnterPipe()
    else if (keys.right && p.ground && L.exit) this.tryExitPipe()
    this.cam = Math.max(this.cam, Math.min(Math.max(p.x - 112, 0), L.cols * TILE - VW))
  }

  addScore(n, at) { hud.score += n; if (at) this.fx.push(new Popup(at.x + 8, at.y, String(n))) }
  addCoin() { hud.coins++; if (hud.coins >= 100) { hud.coins = 0; hud.lives++; sfx('oneup') } }
  stompScore(e) {
    const n = this.player.stompChain++
    if (n >= STOMP.length) { hud.lives++; this.fx.push(new Popup(e.x + 8, e.y, '1UP')); sfx('oneup') } else this.addScore(STOMP[n], e)
  }

  enemyVsPlayer(e) {
    const p = this.player
    if (hud.status !== 'playing' || e.state === 'flipped' || e.state === 'squish' || !overlap(e, p)) return
    if (p.starT > 0) { if (!e.boss) { e.flip(this, p.x < e.x ? 1 : -1); this.addScore(100, e) } return } // bất tử: húc là hạ (trừ Bowser)
    if (p.vy > 0 && p.y + p.h - e.y <= Math.max(8, p.vy * 2 + 4)) e.stomp(this, p); else e.touch(this, p)
  }

  // ---------- khối ----------
  // Khối ẩn 'H' chỉ phản ứng khi Mario đội đầu từ phía dưới
  checkHidden(p) {
    if (p.vy >= 0) return
    const r = Math.floor((p.y + p.vy) / TILE); if (r < 0) return
    for (let c = Math.floor(p.x / TILE); c <= Math.floor((p.x + p.w - 0.01) / TILE); c++) {
      if (this.level.grid[r][c] === 'H' && p.y >= (r + 1) * TILE - 0.5) { p.y = (r + 1) * TILE; p.vy = 0; this.bumpBlocks([[c, r]]); return }
    }
  }
  bumpBlocks(tiles) {
    const p = this.player, cx = p.x + p.w / 2
    const [c, r] = tiles.sort((a, b) => Math.abs(a[0] * TILE + 8 - cx) - Math.abs(b[0] * TILE + 8 - cx))[0]
    const g = this.level.grid, ch = g[r][c], bump = () => this.bumps.push({ c, r, t: 0 })
    const coin = () => { this.addCoin(); hud.score += 200; this.fx.push(new CoinPop(c * TILE + 8, r * TILE - 16)); sfx('coin'); bump() }
    if (ch === 'Q') { g[r][c] = 'U'; coin() }
    else if (ch === 'C') { // gạch 10 xu: nhả xu mỗi lần đụng, hết 10 xu hoặc sau ~4 giây thì thành khối đã dùng
      const m = (this.level.multi ||= {}), k = r * this.level.cols + c, s = (m[k] ||= { n: 0, t: this.frame })
      s.n++; coin(); if (s.n >= 10 || (s.n > 1 && this.frame - s.t > 240)) g[r][c] = 'U'
    }
    else if (ch === 'M') { g[r][c] = 'U'; this.items.push(p.big ? new Flower(c, r) : new Mushroom(c, r)); sfx('appear'); bump() }
    else if (ch === 'T') { g[r][c] = 'U'; this.items.push(new Starman(c, r)); sfx('appear'); bump() }
    else if (ch === 'H') { g[r][c] = 'U'; this.items.push(new OneUp(c, r)); sfx('appear'); bump() }
    else if (ch === 'B') {
      if (p.big) {
        g[r][c] = ' '; hud.score += 50; sfx('break')
        for (const [dx, dy] of [[-1.5, -5], [1.5, -5], [-1.5, -3], [1.5, -3]]) this.fx.push(new Debris(c * TILE + (dx < 0 ? 0 : 8), r * TILE + (dy < -4 ? 0 : 8), dx, dy))
      } else { sfx('bump'); bump() }
    } else sfx('bump')
    // kẻ địch đứng trên khối bị hất văng
    for (const e of this.enemies) if (!e.boss && !e.noBump && e.active && e.state !== 'flipped' && e.x + e.w > c * TILE && e.x < (c + 1) * TILE && Math.abs(e.y + e.h - r * TILE) < 3) { e.flip(this, e.x + e.w / 2 < cx ? -1 : 1); this.addScore(100, e) }
  }

  // ---------- power-up / sát thương ----------
  powerUp(type) {
    const p = this.player
    if (type === '1up') { hud.lives++; this.fx.push(new Popup(p.x + 8, p.y, '1UP')); sfx('oneup'); return }
    if (type === 'star') { p.starT = 600; this.addScore(1000, p); music.play('star'); return }
    if (type === 'mushroom' && p.form === 'small') { p.setForm('big'); this.freeze = 30 }
    if (type === 'flower' && p.form !== 'fire') { p.setForm('fire'); this.freeze = 30 }
    this.addScore(1000, p); sfx('powerup')
  }
  hurtPlayer() {
    const p = this.player
    if (hud.god || p.invuln > 0 || p.starT > 0 || hud.status !== 'playing') return
    if (p.form !== 'small') { p.setForm('small'); p.invuln = 100; this.freeze = 30; sfx('shrink') } else this.killPlayer()
  }
  // ---------- chế độ khám phá (bất tử) ----------
  noteSafe() {
    const p = this.player, L = this.level, r = Math.floor((p.y + p.h + 1) / TILE)
    if (solidAt(L, Math.floor((p.x + 1) / TILE), r) && solidAt(L, Math.floor((p.x + p.w - 1) / TILE), r)) {
      this.safeList.push({ x: p.x, bottom: p.y + p.h }); if (this.safeList.length > 12) this.safeList.shift()
    }
  }
  recover() { // đưa Mario về chỗ đứng an toàn gần nhất (còn nền bên dưới)
    const p = this.player, L = this.level; let s = null
    for (let i = this.safeList.length - 1; i >= 0 && !s; i--) {
      const q = this.safeList[i], r = Math.floor((q.bottom + 1) / TILE)
      if (solidAt(L, Math.floor((q.x + 1) / TILE), r) && solidAt(L, Math.floor((q.x + p.w - 1) / TILE), r)) s = q
    }
    p.x = s ? Math.max(s.x, this.cam + 4) : L.spawn.x; p.y = s ? s.bottom - p.h : L.spawn.y + 16 - p.h
    p.vx = p.vy = 0; p.ground = false; p.invuln = 90; sfx('shrink')
  }
  killPlayer() {
    if (hud.status !== 'playing') return
    if (hud.god) { this.recover(); return }
    const p = this.player; this.carryForm = 'small'
    p.setForm('small'); p.dead = true; p.vx = 0; p.vy = -4.5; p.invuln = 0; p.starT = 0; this.deadT = 0
    hud.status = 'dying'; music.stop(); sfx('die')
  }
  dyingStep() {
    const p = this.player; this.deadT++
    if (this.deadT > 30) { p.vy = Math.min(p.vy + 0.25, 5); p.y += p.vy }
    if (this.deadT > 200) { if (--hud.lives > 0) this.beginLevel(); else { hud.status = 'over'; hud.pick = this.levelIndex; this.onGameOver() } }
  }

  // ---------- ống cống & khu vực ----------
  tryEnterPipe() {
    const p = this.player, cx = p.x + p.w / 2
    for (const pp of this.level.pipes || []) {
      if (Math.abs(p.y + p.h - pp.r * TILE) < 0.5 && cx > pp.c * TILE + 6 && cx < (pp.c + 2) * TILE - 6) {
        p.stand(); p.x = pp.c * TILE + 16 - p.w / 2; this.beginPipe({ dir: 'down', to: pp.to, len: p.h + 4, pp }); return
      }
    }
  }
  tryExitPipe() {
    const p = this.player, e = this.level.exit
    if (p.x + p.w >= e.c * TILE - 0.5 && Math.abs(p.y + p.h - (e.r + 2) * TILE) < 0.5) { p.stand(); this.beginPipe({ dir: 'right', to: 'main', len: 22 }) }
  }
  beginPipe(pipe) {
    const p = this.player
    p.vx = p.vy = 0; p.ground = true; this.pipe = { t: 0, ...pipe }; this.behind = true; hud.status = 'pipein'; sfx('pipe')
  }
  pipeInStep() {
    const p = this.player, d = this.pipe
    if (d.dir === 'down') p.y += 1; else p.x += 1
    if (++d.t >= d.len) this.switchArea(d)
  }
  switchArea(d) {
    const p = this.player
    this.safeList = []
    if (d.to === 'world') { this.carryForm = p.form; this.levelIndex = (d.pp.world - 1) * 4; this.autoSave(); this.beginLevel(); return } // Warp Zone
    if (d.to === 'bonus' || d.to === 'warp') { // vào phòng thưởng: Mario trồi ra từ ống trên trần rồi rơi xuống
      this.saved = { level: this.level, enemies: this.enemies, items: this.items, fx: this.fx, bumps: this.bumps }
      this.level = d.to === 'warp' ? buildWarpRoom(d.pp.worlds) : buildUnderground(d.pp.ret); this.subArea = true
      this.enemies = []; this.items = this.coinItems(this.level); this.fx = []; this.bumps = []; this.cam = 0
      const dr = this.level.drop; p.x = dr.x - p.w / 2; p.y = dr.top; p.vx = p.vy = 0; p.facing = 1
      this.pipe = { t: 0, dir: 'down', bottom: dr.bottom }
    } else { // quay về màn chính: trồi lên từ miệng ống
      const ret = this.level.exit.ret, s = this.saved, top = ret.r * TILE
      Object.assign(this, { level: s.level, enemies: s.enemies, items: s.items, fx: s.fx, bumps: s.bumps }); this.subArea = false
      p.x = ret.c * TILE + 16 - p.w / 2; p.y = top; p.vx = p.vy = 0; p.facing = 1
      this.cam = Math.max(0, Math.min(p.x - 112, this.level.cols * TILE - VW))
      this.pipe = { t: 0, dir: 'up', top }
    }
    hud.status = 'pipeout'; sfx('pipe')
  }
  pipeOutStep() {
    const p = this.player, d = this.pipe
    if (d.dir === 'down') { p.y += 1; if (p.y >= d.bottom) { p.ground = false; this.endPipe() } }
    else { p.y -= 1; if (p.y + p.h <= d.top) { p.y = d.top - p.h; this.endPipe() } }
  }
  endPipe() { this.behind = false; hud.status = 'playing'; music.play(this.areaMusic()) }

  // ---------- kết thúc màn ----------
  // Ghi thời gian hoàn thành màn (không tính nếu đã dùng chế độ khám phá trong lượt này)
  finishRun() {
    if (this.finished) return; this.finished = true
    const id = LEVELS[this.levelIndex].id, ms = Math.round(this.runFrames * 1000 / 60), t = fmtTime(ms)
    if (this.levelAssisted) { notify(`${id}: ${t} (khám phá – không xếp hạng)`); return }
    const { rank, record } = recordTime(this.levelIndex, ms)
    notify(record ? `Kỷ lục mới ${id}: ${t}!` : rank ? `${id}: ${t} – hạng #${rank}` : `${id}: ${t}`)
  }
  touchFlag() {
    this.finishRun()
    const p = this.player, h = (11 * TILE - (p.y + p.h)) / TILE
    const pts = h >= 8 ? 5000 : h >= 6 ? 2000 : h >= 4 ? 800 : h >= 2 ? 400 : 100
    this.addScore(pts, p); Object.assign(p, { vx: 0, vy: 0, sliding: true, facing: 1, invuln: 0, starT: 0 }); p.stand(); p.x = this.poleX - p.w + 2
    this.flagPhase = 0; this.t = 0; hud.status = 'flag'; music.stop(); sfx('flag')
  }
  flagStep() {
    const p = this.player
    if (this.flagPhase === 0) {
      p.y += 2; this.flagY = Math.min(this.flagY + 2, 10 * TILE)
      if (p.y + p.h >= 11 * TILE) { p.y = 11 * TILE - p.h; this.flagPhase = 1; this.t = 0 }
    } else if (this.flagPhase === 1) {
      if (++this.t > 25) { p.x = this.poleX + 4; p.facing = -1; this.flagPhase = 2; this.t = 0 }
    } else if (++this.t > 20) { p.facing = 1; p.sliding = false; p.vx = 1.3; hud.status = 'castle' }
    for (const f of this.fx) f.update(); this.fx = this.fx.filter((f) => !f.dead)
  }
  castleStep() {
    const p = this.player
    p.vy = Math.min(p.vy + 0.4, 4); p.anim += 0.15
    moveX(p, this.level); moveY(p, this.level)
    this.cam = Math.min(Math.max(this.cam, p.x - 112), this.level.cols * TILE - VW)
    for (const f of this.fx) f.update(); this.fx = this.fx.filter((f) => !f.dead)
    if (p.x > this.level.castleCol * TILE + 34) { p.hidden = true; this.t = 0; hud.status = 'count' }
  }
  countStep() {
    if (hud.time > 0) { const d = Math.min(hud.time, 2); hud.time -= d; hud.score += d * 50; if (this.frame++ % 3 === 0) sfx('tick') }
    else if (++this.t > 80) this.levelDone()
  }
  onGameOver() { // cho phép "tiếp tục" tại màn vừa thua, với 3 mạng mới
    this.commitHigh(); hud.slots.auto = { levelIndex: this.levelIndex, score: 0, coins: 0, lives: 3, form: 'small', savedAt: Date.now(), assisted: hud.assisted }; persist()
  }
  levelDone() {
    if (this.levelIndex >= LEVELS.length - 1) { hud.status = 'win'; hud.pick = 0; this.commitHigh(); hud.slots.auto = null; persist(); sfx('win'); return }
    if (this.level.boss) { hud.status = 'message'; this.t = 0; this.card = { msg: ['THANK YOU, MARIO!', 'BUT THE PRINCESS IS IN', 'ANOTHER CASTLE!'] }; return }
    this.advance()
  }
  messageStep() { if (++this.t > 230) this.advance() }

  // ---------- trùm: rìu -> cầu sập -> Toad ----------
  triggerAxe() {
    if (hud.status !== 'playing') return
    hud.status = 'axe'; this.t = 0; music.stop(); sfx('break')
    this.clearHazards(); this.items = this.items.filter((i) => i.type !== 'axe')
  }
  clearHazards() { this.items = this.items.filter((i) => !HAZARDS.has(i.type)) }
  axeStep() {
    const b = this.level.bridge, c = b.c1 - Math.floor(this.t / 4)
    if (this.t % 4 === 0 && c >= b.c0) { this.level.grid[b.row][c] = ' '; sfx('break') }
    this.t++
    for (const e of this.enemies) e.update(this)
    for (const f of this.fx) f.update()
    this.enemies = this.enemies.filter((e) => !e.dead); this.fx = this.fx.filter((f) => !f.dead)
    if (this.t > (b.c1 - b.c0 + 1) * 4 + 70) { if (this.toad) this.toad.visible = true; hud.status = 'playing' }
  }
  rescue() {
    if (hud.status !== 'playing' || this.rescued) return
    this.finishRun(); this.rescued = true; hud.final = !!this.level.final; hud.status = 'count'; this.t = 0; music.stop(); sfx('win')
  }
}
