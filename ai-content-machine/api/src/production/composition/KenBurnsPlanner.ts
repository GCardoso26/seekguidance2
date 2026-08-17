export type KenBurnsMotion =
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_lr'
  | 'pan_rl'
  | 'pan_vertical'
  | 'slow_zoom_in'
  | 'slow_zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'pan_up'
  | 'pan_down'
  | 'zoom_pan_left'
  | 'zoom_pan_right'
  | 'static'

export type KenBurnsScenePlan = {
  scene: number
  imagePath: string
  durationSec: number
  motion: KenBurnsMotion
  startTime: number
  endTime: number
}

const MOTIONS: KenBurnsMotion[] = ['zoom_in', 'zoom_out', 'pan_lr', 'pan_rl', 'pan_vertical']
const HASH_MOTIONS: KenBurnsMotion[] = [
  'slow_zoom_in',
  'slow_zoom_out',
  'pan_left',
  'pan_right',
  'pan_up',
  'pan_down',
  'zoom_pan_left',
  'zoom_pan_right',
  'static',
]

function hash32(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic motion cycle — no randomness. Kept for existing tests. */
export function motionForSceneIndex(index: number): KenBurnsMotion {
  return MOTIONS[index % MOTIONS.length]
}

/** Deterministic by scene_id + asset hash (preferred). */
export function motionForAsset(sceneId: number, assetHash = ''): KenBurnsMotion {
  if (!assetHash) return motionForSceneIndex(Math.max(0, sceneId - 1))
  return HASH_MOTIONS[hash32(`${sceneId}:${assetHash}`) % HASH_MOTIONS.length]
}

/**
 * Build per-scene Ken Burns plan from assets + storyboard/total duration.
 * VisualProvider is not involved — composition owns presentation.
 */
export function planKenBurnsScenes(input: {
  imagePaths: string[]
  totalDurationSec: number
  storyboard?: Array<{ scene: number; duration: number; startTime: number; endTime: number; motion?: string }>
  assetHashes?: string[]
}): KenBurnsScenePlan[] {
  const images = input.imagePaths.filter(Boolean)
  if (!images.length) throw new Error('kenburns_no_images')

  const total = Math.max(1, input.totalDurationSec)
  const sb = input.storyboard?.length ? input.storyboard : null

  return images.map((imagePath, i) => {
    const fromStory = sb?.[i]?.motion as KenBurnsMotion | undefined
    const known = Boolean(
      fromStory && (HASH_MOTIONS.includes(fromStory) || MOTIONS.includes(fromStory)),
    )
    const motion = known
      ? (fromStory as KenBurnsMotion)
      : input.assetHashes?.[i]
        ? motionForAsset(sb?.[i]?.scene || i + 1, input.assetHashes[i])
        : motionForSceneIndex(i)
    if (sb && sb[i]) {
      return {
        scene: sb[i].scene || i + 1,
        imagePath,
        durationSec: Math.max(0.4, sb[i].duration || total / images.length),
        motion,
        startTime: sb[i].startTime,
        endTime: sb[i].endTime,
      }
    }
    const slice = total / images.length
    const startTime = i * slice
    return {
      scene: i + 1,
      imagePath,
      durationSec: Math.max(0.4, slice),
      motion,
      startTime,
      endTime: startTime + slice,
    }
  })
}

/**
 * FFmpeg zoompan expression for a motion. Frames = duration * fps.
 * Input should already be scaled large enough for pan/zoom.
 */
export function zoompanFilter(input: {
  motion: KenBurnsMotion
  width: number
  height: number
  fps: number
  frames: number
}): string {
  const { motion, width, height, fps, frames } = input
  const d = Math.max(2, frames)
  const last = Math.max(1, d - 1)
  const s = `s=${width}x${height}:fps=${fps}:d=${d}`
  const canonical = canonicalizeMotion(motion)

  switch (canonical) {
    case 'zoom_in':
    case 'slow_zoom_in':
      return `zoompan=z='min(1.0+0.0012*on,1.16)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':${s}`
    case 'zoom_out':
    case 'slow_zoom_out':
      return `zoompan=z='if(eq(on,0),1.16,max(1.16-0.0012*on,1.0))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':${s}`
    case 'pan_lr':
    case 'pan_right':
      return `zoompan=z='1.14':x='(iw-iw/zoom)*on/${last}':y='(ih-ih/zoom)/2':${s}`
    case 'pan_rl':
    case 'pan_left':
      return `zoompan=z='1.14':x='(iw-iw/zoom)*(1-on/${last})':y='(ih-ih/zoom)/2':${s}`
    case 'pan_vertical':
    case 'pan_down':
      return `zoompan=z='1.14':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*on/${last}':${s}`
    case 'pan_up':
      return `zoompan=z='1.14':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(1-on/${last})':${s}`
    case 'zoom_pan_left':
      return `zoompan=z='min(1.0+0.0008*on,1.12)':x='(iw-iw/zoom)*(1-on/${last})':y='ih/2-(ih/zoom/2)':${s}`
    case 'zoom_pan_right':
      return `zoompan=z='min(1.0+0.0008*on,1.12)':x='(iw-iw/zoom)*on/${last}':y='ih/2-(ih/zoom/2)':${s}`
    case 'static':
      return `zoompan=z='1.0':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':${s}`
    default:
      return `zoompan=z='min(1.0+0.0012*on,1.16)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':${s}`
  }
}

function canonicalizeMotion(motion: KenBurnsMotion): KenBurnsMotion {
  return motion
}
