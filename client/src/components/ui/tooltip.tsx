'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delayMs?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  delayMs = 150
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <span
      className="relative inline-flex items-center cursor-pointer"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <span
          role="tooltip"
          className={`absolute z-50 pointer-events-none whitespace-normal w-max max-w-xs px-2.5 py-1.5 rounded-lg text-[11px] font-normal leading-relaxed bg-slate-900 text-slate-100 shadow-xl border border-slate-700/80 transition-all duration-150 animate-in fade-in zoom-in-95 ${getPositionClasses()} ${className}`}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export const InfoTooltip: React.FC<{
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconClassName?: string;
}> = ({ content, position = 'top', className = '', iconClassName = 'w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors' }) => {
  return (
    <Tooltip content={content} position={position} className={className}>
      <span className="p-0.5 inline-flex items-center justify-center cursor-pointer ml-1" tabIndex={0} aria-label="More information">
        <Info className={iconClassName} />
      </span>
    </Tooltip>
  );
};
