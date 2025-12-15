'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Camera, AlertTriangle, Shield } from 'lucide-react';
import * as faceapi from 'face-api.js';
import confetti from 'canvas-confetti';

interface Question {
  id: string;
  questionText: string;
  options: { option: string; text: string }[];
  correctAnswer: string;
}

interface TestData {
  id: string;
  name: string;
  duration: number;
  totalQuestions: number;
  passingPercentage: number;
  questions: Question[];
}

const MOCK_TEST: TestData = {
  id: '1',
  name: 'Samsung Protect Max Certification',
  duration: 15,
  totalQuestions: 10,
  passingPercentage: 60,
  questions: [
    { id: '1', questionText: 'What is the coverage period for Samsung Protect Max ADLD plan?', options: [{ option: 'A', text: '1 Year' }, { option: 'B', text: '2 Years' }, { option: 'C', text: '6 Months' }, { option: 'D', text: '3 Years' }], correctAnswer: 'A' },
    { id: '2', questionText: 'Which of the following is NOT covered under Samsung Protect Max?', options: [{ option: 'A', text: 'Accidental Damage' }, { option: 'B', text: 'Liquid Damage' }, { option: 'C', text: 'Theft' }, { option: 'D', text: 'Screen Crack' }], correctAnswer: 'C' },
    { id: '3', questionText: 'What is the maximum claim limit for Samsung Protect Max?', options: [{ option: 'A', text: '₹50,000' }, { option: 'B', text: 'Device Invoice Value' }, { option: 'C', text: '₹1,00,000' }, { option: 'D', text: 'No Limit' }], correctAnswer: 'B' },
    { id: '4', questionText: 'How many claims can be made under Samsung Protect Max ADLD?', options: [{ option: 'A', text: '1 Claim' }, { option: 'B', text: '2 Claims' }, { option: 'C', text: 'Unlimited' }, { option: 'D', text: '3 Claims' }], correctAnswer: 'A' },
    { id: '5', questionText: 'What is the waiting period after purchasing Samsung Protect Max?', options: [{ option: 'A', text: 'No waiting period' }, { option: 'B', text: '7 Days' }, { option: 'C', text: '15 Days' }, { option: 'D', text: '30 Days' }], correctAnswer: 'A' },
    { id: '6', questionText: 'Which document is required for filing a claim?', options: [{ option: 'A', text: 'Only IMEI number' }, { option: 'B', text: 'Invoice and IMEI' }, { option: 'C', text: 'Aadhar Card only' }, { option: 'D', text: 'No documents needed' }], correctAnswer: 'B' },
    { id: '7', questionText: 'What is the deductible amount for screen damage claim?', options: [{ option: 'A', text: '₹0' }, { option: 'B', text: '₹500' }, { option: 'C', text: '₹1000' }, { option: 'D', text: 'Varies by device' }], correctAnswer: 'D' },
    { id: '8', questionText: 'Within how many days of purchase must Samsung Protect Max be activated?', options: [{ option: 'A', text: '7 days' }, { option: 'B', text: '15 days' }, { option: 'C', text: '30 days' }, { option: 'D', text: 'Same day' }], correctAnswer: 'C' },
    { id: '9', questionText: 'What happens if the device is beyond repair?', options: [{ option: 'A', text: 'Full refund' }, { option: 'B', text: 'Replacement device' }, { option: 'C', text: 'Depreciated value' }, { option: 'D', text: 'No coverage' }], correctAnswer: 'C' },
    { id: '10', questionText: 'Which Samsung devices are eligible for Protect Max?', options: [{ option: 'A', text: 'Only flagship phones' }, { option: 'B', text: 'All Samsung smartphones' }, { option: 'C', text: 'Only Galaxy S series' }, { option: 'D', text: 'Selected models only' }], correctAnswer: 'D' },
  ],
};

type TestPhase = 'permission' | 'instructions' | 'test' | 'certificate' | 'review';

