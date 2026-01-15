import { useState } from 'react'
import { motion } from 'framer-motion'
import ConverterCard from './ConverterCard'

const VideoConverters = () => {
  const [activeConverter, setActiveConverter] = useState(null)

  const converters = [
    { id: 'mp4', title: 'MP4 Converter', description: 'Convert any video to MP4 format' },
    { id: 'gif', title: 'Video to GIF', description: 'Transform videos into animated GIFs' },
    { id: 'mov-mp4', title: 'MOV to MP4', description: 'Convert MOV files to MP4 format' },
  ]

  return (
    <motion.div
      id="video"
      initial={{ opacity: 0, x: -50 }}
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
          🎥 Video Converter
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
            type="video"
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
          converter={{ id: 'video-general', title: 'Video Converter', description: 'General video conversion tool' }}
          type="video"
          isActive={activeConverter === 'video-general'}
          onClick={() => setActiveConverter(activeConverter === 'video-general' ? null : 'video-general')}
        />
      </motion.div>
    </motion.div>
  )
}

export default VideoConverters
