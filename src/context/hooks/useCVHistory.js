/**
 * @file useCVHistory.js
 * @description Hook managing undo/redo stacks, history snapshot application,
 * and global keyboard shortcut isolation for the Ressume CV editor.
 */
import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} CVHistoryReturn
 * @property {Array<Object>} past - Stack of previous states (max 30).
 * @property {Array<Object>} future - Stack of reverted states.
 * @property {boolean} canUndo - Whether undo action is available.
 * @property {boolean} canRedo - Whether redo action is available.
 * @property {function(): void} undo - Reverts to previous state.
 * @property {function(): void} redo - Re-applies future state.
 * @property {function(Function|Object): void} applyStateWithHistory - State updater that pushes current state to history.
 * @property {function(): void} clearHistory - Resets past and future history stacks.
 * @property {function(Array|Function): void} setPast - Direct setter for past stack.
 * @property {function(Array|Function): void} setFuture - Direct setter for future stack.
 */

/**
 * Hook providing undo/redo state stacks and keyboard listeners for CV editing.
 * @param {function(Function|Object): void} [setCvData] - State setter for cvData.
 * @returns {CVHistoryReturn} History management utilities and state.
 */
export const useCVHistory = (setCvData) => {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const applyStateWithHistory = useCallback((updater) => {
    if (typeof setCvData !== 'function') return;
    setCvData(current => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (next === current || JSON.stringify(next) === JSON.stringify(current)) {
        return current;
      }
      setPast(prevPast => [...prevPast.slice(-29), current]);
      setFuture([]);
      return next;
    });
  }, [setCvData]);

  const undo = useCallback(() => {
    if (typeof setCvData !== 'function') return;
    setPast(prevPast => {
      if (prevPast.length === 0) return prevPast;
      const previousState = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);
      setCvData(current => {
        setFuture(prevFuture => [current, ...prevFuture]);
        return previousState;
      });
      return newPast;
    });
  }, [setCvData]);

  const redo = useCallback(() => {
    if (typeof setCvData !== 'function') return;
    setFuture(prevFuture => {
      if (prevFuture.length === 0) return prevFuture;
      const nextState = prevFuture[0];
      const newFuture = prevFuture.slice(1);
      setCvData(current => {
        setPast(prevPast => [...prevPast, current]);
        return nextState;
      });
      return newFuture;
    });
  }, [setCvData]);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  // Global window shortcut listener (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (!cmdOrCtrl) return;

      const isUndo = e.key.toLowerCase() === 'z' && !e.shiftKey;
      const isRedo = e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z');
      if (!isUndo && !isRedo) return;

      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const targetEl = e.target;
      const isEditable = (el) => el && (
        el.isContentEditable ||
        el.getAttribute?.('contenteditable') === 'true' ||
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.classList?.contains('inline-edit-active')
      );
      if (isEditable(activeEl) || isEditable(targetEl)) return;

      if (isUndo && past.length > 0) {
        e.preventDefault();
        undo();
      } else if (isRedo && future.length > 0) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, undo, redo]);

  return {
    past,
    future,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    applyStateWithHistory,
    clearHistory,
    setPast,
    setFuture,
  };
};

export default useCVHistory;
