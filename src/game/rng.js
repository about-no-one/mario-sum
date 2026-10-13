// Bộ sinh số ngẫu nhiên có hạt giống (mulberry32): cùng hạt giống -> cùng một màn chơi.
export function rng(seed) {
  let a = seed >>> 0
  const f = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1))
  f.pick = (arr) => arr[Math.floor(f() * arr.length)]
  return f
}
