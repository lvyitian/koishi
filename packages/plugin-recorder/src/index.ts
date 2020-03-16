import { WriteStream, createWriteStream, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { Meta, Context } from 'koishi-core'

function pick <T, K extends keyof T> (source: T, keys: K[]): Pick<T, K> {
  return keys.reduce((prev, curr) => (prev[curr] = source[curr], prev), {} as Pick<T, K>)
}

const streams: Record<string, WriteStream> = {}

export interface RecorderOptions {
  folder?: string
}

const cwd = process.cwd()

export const name = 'recorder'

export function apply (ctx: Context, options: RecorderOptions = {}) {
  function handleMessage (meta: Meta) {
    if (meta.$ctxType !== 'group' || meta.postType === 'message' && meta.$group.assignee !== ctx.app.selfId) return
    const output = JSON.stringify(pick(meta, ['time', 'userId', 'message'])) + '\n'
    const path = resolve(cwd, options.folder || 'messages', `${meta.groupId}.txt`)
    if (!streams[path]) {
      const folder = dirname(path)
      if (!existsSync(folder)) {
        mkdirSync(folder, { recursive: true })
      }
      streams[path] = createWriteStream(path, { flags: 'a' })
    }
    streams[path].write(output)
  }

  ctx.on('attach-group', handleMessage)
  ctx.on('before-send', handleMessage)
}
