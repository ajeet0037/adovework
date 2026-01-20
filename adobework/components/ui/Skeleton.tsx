'use client';

import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const variantStyles: Record<string, string> = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationStyles: Record<string, string> = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'circular' ? width : undefined),
  };

  return (
    <div
      className={`
        bg-gray-200
        ${variantStyles[variant]}
        ${animationStyles[animation]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  );
};

// Skeleton for tool cards
export const ToolCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-start gap-4">
      <Skeleton variant="rounded" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="80%" height={16} />
      </div>
    </div>
  </div>
);

// Skeleton for tool grid
export const ToolGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ToolCardSkeleton key={i} />
    ))}
  </div>
);

// Skeleton for file upload area
export const FileUploadSkeleton: React.FC = () => (
  <div className="border-2 border-dashed border-gray-200 rounded-xl p-12">
    <div className="flex flex-col items-center gap-4">
      <Skeleton variant="circular" width={64} height={64} />
      <Skeleton variant="text" width={200} height={24} />
      <Skeleton variant="text" width={300} height={16} />
    </div>
  </div>
);

// Skeleton for tool page content
export const ToolPageSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
    {/* Title */}
    <div className="text-center space-y-4">
      <Skeleton variant="text" width="50%" height={40} className="mx-auto" />
      <Skeleton variant="text" width="70%" height={20} className="mx-auto" />
    </div>
    
    {/* Upload area */}
    <FileUploadSkeleton />
    
    {/* Content sections */}
    <div className="space-y-4">
      <Skeleton variant="text" width="30%" height={28} />
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="80%" height={16} />
    </div>
  </div>
);

// Skeleton for FAQ section
export const FAQSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border border-gray-200 rounded-lg p-4">
        <Skeleton variant="text" width="70%" height={20} />
      </div>
    ))}
  </div>
);

export default Skeleton;
