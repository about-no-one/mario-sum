import { audioCtx, toneAbs, isMuted } from './audio.js'
// Nhạc nền chiptune (sáng tác gốc): 2 kênh – lead (vuông) + bass (tam giác), lặp vô hạn.
// Cú pháp: "NỐT:SỐ_PHÁCH", '-' là nghỉ. Muốn đổi nhạc: sửa TRACKS hoặc thay bằng <audio> của bạn.
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const freq = (n) => { const m = /^([A-G])(#|b)?(\d)$/.exec(n); const s = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * 2 ** (((+m[3] + 1) * 12 + s - 69) / 12) }
const parse = (s) => s.trim().split(/\s+/).map((t) => { const [n, d] = t.split(':'); return [n === '-' ? 0 : freq(n), parseFloat(d)] })
const rep = (s, n) => (s + ' ').repeat(n)
const arp = (ns) => ns.split(' ').map((n) => n + ':.25').join(' ')

const ARPS = ['C5 E5 G5 E5 C5 E5 G5 E5', 'D5 F5 A5 F5 D5 F5 A5 F5', 'E5 G5 B5 G5 E5 G5 B5 G5', 'F5 A5 C6 A5 F5 A5 C6 A5',
  'G5 B5 D6 B5 G5 B5 D6 B5', 'F5 A5 C6 A5 F5 A5 C6 A5', 'E5 G5 B5 G5 E5 G5 B5 G5', 'D5 F5 A5 F5 D5 F5 A5 F5']
export const TRACKS = {
  over: { bpm: 156,
    lead: 'C5:.5 E5:.5 G5:.5 E5:.5 A5:1 G5:1  F5:.5 A5:.5 C6:.5 A5:.5 G5:1 E5:1  D5:.5 F5:.5 A5:.5 F5:.5 A5:1 F5:1  G5:.5 B5:.5 D6:.5 B5:.5 C6:2 ' +
      'E6:.5 D6:.5 C6:.5 D6:.5 E6:1 C6:1  A5:.5 G5:.5 A5:.5 C6:.5 G5:2  F5:.5 G5:.5 A5:.5 B5:.5 C6:1 A5:1  G5:1 E5:1 C5:2',
    bass: 'C3:1 G3:1 C3:1 G3:1  F3:1 C4:1 F3:1 C4:1  D3:1 A3:1 D3:1 A3:1  G3:1 D4:1 G3:1 D4:1  C3:1 G3:1 C3:1 G3:1  A2:1 E3:1 A2:1 E3:1  F3:1 C4:1 F3:1 C4:1  G3:2 C3:2' },
  under: { bpm: 96,
    lead: 'A4:1 -:1 C5:1 -:1  B4:1 -:1 E5:2  A4:1 C5:1 E5:1 D5:1  C5:1 B4:1 A4:2',
    bass: rep('A2:.5 A3:.5', 4) + rep('G2:.5 G3:.5', 4) + rep('F2:.5 F3:.5', 4) + rep('E2:.5 E3:.5', 4) },
  water: { bpm: 112,
    lead: 'G5:1 E5:.5 C5:.5 E5:1  D5:1 B4:.5 G4:.5 B4:1  C5:1 E5:.5 G5:.5 C6:1  B5:1.5 A5:.5 G5:1  A5:1 F5:.5 D5:.5 F5:1  G5:1 E5:.5 C5:.5 E5:1  F5:1 A5:.5 F5:.5 D5:1  C5:2 -:1',
    bass: 'C3:1 G3:1 E3:1  G2:1 D3:1 B2:1  C3:1 G3:1 E3:1  G2:1 D3:1 G3:1  D3:1 A3:1 F3:1  C3:1 G3:1 E3:1  F3:1 C4:1 A3:1  C3:3' },
  boss: { bpm: 144,
    lead: 'E4:.5 E4:.5 G4:.5 E4:.5 B4:1 A4:1  C5:.5 C5:.5 E5:.5 C5:.5 B4:1 G4:1  D4:.5 D4:.5 F4:.5 D4:.5 A4:1 G4:1  E4:.5 G4:.5 B4:.5 E5:.5 D5:1 B4:1',
    bass: rep('E2:.5 E2:.5 E3:.5 E2:.5', 2) + rep('C2:.5 C2:.5 C3:.5 C2:.5', 2) + rep('D2:.5 D2:.5 D3:.5 D2:.5', 2) + rep('E2:.5 E2:.5 E3:.5 E2:.5', 2) },
  rage: { bpm: 178,
    lead: ['E5 G5 B5 G5 E5 G5 B5 G5', 'C5 E5 G5 E5 C5 E5 G5 E5', 'D5 F5 A5 F5 D5 F5 A5 F5', 'B4 D5 F#5 D5 B4 D5 F#5 D5', 'E5 G5 B5 G5 E5 G5 B5 G5', 'C5 E5 G5 E5 C5 E5 G5 E5', 'D5 F5 A5 F5 D5 F5 A5 F5', 'B4 D5 F#5 D5 B4 D5 F#5 D5'].map(arp).join(' '),
    bass: rep('E2:.5 E2:.5 E3:.5 E2:.5', 2) + rep('C2:.5 C2:.5 C3:.5 C2:.5', 2) + rep('D2:.5 D2:.5 D3:.5 D2:.5', 2) + rep('B1:.5 B1:.5 B2:.5 B1:.5', 2) },
  castle: { bpm: 132,
    lead: 'E4:.5 E4:.5 B4:1 E4:.5 E4:.5 B4:1  E4:.5 E4:.5 C5:1 B4:1 A4:1  E4:.5 E4:.5 B4:1 E4:.5 E4:.5 B4:1  G4:1 F4:1 E4:2',
    bass: rep('E2:.5 B2:.5', 4) + rep('A2:.5 E3:.5', 4) + rep('E2:.5 B2:.5', 4) + rep('B2:.5 F#3:.5', 4) },
  star: { bpm: 190, lead: ARPS.map(arp).join(' '), bass: ['C3', 'D3', 'E3', 'F3', 'G3', 'F3', 'E3', 'D3'].map((n) => rep(n + ':.5', 4)).join(' ') },
}
for (const t of Object.values(TRACKS)) t.parsed = { lead: parse(t.lead), bass: parse(t.bass) }

let timer = null, name = null, cur = null, spb = 0.4, idx = null, tn = null, paused = false
function pump() {
  const a = audioCtx(); if (!a || isMuted()) return
  const horizon = a.currentTime + 0.5
  for (const v of ['lead', 'bass']) {
    const seq = cur[v]
    while (tn[v] < horizon) {
      const [f, d] = seq[idx[v]]
      if (f && tn[v] > a.currentTime - 0.02) toneAbs(f, f, tn[v], d * spb * 0.9, v === 'lead' ? 'square' : 'triangle', v === 'lead' ? 0.022 : 0.045)
      tn[v] += d * spb; idx[v] = (idx[v] + 1) % seq.length
    }
  }
}
const halt = () => { if (timer) clearInterval(timer); timer = null }
const begin = () => { const a = audioCtx(); if (!a || !cur) return; tn = { lead: a.currentTime + 0.08, bass: a.currentTime + 0.08 }; idx = { lead: 0, bass: 0 }; halt(); timer = setInterval(pump, 60) }

export const music = {
  play(n) { name = n; cur = TRACKS[n].parsed; spb = 60 / TRACKS[n].bpm; paused = false; begin() },
  stop() { name = null; halt() },
  pause() { halt(); paused = true },
  resume() { if (!paused || !name) return; paused = false; const a = audioCtx(); if (a) { tn = { lead: a.currentTime + 0.05, bass: a.currentTime + 0.05 }; timer = setInterval(pump, 60) } },
}
