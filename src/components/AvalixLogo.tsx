import { Check } from "lucide-react";

interface Props {
  className?: string;
  size?: number;
}

/**
 * AVALIX corporate mark — stylized "A" with a check inside a circle,
 * rendered as inline SVG. Uses design-system tokens.
 */
export const AvalixLogo = ({ className, size = 40 }: Props) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    aria-label="AVALIX"
    role="img"
  >
    <defs>
      <linearGradient id="avx-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(var(--primary-glow))" />
        <stop offset="100%" stopColor="hsl(var(--primary))" />
      </linearGradient>
      <linearGradient id="avx-a" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#D8E4F5" />
      </linearGradient>
    </defs>
    {/* outer ring */}
    <circle cx="32" cy="32" r="27" fill="none" stroke="url(#avx-ring)" strokeWidth="3.5" />
    {/* stylized A */}
    <path
      d="M32 14 L48 50 L40 50 L36.5 42 L27.5 42 L24 50 L16 50 Z M30 35 L34 35 L32 30 Z"
      fill="url(#avx-a)"
    />
    {/* check */}
    <path
      d="M28 32 L33 37 L44 24"
      stroke="hsl(var(--primary-glow))"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const AvalixWordmark = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-col leading-none ${className}`}>
    <span className="text-[1.35rem] font-extrabold tracking-[0.14em] text-foreground">
      AVAL<span className="text-primary-glow">I</span>X
    </span>
    <span className="text-[9px] font-semibold tracking-[0.32em] text-muted-foreground mt-1">
      AVALIAÇÃO DE VEÍCULOS
    </span>
  </div>
);
