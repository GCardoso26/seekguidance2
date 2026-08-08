import type { StoryboardScene } from './types.js'

export type SubtitleCue = {
  index: number
  start: number
  end: number
  text: string
}

export type SubtitleQaResult = {
  status: 'PASS' | 'FAIL'
  issues: string[]
}

function pad(n: number, w = 2) {
  return String(n).padStart(w, '0')
}

function formatSrtTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.round((sec - Math.floor(sec)) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`
}

function formatVttTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.round((sec - Math.floor(sec)) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`
}

export function cuesFromStoryboard(scenes: StoryboardScene[]): SubtitleCue[] {
  return scenes.map((sc, i) => ({
    index: i + 1,
    start: sc.startTime,
    end: sc.endTime,
    text: (sc.textOverlay || sc.narrationSegment).slice(0, 80),
  }))
}

export function toSrt(cues: SubtitleCue[]): string {
  return cues
    .map((c) => `${c.index}\n${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}\n${c.text}\n`)
    .join('\n')
}

export function toVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map((c) => `${formatVttTime(c.start)} --> ${formatVttTime(c.end)}\n${c.text}\n`)
    .join('\n')
  return `WEBVTT\n\n${body}`
}

/** ASS support prepared for later — generator stub only */
export function toAss(_cues: SubtitleCue[]): string {
  throw Object.assign(new Error('subtitle_format_ass_not_implemented'), { code: 'NOT_CONFIGURED' })
}

export function validateSubtitles(
  cues: SubtitleCue[],
  videoDurationSec: number,
): SubtitleQaResult {
  const issues: string[] = []
  if (!cues.length) issues.push('no_cues')

  for (let i = 0; i < cues.length; i++) {
    const c = cues[i]
    if (!(c.start < c.end)) issues.push(`cue_${c.index}_start_gte_end`)
    if (c.start < 0 || c.end < 0) issues.push(`cue_${c.index}_negative_time`)
    if (c.end > videoDurationSec + 0.25) issues.push(`cue_${c.index}_exceeds_video`)
    if (i > 0 && c.start < cues[i - 1].end - 0.01) issues.push(`cue_${c.index}_overlap`)
    if (!c.text?.trim()) issues.push(`cue_${c.index}_empty_text`)
  }

  return { status: issues.length ? 'FAIL' : 'PASS', issues }
}

export class SubtitleService {
  build(scenes: StoryboardScene[], videoDurationSec: number) {
    const cues = cuesFromStoryboard(scenes)
    const qa = validateSubtitles(cues, videoDurationSec)
    return {
      cues,
      srt: toSrt(cues),
      vtt: toVtt(cues),
      qa,
    }
  }
}

export const subtitleService = new SubtitleService()
