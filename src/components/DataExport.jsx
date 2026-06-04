import React from 'react';

const DataExport = ({ data, filename = 'data', fields = [] }) => {
  // 导出为CSV
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('没有数据可导出');
      return;
    }

    // 如果没有指定字段，使用数据的所有键
    const exportFields = fields.length > 0 ? fields : Object.keys(data[0]);

    // 创建CSV内容
    const csvContent = [
      // 表头
      exportFields.join(','),
      // 数据行
      ...data.map(row => 
        exportFields.map(field => {
          const value = row[field];
          // 处理包含逗号或引号的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value !== null && value !== undefined ? value : '';
        }).join(',')
      )
    ].join('\n');

    // 创建Blob并下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 导出为JSON
  const exportToJSON = () => {
    if (!data || data.length === 0) {
      alert('没有数据可导出');
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 导出为Excel (使用CSV格式，但扩展名为xlsx)
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('没有数据可导出');
      return;
    }

    const exportFields = fields.length > 0 ? fields : Object.keys(data[0]);

    // 创建CSV内容
    const csvContent = [
      // 表头
      exportFields.join('\t'), // 使用制表符分隔
      // 数据行
      ...data.map(row => 
        exportFields.map(field => {
          const value = row[field];
          if (value !== null && value !== undefined) {
            return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
          }
          return '';
        }).join('\t')
      )
    ].join('\n');

    // 创建Blob并下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 打印数据
  const printData = () => {
    if (!data || data.length === 0) {
      alert('没有数据可打印');
      return;
    }

    const exportFields = fields.length > 0 ? fields : Object.keys(data[0]);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>打印 - ${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            h1 { text-align: center; margin-bottom: 20px; }
            .timestamp { text-align: right; color: #666; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${filename}</h1>
          <div class="timestamp">导出时间: ${new Date().toLocaleString('zh-CN')}</div>
          <table>
            <thead>
              <tr>
                ${exportFields.map(field => `<th>${field}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${exportFields.map(field => `<td>${row[field] !== null && row[field] !== undefined ? row[field] : ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={exportToCSV}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-300"
        title="导出为CSV"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        CSV
      </button>

      <button
        onClick={exportToExcel}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-300"
        title="导出为Excel"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </button>

      <button
        onClick={exportToJSON}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-all duration-300"
        title="导出为JSON"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        JSON
      </button>

      <button
        onClick={printData}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-all duration-300"
        title="打印"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        打印
      </button>
    </div>
  );
};

export default DataExport;