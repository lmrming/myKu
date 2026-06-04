import React from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'

// 离线提示组件
const OfflineIndicator = ({ isOnline, wasOffline }) => {
  if (isOnline && !wasOffline) return null

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-amber-500 text-white'
      }`}
    >
      {isOnline ? (
        <span className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          网络已恢复
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          离线模式
        </span>
      )}
    </div>
  )
}

export default OfflineIndicator
