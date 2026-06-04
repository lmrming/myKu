/**
 * 图片处理工具函数
 * 提供图片压缩、裁剪、格式转换等功能
 */

/**
 * 压缩图片
 * @param {File} file - 原始图片文件
 * @param {Object} options - 压缩选项
 * @returns {Promise<string>} - 压缩后的 base64 图片
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 400,
      maxHeight = 400,
      quality = 0.8,
      format = 'image/jpeg'
    } = options;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // 创建 canvas 进行压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // 使用更好的图像质量
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 base64
        const compressedBase64 = canvas.toDataURL(format, quality);
        
        // 计算压缩效果
        const originalSize = (file.size / 1024).toFixed(2);
        const compressedSize = (compressedBase64.length * 0.75 / 1024).toFixed(2);
        const compressionRatio = ((1 - compressedBase64.length * 0.75 / file.size) * 100).toFixed(1);
        
        console.log(`[Image Compress] 原始: ${originalSize}KB → 压缩后: ${compressedSize}KB (${compressionRatio}% 减少)`);
        
        resolve(compressedBase64);
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

/**
 * 创建圆形裁剪图片
 * @param {string} imageSrc - 图片 base64 或 URL
 * @param {number} size - 输出尺寸
 * @returns {Promise<string>} - 裁剪后的 base64
 */
export const createCircularImage = (imageSrc, size = 200) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      
      // 创建圆形裁剪区域
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // 绘制图片
      ctx.drawImage(img, 0, 0, size, size);
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageSrc;
  });
};

/**
 * 验证图片文件
 * @param {File} file - 图片文件
 * @param {Object} options - 验证选项
 * @returns {Object} - 验证结果
 */
export const validateImage = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options;
  
  const errors = [];
  
  // 检查文件类型
  if (!allowedTypes.includes(file.type)) {
    errors.push(`不支持的文件格式: ${file.type}，请上传 ${allowedTypes.join(', ')}`);
  }
  
  // 检查文件大小
  if (file.size > maxSize) {
    errors.push(`文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB，最大支持 ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * 获取图片尺寸
 * @param {File} file - 图片文件
 * @returns {Promise<{width: number, height: number}>}
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法获取图片尺寸'));
    };
    
    img.src = url;
  });
};

/**
 * 生成文件缩略图
 * @param {File} file - 图片文件
 * @param {number} maxSize - 最大尺寸
 * @returns {Promise<string>} - 缩略图 base64
 */
export const generateThumbnail = (file, maxSize = 100) => {
  return compressImage(file, {
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality: 0.6
  });
};

export default {
  compressImage,
  createCircularImage,
  validateImage,
  getImageDimensions,
  generateThumbnail
};
