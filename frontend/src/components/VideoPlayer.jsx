import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward, 
  Settings, 
  Maximize, 
  Minimize
} from 'lucide-react';
import progressTrackingService from '../services/progressTrackingService';

const VideoPlayer = ({ 
  videoUrl, 
  lessonId, 
  userId, 
  token,
  onProgressUpdate,
  initialProgress = 0,
  autoPlay = false 
}) => {
  const videoRef = useRef(null);
  const progressUpdateIntervalRef = useRef(null);
  // 서버와 동일한 방식으로 진도율 계산을 위해 totalWatchTimeRef 제거
  // const totalWatchTimeRef = useRef(0); // 삭제됨
  // const lastPlayTimeRef = useRef(0); // 삭제됨
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(initialProgress);

  // 진도율 업데이트 함수 - 서버와 동일한 방식 (currentTime 기반)
  const updateProgress = useCallback(() => {
    if (duration === 0) return; // 비디오 길이가 0이면 계산 불가능하므로 종료
    
    // 서버와 동일한 방식: 현재 재생 위치 기반으로 진도율 계산
    const newProgress = Math.min(100, (currentTime / duration) * 100);
    
    // 화면에 표시될 진도율 업데이트
    setProgress(newProgress);
    
    // 부모 컴포넌트에 진도율 변경 알림
    if (onProgressUpdate) {
      onProgressUpdate(newProgress);
    }
  }, [currentTime, duration, onProgressUpdate]);

  // 비디오 이벤트 핸들러
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 비디오 메타데이터 로드 시 처리
    const handleLoadedMetadata = () => {
      setDuration(video.duration); // 비디오 전체 길이 설정
      setLoading(false); // 로딩 상태 해제
      
      // 초기 진도율이 있으면 해당 위치로 이동
      if (initialProgress > 0) {
        const startTime = (initialProgress / 100) * video.duration;
        video.currentTime = startTime;
        setCurrentTime(startTime);
        // 진도율은 currentTime이 변경되면 자동으로 업데이트됨
      }
    };

    // 비디오 시간 업데이트 처리
    const handleTimeUpdate = () => {
      const newTime = video.currentTime; // 현재 비디오 재생 위치
      setCurrentTime(newTime); // 현재 시간 상태 업데이트
      // updateProgress는 currentTime이 변경될 때 useEffect에서 자동 호출됨
    };

    // 비디오 재생 시작 처리
    const handlePlay = () => {
      setIsPlaying(true); // 재생 상태로 변경
    };

    // 비디오 일시정지 처리
    const handlePause = () => {
      setIsPlaying(false); // 일시정지 상태로 변경
    };

    // 볼륨 변경 처리
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    // 재생 속도 변경 처리 (최대 2배속으로 제한)
    const handleRateChange = () => {
      if (video.playbackRate > 2) {
        video.playbackRate = 2;
        setPlaybackRate(2);
      } else {
        setPlaybackRate(video.playbackRate);
      }
    };

    // 이벤트 리스너 등록
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
    };
  }, [videoUrl, initialProgress]);

  // currentTime이 변경될 때마다 진도율 업데이트
  useEffect(() => {
    updateProgress();
  }, [updateProgress]);

  // 진도율 자동 저장 (30초마다)
  useEffect(() => {
    if (isPlaying && lessonId && userId && token) {
      progressUpdateIntervalRef.current = setInterval(async () => {
        try {
          // 서버에 현재 재생 위치 전송 (서버에서 진도율 계산)
          await progressTrackingService.updateProgress(
            lessonId, 
            userId, 
            currentTime, // 현재 재생 위치
            duration, 
            token
          );
          
          console.log(`진도율 자동 저장: ${progress.toFixed(1)}% (currentTime: ${currentTime.toFixed(1)}s)`);
        } catch (error) {
          console.error('자동 진도율 저장 오류:', error);
        }
      }, 30000); // 30초마다 실행

      return () => {
        if (progressUpdateIntervalRef.current) {
          clearInterval(progressUpdateIntervalRef.current);
        }
      };
    }
  }, [isPlaying, lessonId, userId, token, currentTime, duration, progress]);

  // 컴포넌트 언마운트 시 최종 진도율 저장
  useEffect(() => {
    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
      
      // 최종 진도율 저장 (현재 재생 위치 기반)
      if (lessonId && userId && token && currentTime > 0) {
        progressTrackingService.updateProgress(
          lessonId, 
          userId, 
          currentTime, // 현재 재생 위치
          duration, 
          token
        ).catch(console.error);
      }
    };
  }, [lessonId, userId, token, currentTime, duration]);

  // 마우스 비활성화 타이머 (컨트롤 UI 자동 숨김)
  useEffect(() => {
    let hideControlsTimeout;

    const showControlsTemporarily = () => {
      setShowControls(true);
      clearTimeout(hideControlsTimeout);
      hideControlsTimeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => {
      showControlsTemporarily();
    };

    const handleMouseLeave = () => {
      if (isPlaying) {
        setShowControls(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(hideControlsTimeout);
    };
  }, [isPlaying]);

  // 컨트롤 함수들
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    const newTime = Math.max(0, video.currentTime - 10);
    video.currentTime = newTime;
  };

  const skipForward = () => {
    const video = videoRef.current;
    const newTime = Math.min(duration, video.currentTime + 10);
    video.currentTime = newTime;
  };

  const changePlaybackRate = (rate) => {
    const video = videoRef.current;
    const limitedRate = Math.min(rate, 2); // 최대 2배속으로 제한
    video.playbackRate = limitedRate;
    setPlaybackRate(limitedRate);
  };

  const handleSeek = (value) => {
    const video = videoRef.current;
    const seekTime = parseFloat(value);
    video.currentTime = seekTime; // 비디오 위치 이동
    // currentTime 변경으로 handleTimeUpdate가 호출되어 자동으로 진도율 업데이트됨
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden group">
      {/* 비디오 엘리먼트 */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-auto max-h-[70vh]"
        autoPlay={autoPlay}
        onClick={togglePlayPause}
        onDoubleClick={toggleFullscreen}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* 로딩 스피너 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* 중앙 재생 버튼 */}
      {!isPlaying && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlayPause}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 transition-all duration-200"
          >
            <Play className="h-12 w-12 text-white ml-1" />
          </button>
        </div>
      )}

      {/* 진도율 표시 - 서버와 동일한 방식으로 계산된 진도율 */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
        진도율: {Math.round(progress)}%
      </div>

      {/* 컨트롤 바 */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent p-4 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* 진행률 바 */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => handleSeek(e.target.value)}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
            }}
          />
        </div>

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-blue-400 transition-colors duration-200"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            <button
              onClick={skipBackward}
              className="text-white hover:text-blue-400 transition-colors duration-200"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              onClick={skipForward}
              className="text-white hover:text-blue-400 transition-colors duration-200"
            >
              <SkipForward className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors duration-200"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 재생 속도 (최대 2배속) */}
            <select
              value={playbackRate}
              onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
              className="bg-gray-800 text-white text-sm rounded px-2 py-1"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors duration-200"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;