import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FileUploader from './FileUploader'

const ConverterCard = ({ converter, type, isActive, onClick }) => {
  const handleCardClick = (e) => {
    // Only toggle if clicking the card itself, not child elements
    if (e.target === e.currentTarget || e.target.closest('.card-header')) {
      onClick()
    }
  }

  return (
    <motion.div
      className={`glass-effect rounded-3xl p-8 cursor-pointer hover-lift border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 ${
        isActive ? 'border-yellow-500/50' : ''
      }`}
      onClick={handleCardClick}
      whileHover={{ scale: 1.02, borderColor: 'rgba(255, 193, 7, 0.5)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-4 card-header">
        <div className="flex-1 pr-2">
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{converter.title}</h3>
          <p className="text-gray-400 text-base leading-relaxed">{converter.description}</p>
        </div>
        <motion.div
          className="text-yellow-500 text-2xl ml-4 flex-shrink-0"
        >
          {isActive ? '▲' : '▼'}
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <FileUploader converterId={converter.id} type={type} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ConverterCard
