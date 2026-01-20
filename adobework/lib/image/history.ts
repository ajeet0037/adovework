// History manager for undo/redo functionality

import { HistoryState } from './types';

export class HistoryManager {
  private states: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxStates: number;
  private listeners: Set<() => void> = new Set();

  constructor(maxStates: number = 20) {
    this.maxStates = maxStates;
  }

  /**
   * Push a new state to history
   */
  push(imageData: string, operation: string): void {
    // Remove any states after current index (for redo)
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }

    // Add new state
    const state: HistoryState = {
      imageData,
      timestamp: Date.now(),
      operation,
    };
    this.states.push(state);
    this.currentIndex = this.states.length - 1;

    // Remove oldest states if exceeding max
    while (this.states.length > this.maxStates) {
      // Revoke old blob URLs to free memory
      const removed = this.states.shift();
      if (removed?.imageData.startsWith('blob:')) {
        URL.revokeObjectURL(removed.imageData);
      }
      this.currentIndex--;
    }

    this.notifyListeners();
  }

  /**
   * Undo to previous state
   */
  undo(): HistoryState | null {
    if (!this.canUndo()) return null;
    
    this.currentIndex--;
    this.notifyListeners();
    return this.states[this.currentIndex];
  }

  /**
   * Redo to next state
   */
  redo(): HistoryState | null {
    if (!this.canRedo()) return null;
    
    this.currentIndex++;
    this.notifyListeners();
    return this.states[this.currentIndex];
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.states.length - 1;
  }

  /**
   * Get current state
   */
  getCurrentState(): HistoryState | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.states.length) {
      return null;
    }
    return this.states[this.currentIndex];
  }

  /**
   * Get history length
   */
  getLength(): number {
    return this.states.length;
  }

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get all states (for debugging)
   */
  getStates(): HistoryState[] {
    return [...this.states];
  }

  /**
   * Clear all history
   */
  clear(): void {
    // Revoke all blob URLs
    for (const state of this.states) {
      if (state.imageData.startsWith('blob:')) {
        URL.revokeObjectURL(state.imageData);
      }
    }
    
    this.states = [];
    this.currentIndex = -1;
    this.notifyListeners();
  }

  /**
   * Subscribe to history changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/**
 * Create a blob URL from canvas
 */
export async function canvasToDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  return canvas.toDataURL('image/png');
}

/**
 * Create a blob URL from canvas (more memory efficient for large images)
 */
export async function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        reject(new Error('Failed to create blob'));
      }
    }, 'image/png');
  });
}

/**
 * Load image from data URL or blob URL
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

// Singleton instance for global use
let globalHistoryManager: HistoryManager | null = null;

export function getGlobalHistoryManager(): HistoryManager {
  if (!globalHistoryManager) {
    globalHistoryManager = new HistoryManager(20);
  }
  return globalHistoryManager;
}

export function resetGlobalHistoryManager(): void {
  if (globalHistoryManager) {
    globalHistoryManager.clear();
  }
  globalHistoryManager = new HistoryManager(20);
}
