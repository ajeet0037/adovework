'use client';

import React, { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title?: string;
  description?: string;
  children?: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  icon,
  title,
  description,
  children,
  hoverable = true,
  clickable = false,
  className = '',
  ...props
}) => {
  const baseStyles = `
    bg-white rounded-xl border border-gray-200
    p-6 transition-all duration-200
  `;

  const hoverStyles = hoverable
    ? 'hover:shadow-lg hover:border-primary-200 hover:-translate-y-1'
    : '';

  const clickableStyles = clickable
    ? 'cursor-pointer active:scale-[0.98]'
    : '';

  return (
    <div
      className={`
        ${baseStyles}
        ${hoverStyles}
        ${clickableStyles}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {icon && (
        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-gray-600 text-sm">{description}</p>
      )}
      {children}
    </div>
  );
};

export default Card;
