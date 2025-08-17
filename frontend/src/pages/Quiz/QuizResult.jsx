import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, BarChart3, CheckCircle, XCircle, Users, Download } from 'lucide-react';
import quizService from '../../services/quizService';

const QuizResult = ({ classroomId, quiz, currentUser, accessToken, isEducator, onBack }) => {
  const [resultData, setResultData] = useState(null);
  const [allResults, setAllResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isEducator ? 'overview' : 'my-result');
  const [error, setError] = useState(null);

  // ============================================================================
  // 데이터 로딩
  // ============================================================================

  useEffect(() => {
    const loadResults = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (isEducator) {
          // 교육자: 모든 참여자 결과 조회 - 수정된 API 호출
          const results = await quizService.getQuizResults(classroomId, quiz.quizId, accessToken, currentUser.userId);
          setAllResults(results);
        } else {
          // 학습자: 본인 결과 조회
          const result = await quizService.getQuizResult(classroomId, quiz.quizId, currentUser.userId, accessToken);
          setResultData(result);
        }
      } catch (error) {
        console.error('결과 조회 실패:', error);
        setError('결과를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [classroomId, quiz.quizId, currentUser.userId, accessToken, isEducator]);

  // ============================================================================
  // 유틸리티 함수
  // ============================================================================

  const getScorePercentage = (score, totalScore) => {
    return totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBgColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-50 border-green-200';
    if (percentage >= 80) return 'bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================================================
  // 학습자용 결과 렌더링
  // ============================================================================

  const renderStudentResult = () => {
    if (!resultData) return null;

    const percentage = getScorePercentage(resultData.earnedPoints, resultData.totalPoints);

    return (
      <div className="space-y-6">
        {/* 점수 요약 */}
        <div className={`rounded-lg border-2 p-6 ${getGradeBgColor(percentage)}`}>
          <div className="text-center">
            <Trophy className={`mx-auto mb-4 ${getGradeColor(percentage)}`} size={48} />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {resultData.earnedPoints} / {resultData.totalPoints}
            </h2>
            <p className={`text-xl font-semibold mb-2 ${getGradeColor(percentage)}`}>
              {percentage}점
            </p>
            <p className="text-gray-600">
              {resultData.correctAnswers} / {resultData.totalQuestions} 문제 정답
            </p>
          </div>
        </div>

        {/* 상세 결과 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">문제별 상세 결과</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {resultData.answerResults?.map((answerResult, index) => (
              <div key={answerResult.questionId} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900">
                    문제 {index + 1}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {answerResult.isCorrect ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <XCircle className="text-red-500" size={20} />
                    )}
                    <span className="text-sm text-gray-500">
                      {answerResult.isCorrect ? answerResult.points : 0} / {answerResult.points}점
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">
                  {answerResult.questionText}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">당신의 답:</span>
                    <p className={answerResult.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {answerResult.studentAnswer || '미답변'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">정답:</span>
                    <p className="text-green-600">
                      {answerResult.correctAnswer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 제출 정보 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">제출 시간:</span>
              <p>{formatDateTime(resultData.submittedAt)}</p>
            </div>
            <div>
              <span className="font-medium">소요 시간:</span>
              <p>{resultData.timeSpent || '정보 없음'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 교육자용 결과 렌더링
  // ============================================================================

  const renderEducatorOverview = () => {
    if (!allResults) return null;

    const totalParticipants = allResults.totalParticipants || 0;
    const averageScore = allResults.averageScore || 0;
    const averagePercentage = allResults.averagePercentage || 0;

    return (
      <div className="space-y-6">
        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Users className="text-blue-500" size={24} />
              <div>
                <p className="text-sm text-gray-600">참여자</p>
                <p className="text-xl font-semibold text-gray-900">{totalParticipants}명</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-gray-600">평균 점수</p>
                <p className="text-xl font-semibold text-gray-900">
                  {averageScore.toFixed(1)} / {allResults.maxPossibleScore || quiz.totalPoints}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Trophy className="text-yellow-500" size={24} />
              <div>
                <p className="text-sm text-gray-600">평균 정답률</p>
                <p className="text-xl font-semibold text-gray-900">{averagePercentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-purple-500" size={24} />
              <div>
                <p className="text-sm text-gray-600">완료율</p>
                <p className="text-xl font-semibold text-gray-900">
                  {quiz.participantCount > 0 ? Math.round((totalParticipants / quiz.participantCount) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 점수 분포 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">점수 분포</h3>
          <div className="space-y-3">
            {['90-100', '80-89', '70-79', '60-69', '0-59'].map((range, index) => {
              const [min, max] = range.split('-').map(Number);
              const count = allResults.participants?.filter(p => {
                const percentage = p.percentage || 0;
                return percentage >= min && percentage <= max;
              }).length || 0;
              
              const percentage = totalParticipants > 0 ? (count / totalParticipants) * 100 : 0;
              
              return (
                <div key={range} className="flex items-center space-x-4">
                  <div className="w-20 text-sm text-gray-600">{range}점</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-500 h-6 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                      {count}명 ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderEducatorParticipants = () => {
    if (!allResults?.participants) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">참여자 결과</h3>
          <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Download size={16} />
            <span>Excel 다운로드</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  학생명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  점수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  정답률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제출 시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  소요 시간
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allResults.participants.map((participant, index) => {
                const percentage = participant.percentage || 0;
                return (
                  <tr key={participant.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {participant.studentName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {participant.score} / {allResults.maxPossibleScore || quiz.totalPoints}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeBgColor(percentage)}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(participant.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.timeSpent || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 메인 렌더링
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">퀴즈 결과</h1>
          <p className="text-gray-600">{quiz.title}</p>
        </div>
      </div>

      {/* 탭 네비게이션 (교육자용) */}
      {isEducator && (
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              통계 개요
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'participants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              참여자 결과
            </button>
          </nav>
        </div>
      )}

      {/* 컨텐츠 */}
      {isEducator ? (
        activeTab === 'overview' ? renderEducatorOverview() : renderEducatorParticipants()
      ) : (
        renderStudentResult()
      )}
    </div>
  );
};

export default QuizResult;