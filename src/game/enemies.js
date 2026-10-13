import { TILE, VW, VH } from './constants.js'
import { moveX, moveY, overlap, solidAt } from './physics.js'
import { drawSprite } from './sprites.js'
import { sfx } from './audio.js'
import { hud } from './state.js'
import { BowserFire } from './items.js'
import { Popup } from './fx.js'
import { music } from './music.js'

// Lớp cơ sở cho kẻ địch. Thêm kẻ địch mới: kế thừa Enemy, cài think/stomp/touch/draw rồi đăng ký trong engine.js (ENEMIES).
class Enemy {
  constructor(c, r, w, h) {
    Object.assign(this, { w, h, x: c * TILE + (TILE - w) / 2, y: (r + 1) * TILE - h, vx: -0.5, vy: 0, state: 'walk', active: false, dead: false, t: 0, anim: 0, grace: 0 })
  }
  flip(g, dir = 1) { if (this.state === 'flipped') return; this.state = 'flipped'; this.vy = -3; this.vx = 0.6 * dir; sfx('kick') }
  update(g) {
    if (!this.active) { if (this.x < g.cam + VW + 16) this.active = true; else return }
    this.anim++
    if (this.state === 'flipped') { this.vy += 0.3; this.x += this.vx; this.y += this.vy; if (this.y > VH + 32) this.dead = true; return }
    if (this.think(g) === false) return
    for (const o of g.enemies) if (o !== this && o.active && o.state === 'walk' && this.state === 'walk' && overlap(this, o) && (o.x - this.x) * this.vx > 0) this.vx *= -1
    this.vy = Math.min(this.vy + 0.3, 4)
    if (moveX(this, g.level)) this.vx *= -1
    moveY(this, g.level)
    if (this.y > VH + 32) { this.dead = true; return }
    g.enemyVsPlayer(this)
  }
  think() {}
  touch(g) { g.hurtPlayer() }
}

export class Goomba extends Enemy {
  constructor(c, r) { super(c, r, 14, 14); this.score = 100 }
  think() { if (this.state === 'squish') { if (++this.t > 30) this.dead = true; return false } }
  stomp(g, p) { this.state = 'squish'; this.vx = 0; p.vy = -3.2; sfx('stomp'); g.stompScore(this) }
  draw(ctx, cam, S) {
    if (!this.active) return
    const x = Math.round(this.x + this.w / 2 - 8 - cam)
    if (this.state === 'squish') return drawSprite(ctx, S.goombaSquish, x, Math.round(this.y + this.h - 8))
    drawSprite(ctx, S.goomba[Math.floor(this.anim / 8) % 2], x, Math.round(this.y + this.h - 16), false, this.state === 'flipped')
  }
}

export class Koopa extends Enemy {
  constructor(c, r) { super(c, r, 14, 24); this.score = 100; this.skin = 'koopa' }
  think(g) {
    if (this.grace > 0) this.grace--
    if (this.state === 'shell' && this.vx !== 0) {
      for (const o of g.enemies) if (o !== this && o.active && o.state !== 'flipped' && o.state !== 'squish' && overlap(this, o)) { o.flip(g, Math.sign(this.vx)); g.addScore(500, o) }
    }
  }
  kick(g, p) { this.vx = p.x + p.w / 2 < this.x + this.w / 2 ? 4 : -4; this.grace = 12; sfx('kick') }
  stomp(g, p) {
    p.vy = -3.2; sfx('stomp'); g.stompScore(this)
    if (this.state === 'walk') { this.state = 'shell'; this.vx = 0; this.y += this.h - 14; this.h = 14 }
    else if (this.vx === 0) this.kick(g, p)
    else this.vx = 0
    this.grace = 12
  }
  touch(g, p) {
    if (this.state === 'shell' && this.vx === 0) { this.kick(g, p); g.addScore(400, this); return }
    if (this.grace > 0) return
    g.hurtPlayer()
  }
  draw(ctx, cam, S) {
    if (!this.active) return
    const x = Math.round(this.x + this.w / 2 - 8 - cam), flipY = this.state === 'flipped'
    if (this.state === 'walk' || (flipY && this.h > 14)) return drawSprite(ctx, S[this.skin][Math.floor(this.anim / 10) % 2], x, Math.round(this.y + this.h - 24), this.vx < 0, flipY)
    drawSprite(ctx, this.skin === 'koopaR' ? S.shellR : S.shell, x, Math.round(this.y + this.h - 16), false, flipY)
  }
}

