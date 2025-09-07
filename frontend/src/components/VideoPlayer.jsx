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
  const totalWatchTimeRef = useRef(0); // 누적 재생 시간
  const lastPlayTimeRef = useRef(0); // 마지막 재생 시점
  
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

  // 진도율 업데이트 함수
  const updateProgress = useCallback(() => {
    if (duration === 0) return;
    
    const newProgress = (totalWatchTimeRef.current / duration) * 100;
    const finalProgress = Math.min(newProgress, 100);
    
    setProgress(finalProgress);
    
    if (onProgressUpdate) {
      onProgressUpdate(finalProgress);
    }
  }, [duration, onProgressUpdate]);

  // 비디오 이벤트 핸들러
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
      
      // 초기 진도율이 있으면 해당 위치로 이동하고 시청 시간 설정
      if (initialProgress > 0) {
        const startTime = (initialProgress / 100) * video.duration;
        video.currentTime = startTime;
        setCurrentTime(startTime);
        // 초기 시청 시간을 영상 길이로 제한
        totalWatchTimeRef.current = Math.min((initialProgress / 100) * video.duration, video.duration);

        updateProgress();
      }
    };

    const handleTimeUpdate = () => {
      const newTime = video.currentTime;
      setCurrentTime(newTime);
      // 진도율 계산은 여기서 하지 않음
    };

    const handlePlay = () => {
      setIsPlaying(true);
      lastPlayTimeRef.current = videoRef.current.currentTime;
    };

    const handlePause = () => {
      setIsPlaying(false);
    
      // 재생된 시간만큼 누적 시청 시간에 추가
      const currentVideoTime = videoRef.current.currentTime;
      const playedDuration = currentVideoTime - lastPlayTimeRef.current;
    
      // 순차적으로 앞으로 재생된 경우만 시청 시간에 추가 (되감기 제외)
      if (playedDuration > 0 && playedDuration <= 60) { // 최대 60초까지만 인정
        totalWatchTimeRef.current += playedDuration;
        console.log(`시청 시간 추가: ${playedDuration.toFixed(1)}s, 총: ${totalWatchTimeRef.current.toFixed(1)}s`);
        
        // 진도율 업데이트
        updateProgress();
      } else if (playedDuration <= 0) {
        console.log('되감기 감지 - 시청 시간 추가 안함');
      } else {
        console.log('큰 점프 감지 - 시청 시간 추가 안함');
      }
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    // 재생 속도 제한 (최대 2배속)
    const handleRateChange = () => {
      if (video.playbackRate > 2) {
        video.playbackRate = 2;
        setPlaybackRate(2);
      } else {
        setPlaybackRate(video.playbackRate);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
    };
  }, [videoUrl, initialProgress, updateProgress]);

  // 진도율 자동 저장 (30초마다)
  useEffect(() => {
    if (isPlaying && lessonId && userId && token) {
      progressUpdateIntervalRef.current = setInterval(async () => {
        try {
          await progressTrackingService.updateProgress(
            lessonId, 
            userId, 
            currentTime, 
            duration, 
            token
          );
          
          console.log(`진도율 자동 저장: ${progress.toFixed(1)}%`);
        } catch (error) {
          console.error('자동 진도율 저장 오류:', error);
        }
      }, 30000);

      return () => {
        if (progressUpdateIntervalRef.current) {
          clearInterval(progressUpdateIntervalRef.current);
        }
      };
    }
  }, [isPlaying, lessonId, userId, token, currentTime, duration, progress]);

  // 컴포넌트 언마운트 시 진도율 저장
  useEffect(() => {
    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
      
      // 마지막 재생 세션의 시청 시간 추가
      if (isPlaying && videoRef.current) {
        const currentVideoTime = videoRef.current.currentTime;
        const playedDuration = currentVideoTime - lastPlayTimeRef.current;
        if (playedDuration > 0 && playedDuration <= 60) {
          totalWatchTimeRef.current += playedDuration;
          updateProgress();
        }
      }
      
      // 최종 진도율 저장
      if (lessonId && userId && token && currentTime > 0) {
        progressTrackingService.updateProgress(
          lessonId, 
          userId, 
          currentTime,
          duration, 
          token
        ).catch(console.error);
      }
    };
  }, [lessonId, userId, token, currentTime, duration, isPlaying, updateProgress]);

  // 마우스 비활성화 타이머
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
    const limitedRate = Math.min(rate, 2);
    video.playbackRate = limitedRate;
    setPlaybackRate(limitedRate);
  };

  const handleSeek = (value) => {
    const video = videoRef.current;
    const seekTime = parseFloat(value);
  
    // 시킹 시에는 시청 시간 추가하지 않음 (pause/play에서만 처리)
    if (isPlaying) {
      lastPlayTimeRef.current = seekTime; // 위치만 업데이트
    }
  
    video.currentTime = seekTime;
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

      {/* 진도율 표시 */}
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