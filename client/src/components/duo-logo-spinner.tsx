import duoLogo from "@assets/ChatGPT_Image_Dec_29,_2025,_11_57_01_AM_1767027492270.png";

interface DuoLogoSpinnerProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function DuoLogoSpinner({ size = "md", showText = true }: DuoLogoSpinnerProps) {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-56 h-56",
  };
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        {/* Outer glow rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={`${sizeClasses[size]} rounded-full opacity-20`}
            style={{
              background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(59,130,246,0.2) 50%, transparent 70%)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
        </div>
        
        {/* Spinning outer ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={`${sizeClasses[size]} rounded-full`}
            style={{
              border: '3px solid transparent',
              borderTopColor: 'rgba(168,85,247,0.8)',
              borderRightColor: 'rgba(59,130,246,0.6)',
              animation: 'spin 1.5s linear infinite',
            }}
          />
        </div>
        
        {/* Spinning inner ring (opposite direction) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="rounded-full"
            style={{
              width: '85%',
              height: '85%',
              border: '2px solid transparent',
              borderBottomColor: 'rgba(236,72,153,0.7)',
              borderLeftColor: 'rgba(6,182,212,0.5)',
              animation: 'spin-reverse 2s linear infinite',
            }}
          />
        </div>
        
        {/* Pulsing dots */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 90}deg) translateY(-${size === 'sm' ? '48' : size === 'md' ? '80' : '112'}px)`,
                animation: `pulse-dot 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        
        {/* Logo container with float animation */}
        <div 
          className={`${sizeClasses[size]} relative flex items-center justify-center`}
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          <img 
            src={duoLogo} 
            alt="DUO"
            className="w-3/4 h-3/4 object-contain drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.4)) drop-shadow(0 0 40px rgba(59,130,246,0.2))',
            }}
          />
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col items-center gap-2">
          <p 
            className={`${textSizeClasses[size]} font-medium bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent`}
            style={{ animation: 'shimmer 2s ease-in-out infinite' }}
          >
            Loading...
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                style={{
                  animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.4; }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: rotate(var(--rotation)) translateY(var(--distance)) scale(1); opacity: 0.6; }
          50% { transform: rotate(var(--rotation)) translateY(var(--distance)) scale(1.5); opacity: 1; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