// Buzzy Beetle: giống Koopa nhưng thấp hơn, miễn nhiễm cầu lửa, giẫm là thành mai ngay
export class Buzzy extends Koopa {
  constructor(c, r) { super(c, r); this.h = 14; this.y = (r + 1) * TILE - 14; this.fireproof = true }
  draw(ctx, cam, S) {
    if (!this.active) return
    drawSprite(ctx, S.buzzy, Math.round(this.x + this.w / 2 - 8 - cam), Math.round(this.y + this.h - 16), this.state === 'walk' && Math.floor(this.anim / 8) % 2 === 1, this.state === 'flipped')
  }
}

// Bowser: đi tuần trên cầu, nhảy, phun lửa; 5 quả cầu lửa hạ được; hoặc chạm rìu để làm sập cầu
export class Bowser extends Enemy {
  boss = true
  constructor(c, r, d = {}) {
    super(c, r, 28, 30)
    Object.assign(this, { hp: d.hp ?? 5, maxHp: d.hp ?? 5, rate: d.rate ?? 170, fake: d.fake, real: !!d.real, showBar: !!d.real, dir: -1, mouth: 0, faceRight: false,
      minX: (c - 4) * TILE, maxX: (c + 3) * TILE, c0: c, score: 5000, act: null, cool: 80, last: '', hurtT: 0, rage: false })
  }
  hit(g) {
    if (this.real && this.hurtT > 0) return // vừa trúng đòn: miễn nhiễm ngắn, cầu lửa đôi không "ăn" 2 máu
    if (--this.hp > 0) {
      sfx('bump')
      if (this.real) { this.hurtT = 24; if (!this.rage && this.hp <= this.maxHp / 2) this.enrage(g) }
      return
    }
    if (this.fake) this.reveal(g)
    else { this.act = null; this.flip(g, this.faceRight ? 1 : -1); g.addScore(5000, this); g.clearHazards() }
  }
  // Bowser giả: bị đủ cầu lửa thì lộ nguyên hình thành một kẻ địch thường
  reveal(g) {
    const e = new FAKES[this.fake](0, 0)
    e.x = this.x + (this.w - e.w) / 2; e.y = this.y + this.h - e.h; e.active = true; if (e.home !== undefined) e.home = e.x
    g.enemies.push(e); this.dead = true; g.fx.push(new Popup(this.x + 14, this.y, 'FAKE!')); g.addScore(1000, this); sfx('powerup')
  }
  stomp(g, p) { this.touch(g, p) }

