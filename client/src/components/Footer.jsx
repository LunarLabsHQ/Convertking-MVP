import { motion } from 'framer-motion'
import Logo from './Logo'

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="glass-effect mt-12 sm:mt-16 md:mt-20"
    >
      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12 text-center">
        <div className="flex justify-center mb-4 sm:mb-6">
          <Logo size="sm" />
        </div>
        <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-2">
          © 2024 ConvertKing. All rights reserved.
        </p>
        <p className="text-gray-500 text-xs sm:text-sm md:text-base">
          Fast, free, and secure file conversion for videos, audio, images, and documents
        </p>
      </div>
    </motion.footer>
  )
}

export default Footer
