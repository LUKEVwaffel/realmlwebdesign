interface DuoLogoSpinnerProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function DuoLogoSpinner({ size = "md", showText = true }: DuoLogoSpinnerProps) {
  const sizeClasses = {
    sm: { container: "w-24 h-24", text: "text-3xl", subtext: "text-xs" },
    md: { container: "w-40 h-40", text: "text-5xl", subtext: "text-sm" },
    lg: { container: "w-56 h-56", text: "text-6xl", subtext: "text-base" },
  };

  const config = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        {/* Outer glow */}
        <div 
          className={`absolute inset-0 ${config.container} rounded-full opacity-30 blur-2xl`}
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(236,72,153,0.3) 50%, transparent 70%)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
        
        {/* Spinning outer ring */}
        <div 
          className={`absolute inset-0 ${config.container} rounded-full`}
          style={{
            border: '3px solid transparent',
            borderTopColor: 'rgba(168,85,247,0.8)',
            borderRightColor: 'rgba(59,130,246,0.6)',
            animation: 'spin 1.5s linear infinite',
          }}
        />
        
        {/* Spinning inner ring (opposite direction) */}
        <div 
          className="absolute inset-3 rounded-full"
          style={{
            border: '2px solid transparent',
            borderBottomColor: 'rgba(236,72,153,0.7)',
            borderLeftColor: 'rgba(6,182,212,0.5)',
            animation: 'spin-reverse 2s linear infinite',
          }}
        />
        
        {/* Center content with DUO text */}
        <div 
          className={`${config.container} relative flex items-center justify-center`}
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          <span 
            className={`${config.text} font-bold tracking-tight`}
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.4))',
            }}
          >
            DUO
          </span>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                  animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
                }}
              />
            ))}
          </div>
          <p className={`${config.subtext} text-muted-foreground`}>
            Loading your portal...
          </p>
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
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.5; }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