  // ---- Bowser thật: giai đoạn 2 (nổi điên) khi còn ≤ nửa máu ----
  enrage(g) {
    this.rage = true; this.act = { name: 'roar', t: 0 }; g.level.music = 'rage'; music.play('rage'); g.shake = 40
    g.fx.push(new Popup(this.x + 14, this.y - 6, 'RAGE!')); sfx('shrink')
  }
  get telegraphing() { const a = this.act; return !!a && ((a.name === 'charge' && a.t <= 36) || (a.name === 'pound' && a.t < 18)) }
  startAttack() {
    const pool = (this.rage ? [['fire', 2], ['hammer', 2], ['pound', 2], ['charge', 3], ['meteor', 2]] : [['fire', 3], ['hammer', 2], ['pound', 2]]).filter(([n]) => n !== this.last)
    let t = Math.random() * pool.reduce((s, [, w]) => s + w, 0), name = pool[0][0]
    for (const [n, w] of pool) { if ((t -= w) < 0) { name = n; break } }
    this.act = { name, t: 0 }; this.last = name
  }
  endAttack(cool) { this.act = null; this.mouth = 0; this.cool = cool + Math.random() * 30 }
  slam(g, speed) { // sóng xung kích chạy dọc cầu về hai phía: phải nhảy qua
    const y = this.y + this.h - 10, cx = this.x + this.w / 2
    g.items.push(new Shockwave(cx - 14, y, -speed), new Shockwave(cx, y, speed))
  }
  rain(g, n) { // mưa đá từ trần; viên đầu nhắm vào chỗ Mario đang đứng, có vạch cảnh báo ~0.7 giây
    for (let i = 0; i < n; i++) g.items.push(new Rock(i === 0 ? g.player.x + 6 : g.cam + 28 + Math.random() * (VW - 56), i * 12))
    sfx('fire')
  }
  realThink(g) {
    const a = this.act
    if (!a) { // đi tuần giữa các đòn
      if (this.x < this.minX) this.dir = 1; else if (this.x > this.maxX) this.dir = -1
      if (this.t % 90 === 0 && Math.random() < 0.5) this.dir *= -1
      this.vx = this.dir * (this.rage ? 0.55 : 0.35)
      if (--this.cool <= 0) this.startAttack()
      return
    }
    a.t++; this.vx = 0; this.mouth = 0
    switch (a.name) {
      case 'fire': { // GĐ1: 1 quả; GĐ2: 3 quả liên tiếp (cao → thấp)
        this.mouth = a.t < (this.rage ? 52 : 28) ? 1 : 0
        const shots = this.rage ? [26, 38, 50] : [26], i = shots.indexOf(a.t)
        if (i >= 0) { g.items.push(new BowserFire(this.faceRight ? this.x + this.w : this.x - 14, this.y + 6 + (this.rage ? [16, 8, 0][i] : 8 * Math.floor(Math.random() * 3)), this.faceRight ? 1 : -1)); sfx('fire') }
        if (a.t >= (this.rage ? 74 : 58)) this.endAttack(this.rage ? 30 : 50)
        break
      }
      case 'hammer': { // ném 3-4 cây búa vòng cung, rơi quanh chỗ Mario đang đứng
        const times = this.rage ? [16, 30, 44, 58] : [20, 38, 56]
        if (times.includes(a.t)) {
          const d = this.faceRight ? 1 : -1, dist = Math.abs(g.player.x - this.x)
          g.items.push(new Hammer(this.x + (d > 0 ? 22 : -2), this.y - 2, d * Math.max(0.6, Math.min(2.2, dist / 44 + (Math.random() - 0.5) * 0.5)), -4.5)); sfx('kick')
        }
        if (a.t >= times[times.length - 1] + 22) this.endAttack(this.rage ? 24 : 40)
        break
      }
      case 'pound': { // gập người -> nhảy cao -> đáp xuống tạo sóng xung kích (GĐ2: thêm một cặp sóng nhanh hơn)
        if (a.t < 18) break
        if (a.t === 18) { this.vy = -5.4; this.ground = false; a.air = true; sfx('appear') }
        if (a.air) {
          this.vx = (g.player.x > this.x ? 1 : -1) * 1.1
          this.x = Math.max(this.minX - 16, Math.min(this.maxX + 16, this.x))
          if (a.t > 20 && this.ground) { a.air = false; a.landed = a.t; this.slam(g, this.rage ? 2.0 : 1.6); g.shake = 16; sfx('break'); if (this.rage) a.wave2 = a.t + 22 }
        } else if (a.wave2 && a.t === a.wave2) { this.slam(g, 2.3); g.shake = 8 }
        if (!a.air && a.landed && a.t >= a.landed + (this.rage ? 46 : 34)) this.endAttack(this.rage ? 26 : 44)
        break
      }
      case 'charge': { // GĐ2: giậm chân báo trước ~0.6 giây rồi lao ngang cầu; nhảy qua đầu để né
        const left = (this.c0 - 5) * TILE, right = (this.c0 + 4) * TILE
        if (a.t === 1) { a.dir = this.faceRight ? 1 : -1; sfx('appear') }
        if (a.t <= 36) { g.shake = a.t % 8 < 4 ? 2 : 0; break }
        if (a.t <= 116) {
          this.vx = a.dir * 2.6
          if ((a.dir > 0 && this.x >= right) || (a.dir < 0 && this.x <= left)) { this.x = Math.min(right, Math.max(left, this.x)); g.shake = 12; sfx('break'); this.endAttack(54) }
          break
        }
        this.endAttack(54)
        break
      }
      case 'meteor': // GĐ2: mưa đá
        this.mouth = 1; if (a.t === 6) this.rain(g, 5); if (a.t >= 30) this.endAttack(70)
        break
      case 'roar': // chuyển giai đoạn: gầm + mưa đá, không tấn công trực tiếp
        this.mouth = 1; g.shake = Math.max(g.shake, 2); if (a.t === 12) this.rain(g, 4); if (a.t >= 54) this.endAttack(30)
        break
    }
  }
  think(g) {
    if (hud.status !== 'playing') { this.vx = 0; return }
    this.t++; this.faceRight = g.player.x > this.x
    if (this.hurtT > 0) this.hurtT--
    if (this.real) return this.realThink(g)
    // Bowser "thường" (không real): đi tuần, nhảy, phun lửa
    if (this.x < this.minX) this.dir = 1; else if (this.x > this.maxX) this.dir = -1
    if (this.t % 120 === 0 && Math.random() < 0.5) this.dir *= -1
    this.vx = this.dir * 0.35
    if (this.t % 140 === 50 && this.ground) this.vy = -3.4
    if (this.t % this.rate === Math.floor(this.rate / 2) + 5) this.mouth = 36
    if (this.mouth > 0 && --this.mouth === 12) { g.items.push(new BowserFire(this.faceRight ? this.x + this.w : this.x - 14, this.y + 6 + 8 * Math.floor(Math.random() * 3), this.faceRight ? 1 : -1)); sfx('fire') }
  }
  draw(ctx, cam) {
    if (!this.active) return
    const x = Math.round(this.x - 2 - cam), y = Math.round(this.y), R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h) }, skin = this.rage ? '#fc7400' : '#fc9838'
    ctx.save(); ctx.translate(this.faceRight ? x + 32 : x, this.state === 'flipped' ? y + 32 : y); ctx.scale(this.faceRight ? -1 : 1, this.state === 'flipped' ? -1 : 1)
    if (this.hurtT > 0 && Math.floor(this.hurtT / 3) % 2) ctx.globalAlpha = 0.5
    R('#00a800', 10, 8, 18, 14); for (const i of [12, 18, 24]) R('#fcfcfc', i, 3, 4, 6)          // mai + gai
    R(skin, 0, 7, 12, 12); R('#fcfcfc', 2, 0, 3, 7); R('#fcfcfc', 8, 0, 3, 7)                    // đầu + sừng
    if (this.real) R('#d82800', 4, 2, 5, 6)                                                       // tóc đỏ (Bowser thật)
    R('#fcfcfc', 3, 10, 4, 3); R(this.rage ? '#d82800' : '#000', 3, 11, 2, 2)                      // mắt (đỏ khi nổi điên)
    R('#000', 0, this.mouth > 0 ? 14 : 16, 8, this.mouth > 0 ? 5 : 2)                              // miệng
    R(skin, 8, 19, 6, 6); R('#fcd000', 13, 18, 12, 7)                                              // tay + bụng
    const s = Math.floor(this.anim / 12) % 2; R(skin, 8 + s, 24, 7, 6); R(skin, 21 - s, 24, 7, 6)  // chân
    R('#00a800', 28, 14, 4, 6)
    if (this.act?.name === 'hammer') { R('#a05020', 11, -4, 2, 9); R('#bcbcbc', 8, -8, 8, 5) }       // giơ búa
    if (this.telegraphing && Math.floor(this.t / 3) % 2) { ctx.globalAlpha = 0.55; R('#fcfcfc', 0, 0, 30, 30) } // nhấp nháy báo trước đòn
    ctx.restore()
  }
}

