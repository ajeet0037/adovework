import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Project Configuration', () => {
  describe('TypeScript Configuration', () => {
    it('should have strict mode enabled', () => {
      const tsconfigPath = path.resolve(__dirname, '../../../tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('should have path aliases configured', () => {
      const tsconfigPath = path.resolve(__dirname, '../../../tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      
      expect(tsconfig.compilerOptions.paths).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@/*']).toContain('./*');
    });
  });

  describe('Tailwind CSS Configuration', () => {
    it('should have globals.css with design system colors', () => {
      const globalsPath = path.resolve(__dirname, '../../../app/globals.css');
      const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
      
      // Check for primary color definitions
      expect(globalsContent).toContain('--primary-500');
      expect(globalsContent).toContain('#6366f1');
      
      // Check for gray color definitions
      expect(globalsContent).toContain('--gray-500');
      expect(globalsContent).toContain('#6b7280');
    });

    it('should have typography scale defined', () => {
      const globalsPath = path.resolve(__dirname, '../../../app/globals.css');
      const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
      
      expect(globalsContent).toContain('.text-h1');
      expect(globalsContent).toContain('.text-h2');
      expect(globalsContent).toContain('.text-h3');
      expect(globalsContent).toContain('.text-body');
    });

    it('should have spacing tokens defined', () => {
      const globalsPath = path.resolve(__dirname, '../../../app/globals.css');
      const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
      
      expect(globalsContent).toContain('--spacing-xs');
      expect(globalsContent).toContain('--spacing-md');
      expect(globalsContent).toContain('--spacing-xl');
    });
  });

  describe('Project Structure', () => {
    it('should have required directories', () => {
      const requiredDirs = [
        'app',
        'components/ui',
        'components/layout',
        'components/tools',
        'components/seo',
        'lib/pdf',
        'lib/converters',
        'lib/utils',
        'lib/constants',
        'hooks',
        'types',
        'public/icons',
        'public/images',
      ];

      requiredDirs.forEach((dir) => {
        const dirPath = path.resolve(__dirname, '../../../', dir);
        expect(fs.existsSync(dirPath), `Directory ${dir} should exist`).toBe(true);
      });
    });

    it('should have type definition files', () => {
      const typeFiles = ['types/tool.ts', 'types/file.ts', 'types/seo.ts'];

      typeFiles.forEach((file) => {
        const filePath = path.resolve(__dirname, '../../../', file);
        expect(fs.existsSync(filePath), `Type file ${file} should exist`).toBe(true);
      });
    });
  });
});
