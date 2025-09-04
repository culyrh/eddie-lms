const API_BASE_URL = 'http://localhost:8080/api';

export const multipartUploadService = {
  
  // 간단한 파일 업로드 (10MB 이하)
  uploadFile: async (file, onProgress = null, token) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    
    try {
      console.log('📤 파일 업로드 시작:', file.name, `(${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      
      // 작은 파일은 단일 파트로 처리
      if (file.size <= CHUNK_SIZE) {
        return await uploadSinglePart(file, onProgress, token);
      }
      
      // 큰 파일은 멀티파트로 처리
      return await uploadMultipart(file, onProgress, token);
      
    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error);
      throw error;
    }
  }
};

// 단일 파트 업로드
async function uploadSinglePart(file, onProgress, token) {
  // 1. Multipart Upload 시작
  const initResponse = await fetch(`${API_BASE_URL}/upload/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type
    })
  });
  
  if (!initResponse.ok) {
    throw new Error('업로드 초기화 실패');
  }
  
  const { uploadId, key } = await initResponse.json();
  
  // 2. Presigned URL 요청
  const urlResponse = await fetch(`${API_BASE_URL}/upload/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      uploadId,
      key,
      partNumber: 1
    })
  });
  
  if (!urlResponse.ok) {
    throw new Error('Presigned URL 생성 실패');
  }
  
  const { presignedUrl } = await urlResponse.json();
  
  // 3. S3에 직접 업로드
  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });
  
  if (!uploadResponse.ok) {
    throw new Error('S3 업로드 실패');
  }
  
  const etag = uploadResponse.headers.get('ETag');
  
  if (onProgress) onProgress(100);
  
  // 4. 업로드 완료
  const completeResponse = await fetch(`${API_BASE_URL}/upload/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      uploadId,
      key,
      parts: [{
        partNumber: 1,
        etag: etag?.replace(/"/g, '') || ''
      }]
    })
  });
  
  if (!completeResponse.ok) {
    throw new Error('업로드 완료 실패');
  }
  
  const result = await completeResponse.json();
  console.log('✅ 단일 파트 업로드 완료:', result.fileUrl);
  
  return {
    fileUrl: result.fileUrl,
    key: result.key
  };
}

// 멀티파트 업로드 (나중에 필요시 구현)
async function uploadMultipart(file, onProgress, token) {
  // 현재는 단순화를 위해 단일 파트로 처리
  console.log('⚠️ 큰 파일이지만 단일 파트로 처리합니다.');
  return await uploadSinglePart(file, onProgress, token);
}

export default multipartUploadService;