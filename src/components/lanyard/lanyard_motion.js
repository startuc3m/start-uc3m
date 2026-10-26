export const LANYARD_STEP = 1000 / 60

export function advanceLanyardClock(clock, time) {
  const elapsed = Math.min(Math.max(time - clock.time, 0), 50)
  clock.time = time
  clock.accumulator += elapsed
  const steps = Math.floor((clock.accumulator + 1e-8) / LANYARD_STEP)
  clock.accumulator = Math.max(0, clock.accumulator - steps * LANYARD_STEP)
  return { steps, blend: clock.accumulator / LANYARD_STEP, elapsed }
}

export function smoothLanyardAngle(current, target, elapsed) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + difference * (1 - Math.exp(-elapsed / 75))
}
