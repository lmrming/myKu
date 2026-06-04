import React, { useState, useMemo } from 'react';

const SearchFilter = ({ 
  data, 
  onFilter, 
  searchFields = [], 
  filterOptions = [],
  placeholder = "搜索..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const filteredData = useMemo(() => {
    let result = [...data];

    // 搜索过滤
    if (searchTerm) {
      result = result.filter(item => {
        return searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          if (typeof value === 'number') {
            return value.toString().includes(searchTerm);
          }
          return false;
        });
      });
    }

    // 选项过滤
    Object.keys(activeFilters).forEach(key => {
      const filterValue = activeFilters[key];
      if (filterValue && filterValue !== 'all') {
        result = result.filter(item => {
          const itemValue = item[key];
          if (typeof itemValue === 'boolean') {
            return itemValue === (filterValue === 'true');
          }
          return itemValue === filterValue;
        });
      }
    });

    // 排序
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, activeFilters, sortConfig, searchFields]);

  // 当过滤后的数据变化时，通知父组件
  React.useEffect(() => {
    onFilter(filteredData);
  }, [filteredData, onFilter]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveFilters({});
    setSortConfig({ key: null, direction: 'asc' });
  };

  const hasActiveFilters = searchTerm || Object.keys(activeFilters).some(key => activeFilters[key] && activeFilters[key] !== 'all');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 筛选选项 */}
        <div className="flex flex-wrap gap-3 items-center">
          {filterOptions.map((option) => (
            <div key={option.key} className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {option.label}:
              </label>
              <select
                value={activeFilters[option.key] || 'all'}
                onChange={(e) => handleFilterChange(option.key, e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="all">全部</option>
                {option.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* 排序选项 */}
          {sortConfig.key && (
            <button
              onClick={() => handleSort(sortConfig.key)}
              className="flex items-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-all"
            >
              排序
              {sortConfig.direction === 'asc' ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          )}

          {/* 清除筛选 */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-all"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 结果统计 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          显示 <span className="font-medium text-gray-900 dark:text-gray-100">{filteredData.length}</span> 条结果
          {hasActiveFilters && (
            <span className="text-gray-500 dark:text-gray-500"> (共 {data.length} 条)</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default SearchFilter;