// Koopa đỏ: quay đầu ở mép vực thay vì rơi xuống
export class RedKoopa extends Koopa {
  constructor(c, r) { super(c, r); this.skin = 'koopaR' }
  think(g) {
    super.think(g)
    if (this.state === 'walk' && this.ground) {
      const ax = this.vx < 0 ? this.x - 2 : this.x + this.w + 2
      if (!solidAt(g.level, Math.floor(ax / TILE), Math.floor((this.y + this.h + 2) / TILE))) this.vx *= -1
    }
  }
}

// Piranha Plant: trồi lên từ ống theo chu kỳ, thụt xuống khi Mario đứng sát miệng ống; giẫm không hạ được (dùng cầu lửa / Starman)
export class Piranha {
  constructor(c, r) { Object.assign(this, { w: 12, h: 24, x: c * TILE + 10, top: r * TILE, y: r * TILE, ext: 0, ph: 0, vx: 0, vy: 0, state: 'walk', active: false, dead: false, noBump: true, anim: 0 }) }
  flip() { this.dead = true; sfx('kick') }
  stomp(g) { g.hurtPlayer() }
  touch(g) { g.hurtPlayer() }
  update(g) {
    if (!this.active) { if (this.x < g.cam + VW + 16) this.active = true; else return }
    this.anim++
    const p = g.player
    if (!(this.ph < 60 && Math.abs(p.x + p.w / 2 - (this.x + 6)) < 30)) this.ph = (this.ph + 1) % 180
    const ph = this.ph
    this.ext = ph < 60 ? 0 : ph < 84 ? ph - 60 : ph < 144 ? 24 : ph < 168 ? 24 - (ph - 144) : 0
    this.y = this.top - this.ext
    if (this.ext > 2) g.enemyVsPlayer(this)
  }
  draw(ctx, cam) {
    if (!this.active || this.ext <= 0) return
    const x = Math.round(this.x - 2 - cam), y = Math.round(this.y), open = Math.floor(this.anim / 10) % 2, R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h) }
    R('#00a800', x + 6, y + 12, 4, 12); R('#005800', x + 6, y + 12, 1, 12)
    R('#d82800', x + 1, y, 14, 12); R('#fcfcfc', x + 3, y + 2, 3, 3); R('#fcfcfc', x + 10, y + 2, 3, 3)
    R('#000', x + 1, y + 6, 14, open ? 3 : 1); if (open) { R('#fcfcfc', x + 3, y + 6, 2, 1); R('#fcfcfc', x + 8, y + 6, 2, 1); R('#fcfcfc', x + 12, y + 6, 2, 1) }
  }
}

