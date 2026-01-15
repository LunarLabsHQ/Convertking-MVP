import { motion } from 'framer-motion'
import Logo from './Logo'

const Header = () => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="glass-effect sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-5 md:py-6">
        <div className="flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex items-center"
          >
            <Logo size="md" className="items-center" />
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}

export default Header
