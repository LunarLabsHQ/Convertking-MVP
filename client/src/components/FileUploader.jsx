import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const FileUploader = ({ converterId, type }) => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [converting, setConverting] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [downloadFilename, setDownloadFilename] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    e.stopPropagation()
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      console.log('File selected:', selectedFile.name)
      setFile(selectedFile)
      setError(null)
      setDownloadUrl(null)
      setDownloadFilename(null)
      setConverting(false)
      setProgress(0)
    }
  }

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setProgress(0)
    setConverting(false)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('converterId', converterId)
    formData.append('type', type)

    try {
      const response = await axios.post('/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for large files
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setProgress(percentCompleted)
            // When upload is complete, show converting status
            if (percentCompleted === 100) {
              setConverting(true)
            }
          }
        },
      })

      if (response.data.success) {
        setDownloadUrl(response.data.downloadUrl)
        setDownloadFilename(response.data.filename || 'converted-file')
        setProgress(100)
      } else {
        setError(response.data.error || 'Conversion failed')
      }
    } catch (err) {
      let errorMessage = 'An error occurred during conversion'
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || `Server error: ${err.response.status}`
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'No response from server. Please ensure the backend server is running on port 5000.'
      } else {
        // Error setting up request
        errorMessage = err.message || errorMessage
      }
      
      setError(errorMessage)
      console.error('Conversion error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!downloadUrl) return

    try {
      // Use full backend URL for download
      const fullUrl = downloadUrl.startsWith('http')
        ? downloadUrl
        : `http://localhost:5000${downloadUrl}`

      // Fetch the file as a blob
      const response = await fetch(fullUrl)
      const blob = await response.blob()

      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob)
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

      // Delete the converted file from server after download
      if (downloadFilename) {
        try {
          await axios.delete(`http://localhost:5000/api/converted/${downloadFilename}`)
          console.log('Converted file deleted from server:', downloadFilename)
        } catch (deleteErr) {
          console.error('Failed to delete file from server:', deleteErr)
          // Don't show error to user as download was successful
        }
      }
    } catch (err) {
      console.error('Download error:', err)
      // Fallback: use direct link if blob download fails
      const fullUrl = downloadUrl.startsWith('http')
        ? downloadUrl
        : `http://localhost:5000${downloadUrl}`

      const link = document.createElement('a')
      link.href = fullUrl
      link.download = downloadFilename || 'converted-file'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Delete the converted file from server after download
      if (downloadFilename) {
        try {
          await axios.delete(`http://localhost:5000/api/converted/${downloadFilename}`)
          console.log('Converted file deleted from server:', downloadFilename)
        } catch (deleteErr) {
          console.error('Failed to delete file from server:', deleteErr)
          // Don't show error to user as download was successful
        }
      }
    }
  }

  console.log('FileUploader render - file:', !!file, 'uploading:', uploading, 'downloadUrl:', !!downloadUrl)

  return (
    <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={
            type === 'video' 
              ? 'video/*' 
              : type === 'audio' 
              ? 'audio/*,video/*' 
              : type === 'image'
              ? 'image/*,.pdf'
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
            const droppedFile = e.dataTransfer.files[0]
            if (droppedFile) {
              console.log('File dropped:', droppedFile.name)
              setFile(droppedFile)
              setError(null)
              setDownloadUrl(null)
              setDownloadFilename(null)
              setConverting(false)
              setProgress(0)
            }
          }}
          className="glass-effect rounded-xl p-4 sm:p-6 md:p-8 cursor-pointer hover:bg-black/60 hover:border-yellow-500/30 transition-all text-center border-2 border-dashed border-gray-700 hover:border-yellow-500/50 block min-h-[160px] sm:min-h-[180px] md:min-h-[200px] flex items-center justify-center"
        >
          <div className="text-white w-full">
            {file ? (
              <div className="px-2">
                <p className="font-bold text-sm sm:text-base md:text-lg text-white mb-1 break-words">{file.name}</p>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
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
                <p className="text-base sm:text-lg mb-1 sm:mb-2 text-white font-semibold">Click to select file</p>
                <p className="text-xs sm:text-sm text-gray-400">or drag and drop here</p>
              </div>
            )}
          </div>
        </label>

        {file && !uploading && !downloadUrl && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {console.log('Buttons should show - file:', !!file, 'uploading:', uploading, 'downloadUrl:', !!downloadUrl)}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
                setError(null)
                setDownloadUrl(null)
                setDownloadFilename(null)
                setConverting(false)
                setProgress(0)
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
        
        {file && uploading && (
          <motion.button
            disabled={true}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black py-3 sm:py-4 px-6 sm:px-8 rounded-xl opacity-50 cursor-not-allowed shadow-lg shadow-yellow-500/50 text-base sm:text-lg tracking-wide uppercase"
          >
            {converting ? 'Converting...' : `Uploading... ${progress}%`}
          </motion.button>
        )}

        {uploading && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                {converting ? 'Converting file...' : 'Uploading...'}
              </span>
              <span className="text-sm font-bold text-yellow-500">
                {converting ? '' : `${progress}%`}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5 border border-gray-700">
              <motion.div
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2.5 rounded-full shadow-lg shadow-yellow-500/50"
                initial={{ width: 0 }}
                animate={{ width: converting ? '100%' : `${progress}%` }}
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

        {downloadUrl && (
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
                  setError(null)
                  setDownloadUrl(null)
                  setDownloadFilename(null)
                  setConverting(false)
                  setProgress(0)
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