// ================= Kẻ địch bổ sung (vẽ bằng hình khối, không cần sprite) =================
const FR = (ctx, c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h) }

// ---- Hammer Bro: đi tuần tại chỗ, thỉnh thoảng nhảy, ném búa theo hình vòng cung ----
export class Hammer {
  type = 'hammer'
  constructor(x, y, vx, vy) { Object.assign(this, { x, y, w: 8, h: 8, vx, vy, t: 0, dead: false }) }
  update(g) {
    this.t++; this.vy += 0.2; this.x += this.vx; this.y += this.vy
    if (this.y > VH + 24 || this.x < g.cam - 24 || this.x > g.cam + VW + 24) this.dead = true
    else if (hud.status === 'playing' && overlap(this, g.player)) g.hurtPlayer()
  }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam), y = Math.round(this.y), k = Math.floor(this.t / 3) % 4
    if (k === 0) { FR(ctx, '#bcbcbc', x, y, 8, 4); FR(ctx, '#a05020', x + 3, y + 4, 2, 4) }
    else if (k === 1) { FR(ctx, '#bcbcbc', x + 4, y, 4, 8); FR(ctx, '#a05020', x, y + 3, 4, 2) }
    else if (k === 2) { FR(ctx, '#bcbcbc', x, y + 4, 8, 4); FR(ctx, '#a05020', x + 3, y, 2, 4) }
    else { FR(ctx, '#bcbcbc', x, y, 4, 8); FR(ctx, '#a05020', x + 4, y + 3, 4, 2) }
  }
}
export class HammerBro extends Enemy {
  constructor(c, r) { super(c, r, 14, 24); Object.assign(this, { home: this.x, dir: -1, faceRight: false, score: 1000 }) }
  think(g) {
    this.t++; this.faceRight = g.player.x > this.x
    if (this.x < this.home - 20) this.dir = 1; else if (this.x > this.home + 20) this.dir = -1
    this.vx = this.dir * 0.3
    if (this.t % 150 === 60 && this.ground) this.vy = -4.2
    if (this.t % 90 === 45 && hud.status === 'playing' && Math.abs(g.player.x - this.x) < 200) {
      const d = this.faceRight ? 1 : -1; g.items.push(new Hammer(this.x + (d > 0 ? 8 : -2), this.y - 4, d * (0.6 + Math.random() * 0.9), -4.1))
    }
  }
  stomp(g, p) { p.vy = -3.2; sfx('stomp'); this.flip(g, this.faceRight ? 1 : -1); g.addScore(1000, this) }
  draw(ctx, cam) {
    if (!this.active) return
    const x = Math.round(this.x - 1 - cam), y = Math.round(this.y), flipY = this.state === 'flipped'
    ctx.save(); ctx.translate(this.faceRight ? x + 16 : x, flipY ? y + 24 : y); ctx.scale(this.faceRight ? -1 : 1, flipY ? -1 : 1)
    FR(ctx, '#00a800', 2, 0, 10, 6); FR(ctx, '#fcfcfc', 3, 1, 3, 2); FR(ctx, '#f8d8a0', 2, 6, 10, 5); FR(ctx, '#000', 3, 7, 2, 2)
    FR(ctx, '#00a800', 1, 11, 13, 8); FR(ctx, '#fcfcfc', 5, 12, 6, 6)
    const s = Math.floor(this.anim / 10) % 2; FR(ctx, '#f8d8a0', 3 + s, 19, 4, 5); FR(ctx, '#f8d8a0', 8 - s, 19, 4, 5)
    if (this.t % 90 >= 20 && this.t % 90 < 45) { FR(ctx, '#a05020', 10, -2, 2, 9); FR(ctx, '#bcbcbc', 7, -6, 8, 4) } // búa giơ lên
    ctx.restore()
  }
}

