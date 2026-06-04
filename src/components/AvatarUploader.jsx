/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Loader2,
  Image as ImageIcon,
  Trash2
} from 'lucide-react'
import { compressImage, validateImage } from '../utils/imageUtils.js'

const AvatarUploader = ({ 
  currentAvatar, 
  onSave, 
  onCancel,
  maxFileSize = 5 * 1024 * 1024,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadState, setUploadState] = useState('idle') // idle, compressing, uploading, success, error
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [compressionInfo, setCompressionInfo] = useState(null)
  const fileInputRef = useRef(null)

  // 处理文件选择
  const handleFileSelect = useCallback(async (file) => {
    setError(null)
    setCompressionInfo(null)
    
    // 验证文件
    const validation = validateImage(file, { maxSize: maxFileSize, allowedTypes })
    if (!validation.valid) {
      setError(validation.errors[0])
      return
    }

    try {
      // 开始压缩
      setUploadState('compressing')
      setProgress(10)
      
      const originalSize = (file.size / 1024).toFixed(1)
      
      // 压缩图片
      const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
        format: 'image/jpeg'
      })
      
      setProgress(50)
      
      const compressedSize = (compressed.length * 0.75 / 1024).toFixed(1)
      const ratio = ((1 - compressed.length * 0.75 / file.size) * 100).toFixed(0)
      
      setCompressionInfo({
        original: originalSize,
        compressed: compressedSize,
        ratio
      })
      
      setPreview(compressed)
      setUploadState('idle')
      setProgress(0)
    } catch (err) {
      console.error('[AvatarUploader] 压缩失败:', err)
      setError('图片处理失败，请重试')
      setUploadState('error')
    }
  }, [maxFileSize, allowedTypes])

  // 处理文件输入变化
  const handleInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFileSelect(file)
  }

  // 处理拖拽
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  // 保存头像
  const handleSave = async () => {
    if (!preview) return
    
    setUploadState('uploading')
    setProgress(60)
    
    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 100)
      
      // 调用保存回调
      await onSave(preview)
      
      clearInterval(progressInterval)
      setProgress(100)
      setUploadState('success')
      
      // 延迟关闭
      setTimeout(() => {
        onCancel()
      }, 800)
    } catch (err) {
      console.error('[AvatarUploader] 保存失败:', err)
      setError('保存失败，请重试')
      setUploadState('error')
    }
  }

  // 清除预览
  const handleClear = () => {
    setPreview(null)
    setCompressionInfo(null)
    setError(null)
    setUploadState('idle')
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-4)'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
          width: '100%',
          maxWidth: '420px',
          boxShadow: 'var(--shadow-4)',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 500,
            color: 'var(--color-text-primary)'
          }}>
            更换头像
          </h3>
          <button 
            onClick={onCancel}
            disabled={uploadState === 'uploading'}
            style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'none',
              cursor: uploadState === 'uploading' ? 'not-allowed' : 'pointer',
              opacity: uploadState === 'uploading' ? 0.5 : 1
            }}
          >
            <X style={{ width: '20px', height: '20px', color: 'var(--color-text-tertiary)' }} />
          </button>
        </div>

        {/* Preview Area */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          {preview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-4)'
              }}
            >
              {/* Preview Image */}
              <div style={{
                position: 'relative',
                width: '160px',
                height: '160px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '2px solid var(--color-border)'
              }}>
                <img 
                  src={preview} 
                  alt="Preview" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Remove Button */}
                <button
                  onClick={handleClear}
                  disabled={uploadState === 'uploading'}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: uploadState === 'uploading' ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Trash2 style={{ width: '14px', height: '14px', color: 'white' }} />
                </button>
              </div>

              {/* Compression Info */}
              {compressionInfo && (
                <div style={{
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'rgba(39, 174, 96, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-xs)',
                  color: '#27ae60'
                }}>
                  已压缩 {compressionInfo.original}KB → {compressionInfo.compressed}KB (-{compressionInfo.ratio}%)
                </div>
              )}
            </motion.div>
          ) : (
            /* Upload Area */
            <motion.div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-8)',
                border: `2px dashed ${isDragging ? 'var(--color-ink-9)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                backgroundColor: isDragging ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-paper-1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {uploadState === 'compressing' ? (
                  <Loader2 style={{ width: '24px', height: '24px', color: 'var(--color-text-primary)', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ImageIcon style={{ width: '24px', height: '24px', color: 'var(--color-text-secondary)' }} />
                )}
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-1)'
                }}>
                  {uploadState === 'compressing' ? '正在处理...' : '点击或拖拽上传图片'}
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-tertiary)'
                }}>
                  支持 JPG, PNG, GIF, WebP · 最大 5MB
                </p>
              </div>
            </motion.div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept={allowedTypes.join(',')}
            style={{ display: 'none' }}
          />
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--space-4)'
              }}
            >
              <AlertCircle style={{ width: '16px', height: '16px', color: '#e74c3c' }} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--font-size-xs)',
                color: '#e74c3c'
              }}>
                {error}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <AnimatePresence>
          {(uploadState === 'uploading' || uploadState === 'compressing') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <div style={{
                height: '4px',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    backgroundColor: uploadState === 'compressing' ? '#3498db' : '#27ae60',
                    borderRadius: 'var(--radius-full)'
                  }}
                />
              </div>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-tertiary)',
                textAlign: 'center',
                marginTop: 'var(--space-2)'
              }}>
                {uploadState === 'compressing' ? '正在压缩图片...' : '正在保存...'} {progress}%
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {uploadState === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3)',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--space-4)'
              }}
            >
              <Check style={{ width: '18px', height: '18px', color: '#27ae60' }} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                color: '#27ae60'
              }}>
                头像保存成功！
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-3)'
        }}>
          <button
            onClick={onCancel}
            disabled={uploadState === 'uploading' || uploadState === 'compressing'}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!preview || uploadState === 'uploading' || uploadState === 'compressing' || uploadState === 'success'}
            className="btn-primary"
            style={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)'
            }}
          >
            {uploadState === 'uploading' ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                保存中...
              </>
            ) : (
              <>
                <Check style={{ width: '16px', height: '16px' }} />
                确认保存
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default AvatarUploader
