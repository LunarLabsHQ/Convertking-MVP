import { useState } from 'react'
import { motion } from 'framer-motion'
import ConverterCard from './ConverterCard'

const ImageConverters = () => {
  const [activeConverter, setActiveConverter] = useState(null)

  const converters = [
    { id: 'jpg-pdf', title: 'JPG to PDF', description: 'Convert JPG images to PDF format' },
    { id: 'pdf-jpg', title: 'PDF to JPG', description: 'Extract images from PDF to JPG' },
    { id: 'heic-jpg', title: 'HEIC to JPG', description: 'Convert HEIC images to JPG format' },
    { id: 'image-pdf', title: 'Image to PDF', description: 'Convert any image to PDF format' },
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
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <ConverterCard
          converter={{ id: 'image-general', title: 'Image Converter', description: 'General image conversion tool' }}
          type="image"
          isActive={activeConverter === 'image-general'}
          onClick={() => setActiveConverter(activeConverter === 'image-general' ? null : 'image-general')}
        />
      </motion.div>
    </motion.div>
  )
}

export default ImageConverters