// ---- Bullet Bill + súng thần công (ô 'Y' trên bản đồ) ----
export class BulletBill {
  constructor(x, y, dir) { Object.assign(this, { x, y, w: 16, h: 12, vx: dir * 1.6, vy: 0, state: 'walk', active: true, dead: false, noBump: true, t: 0 }) }
  flip() { if (this.state === 'flipped') return; this.state = 'flipped'; this.vy = -2; this.vx = 0; sfx('kick') }
  update(g) {
    if (this.state === 'flipped') { this.vy += 0.3; this.y += this.vy; if (this.y > VH + 32) this.dead = true; return }
    if (hud.status !== 'playing') return
    this.t++; this.x += this.vx
    if (this.x < g.cam - 40 || this.x > g.cam + VW + 40) { this.dead = true; return }
    g.enemyVsPlayer(this)
  }
  stomp(g, p) { p.vy = -3.2; sfx('stomp'); g.stompScore(this); this.flip() }
  touch(g) { g.hurtPlayer() }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam), y = Math.round(this.y), d = this.vx < 0 || (this.vx === 0 && this.face < 0) ? 1 : -1
    ctx.save(); ctx.translate(d > 0 ? x : x + 16, this.state === 'flipped' ? y + 12 : y); ctx.scale(d, this.state === 'flipped' ? -1 : 1)
    FR(ctx, '#000', 4, 1, 11, 10); FR(ctx, '#000', 1, 3, 4, 6); FR(ctx, '#505050', 12, 0, 3, 12); FR(ctx, '#fcfcfc', 3, 3, 4, 4); FR(ctx, '#000', 3, 4, 2, 2); FR(ctx, '#bcbcbc', 7, 2, 2, 2)
    ctx.restore()
  }
}
export class Cannon {
  type = 'cannon'
  constructor(c, r) { Object.assign(this, { x: c * TILE, y: r * TILE, w: 16, h: 16, next: 80 + Math.random() * 80, dead: false }) }
  update(g) {
    if (hud.status !== 'playing' || this.x < g.cam - 16 || this.x > g.cam + VW || --this.next > 0) return
    this.next = 100 + Math.random() * 120
    const dx = g.player.x - this.x
    if (Math.abs(dx) < 56 || g.enemies.filter((e) => e instanceof BulletBill).length >= 3) return
    const b = new BulletBill(this.x + (dx < 0 ? -10 : 10), this.y + 2, dx < 0 ? -1 : 1); b.face = dx < 0 ? -1 : 1; g.enemies.push(b); sfx('fire')
  }
  draw() {}
}

// ---- Lakitu: bay trên mây bám theo Mario, ném trứng Spiny ----
export class Spiny extends Enemy {
  constructor(c, r) { super(c, r, 14, 14); this.score = 100 }
  stomp(g) { g.hurtPlayer() } // có gai: giẫm cũng bị thương
  draw(ctx, cam) {
    if (!this.active) return
    const x = Math.round(this.x - cam), y = Math.round(this.y), f = Math.floor(this.anim / 8) % 2, flipY = this.state === 'flipped'
    ctx.save(); ctx.translate(x, flipY ? y + 14 : y); if (flipY) ctx.scale(1, -1)
    FR(ctx, '#d82800', 0, 4, 14, 7); for (let i = 0; i < 3; i++) FR(ctx, '#fcfcfc', 1 + i * 4, 0, 3, 5)
    FR(ctx, '#fcfcfc', 9, 6, 3, 3); FR(ctx, '#000', 10, 7, 1, 2); FR(ctx, '#f8d8a0', f ? 1 : 3, 11, 4, 3); FR(ctx, '#f8d8a0', f ? 9 : 7, 11, 4, 3)
    ctx.restore()
  }
}
export class SpinyEgg extends Enemy {
  constructor(x, y, dir) { super(0, 0, 10, 10); Object.assign(this, { x, y, vx: dir * 0.7, vy: -3, active: true, noBump: true }) }
  think(g) {
    if (this.ground && this.anim > 3) {
      const s = new Spiny(0, 0); s.x = this.x - 2; s.y = this.y - 4; s.vx = g.player.x < this.x ? -0.6 : 0.6; s.active = true
      g.enemies.push(s); this.dead = true; return false
    }
  }
  stomp(g) { g.hurtPlayer() }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam), y = Math.round(this.y)
    FR(ctx, '#d82800', x + 1, y + 1, 8, 8); FR(ctx, '#fcfcfc', x + 2, y, 2, 2); FR(ctx, '#fcfcfc', x + 6, y, 2, 2); FR(ctx, '#fcfcfc', x + 3, y + 4, 2, 2)
  }
}
export class Lakitu extends Enemy {
  constructor(c, r, d = {}) { super(c, r, 14, 20); Object.assign(this, { to: d.to ?? 9999, cool: 90, out: false, y0: 34, noBump: true, score: 1200 }); this.y = this.y0; this.vx = 0 }
  flip(g, dir = 1) { if (this.state === 'flipped') return; super.flip(g, dir); if (!this.out) g.later(540, () => g.spawnLakitu(this.to)) }
  stomp(g, p) { p.vy = -3.2; sfx('stomp'); this.flip(g, 1); g.addScore(1200, this) }
  update(g) {
    if (!this.active) { if (this.x < g.cam + VW + 16) this.active = true; else return }
    this.anim++
    if (this.state === 'flipped') { this.vy += 0.3; this.y += this.vy; this.x += this.vx; if (this.y > VH + 32) this.dead = true; return }
    if (hud.status !== 'playing') return
    const p = g.player
    if (p.x > this.to * TILE) this.out = true
    const target = this.out ? g.cam + VW + 80 : p.x + 8 + Math.sin(this.anim / 50) * 60
    this.vx += (Math.max(-2.2, Math.min(2.2, (target - this.x) * 0.03)) - this.vx) * 0.08
    this.x += this.vx; this.y = this.y0 + Math.sin(this.anim / 20) * 4
    if (!this.out) this.x = Math.max(g.cam + 8, Math.min(this.x, g.cam + VW - 24))
    if (this.out && this.x > g.cam + VW + 40) { this.dead = true; return }
    if (!this.out && --this.cool <= 0 && g.enemies.filter((e) => e instanceof Spiny || e instanceof SpinyEgg).length < 3) {
      this.cool = 100 + Math.random() * 60; g.enemies.push(new SpinyEgg(this.x + 2, this.y + 14, p.x < this.x ? -1 : 1))
    }
    g.enemyVsPlayer(this)
  }
  draw(ctx, cam) {
    if (!this.active) return
    const x = Math.round(this.x - cam), y = Math.round(this.y), flipY = this.state === 'flipped'
    ctx.save(); ctx.translate(x, flipY ? y + 20 : y); if (flipY) ctx.scale(1, -1)
    FR(ctx, '#fcfcfc', -2, 12, 18, 8); FR(ctx, '#fcfcfc', 2, 10, 10, 3); FR(ctx, '#bcbcbc', -2, 18, 18, 2)
    FR(ctx, '#00a800', 3, 0, 8, 5); FR(ctx, '#f8d8a0', 3, 5, 8, 6); FR(ctx, '#000', 4, 6, 2, 2); FR(ctx, '#000', 8, 6, 2, 2)
    ctx.restore()
  }
}

