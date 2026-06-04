import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command, Search, Database, BarChart3, Brain } from 'lucide-react';

const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  // 监听 Ctrl+/ 打开快捷键帮助
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const shortcutGroups = [
    {
      title: '导航',
      icon: Command,
      shortcuts: [
        { key: 'Ctrl + H', description: '返回首页' },
        { key: 'Ctrl + T', description: '待办事项' },
        { key: 'Ctrl + C', description: '日历' },
        { key: 'Ctrl + F', description: '专注模式' },
        { key: 'Ctrl + N', description: '笔记' },
        { key: 'Ctrl + Shift + H', description: '习惯追踪' },
        { key: 'Ctrl + W', description: '天气' },
        { key: 'Ctrl + S', description: '白噪音' },
        { key: 'Ctrl + D', description: '仪表盘' },
        { key: 'Ctrl + P', description: '个人资料' },
      ]
    },
    {
      title: '功能',
      icon: Search,
      shortcuts: [
        { key: 'Ctrl + K', description: '全局搜索' },
        { key: 'Ctrl + E', description: '数据管理' },
        { key: 'Ctrl + I', description: 'AI 助手' },
      ]
    },
    {
      title: '通用',
      icon: Keyboard,
      shortcuts: [
        { key: 'Ctrl + /', description: '显示/隐藏快捷键帮助' },
        { key: 'Esc', description: '关闭弹窗/返回' },
      ]
    }
  ];

  return (
    <>
      {/* 帮助按钮 */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center justify-center"
        title="键盘快捷键 (Ctrl+/)"
      >
        <Keyboard className="w-5 h-5" />
      </motion.button>

      {/* 快捷键帮助弹窗 */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* 弹窗内容 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">键盘快捷键</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">提高您的操作效率</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 快捷键列表 */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shortcutGroups.map((group) => {
                    const Icon = group.icon;
                    return (
                      <div key={group.title} className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                          <Icon className="w-4 h-4 text-gray-400" />
                          {group.title}
                        </div>
                        <div className="space-y-2">
                          {group.shortcuts.map((shortcut, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50"
                            >
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {shortcut.description}
                              </span>
                              <kbd className="px-2.5 py-1 bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono border border-gray-200 dark:border-zinc-600 shadow-sm">
                                {shortcut.key}
                              </kbd>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 底部提示 */}
              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  提示：在 Mac 上可以使用 Cmd 键代替 Ctrl 键
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KeyboardShortcutsHelp;
