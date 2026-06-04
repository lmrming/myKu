import { useEffect, useCallback } from 'react';

const useKeyboardShortcuts = (shortcuts) => {
  const handleKeyDown = useCallback((event) => {
    const { key, ctrlKey, altKey, shiftKey, metaKey } = event;

    // 遍历所有快捷键配置
    Object.entries(shortcuts).forEach(([shortcut, callback]) => {
      const keys = shortcut.toLowerCase().split('+');
      
      // 检查修饰键
      const needsCtrl = keys.includes('ctrl');
      const needsAlt = keys.includes('alt');
      const needsShift = keys.includes('shift');
      const needsMeta = keys.includes('meta') || keys.includes('cmd') || keys.includes('command');

      // 获取主键（非修饰键）
      const mainKey = keys.find(k => !['ctrl', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(k));

      // 检查是否匹配
      const matches = (
        key.toLowerCase() === mainKey &&
        ctrlKey === needsCtrl &&
        altKey === needsAlt &&
        shiftKey === needsShift &&
        metaKey === needsMeta
      );

      if (matches) {
        event.preventDefault();
        callback();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;