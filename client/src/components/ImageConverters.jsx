import { useState } from 'react'
import { motion } from 'framer-motion'
import ConverterCard from './ConverterCard'

const ImageConverters = () => {
  const [activeConverter, setActiveConverter] = useState(null)

  const converters = [
    { id: 'image-pdf', title: 'Image to PDF', description: 'Convert any image to PDF format (supports multiple images)' },
    { id: 'pdf-jpg', title: 'PDF to JPG', description: 'Convert all PDF pages to JPG images (downloads as zip)' },
    { id: 'heic-jpg', title: 'HEIC to JPG', description: 'Convert HEIC images to JPG format' },
    { id: 'image-jpg', title: 'Image to JPG', description: 'Convert any image format to JPG' },
  ]

  return (
    <motion.div
      id="image"
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
          🖼️ Image Converter
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
            type="image"
            isActive={activeConverter === converter.id}
            onClick={() => setActiveConverter(activeConverter === converter.id ? null : converter.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

export default ImageConverters
