import { motion } from 'framer-motion'

const Logo = ({ className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "w-5 h-5 sm:w-6 sm:h-6",
    md: "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8",
    lg: "w-10 h-10 sm:w-12 sm:h-12",
    xl: "w-14 h-14 sm:w-16 sm:h-16"
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} flex-shrink-0`}
        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        <svg
          viewBox="0 0 80 60"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Crown icon - five vertical bars with rounded tops, varying heights */}
          <g>
            {/* Horizontal base line */}
            <line
              x1="5"
              y1="50"
              x2="75"
              y2="50"
              stroke="#FFD700"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Bar 1 - Left (shortest) */}
            <rect
              x="10"
              y="35"
              width="8"
              height="15"
              rx="4"
              fill="#FFD700"
            />
            
            {/* Bar 2 - Left-center (medium) */}
            <rect
              x="22"
              y="25"
              width="8"
              height="25"
              rx="4"
              fill="#FFD700"
            />
            
            {/* Bar 3 - Center (medium) */}
            <rect
              x="34"
              y="28"
              width="8"
              height="22"
              rx="4"
              fill="#FFD700"
            />
            
            {/* Bar 4 - Right-center (tallest - second from right) */}
            <rect
              x="46"
              y="15"
              width="8"
              height="35"
              rx="4"
              fill="#FFD700"
            />
            
            {/* Bar 5 - Right (medium-tall) */}
            <rect
              x="58"
              y="20"
              width="8"
              height="30"
              rx="4"
              fill="#FFD700"
            />
          </g>
        </svg>
      </motion.div>
      
      <span
        className="font-black tracking-tight whitespace-nowrap"
        style={{ color: '#FFD700' }}
      >
        {size === "sm" && <span className="text-base sm:text-lg md:text-xl">ConvertKing MVP</span>}
        {size === "md" && <span className="text-xl sm:text-2xl md:text-3xl">ConvertKing MVP</span>}
        {size === "lg" && <span className="text-2xl sm:text-3xl md:text-4xl">ConvertKing MVP</span>}
        {size === "xl" && <span className="text-3xl sm:text-4xl md:text-5xl">ConvertKing MVP</span>}
      </span>
    </div>
  )
}

export default Logo
