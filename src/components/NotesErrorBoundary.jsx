import React from 'react'
import { motion } from 'framer-motion'

class NotesErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, retryCount: 0 }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NotesErrorBoundary] 备忘录组件加载失败:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
    
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render() {
    if (this.state.hasError) {
      const { retryCount } = this.state
      
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-zinc-800"
            >
              <div className="text-6xl mb-4">⚠️</div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                备忘录加载失败
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {retryCount === 0 
                  ? '抱歉，备忘录模块遇到了问题。这可能是由于网络波动或系统更新导致。'
                  : `已尝试重新加载 ${retryCount} 次，如果问题持续存在，请刷新页面或稍后重试。`
                }
              </p>

              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
                    技术详情 (点击展开)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/25 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  重新加载
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  刷新页面
                </button>
              </div>

              {retryCount > 2 && (
                <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                  💡 提示：您也可以尝试清除浏览器缓存后重试
                </p>
              )}
            </motion.div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default NotesErrorBoundary