// ---- Cheep Cheep: bơi ngang dưới nước (xanh chậm / đỏ nhanh), hoặc phóng vọt lên từ vực ----
export class CheepCheep extends Enemy {
  constructor(c, r, d = {}) {
    super(c, r, 14, 14)
    const red = d.kind === 'cheepR'
    Object.assign(this, { red, leap: !!d.leap, y0: r * TILE, vx: -(red ? 0.9 : 0.6), score: 200, noBump: true, ph: Math.random() * 6 })
  }
  stomp(g, p) { p.vy = -3.2; sfx('stomp'); g.stompScore(this); this.flip(g, this.vx > 0 ? 1 : -1) }
  update(g) {
    if (!this.active) { if (this.x < g.cam + VW + 16) this.active = true; else return }
    this.anim++
    if (this.state === 'flipped') { this.vy += 0.3; this.x += this.vx; this.y += this.vy; if (this.y > VH + 32) this.dead = true; return }
    if (hud.status !== 'playing') return
    if (this.leap) { this.vy += 0.13; this.x += this.vx; this.y += this.vy; if (this.y > VH + 30 && this.vy > 0) { this.dead = true; return } }
    else { this.x += this.vx; this.y = this.y0 + Math.sin(this.anim / 22 + this.ph) * (this.red ? 14 : 8); if (this.x < g.cam - 30) { this.dead = true; return } }
    g.enemyVsPlayer(this)
  }
  draw(ctx, cam) {
    if (!this.active) return
    const x = Math.round(this.x - cam), y = Math.round(this.y), col = this.red ? '#d82800' : '#00a800', flipY = this.state === 'flipped'
    ctx.save(); ctx.translate(this.vx > 0 ? x + 14 : x, flipY ? y + 14 : y); ctx.scale(this.vx > 0 ? -1 : 1, flipY ? -1 : 1)
    FR(ctx, col, 1, 3, 11, 9); FR(ctx, col, 11, Math.floor(this.anim / 6) % 2 ? 2 : 4, 3, 4); FR(ctx, '#fc9838', 5, 1, 4, 3); FR(ctx, '#fcfcfc', 2, 4, 3, 3); FR(ctx, '#000', 2, 5, 1, 2)
    ctx.restore()
  }
}

