import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { performConversion } from '../utils/conversionService'

const FileUploader = ({ converterId, type }) => {
  const [file, setFile] = useState(null)
  const [files, setFiles] = useState([]) // For multiple file uploads
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [convertedBlob, setConvertedBlob] = useState(null)
  const [downloadFilename, setDownloadFilename] = useState(null)
  const [error, setError] = useState(null)
  const [loadingFFmpeg, setLoadingFFmpeg] = useState(false)
  const fileInputRef = useRef(null)

  // Converters that support multiple files
  const multiFileConverters = ['image-pdf']
  const supportsMultiple = multiFileConverters.includes(converterId)

  const handleFileSelect = (e) => {
    e.stopPropagation()

    if (supportsMultiple) {
      const selectedFiles = Array.from(e.target.files)
      if (selectedFiles.length > 0) {
        console.log('Files selected:', selectedFiles.map(f => f.name))
        setFiles(selectedFiles)
        setFile(null) // Clear single file
        setError(null)
        setConvertedBlob(null)
        setDownloadFilename(null)
        setConverting(false)
        setProgress(0)
        setLoadingFFmpeg(false)
      }
    } else {
      const selectedFile = e.target.files[0]
      if (selectedFile) {
        console.log('File selected:', selectedFile.name)
        setFile(selectedFile)
        setFiles([]) // Clear multiple files
        setError(null)
        setConvertedBlob(null)
        setDownloadFilename(null)
        setConverting(false)
        setProgress(0)
        setLoadingFFmpeg(false)
      }
    }
  }

  const handleConvert = async () => {
    const hasFiles = supportsMultiple ? files.length > 0 : file
    if (!hasFiles) {
      setError('Please select a file first')
      return
    }

    setConverting(true)
    setProgress(0)
    setError(null)
    setLoadingFFmpeg(true)

    try {
      // Check if backend API is available
      const apiUrl = import.meta.env.VITE_API_URL

      if (apiUrl) {
        // Use backend API for conversion
        const formData = new FormData()

        if (supportsMultiple) {
          files.forEach(f => formData.append('files', f))
        } else {
          formData.append('file', file)
        }

        formData.append('converterId', converterId)
        formData.append('type', type)

        setLoadingFFmpeg(false)
        setProgress(10)

        const response = await fetch(`${apiUrl}/api/convert`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Conversion failed')
        }

        setProgress(50)

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Conversion failed')
        }

        setProgress(75)

        // Download the converted file from backend
        const downloadResponse = await fetch(`${apiUrl}${result.downloadUrl}`)
        const blob = await downloadResponse.blob()

        setConvertedBlob(blob)
        setDownloadFilename(result.filename)
        setProgress(100)
      } else {
        // Fallback to client-side conversion
        const fileToConvert = supportsMultiple ? files : file
        const result = await performConversion(
          fileToConvert,
          converterId,
          type,
          (progressValue) => {
            setProgress(progressValue)
            setLoadingFFmpeg(false)
          }
        )

        setConvertedBlob(result.blob)
        setDownloadFilename(result.filename)
        setProgress(100)
      }
    } catch (err) {
      let errorMessage = 'An error occurred during conversion'

      if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      console.error('Conversion error:', err)
    } finally {
      setConverting(false)
      setLoadingFFmpeg(false)
    }
  }

  const handleDownload = () => {
    if (!convertedBlob) return

    // Create a blob URL and trigger download
    const blobUrl = window.URL.createObjectURL(convertedBlob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = downloadFilename || 'converted-file'
    link.style.display = 'none'

    // Append to body, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the blob URL after a short delay
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 100)
  }

  console.log('FileUploader render - file:', !!file, 'files:', files.length, 'converting:', converting, 'convertedBlob:', !!convertedBlob)

  return (
    <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple={supportsMultiple}
          accept={
            type === 'video'
              ? 'video/*'
              : type === 'audio'
              ? 'audio/*,video/*'
              : type === 'image'
              ? 'image/*,.pdf,.heic,.heif'
              : type === 'document'
              ? '.pdf,.doc,.docx,.epub,.mobi'
              : '*/*'
          }
          className="hidden"
          id={`file-input-${converterId}`}
        />
        
        <label
          htmlFor={`file-input-${converterId}`}
          onClick={(e) => {
            e.stopPropagation()
            console.log('Label clicked')
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()

            if (supportsMultiple) {
              const droppedFiles = Array.from(e.dataTransfer.files)
              if (droppedFiles.length > 0) {
                console.log('Files dropped:', droppedFiles.map(f => f.name))
                setFiles(droppedFiles)
                setFile(null)
                setError(null)
                setConvertedBlob(null)
                setDownloadFilename(null)
                setConverting(false)
                setProgress(0)
                setLoadingFFmpeg(false)
              }
            } else {
              const droppedFile = e.dataTransfer.files[0]
              if (droppedFile) {
                console.log('File dropped:', droppedFile.name)
                setFile(droppedFile)
                setFiles([])
                setError(null)
                setConvertedBlob(null)
                setDownloadFilename(null)
                setConverting(false)
                setProgress(0)
                setLoadingFFmpeg(false)
              }
            }
          }}
          className="glass-effect rounded-xl p-4 sm:p-6 md:p-8 cursor-pointer hover:bg-black/60 hover:border-yellow-500/30 transition-all text-center border-2 border-dashed border-gray-700 hover:border-yellow-500/50 block min-h-[160px] sm:min-h-[180px] md:min-h-[200px] flex items-center justify-center"
        >
          <div className="text-white w-full">
            {file || files.length > 0 ? (
              <div className="px-2">
                {supportsMultiple && files.length > 0 ? (
                  <div>
                    <p className="font-bold text-sm sm:text-base md:text-lg text-white mb-2">
                      {files.length} file{files.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1 text-left">
                      {files.map((f, idx) => (
                        <div key={idx} className="text-xs sm:text-sm text-gray-300 truncate">
                          • {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium mt-2">
                      Total: {(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-sm sm:text-base md:text-lg text-white mb-1 break-words">{file.name}</p>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <p className="text-base sm:text-lg mb-1 sm:mb-2 text-white font-semibold">
                  Click to select file{supportsMultiple ? 's' : ''}
                </p>
                <p className="text-xs sm:text-sm text-gray-400">or drag and drop here</p>
              </div>
            )}
          </div>
        </label>

        {(file || files.length > 0) && !converting && !convertedBlob && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
                setFiles([])
                setError(null)
                setConvertedBlob(null)
                setDownloadFilename(null)
                setConverting(false)
                setProgress(0)
                setLoadingFFmpeg(false)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              className="flex-1 bg-gray-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-gray-600 transition-all shadow-lg text-base sm:text-lg"
            >
              Clear
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                handleConvert()
              }}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg shadow-yellow-500/50 text-base sm:text-lg tracking-wide uppercase"
            >
              Convert
            </motion.button>
          </div>
        )}

        {(file || files.length > 0) && converting && (
          <motion.button
            disabled={true}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black py-3 sm:py-4 px-6 sm:px-8 rounded-xl opacity-50 cursor-not-allowed shadow-lg shadow-yellow-500/50 text-base sm:text-lg tracking-wide uppercase"
          >
            {loadingFFmpeg ? 'Loading FFmpeg...' : 'Converting...'}
          </motion.button>
        )}

        {converting && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                {loadingFFmpeg ? 'Loading conversion engine...' : 'Converting file...'}
              </span>
              <span className="text-sm font-bold text-yellow-500">
                {loadingFFmpeg ? '' : `${progress}%`}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5 border border-gray-700">
              <motion.div
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2.5 rounded-full shadow-lg shadow-yellow-500/50"
                initial={{ width: 0 }}
                animate={{ width: loadingFFmpeg ? '100%' : `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/30 border border-red-600 text-red-300 p-2 sm:p-3 rounded-lg text-xs sm:text-sm break-words"
          >
            {error}
          </motion.div>
        )}

        {convertedBlob && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2 sm:space-y-3"
          >
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-green-400 text-xs sm:text-sm font-semibold mb-1">✓ Conversion Complete!</p>
              {downloadFilename && (
                <p className="text-gray-400 text-xs break-words px-2">{downloadFilename}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">File converted locally in your browser</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload()
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/50 text-base sm:text-lg tracking-wide flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Download File</span>
                <span className="sm:hidden">Download</span>
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setFiles([])
                  setError(null)
                  setConvertedBlob(null)
                  setDownloadFilename(null)
                  setConverting(false)
                  setProgress(0)
                  setLoadingFFmpeg(false)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="flex-1 bg-gray-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-gray-600 transition-all shadow-lg text-base sm:text-lg"
              >
                Convert Another
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default FileUploader
