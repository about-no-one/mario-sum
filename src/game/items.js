import { TILE, VH } from './constants.js'
import { moveX, moveY, overlap } from './physics.js'
import { drawSprite } from './sprites.js'
import { sfx } from './audio.js'
import { hud } from './state.js'
import { Popup } from './fx.js'

// Vật phẩm trồi lên từ hộp rồi mới hoạt động. Thêm power-up mới: kế thừa Rising + đăng ký trong engine.powerUp().
class Rising {
  constructor(c, r) { Object.assign(this, { x: c * TILE + 2, y: r * TILE, w: 12, h: 16, vx: 0, vy: 0, rise: 16, dead: false }) }
  update(g) {
    if (this.rise > 0) { this.rise -= 0.5; this.y -= 0.5; if (this.rise <= 0) this.onRisen(); return }
    this.move(g)
    if (this.y > VH + 32) { this.dead = true; return }
    if (overlap(this, g.player)) { this.dead = true; g.powerUp(this.type) }
  }
  onRisen() {}
  move() {}
}
export class Mushroom extends Rising {
  type = 'mushroom'; dir = 1
  onRisen() { this.dir = 1 }
  move(g) { this.vy = Math.min(this.vy + 0.3, 3.5); this.vx = this.dir * 0.9; if (moveX(this, g.level)) this.dir *= -1; moveY(this, g.level) }
  draw(ctx, cam, S) { drawSprite(ctx, S.mushroom, Math.round(this.x - 2 - cam), Math.round(this.y)) }
}
export class Flower extends Rising {
  type = 'flower'
  draw(ctx, cam, S) { drawSprite(ctx, S.flower, Math.round(this.x - 2 - cam), Math.round(this.y)) }
}
export class Fireball {
  type = 'fireball'
  constructor(x, y, dir) { Object.assign(this, { x, y, w: 8, h: 8, vx: dir * 3.2, vy: 0, t: 0, dead: false }) }
  update(g) {
    this.t++; this.vy = Math.min(this.vy + 0.25, 3.5)
    if (moveX(this, g.level)) { this.dead = true; sfx('bump'); return }
    const r = moveY(this, g.level)
    if (r === 'landed') this.vy = -2.8; else if (r) { this.dead = true; sfx('bump'); return }
    if (this.y > VH || this.x < g.cam - 16 || this.x > g.cam + 272) { this.dead = true; return }
    for (const e of g.enemies) {
      if (e.active && e.state !== 'flipped' && e.state !== 'squish' && overlap(this, e)) {
        if (e.boss) { e.hit(g); this.dead = true; return }
        if (e.fireproof) { this.dead = true; sfx('bump'); return }
        e.flip(g, this.vx > 0 ? 1 : -1); g.addScore(100, e); this.dead = true; return
      }
    }
  }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam), y = Math.round(this.y), a = Math.floor(this.t / 3) % 2
    ctx.fillStyle = '#fc7400'; ctx.fillRect(x + 2, y + (a ? 1 : 0), 4, 8 - (a ? 2 : 0)); ctx.fillRect(x, y + 2, 8, 4)
    ctx.fillStyle = '#fcd000'; ctx.fillRect(x + 3, y + 3, 2, 2)
  }
}

// 1-Up: nấm xanh, di chuyển như nấm thường nhưng cho thêm một mạng
export class OneUp extends Mushroom {
  type = '1up'
  draw(ctx, cam, S) { drawSprite(ctx, S.oneup, Math.round(this.x - 2 - cam), Math.round(this.y)) }
}
// Starman: nảy liên tục, chạm vào -> bất tử ~10 giây
export class Starman extends Rising {
  type = 'star'; dir = 1; t = 0
  onRisen() { this.vy = -3.5 }
  move(g) {
    this.t++; this.vy = Math.min(this.vy + 0.2, 3); this.vx = this.dir
    if (moveX(this, g.level)) this.dir *= -1
    if (moveY(this, g.level) === 'landed') this.vy = -3.2
  }
  draw(ctx, cam, S) { drawSprite(ctx, S.star[Math.floor(this.t / 4) % 2], Math.round(this.x - 2 - cam), Math.round(this.y)) }
}
// Xu đặt sẵn trong màn chơi
export class Coin {
  type = 'coin'
  constructor(c, r) { Object.assign(this, { x: c * TILE + 3, y: r * TILE + 1, w: 10, h: 14, t: (c * 5) % 24, dead: false }) }
  update(g) { this.t++; if (overlap(this, g.player)) { this.dead = true; g.addCoin(); g.addScore(200); sfx('coin') } }
  draw(ctx, cam) {
    const w = [8, 5, 2, 5][Math.floor(this.t / 6) % 4], x = Math.round(this.x + 5 - w / 2 - cam)
    ctx.fillStyle = '#fcd000'; ctx.fillRect(x, Math.round(this.y), w, 14); ctx.fillStyle = '#fc9838'; ctx.fillRect(x, Math.round(this.y) + 11, w, 3)
  }
}

