import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';

const SearchBar = ({ onSearch, searchTerm, setSearchTerm }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all', // all, title, content, author
    sortBy: 'latest' // latest, oldest, popular
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm, filters);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('', filters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(searchTerm, newFilters);
  };

  return (
    <div className="space-y-4">
      {/* 검색 입력 폼 */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <div className="pl-4 pr-2">
            <Search size={20} className="text-gray-400" />
          </div>
          
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="게시글을 검색해보세요..."
            className="flex-1 py-3 pr-4 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
          />
          
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 border-l border-gray-300 transition-colors ${
              showFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>
      </form>

      {/* 필터 옵션 */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">검색 필터</h4>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 검색 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색 범위
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체</option>
                <option value="title">제목만</option>
                <option value="content">내용만</option>
                <option value="author">작성자</option>
              </select>
            </div>

            {/* 정렬 방식 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정렬 방식
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="popular">인기순</option>
              </select>
            </div>
          </div>

          {/* 필터 초기화 버튼 */}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                const defaultFilters = { type: 'all', sortBy: 'latest' };
                setFilters(defaultFilters);
                onSearch(searchTerm, defaultFilters);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        </div>
      )}

      {/* 검색 결과 정보 */}
      {searchTerm && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
          <span>
            '<span className="font-medium text-gray-900">{searchTerm}</span>' 검색 결과
          </span>
          <button
            onClick={handleClear}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            검색 지우기
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;