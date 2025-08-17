import React, { useState, useEffect } from 'react';
import { ArrowLeft, Paperclip, X, Upload, File } from 'lucide-react';

const PostForm = ({ onSubmit, onCancel, initialData, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPinned: false
  });
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  // 초기 데이터 설정 (수정 모드)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        isPinned: initialData.isPinned || false
      });
      setAttachments(initialData.attachments || []);
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    const submitData = {
      ...formData,
      attachments: attachments
    };

    onSubmit(submitData);
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  // 드래그 앤 드롭 핸들러
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      isNew: true
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📺';
    return '📁';
  };

  return (
    <div className="bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? '게시글 수정' : '새 게시글 작성'}
          </h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '저장 중...' : (initialData ? '수정하기' : '게시하기')}
          </button>
        </div>
      </div>

      {/* 폼 내용 */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 제목 입력 */}
        <div>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="제목을 입력하세요"
            className="w-full text-2xl font-semibold border-none outline-none placeholder-gray-400 bg-transparent"
            disabled={isLoading}
          />
        </div>

        {/* 내용 입력 */}
        <div>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="내용을 입력하세요..."
            rows="15"
            className="w-full border-none outline-none resize-none placeholder-gray-400 text-gray-900 bg-transparent"
            disabled={isLoading}
          />
        </div>

        {/* 파일 첨부 영역 */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">파일 첨부</h3>
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Paperclip size={16} />
                <span>파일 선택</span>
              </div>
            </label>
          </div>

          {/* 드래그 앤 드롭 영역 */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">
              파일을 여기로 드래그하거나 <span className="text-blue-600">파일 선택</span>을 클릭하세요
            </p>
            <p className="text-sm text-gray-500 mt-1">
              최대 10MB, 이미지/문서 파일 지원
            </p>
          </div>

          {/* 첨부된 파일 목록 */}
          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">첨부된 파일</h4>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {getFileIcon(attachment.type)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      disabled={isLoading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 게시글 옵션 */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">게시글 옵션</h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPinned"
              name="isPinned"
              checked={formData.isPinned}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isLoading}
            />
            <label htmlFor="isPinned" className="text-sm text-gray-700">
              상단 고정 (중요한 공지사항일 때 선택)
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PostForm;