// ---- Blooper (mực): chỉ ở màn dưới nước – phóng chéo về phía Mario rồi chìm xuống, lặp lại; giẫm/cầu lửa hạ được ----
export class Blooper extends Enemy {
  constructor(c, r) { super(c, r, 14, 16); Object.assign(this, { phase: 'sink', pt: 0, dirX: -1, jetVy: -1, noBump: true, score: 200 }); this.y = r * TILE; this.vx = 0 }
  stomp(g, p) { p.vy = -3.2; sfx('stomp'); g.stompScore(this); this.flip(g, this.dirX) }
  update(g) {
    if (!this.active) { if (this.x < g.cam + VW + 16) this.active = true; else return }
    this.anim++
    if (this.state === 'flipped') { this.vy += 0.3; this.y += this.vy; this.x += this.vx; if (this.y > VH + 32) this.dead = true; return }
    if (hud.status !== 'playing') return
    const p = g.player; this.pt++
    if (this.phase === 'sink') {
      this.y += 0.55; this.x += this.dirX * 0.3
      if (this.pt > 26) { this.phase = 'jet'; this.pt = 0; this.dirX = p.x < this.x ? -1 : 1; this.jetVy = p.y + 8 < this.y ? -1.3 : -0.45 }
    } else {
      this.x += this.dirX * 1.1; this.y += this.jetVy
      if (this.pt > 16) { this.phase = 'sink'; this.pt = 0 }
    }
    this.y = Math.max(36, Math.min(this.y, 176))
    if (this.x < g.cam - 40) { this.dead = true; return }
    g.enemyVsPlayer(this)
  }
  draw(ctx, cam) {
    if (!this.active) return
    const x = Math.round(this.x - 1 - cam), y = Math.round(this.y), jet = this.phase === 'jet', flipY = this.state === 'flipped'
    ctx.save(); ctx.translate(x, flipY ? y + 16 : y); if (flipY) ctx.scale(1, -1)
    FR(ctx, '#fcfcfc', 2, 0, 12, 9); FR(ctx, '#bcbcbc', 2, 7, 12, 2); FR(ctx, '#000', 4, 3, 2, 3); FR(ctx, '#000', 10, 3, 2, 3)
    const t = jet ? 3 : 7; FR(ctx, '#fcfcfc', 2, 9, 3, t); FR(ctx, '#fcfcfc', 7, 9, 2, t); FR(ctx, '#fcfcfc', 11, 9, 3, t)
    ctx.restore()
  }
}
// kẻ địch mà Bowser giả có thể là
const FAKES = { goomba: Goomba, koopa: Koopa, redkoopa: RedKoopa, buzzy: Buzzy, spiny: Spiny, hammerbro: HammerBro }

// ---- Đòn của Bowser thật: sóng xung kích khi đập đất, mưa đá có vạch cảnh báo ----
export class Shockwave {
  type = 'shock'
  constructor(x, y, vx) { Object.assign(this, { x, y, w: 14, h: 10, vx, t: 0, dead: false }) }
  update(g) {
    if (hud.status !== 'playing') return
    this.t++; this.x += this.vx
    if (this.x < g.cam - 20 || this.x > g.cam + VW + 20) { this.dead = true; return }
    if (overlap(this, g.player)) g.hurtPlayer()
  }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam), y = Math.round(this.y), f = Math.floor(this.t / 3) % 2
    FR(ctx, '#fcd000', x, y + 4, 14, 6); FR(ctx, '#fcfcfc', x + 2, y + 6, 10, 3); FR(ctx, '#fc7400', x + (this.vx > 0 ? 7 : 1), y + (f ? 0 : 2), 6, 6)
  }
}
export class Rock {
  type = 'rock'
  constructor(cx, delay = 0) { Object.assign(this, { x: cx - 6, y: 84, w: 12, h: 12, vy: 0, t: -delay, dead: false }) }
  update(g) {
    if (hud.status !== 'playing') return
    this.t++
    if (this.t < 44) return // đang báo trước
    this.vy = Math.min(this.vy + 0.2, 4); this.y += this.vy
    if (this.y >= 180) { this.dead = true; g.shake = Math.max(g.shake, 5); sfx('break'); return }
    if (overlap(this, g.player)) g.hurtPlayer()
  }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam)
    if (this.t < 44) { if (this.t > 0 && Math.floor(this.t / 4) % 2) { FR(ctx, '#d82800', x + 4, 166, 4, 13); FR(ctx, '#d82800', x + 4, 182, 4, 4) } return } // dấu '!' cảnh báo trên sàn
    const y = Math.round(this.y); FR(ctx, '#7c7c7c', x, y, 12, 12); FR(ctx, '#bcbcbc', x, y, 12, 2); FR(ctx, '#bcbcbc', x, y, 2, 12); FR(ctx, '#505050', x + 10, y, 2, 12); FR(ctx, '#505050', x, y + 10, 12, 2)
  }
}