export default function ProctoredTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;

  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<TestPhase>('permission');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [sessionToken] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [submittedAt, setSubmittedAt] = useState<string>('');

  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const faceDetectionInterval = useRef<NodeJS.Timeout | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => { setTestData(MOCK_TEST); setTimeLeft(MOCK_TEST.duration * 60); setLoading(false); }, 500);
  }, [testId]);

  useEffect(() => {
    const loadModels = async () => { try { await faceapi.nets.tinyFaceDetector.loadFromUri('/models'); setModelsLoaded(true); } catch { setModelsLoaded(false); } };
    loadModels();
  }, []);

  useEffect(() => {
    if (phase === 'certificate' && score >= 60) {
      const duration = 3000; const end = Date.now() + duration; const colors = ['#00C853', '#FFD600', '#2979FF'];
      const frame = () => { confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors }); confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors }); if (Date.now() < end) requestAnimationFrame(frame); };
      frame();
    }
  }, [phase, score]);

  const requestCameraPermission = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); setCameraStream(stream); setCameraPermission('granted'); } catch { setCameraPermission('denied'); } };

  useEffect(() => { if (cameraStream && videoRef.current) { videoRef.current.srcObject = cameraStream; } }, [cameraStream, phase]);
  useEffect(() => { return () => { if (cameraStream) cameraStream.getTracks().forEach(track => track.stop()); if (faceDetectionInterval.current) clearInterval(faceDetectionInterval.current); }; }, [cameraStream]);

  useEffect(() => {
    if (phase !== 'test' || !modelsLoaded || !videoRef.current) return;
    const detectFaces = async () => { if (!videoRef.current) return; try { const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()); if (detections.length === 0) { logViolation('no_face', 'No face detected'); showWarning('No face detected.'); } else if (detections.length > 1) { logViolation('multi_face', `${detections.length} faces`); showWarning('Multiple faces detected.'); } } catch {} };
    faceDetectionInterval.current = setInterval(detectFaces, 5000);
    return () => { if (faceDetectionInterval.current) clearInterval(faceDetectionInterval.current); };
  }, [phase, modelsLoaded]);

  useEffect(() => {
    if (phase !== 'test') return;
    const prevent = (e: Event) => { e.preventDefault(); showWarning('This action is not allowed.'); };
    document.addEventListener('copy', prevent); document.addEventListener('paste', prevent); document.addEventListener('cut', prevent); document.addEventListener('contextmenu', prevent); document.addEventListener('selectstart', prevent);
    return () => { document.removeEventListener('copy', prevent); document.removeEventListener('paste', prevent); document.removeEventListener('cut', prevent); document.removeEventListener('contextmenu', prevent); document.removeEventListener('selectstart', prevent); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'test') return;
    const handleVisibility = () => { if (document.visibilityState === 'hidden') { logViolation('tab_switch', 'Tab switched'); showWarning('Tab switching not allowed!'); } };
    const handleBlur = () => { logViolation('window_blur', 'Window lost focus'); showWarning('Stay on this window!'); };
    document.addEventListener('visibilitychange', handleVisibility); window.addEventListener('blur', handleBlur);
    return () => { document.removeEventListener('visibilitychange', handleVisibility); window.removeEventListener('blur', handleBlur); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'test') return;
    const handleFs = () => { if (!document.fullscreenElement) { logViolation('fullscreen_exit', 'Exited fullscreen'); showWarning('Stay in fullscreen!'); setTimeout(() => document.documentElement.requestFullscreen?.().catch(() => {}), 1000); } };
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'test' || timeLeft <= 0) return;
    const timer = setInterval(() => { setTimeLeft(prev => { if (prev <= 1) { handleSubmit(); return 0; } return prev - 1; }); }, 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const logViolation = async (type: string, details?: string) => { try { await fetch('/api/proctoring/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionToken, eventType: type, details }) }); } catch {} };
  const showWarning = (msg: string) => { setWarningMessage(msg); setTimeout(() => setWarningMessage(null), 3000); };
  const startTest = async () => { try { await document.documentElement.requestFullscreen(); } catch {} setPhase('test'); };
  const handleAnswerSelect = async (questionId: string, option: string) => { setAnswers(prev => ({ ...prev, [questionId]: option })); try { await fetch('/api/test/save-answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionToken, testId, questionId, selectedAnswer: option }) }); } catch {} };
  const handleNextQuestion = () => { if (testData && currentQuestion < testData.questions.length - 1) { setCurrentQuestion(prev => prev + 1); } };

  const handleSubmit = useCallback(async () => {
    if (!testData) return;
    let correct = 0; testData.questions.forEach(q => { if (answers[q.id] === q.correctAnswer) correct++; });
    const percentage = Math.round((correct / testData.questions.length) * 100);
    setScore(percentage); setSubmittedAt(new Date().toLocaleString());
    try { await fetch('/api/test/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionToken, testId, testName: testData.name, answers, score: percentage, totalQuestions: testData.questions.length, passed: percentage >= testData.passingPercentage }) }); } catch {}
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    setPhase('certificate');
  }, [testData, answers, cameraStream, sessionToken, testId]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  if (!testData) return <div className="h-screen bg-gray-900 flex items-center justify-center text-white"><button onClick={() => router.push('/SEC/training')} className="px-6 py-3 bg-blue-600 rounded-lg">Back to Training</button></div>;

  if (phase === 'permission') {
    return (
      <div className="h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><Camera className="w-10 h-10 text-blue-600" /></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Camera Permission Required</h1>
            <p className="text-gray-600">This test requires camera access for proctoring.</p>
          </div>
          {cameraPermission === 'pending' && <button onClick={requestCameraPermission} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Allow Camera Access</button>}
          {cameraPermission === 'granted' && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video"><video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" /><div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> Camera Active</div></div>
              <button onClick={() => setPhase('instructions')} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700">✓ Continue to Instructions</button>
            </div>
          )}
          {cameraPermission === 'denied' && (<div className="text-center"><div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"><AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" /><p className="text-red-700 font-medium">Camera access is required.</p></div><button onClick={() => window.location.reload()} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg">Refresh Page</button></div>)}
          <button onClick={() => router.push('/SEC/training')} className="w-full mt-4 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    );
  }

  if (phase === 'instructions') {
    return (
      <div className="h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6"><Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" /><h1 className="text-2xl font-bold text-gray-900">{testData.name}</h1></div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-blue-600">{testData.totalQuestions}</div><div className="text-xs text-gray-600">Questions</div></div>
            <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-blue-600">{testData.duration}</div><div className="text-xs text-gray-600">Minutes</div></div>
            <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-blue-600">{testData.passingPercentage}%</div><div className="text-xs text-gray-600">To Pass</div></div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-3">⚠️ Proctoring Rules</h3>
            <ul className="text-sm text-yellow-700 space-y-2"><li>📷 Camera must stay ON</li><li>👤 Only one face visible</li><li>🚫 No tab switching</li><li>🖥️ Fullscreen mode</li><li>🔒 Copy/paste disabled</li><li>↩️ No back navigation</li></ul>
          </div>
          <button onClick={startTest} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-lg">Start Test</button>
        </div>
      </div>
    );
  }

  if (phase === 'test') {
    const question = testData.questions[currentQuestion];
    const isLast = currentQuestion === testData.questions.length - 1;
    return (
      <div className="h-screen bg-gray-100 flex flex-col select-none">
        {warningMessage && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse"><AlertTriangle className="w-5 h-5" />{warningMessage}</div>}
        <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center"><div className="font-bold text-gray-900">Q {currentQuestion + 1} / {testData.questions.length}</div><div className={`font-bold text-lg ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>⏱️ {formatTime(timeLeft)}</div></div>
        <div className="h-1 bg-gray-200"><div className="h-full bg-blue-600 transition-all" style={{ width: `${((currentQuestion + 1) / testData.questions.length) * 100}%` }} /></div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-6">{question.questionText}</h2>
              <div className="space-y-3">{question.options.map(opt => (<button key={opt.option} onClick={() => handleAnswerSelect(question.id, opt.option)} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${answers[question.id] === opt.option ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}><div className="flex items-center gap-3"><span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${answers[question.id] === opt.option ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{opt.option}</span><span className="font-medium text-gray-900">{opt.text}</span></div></button>))}</div>
            </div>
            {isLast ? <button onClick={handleSubmit} disabled={!answers[question.id]} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50">Submit Test ✓</button> : <button onClick={handleNextQuestion} disabled={!answers[question.id]} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50">Next Question →</button>}
          </div>
        </div>
        <div className="fixed bottom-4 right-4 w-32 h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white"><video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" /><div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div></div>
      </div>
    );
  }

  if (phase === 'certificate') {
    const passed = score >= testData.passingPercentage;
    const correctCount = testData.questions.filter(q => answers[q.id] === q.correctAnswer).length;
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-50 py-6 px-4">
        <div className="bg-white border-4 border-yellow-400 rounded-3xl shadow-xl max-w-2xl w-full text-center px-6 sm:px-10 py-8 sm:py-10 relative">
          <img src="/zopper-logo.png" alt="Zopper Logo" className="absolute top-4 right-4 sm:top-6 sm:right-6 w-16 sm:w-20 opacity-90" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{passed ? 'Certificate of Achievement' : 'Certificate of Participation'}</h1>
          <p className="text-sm text-gray-500 mb-6">Presented by Zopper</p>
          <p className="text-gray-600 text-lg mb-2">This is proudly awarded to</p>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-3">SEC User</h2>
          <p className="text-gray-600 mb-2 px-4">for successfully completing the <strong>SEC Knowledge Assessment</strong>.</p>
          <div className="my-6 bg-blue-50 rounded-xl py-4 px-6 inline-block"><h3 className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2">🎉 {score}%</h3><p className="text-gray-700 font-medium">{correctCount} out of {testData.questions.length} correct</p></div>
          <div className="mb-6"><p className="text-gray-500 text-sm mb-1">Test: {testData.name}</p><p className="text-gray-500 text-sm">Submitted on: {submittedAt}</p></div>
          <div className="border-t border-gray-300 my-4 w-3/4 mx-auto"></div>
          <p className="text-gray-700 font-medium italic mb-8">&quot;Best wishes for your bright future ahead with Zopper 🌟&quot;</p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button onClick={() => router.push('/SEC/home')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium">Go to Dashboard</button>
            <button onClick={() => window.print()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 rounded-lg font-medium">Print Certificate</button>
            <button onClick={() => setPhase('review')} className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-lg font-medium">View All Results</button>
          </div>
          <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 text-xs text-gray-400 flex items-center gap-1">Powered by <img src="/zopper-logo.png" alt="Zopper" className="inline w-10" /></div>
        </div>
      </div>
    );
  }

  if (phase === 'review') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4"><h1 className="text-2xl font-bold text-gray-900 mb-2">📝 Answer Review</h1><p className="text-gray-600">{testData.name}</p><p className="text-sm text-gray-500 mt-2">Your Score: <span className="font-bold text-blue-600">{score}%</span></p></div>
          {testData.questions.map((q, idx) => {
            const userAnswer = answers[q.id]; const isCorrect = userAnswer === q.correctAnswer;
            return (
              <div key={q.id} className={`bg-white rounded-2xl shadow-lg p-5 mb-4 border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex items-center gap-2 mb-3"><span className={`px-3 py-1 rounded-full text-sm font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isCorrect ? '✓ Correct' : '✗ Incorrect'}</span><span className="text-gray-500 text-sm">Question {idx + 1}</span></div>
                <h3 className="font-bold text-gray-900 mb-4">{q.questionText}</h3>
                <div className="space-y-2">{q.options.map(opt => (<div key={opt.option} className={`p-3 rounded-lg border-2 ${opt.option === q.correctAnswer ? 'border-green-500 bg-green-50' : opt.option === userAnswer && !isCorrect ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}`}><div className="flex items-center gap-3"><span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${opt.option === q.correctAnswer ? 'bg-green-500 text-white' : opt.option === userAnswer && !isCorrect ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{opt.option}</span><span className="text-gray-900 flex-1">{opt.text}</span>{opt.option === q.correctAnswer && <span className="text-green-600 text-xs font-medium">✓ Correct</span>}{opt.option === userAnswer && opt.option !== q.correctAnswer && <span className="text-yellow-600 text-xs font-medium">🟡 Your Answer</span>}</div></div>))}</div>
              </div>
            );
          })}
          <div className="flex gap-3"><button onClick={() => setPhase('certificate')} className="flex-1 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700">← Back to Certificate</button><button onClick={() => router.push('/SEC/training')} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Back to Training</button></div>
        </div>
      </div>
    );
  }

  return null;
}
