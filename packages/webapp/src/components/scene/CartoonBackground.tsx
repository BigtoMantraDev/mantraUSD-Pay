import { cn } from '@/lib/utils';

export function CartoonBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden bg-[#4FA3DC]',
        className,
      )}
    >
      {/* 1. Sun Rays Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] animate-[spin_60s_linear_infinite]">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
            {/* Generate multiple rays */}
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(0 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(30 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(60 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(90 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(120 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(150 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(180 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(210 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(240 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(270 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(300 50 50)" />
            <path d="M50 50 L50 0 L55 50 Z" transform="rotate(330 50 50)" />
          </svg>
        </div>
      </div>

      {/* 2. Clouds - Simple cartoon shapes */}
      <div className="absolute top-[10%] left-[10%] animate-[pulse_8s_ease-in-out_infinite]">
        <svg width="120" height="60" viewBox="0 0 120 60" fill="white">
          <path
            d="M10 40 Q20 20 40 30 Q50 10 70 25 Q90 15 100 35 Q115 40 105 50 H20 Q5 50 10 40Z"
            stroke="black"
            strokeWidth="3"
          />
        </svg>
      </div>
      <div className="absolute top-[20%] right-[15%] animate-[pulse_10s_ease-in-out_infinite] delay-1000">
        <svg width="160" height="80" viewBox="0 0 160 80" fill="white">
          <path
            d="M20 50 Q30 30 60 40 Q70 20 90 35 Q110 25 120 45 Q135 50 125 60 H30 Q15 60 20 50Z"
            stroke="black"
            strokeWidth="3"
          />
        </svg>
      </div>

      {/* 3. Rolling Green Hills (Foreground) */}
      <div className="absolute bottom-0 left-0 w-full h-[30%]">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Back Hill */}
          <path
            fill="#48BB78"
            stroke="black"
            strokeWidth="4"
            fillOpacity="1"
            d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,224C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          {/* Front Hill */}
          <path
            fill="#68D391"
            stroke="black"
            strokeWidth="4"
            fillOpacity="1"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,229.3C960,213,1056,171,1152,149.3C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            transform="translate(0, 50)"
          />
        </svg>
      </div>
    </div>
  );
}
