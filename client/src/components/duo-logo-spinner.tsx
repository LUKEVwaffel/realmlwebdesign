import { useTheme } from "@/lib/theme-provider";
import duoLogoLight from "@assets/ChatGPT_Image_Dec_29,_2025,_07_49_10_AM_1767014379495.png";
import duoLogoDark from "@assets/ChatGPT_Image_Dec_29,_2025,_07_56_01_AM_1767014379497.png";

interface DuoLogoSpinnerProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function DuoLogoSpinner({ size = "md", showText = true }: DuoLogoSpinnerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };
  
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} relative`}>
          <img 
            src={isDark ? duoLogoDark : duoLogoLight} 
            alt="DUO"
            className="w-full h-full object-contain animate-pulse"
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${sizeClasses[size]} border-4 border-transparent border-t-primary/30 rounded-full animate-spin`} />
        </div>
      </div>
      {showText && (
        <p className={`${textSizeClasses[size]} text-muted-foreground animate-pulse`}>
          Loading...
        </p>
      )}
    </div>
  );
}
