// Hiệu ứng thuần hình ảnh: mảnh gạch vỡ, xu bật lên, điểm số bay.
export class Debris {
  constructor(x, y, vx, vy) { Object.assign(this, { x, y, vx, vy, dead: false }) }
  update() { this.vy += 0.3; this.x += this.vx; this.y += this.vy; if (this.y > 260) this.dead = true }
  draw(ctx, cam) { ctx.fillStyle = '#c84c0c'; ctx.fillRect(Math.round(this.x - cam), Math.round(this.y), 8, 8); ctx.fillStyle = '#000'; ctx.fillRect(Math.round(this.x - cam), Math.round(this.y) + 7, 8, 1) }
}
export class CoinPop {
  constructor(x, y) { Object.assign(this, { x, y, vy: -5, t: 0, dead: false }) }
  update() { this.t++; this.vy += 0.3; this.y += this.vy; if (this.t > 34) this.dead = true }
  draw(ctx, cam) { const w = [8, 4, 2, 4][Math.floor(this.t / 3) % 4]; ctx.fillStyle = '#fcd000'; ctx.fillRect(Math.round(this.x - cam - w / 2), Math.round(this.y), w, 14); ctx.fillStyle = '#fc9838'; ctx.fillRect(Math.round(this.x - cam - w / 2), Math.round(this.y) + 12, w, 2) }
}
export class Popup {
  constructor(x, y, text) { Object.assign(this, { x, y, text, t: 0, dead: false }) }
  update() { this.t++; this.y -= 0.6; if (this.t > 45) this.dead = true }
  draw(ctx, cam) { ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(this.text, Math.round(this.x - cam) + 1, Math.round(this.y) + 1); ctx.fillStyle = '#fff'; ctx.fillText(this.text, Math.round(this.x - cam), Math.round(this.y)) }
}
