'use client';

import React from 'react';
import { TOOLS, getCoreTools, getAdvancedTools, getImageTools } from '@/lib/constants/tools';
import { ToolCard } from './ToolCard';

export interface ToolGridProps {
  showCategories?: boolean;
  category?: 'all' | 'core' | 'advanced' | 'image';
}

const categoryInfo = {
  core: {
    title: 'Core PDF Tools',
    description: 'Essential tools for everyday PDF tasks',
    icon: '📄',
    gradient: 'from-red-500 to-orange-500',
  },
  advanced: {
    title: 'Advanced Tools',
    description: 'Professional features for complex workflows',
    icon: '⚡',
    gradient: 'from-blue-500 to-cyan-500',
  },
  image: {
    title: 'Image Tools',
    description: 'Edit, convert, and enhance your images',
    icon: '🖼️',
    gradient: 'from-purple-500 to-pink-500',
  },
};

export const ToolGrid: React.FC<ToolGridProps> = ({
  showCategories = true,
  category = 'all',
}) => {
  const coreTools = getCoreTools();
  const advancedTools = getAdvancedTools();
  const imageTools = getImageTools();

  const renderCategoryHeader = (cat: 'core' | 'advanced' | 'image') => {
    const info = categoryInfo[cat];
    return (
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${info.gradient} flex items-center justify-center text-lg`}>
          {info.icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{info.title}</h2>
          <p className="text-gray-500 text-sm">{info.description}</p>
        </div>
      </div>
    );
  };

  const renderToolGrid = (tools: typeof TOOLS, cat?: 'core' | 'advanced' | 'image') => (
    <div className="mb-10 last:mb-0">
      {cat && showCategories && renderCategoryHeader(cat)}
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
        data-testid="tool-grid"
      >
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );

  if (category === 'core') {
    return renderToolGrid(coreTools, 'core');
  }

  if (category === 'advanced') {
    return renderToolGrid(advancedTools, 'advanced');
  }

  if (category === 'image') {
    return renderToolGrid(imageTools, 'image');
  }

  // Show all tools organized by category
  return (
    <section id="tools" className="py-12 sm:py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header - simplified */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            All PDF & Image Tools
          </h2>
          <p className="mt-2 text-base text-gray-600">
            Everything you need to work with PDF and image files
          </p>
        </div>

        {/* Tools by Category */}
        {showCategories ? (
          <div className="space-y-12">
            {renderToolGrid(coreTools, 'core')}
            {renderToolGrid(advancedTools, 'advanced')}
            {renderToolGrid(imageTools, 'image')}
          </div>
        ) : (
          renderToolGrid(TOOLS)
        )}
      </div>
    </section>
  );
};

export default ToolGrid;