// Thanh lửa xoay (lâu đài): 6 quả cầu quanh một khối gốc
export class FireBar {
  type = 'firebar'
  constructor(c, r, a = 0, dir = 1) { Object.assign(this, { cx: c * TILE + 8, cy: r * TILE + 8, a, dir, dead: false }) }
  update(g) {
    this.a += 0.045 * this.dir
    if (hud.status !== 'playing') return
    for (let k = 1; k <= 5; k++) {
      const b = { x: this.cx + Math.cos(this.a) * k * 8 - 3, y: this.cy + Math.sin(this.a) * k * 8 - 3, w: 6, h: 6 }
      if (overlap(b, g.player)) { g.hurtPlayer(); return }
    }
  }
  draw(ctx, cam) {
    for (let k = 0; k <= 5; k++) {
      const x = Math.round(this.cx + Math.cos(this.a) * k * 8 - 4 - cam), y = Math.round(this.cy + Math.sin(this.a) * k * 8 - 4)
      ctx.fillStyle = '#fc7400'; ctx.fillRect(x, y, 8, 8); ctx.fillStyle = '#fcd000'; ctx.fillRect(x + 2, y + 2, 4, 4)
    }
  }
}
// Hơi lửa của Bowser
export class BowserFire {
  type = 'bfire'
  constructor(x, y, dir) { Object.assign(this, { x, y, w: 16, h: 8, vx: dir * 1.7, t: 0, dead: false }) }
  update(g) {
    this.t++; this.x += this.vx
    if (this.x < g.cam - 32 || this.x > g.cam + 300) this.dead = true
    if (hud.status === 'playing' && overlap(this, g.player)) g.hurtPlayer()
  }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam), y = Math.round(this.y), f = Math.floor(this.t / 3) % 2
    ctx.fillStyle = '#d82800'; ctx.fillRect(x, y + f, 16, 7 - f); ctx.fillStyle = '#fc7400'; ctx.fillRect(x + (this.vx < 0 ? 2 : 0), y + 1, 12, 5)
    ctx.fillStyle = '#fcd000'; ctx.fillRect(x + (this.vx < 0 ? 2 : 4), y + 2, 8, 3)
  }
}
// Rìu cuối cầu: chạm vào là cầu sập, Bowser rơi xuống dung nham
export class Axe {
  type = 'axe'
  constructor(c, r) { Object.assign(this, { x: c * TILE, y: r * TILE, w: 16, h: 16, t: 0, dead: false, locked: false, nag: 0 }) }
  update(g) {
    this.t++; if (this.nag > 0) this.nag--
    this.locked = g.enemies.some((e) => e.real && !e.dead && e.state !== 'flipped') // Bowser thật còn sống: rìu bị khóa
    if (!overlap(this, g.player)) return
    if (!this.locked) g.triggerAxe()
    else if (this.nag <= 0 && hud.status === 'playing') { g.fx.push(new Popup(this.x + 8, this.y - 6, 'LOCKED!')); sfx('bump'); this.nag = 80 }
  }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam), y = Math.round(this.y), c = Math.floor(this.t / 8) % 2 ? '#fcfcfc' : '#bcbcbc'
    if (this.locked) ctx.globalAlpha = 0.55
    ctx.fillStyle = '#a05020'; ctx.fillRect(x + 7, y + 4, 3, 12); ctx.fillStyle = this.locked ? '#7c7c7c' : c; ctx.fillRect(x + 1, y + 1, 8, 8); ctx.fillStyle = '#505050'; ctx.fillRect(x + 1, y + 8, 8, 1); ctx.fillRect(x + 8, y + 1, 1, 8)
    ctx.globalAlpha = 1
    if (this.locked) { ctx.fillStyle = '#d82800'; ctx.fillRect(x, y + 2, 12, 2); ctx.fillRect(x, y + 9, 12, 2); ctx.fillRect(x + 5, y, 2, 14) } // xích khóa
  }
}
// Toad: xuất hiện sau khi cầu sập; chạm vào để kết thúc
export class Toad {
  type = 'toad'; visible = false
  constructor(c, r) { Object.assign(this, { x: c * TILE + 2, y: r * TILE, w: 12, h: 16, dead: false }) }
  update(g) { if (this.visible && overlap(this, g.player)) g.rescue() }
  draw(ctx, cam) {
    if (!this.visible) return
    const x = Math.round(this.x - 2 - cam), y = Math.round(this.y)
    ctx.fillStyle = '#fcfcfc'; ctx.fillRect(x + 2, y, 12, 8); ctx.fillStyle = '#d82800'; ctx.fillRect(x + 3, y + 1, 3, 3); ctx.fillRect(x + 10, y + 1, 3, 3); ctx.fillRect(x + 6, y + 4, 4, 3)
    ctx.fillStyle = '#fc9838'; ctx.fillRect(x + 4, y + 8, 8, 4); ctx.fillStyle = '#000'; ctx.fillRect(x + 5, y + 9, 1, 2); ctx.fillRect(x + 10, y + 9, 1, 2)
    ctx.fillStyle = '#fcfcfc'; ctx.fillRect(x + 3, y + 12, 10, 4); ctx.fillStyle = '#2038ec'; ctx.fillRect(x + 5, y + 12, 6, 4)
  }
}

// Công chúa Peach (cuối 8-4): dùng chung logic với Toad
export class Peach extends Toad {
  draw(ctx, cam) {
    if (!this.visible) return
    const x = Math.round(this.x - 2 - cam), y = Math.round(this.y), R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h) }
    R('#fcd000', 3, 0, 10, 5); R('#fc9838', 5, 4, 7, 5); R('#000', 6, 6, 1, 2); R('#000', 10, 6, 1, 2); R('#fcd000', 2, 3, 3, 8)
    R('#fc9cb0', 3, 9, 10, 7); R('#fcc0d0', 1, 12, 14, 4); R('#2038ec', 7, 10, 2, 2)
  }
}
