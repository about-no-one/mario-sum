import { VH } from './constants.js'
import { moveX, moveY, tilesHit } from './physics.js'
import { drawSprite } from './sprites.js'
import { keys as k, edge } from './input.js'
import { Fireball } from './items.js'
import { sfx } from './audio.js'
import { hud } from './state.js'

const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t))

export class Player {
  constructor(x, y) {
    Object.assign(this, { x, y, w: 12, h: 16, vx: 0, vy: 0, form: 'small', facing: 1, ground: false, skid: false,
      invuln: 0, anim: 0, swim: 0, swimT: 0, wet: false, stompChain: 0, dead: false, hidden: false, sliding: false, ducking: false, starT: 0 })
  }
  get big() { return this.form !== 'small' }
  setForm(f) { const bottom = this.y + this.h; this.form = f; this.ducking = false; this.h = f === 'small' ? 16 : 32; this.y = bottom - this.h }
  stand() { if (this.ducking) { this.ducking = false; this.h = 32; this.y -= 16 } }

  update(g) {
    const wet = !!g.level.water && this.x < g.level.dryFrom * 16 // dưới nước: trọng lực nhẹ, bơi bằng nút nhảy
    this.wet = wet; if (this.swim > 0) this.swim--; this.swimT++
    // ngồi xuống (chỉ Mario lớn/lửa) – chỉ đứng dậy khi phía trên còn chỗ
    if (this.big && !wet) {
      if (k.down && this.ground && !this.ducking) { this.ducking = true; this.h = 16; this.y += 16 }
      else if (this.ducking && !k.down && !tilesHit(g.level, { x: this.x, y: this.y - 16, w: this.w, h: 32 }).length) this.stand()
    }
    let dir = (k.right ? 1 : 0) - (k.left ? 1 : 0)
    if (this.ducking && this.ground) dir = 0
    const max = wet ? 1.3 : k.run ? 2.5 : 1.5
    this.skid = false
    if (dir) {
      if (this.vx * dir < 0) { this.vx += dir * (this.ground ? 0.18 : 0.1); this.skid = this.ground && !wet }
      else this.vx = approach(this.vx, dir * max, Math.abs(this.vx) < max ? (wet ? 0.05 : this.ground ? 0.08 : 0.06) : 0.03)
      if (!this.skid) this.facing = dir
    } else if (this.ground) this.vx = approach(this.vx, 0, 0.07)

    if (wet && edge.jumpPressed) { this.vy = -1.8; this.ground = false; this.swim = 10; sfx('swim') }
    else if (edge.jumpPressed && this.ground) { this.vy = -(4.3 + Math.abs(this.vx) * 0.12); this.ground = false; sfx(this.big ? 'jumpBig' : 'jump') }
    // Giữ nút nhảy -> trọng lực nhẹ (nhảy cao); thả sớm -> trọng lực nặng (nhảy thấp)
    if (wet) this.vy = Math.min(this.vy + 0.07, 1.15)
    else this.vy = Math.min(this.vy + (this.vy < 0 ? (k.jump ? 0.14 : 0.5) : 0.4), 4.5)

    if (edge.firePressed && this.form === 'fire' && !this.ducking && g.items.filter((i) => i.type === 'fireball').length < 2) {
      g.items.push(new Fireball(this.facing > 0 ? this.x + this.w : this.x - 8, this.y + 8, this.facing)); sfx('fire')
    }
    if (moveX(this, g.level)) this.vx = 0
    if (this.x < g.cam) { this.x = g.cam; this.vx = Math.max(this.vx, 0) }
    g.checkHidden(this)
    const r = moveY(this, g.level)
    if (r && r !== 'landed') g.bumpBlocks(r)
    if (this.ground) this.stompChain = 0
    this.anim += Math.abs(this.vx) * 0.12
    if (this.y > VH + 16) g.killPlayer()
  }

  draw(ctx, cam, S) {
    if (this.invuln > 0 && Math.floor(this.invuln / 3) % 2) return
    const set = this.starT > 0 ? S.marioStar[Math.floor(this.starT / 3) % 3][this.form] : S.mario[this.form]
    let pose = 'idle'
    if (this.dead || this.sliding) pose = 'jump'
    else if (this.wet && !this.ground) pose = this.swim > 0 ? (Math.floor(this.swimT / 4) % 2 ? 'w1' : 'w2') : 'jump'
    else if (!this.ground) pose = 'jump'
    else if (this.ducking) pose = 'crouch'
    else if (this.skid) pose = 'w2'
    else if (Math.abs(this.vx) > 0.1) pose = Math.floor(this.anim) % 2 ? 'w1' : 'w2'
    if (this.ducking && !this.ground) pose = 'crouch'
    const img = set[pose]
    if (hud.god) ctx.globalAlpha = 0.7
    drawSprite(ctx, img, Math.round(this.x + this.w / 2 - 8 - cam), Math.round(this.y + this.h - img.height), this.facing < 0)
    ctx.globalAlpha = 1
  }
}
