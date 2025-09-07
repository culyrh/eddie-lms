const API_BASE_URL = 'http://localhost:8080/api';

const progressTrackingService = {
  
  // 진도율 업데이트
  updateProgress: async (lessonId, userId, currentTime, duration, token) => {
    try {
      const completionPercentage = Math.min(100, (currentTime / duration) * 100);
      
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          completionPercentage: Math.round(completionPercentage * 100) / 100,
          lastAccessedTime: currentTime,
          watchedDuration: currentTime
        })
      });

      if (!response.ok) {
        throw new Error('진도율 업데이트 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('진도율 업데이트 오류:', error);
      throw error;
    }
  },

  // 진도율 조회
  getProgress: async (lessonId, userId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/progress/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return { completionPercentage: 0, lastAccessedTime: 0 };
      }

      return await response.json();
    } catch (error) {
      console.error('진도율 조회 오류:', error);
      return { completionPercentage: 0, lastAccessedTime: 0 };
    }
  },

  // 수업 완료 처리
  markAsCompleted: async (lessonId, userId, token) => {
    try {
      const response = await fetch(`http://localhost:8080/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      return await response.json();
    } catch (error) {
      console.error('수업 완료 처리 오류:', error);
      throw error;
    }
  }
};

export default progressTrackingService;