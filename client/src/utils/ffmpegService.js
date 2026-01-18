import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance = null
let isLoading = false

export const loadFFmpeg = async (onProgress) => {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance
  }

  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return ffmpegInstance
  }

  isLoading = true

  try {
    const ffmpeg = new FFmpeg()

    // Set up logging
    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg:', message)
    })

    // Set up progress tracking
    if (onProgress) {
      ffmpeg.on('progress', ({ progress, time }) => {
        onProgress(Math.round(progress * 100))
      })
    }

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    ffmpegInstance = ffmpeg
    ffmpeg.loaded = true
    return ffmpeg
  } finally {
    isLoading = false
  }
}

export const convertVideo = async (file, outputFormat, options = {}, onProgress) => {
  const ffmpeg = await loadFFmpeg(onProgress)

  const inputFileName = 'input' + getFileExtension(file.name)
  const outputFileName = `output.${outputFormat}`

  // Write input file to FFmpeg's virtual file system
  await ffmpeg.writeFile(inputFileName, await fetchFile(file))

  // Build FFmpeg command based on output format and options
  const args = ['-i', inputFileName]

  switch (outputFormat) {
    case 'mp4':
      args.push('-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart')
      break
    case 'gif':
      args.push('-vf', 'fps=10,scale=800:-1:flags=lanczos', '-c:v', 'gif')
      break
    case 'mp3':
      args.push('-vn', '-c:a', 'libmp3lame', '-b:a', '192k')
      break
    case 'webm':
      args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus')
      break
    default:
      args.push('-c', 'copy') // Just remux
  }

  args.push(outputFileName)

  // Execute FFmpeg command
  await ffmpeg.exec(args)

  // Read the output file
  const data = await ffmpeg.readFile(outputFileName)

  // Clean up
  await ffmpeg.deleteFile(inputFileName)
  await ffmpeg.deleteFile(outputFileName)

  // Convert to Blob and return
  const blob = new Blob([data.buffer], { type: getMimeType(outputFormat) })
  return blob
}

export const convertAudio = async (file, outputFormat, options = {}, onProgress) => {
  const ffmpeg = await loadFFmpeg(onProgress)

  const inputFileName = 'input' + getFileExtension(file.name)
  const outputFileName = `output.${outputFormat}`

  await ffmpeg.writeFile(inputFileName, await fetchFile(file))

  const args = ['-i', inputFileName]

  switch (outputFormat) {
    case 'mp3':
      args.push('-vn', '-c:a', 'libmp3lame', '-b:a', '192k')
      break
    case 'wav':
      args.push('-vn', '-c:a', 'pcm_s16le')
      break
    case 'ogg':
      args.push('-vn', '-c:a', 'libvorbis')
      break
    case 'aac':
      args.push('-vn', '-c:a', 'aac', '-b:a', '192k')
      break
    default:
      args.push('-vn', '-c:a', 'copy')
  }

  args.push(outputFileName)

  await ffmpeg.exec(args)
  const data = await ffmpeg.readFile(outputFileName)

  await ffmpeg.deleteFile(inputFileName)
  await ffmpeg.deleteFile(outputFileName)

  const blob = new Blob([data.buffer], { type: getMimeType(outputFormat) })
  return blob
}

function getFileExtension(filename) {
  return filename.substring(filename.lastIndexOf('.'))
}

function getMimeType(format) {
  const mimeTypes = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    gif: 'image/gif',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
  }
  return mimeTypes[format] || 'application/octet-stream'
}
