'use client';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  solid?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  solid = false,
  hover = false,
  onClick,
}: GlassCardProps) {
  const base = solid ? 'glass-card-solid' : 'glass-card';
  const hoverClass = hover ? 'hover-glow cursor-pointer' : '';
  const clickable = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${base} ${hoverClass} ${clickable} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
