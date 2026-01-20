/**
 * Property-based tests for HistoryManager
 * Feature: image-tools, Property 9: Undo/Redo Round Trip
 * Feature: image-tools, Property 10: History Capacity
 * Validates: Requirements 6.8, 6.9, 6.10
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { HistoryManager } from '../../lib/image/history';

describe('Feature: image-tools, Property 9: Undo/Redo Round Trip', () => {
  /**
   * Property 9: Undo/Redo Round Trip
   * For any sequence of N edit operations followed by N undo operations,
   * the image SHALL return to its original state.
   */
  it('N operations followed by N undos returns to original state', () => {
    fc.assert(
      fc.property(
        // Generate 1-15 operations (keeping under max history)
        fc.array(
          fc.record({
            imageData: fc.string({ minLength: 1, maxLength: 50 }),
            operation: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 1, maxLength: 15 }
        ),
        (operations) => {
          const history = new HistoryManager(20);
          
          // Push initial state
          const initialState = 'initial-image-data';
          history.push(initialState, 'initial');
          
          // Push all operations
          for (const op of operations) {
            history.push(op.imageData, op.operation);
          }
          
          // Verify we can undo
          expect(history.canUndo()).toBe(true);
          
          // Undo all operations (N times)
          for (let i = 0; i < operations.length; i++) {
            const state = history.undo();
            expect(state).not.toBeNull();
          }
          
          // Should be back at initial state
          const currentState = history.getCurrentState();
          expect(currentState).not.toBeNull();
          expect(currentState!.imageData).toBe(initialState);
          expect(currentState!.operation).toBe('initial');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('undo followed by redo returns to same state', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            imageData: fc.string({ minLength: 1, maxLength: 50 }),
            operation: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (operations) => {
          const history = new HistoryManager(20);
          
          // Push all operations
          for (const op of operations) {
            history.push(op.imageData, op.operation);
          }
          
          // Get state before undo
          const stateBeforeUndo = history.getCurrentState();
          
          // Undo
          history.undo();
          
          // Redo
          const stateAfterRedo = history.redo();
          
          // Should be same as before undo
          expect(stateAfterRedo).not.toBeNull();
          expect(stateAfterRedo!.imageData).toBe(stateBeforeUndo!.imageData);
          expect(stateAfterRedo!.operation).toBe(stateBeforeUndo!.operation);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('multiple undo/redo cycles preserve state integrity', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }),
          { minLength: 3, maxLength: 10 }
        ),
        fc.integer({ min: 1, max: 5 }),
        (imageStates, cycles) => {
          const history = new HistoryManager(20);
          
          // Push all states
          for (let i = 0; i < imageStates.length; i++) {
            history.push(imageStates[i], `op-${i}`);
          }
          
          // Perform multiple undo/redo cycles
          for (let cycle = 0; cycle < cycles; cycle++) {
            // Undo to beginning
            while (history.canUndo()) {
              history.undo();
            }
            
            // Should be at first state
            expect(history.getCurrentState()!.imageData).toBe(imageStates[0]);
            
            // Redo to end
            while (history.canRedo()) {
              history.redo();
            }
            
            // Should be at last state
            expect(history.getCurrentState()!.imageData).toBe(imageStates[imageStates.length - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: image-tools, Property 10: History Capacity', () => {
  /**
   * Property 10: History Capacity
   * For any sequence of operations, the history manager SHALL maintain
   * at least the last 20 states.
   */
  it('maintains at least maxStates entries', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 30 }),
        fc.integer({ min: 1, max: 50 }),
        (maxStates, operationCount) => {
          const history = new HistoryManager(maxStates);
          
          // Push many operations
          for (let i = 0; i < operationCount; i++) {
            history.push(`image-${i}`, `operation-${i}`);
          }
          
          // History length should be min(operationCount, maxStates)
          const expectedLength = Math.min(operationCount, maxStates);
          expect(history.getLength()).toBe(expectedLength);
          
          // Should be able to undo (expectedLength - 1) times
          let undoCount = 0;
          while (history.canUndo()) {
            history.undo();
            undoCount++;
          }
          expect(undoCount).toBe(expectedLength - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('default capacity is 20 states', () => {
    const history = new HistoryManager();
    
    // Push 30 operations
    for (let i = 0; i < 30; i++) {
      history.push(`image-${i}`, `op-${i}`);
    }
    
    // Should only have 20 states
    expect(history.getLength()).toBe(20);
    
    // Current state should be the last pushed
    expect(history.getCurrentState()!.imageData).toBe('image-29');
    
    // First state should be image-10 (30 - 20 = 10)
    while (history.canUndo()) {
      history.undo();
    }
    expect(history.getCurrentState()!.imageData).toBe('image-10');
  });

  it('oldest states are removed when capacity exceeded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 15 }),
        fc.integer({ min: 1, max: 20 }),
        (maxStates, extraOperations) => {
          const history = new HistoryManager(maxStates);
          const totalOperations = maxStates + extraOperations;
          
          // Push more than maxStates operations
          for (let i = 0; i < totalOperations; i++) {
            history.push(`image-${i}`, `op-${i}`);
          }
          
          // Go to oldest state
          while (history.canUndo()) {
            history.undo();
          }
          
          // Oldest state should be (totalOperations - maxStates)
          const oldestIndex = totalOperations - maxStates;
          expect(history.getCurrentState()!.imageData).toBe(`image-${oldestIndex}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('HistoryManager additional properties', () => {
  it('clear removes all states', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
        (states) => {
          const history = new HistoryManager(20);
          
          for (const state of states) {
            history.push(state, 'op');
          }
          
          expect(history.getLength()).toBeGreaterThan(0);
          
          history.clear();
          
          expect(history.getLength()).toBe(0);
          expect(history.getCurrentState()).toBeNull();
          expect(history.canUndo()).toBe(false);
          expect(history.canRedo()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('new operation after undo clears redo stack', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 3, maxLength: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (states, undoCount) => {
          const history = new HistoryManager(20);
          
          for (const state of states) {
            history.push(state, 'op');
          }
          
          // Undo some operations
          const actualUndos = Math.min(undoCount, states.length - 1);
          for (let i = 0; i < actualUndos; i++) {
            history.undo();
          }
          
          // Should be able to redo
          if (actualUndos > 0) {
            expect(history.canRedo()).toBe(true);
          }
          
          // Push new operation
          history.push('new-state', 'new-op');
          
          // Redo should no longer be available
          expect(history.canRedo()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getCurrentIndex tracks position correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 15 }),
        (states) => {
          const history = new HistoryManager(20);
          
          for (let i = 0; i < states.length; i++) {
            history.push(states[i], `op-${i}`);
            expect(history.getCurrentIndex()).toBe(i);
          }
          
          // Undo and check index decrements
          for (let i = states.length - 2; i >= 0; i--) {
            history.undo();
            expect(history.getCurrentIndex()).toBe(i);
          }
          
          // Redo and check index increments
          for (let i = 1; i < states.length; i++) {
            history.redo();
            expect(history.getCurrentIndex()).toBe(i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
