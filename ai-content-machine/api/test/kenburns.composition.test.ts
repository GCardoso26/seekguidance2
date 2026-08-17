import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ffmpegService } from '../src/production/FFmpegService.js'
import {
  motionForSceneIndex,
  planKenBurnsScenes,
} from '../src/production/composition/KenBurnsPlanner.js'
import { ffmpegCompositionProvider } from '../src/production/composition/FfmpegCompositionProvider.js'
import type { ProductionPlan } from '../src/production/types.js'

process.env.AUTOMATION_MODE = 'mock'

describe('FFmpeg Ken Burns composition', () => {
  const tmp = path.join(os.tmpdir(), `cwm-kb-${Date.now()}`)

  before(() => {
    fs.mkdirSync(tmp, { recursive: true })
    assert.equal(ffmpegService.available(), true)
  })

  it('motion cycle is deterministic and alternating', () => {
    assert.equal(motionForSceneIndex(0), 'zoom_in')
    assert.equal(motionForSceneIndex(1), 'zoom_out')
    assert.equal(motionForSceneIndex(2), 'pan_lr')
    assert.equal(motionForSceneIndex(3), 'pan_rl')
    assert.equal(motionForSceneIndex(4), 'pan_vertical')
    assert.equal(motionForSceneIndex(5), 'zoom_in')
  })

  it('plans one Ken Burns scene per image covering total duration', () => {
    const plan = planKenBurnsScenes({
      imagePaths: ['/a.png', '/b.png', '/c.png'],
      totalDurationSec: 6,
    })
    assert.equal(plan.length, 3)
    assert.equal(plan[0].motion, 'zoom_in')
    assert.equal(plan[1].motion, 'zoom_out')
    assert.ok(Math.abs(plan.reduce((s, p) => s + p.durationSec, 0) - 6) < 0.01)
  })

  it('composes a real MP4 from narration + multiple stills with Ken Burns', () => {
    const img1 = path.join(tmp, 's1.png')
    const img2 = path.join(tmp, 's2.png')
    const img3 = path.join(tmp, 's3.png')
    const audio = path.join(tmp, 'narr.wav')
    const out = path.join(tmp, 'final.mp4')

    ffmpegService.generateColorImage(img1, 1080, 1920, '0x0B6E6E')
    ffmpegService.generateColorImage(img2, 1080, 1920, '0x1a1a2e')
    ffmpegService.generateColorImage(img3, 1080, 1920, '0x533483')
    ffmpegService.generateToneWav(audio, 3, 22050)

    const plan: ProductionPlan = {
      platform: 'YOUTUBE_SHORT',
      aspectRatio: '9:16',
      resolution: '1080x1920',
      width: 1080,
      height: 1920,
      fps: 30,
      targetDuration: 3,
      voice: { format: 'wav', sampleRate: 22050 },
      visual: { sceneCount: 3, assetType: 'IMAGE' },
      subtitle: { formats: ['srt', 'vtt'], burnIn: false },
      thumbnail: { width: 1080, height: 1920, format: 'png' },
    }

    const result = ffmpegCompositionProvider.compose({
      plan,
      audioPath: audio,
      imagePaths: [img1, img2, img3],
      outPath: out,
      storyboard: [
        {
          scene: 1,
          startTime: 0,
          endTime: 1,
          duration: 1,
          narrationSegment: 'a',
          visualPrompt: 'a',
          assetType: 'IMAGE',
          textOverlay: '',
          transition: 'none',
        },
        {
          scene: 2,
          startTime: 1,
          endTime: 2,
          duration: 1,
          narrationSegment: 'b',
          visualPrompt: 'b',
          assetType: 'IMAGE',
          textOverlay: '',
          transition: 'none',
        },
        {
          scene: 3,
          startTime: 2,
          endTime: 3,
          duration: 1,
          narrationSegment: 'c',
          visualPrompt: 'c',
          assetType: 'IMAGE',
          textOverlay: '',
          transition: 'none',
        },
      ],
    })

    assert.equal(result.provider, 'ffmpeg_kenburns')
    assert.ok(fs.existsSync(out))
    assert.ok(fs.statSync(out).size > 1000)
    assert.ok(result.duration > 0)
    assert.ok(result.kenBurns.length === 3)
    assert.deepEqual(
      result.kenBurns.map((k) => k.motion),
      ['zoom_in', 'zoom_out', 'pan_lr'],
    )
    const probe = ffmpegService.probe(out)
    assert.ok(probe.hasVideo && probe.hasAudio)
    assert.ok(probe.duration >= 2.5)
  })
})
