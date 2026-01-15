import { useState } from 'react'
import { motion } from 'framer-motion'
import ConverterCard from './ConverterCard'

const AudioConverters = () => {
  const [activeConverter, setActiveConverter] = useState(null)

  const converters = [
    { id: 'mp3', title: 'MP3 Converter', description: 'Convert any audio to MP3 format' },
    { id: 'mp4-mp3', title: 'MP4 to MP3', description: 'Extract audio from MP4 videos' },
    { id: 'video-mp3', title: 'Video to MP3', description: 'Convert video files to MP3 audio' },
  ]

  return (
    <motion.div
      id="audio"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <motion.h2
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-6 sm:mb-8 md:mb-12 text-center px-2"
        whileHover={{ scale: 1.05 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent drop-shadow-lg">
          🎵 Audio Converter
        </span>
      </motion.h2>
      
      {converters.map((converter, index) => (
        <motion.div
          key={converter.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <ConverterCard
            converter={converter}
            type="audio"
            isActive={activeConverter === converter.id}
            onClick={() => setActiveConverter(activeConverter === converter.id ? null : converter.id)}
          />
        </motion.div>
      ))}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <ConverterCard
          converter={{ id: 'audio-general', title: 'Audio Converter', description: 'General audio conversion tool' }}
          type="audio"
          isActive={activeConverter === 'audio-general'}
          onClick={() => setActiveConverter(activeConverter === 'audio-general' ? null : 'audio-general')}
        />
      </motion.div>
    </motion.div>
  )
}

export default AudioConverters
