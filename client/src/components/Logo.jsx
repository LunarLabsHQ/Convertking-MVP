import { motion } from 'framer-motion'

const Logo = ({ className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "h-5 sm:h-6 md:h-7",
    md: "h-6 sm:h-7 md:h-8",
    lg: "h-10 sm:h-12 md:h-14",
    xl: "h-14 sm:h-16 md:h-20"
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <motion.img
        src="/convertkinglogo.png"
        alt="ConvertKing Logo"
        className={`${sizeClasses[size]} flex-shrink-0 object-contain`}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3 }}
      />
      
      <span
        className="font-black tracking-tight whitespace-nowrap"
        style={{ color: '#FFD700' }}
      >
        {size === "sm" && <span className="text-base sm:text-lg md:text-xl">ConvertKing</span>}
        {size === "md" && <span className="text-xl sm:text-2xl md:text-3xl">ConvertKing</span>}
        {size === "lg" && <span className="text-2xl sm:text-3xl md:text-4xl">ConvertKing</span>}
        {size === "xl" && <span className="text-3xl sm:text-4xl md:text-5xl">ConvertKing</span>}
      </span>
    </div>
  )
}

export default Logo
