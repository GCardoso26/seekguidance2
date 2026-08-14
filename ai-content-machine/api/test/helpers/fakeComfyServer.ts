import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

export type FakeComfyHandle = {
  url: string
  png: Buffer
  close: () => Promise<void>
}

function makePng(width: number, height: number): Buffer {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cwm-fake-comfy-'))
  const out = path.join(dir, 'scene.png')
  const res = spawnSync(
    'ffmpeg',
    ['-y', '-f', 'lavfi', '-i', `color=c=0x0B6E6E:s=${width}x${height}`, '-frames:v', '1', out],
    { encoding: 'utf8' },
  )
  if (res.status !== 0 || !fs.existsSync(out)) {
    throw new Error(`fake_comfy_png_failed:${res.stderr || res.stdout || 'ffmpeg'}`)
  }
  const buf = fs.readFileSync(out)
  fs.rmSync(dir, { recursive: true, force: true })
  return buf
}

/**
 * HTTP stand-in for ComfyUI (/system_stats, /prompt, /history, /view).
 * Used by publishing E2E so packages can become READY_FOR_PUBLISH without a GPU.
 */
export async function startFakeComfyServer(opts?: {
  width?: number
  height?: number
}): Promise<FakeComfyHandle> {
  const png = makePng(opts?.width ?? 256, opts?.height ?? 448)
  const jobs = new Map<string, true>()

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const send = (code: number, body: unknown, headers?: Record<string, string>) => {
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body))
      res.writeHead(code, {
        'content-type': Buffer.isBuffer(body) ? 'image/png' : 'application/json',
        'content-length': buf.length,
        ...headers,
      })
      res.end(buf)
    }

    if (req.method === 'GET' && url.pathname === '/system_stats') {
      send(200, { system: { os: 'linux', comfy: 'fake' }, devices: [] })
      return
    }
    if (req.method === 'POST' && url.pathname === '/prompt') {
      const id = `fake_${jobs.size + 1}`
      jobs.set(id, true)
      const chunks: Buffer[] = []
      req.on('data', (c) => chunks.push(c as Buffer))
      req.on('end', () => send(200, { prompt_id: id }))
      return
    }
    if (req.method === 'GET' && url.pathname.startsWith('/history/')) {
      const id = decodeURIComponent(url.pathname.slice('/history/'.length))
      send(200, {
        [id]: {
          status: { completed: true, status_str: 'success' },
          outputs: { '9': { images: [{ filename: 'out.png', subfolder: '', type: 'output' }] } },
        },
      })
      return
    }
    if (req.method === 'GET' && url.pathname === '/view') {
      send(200, png)
      return
    }
    send(404, { error: 'not_found' })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const addr = server.address()
  if (!addr || typeof addr === 'string') throw new Error('fake_comfy_bind_failed')
  return {
    url: `http://127.0.0.1:${addr.port}`,
    png,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()))
      }),
  }
}
