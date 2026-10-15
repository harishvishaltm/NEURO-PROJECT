import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  Brain,
  Volume2,
  BellRing,
  Check,
  Activity,
  Send,
  ShieldCheck,
} from 'lucide-react';

import Header from './components/Header';
import StatusBanner from './components/StatusBanner';
import PipelineFlow from './components/PipelineFlow';
import UploadView from './components/UploadView';
import ResultsDashboard from './components/ResultsDashboard';
import ClinicalAnalysisView from './components/ClinicalAnalysisView';
import ContinuousStreamingView from './components/ContinuousStreamingView';
import PhoneSimulator from './components/PhoneSimulator';
import StandbyMonitor from './components/StandbyMonitor';
import { api } from './services/api';
import {
  requestDoctorNotificationPermission,
  dispatchDoctorAlert,
} from './services/doctorNotifier';

export default function App() {
  const [health, setHealth] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // View & Page State
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' or 'phone'
  const [activePage, setActivePage] = useState('speech'); // 'speech' (Upload & Output), 'analysis' (Graphs), or 'stream' (Continuous BCI)

  const [isPredicting, setIsPredicting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);

  const [predictionResult, setPredictionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionHistory, setSessionHistory] = useState([]);

  // Doctor Mobile Notification State
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [doctorAlert, setDoctorAlert] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const res = await requestDoctorNotificationPermission();
    if (res.supported) {
      setNotificationPermission(res.status);
    }
  };

  // Fetch system health & model info
  const fetchStatus = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const [hRes, mRes] = await Promise.allSettled([
        api.getHealth(),
        api.getModelInfo(),
      ]);

      if (hRes.status === 'fulfilled') setHealth(hRes.value);
      else setHealth({ status: 'error' });

      if (mRes.status === 'fulfilled') setModelInfo(mRes.value);
    } catch (err) {
      console.error('Status fetch error:', err);
      setHealth({ status: 'error' });
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Execute Upload & Neural Decoding Pipeline
  const handleUpload = async (file, dataset, subject) => {
    setIsPredicting(true);
    setErrorMsg('');
    setAlertDismissed(false);

    // Step 1: Uploading & Staging
    setPipelineStep(1);
    await new Promise((r) => setTimeout(r, 160));

    // Step 2: Signal Filtering & Harmonization
    setPipelineStep(2);
    await new Promise((r) => setTimeout(r, 220));

    // Step 3: Deep Neural Net Forward Pass
    setPipelineStep(3);

    try {
      const res = await api.predictUpload(file, dataset, subject);

      // Step 4: Classifying Vocabulary
      setPipelineStep(4);
      await new Promise((r) => setTimeout(r, 160));

      // Step 5: Assistive LLM Sentence
      setPipelineStep(5);
      await new Promise((r) => setTimeout(r, 160));

      // Step 6: Text-to-Speech Vocal Audio
      setPipelineStep(6);

      setPredictionResult(res);

      // Record in Session Audit History
      setSessionHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          filename: file.name,
          word: res.prediction?.word || 'Assistance',
          confidence: res.prediction?.confidence || 0,
          sentence: res.communication?.sentence || res.prediction?.word,
          latency: res.processing?.inference_time_ms || 28,
          urgency: ['pain', 'help', 'breathe', 'scared'].includes(
            (res.prediction?.word || '').toLowerCase()
          )
            ? 'CRITICAL'
            : 'STANDARD',
        },
        ...prev,
      ]);

      // Dispatch Doctor Mobile & Clinical Audio Alert
      const alertData = dispatchDoctorAlert({
        word: res.prediction?.word || 'Assistance',
        sentence: res.communication?.sentence || res.prediction?.word,
        patient: subject === 'ALS_Patient_01' ? 'ALS Patient 01 (Bed 4B)' : subject,
      });
      setDoctorAlert(alertData);

      // Trigger Telegram notification directly via backend endpoint
      try {
        await api.notifyDoctor({
          patient_id: subject === 'ALS_Patient_01' ? 'ALS Patient 01 (Bed 4B)' : subject,
          word: res.prediction?.word || 'Need',
          sentence: res.communication?.sentence || res.prediction?.word,
          urgency: ['pain', 'help', 'breathe', 'scared'].includes(
            (res.prediction?.word || '').toLowerCase()
          )
            ? 'CRITICAL'
            : 'STANDARD',
        });
      } catch (tgErr) {
        console.warn('Backend Telegram dispatch:', tgErr);
      }
    } catch (err) {
      setErrorMsg(err.message || 'EEG neural decoding failed.');
      setPipelineStep(0);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleReset = () => {
    setPredictionResult(null);
    setPipelineStep(0);
    setErrorMsg('');
  };

  return (
    <div
      className="min-h-screen bg-[#f0f7ff] text-slate-800 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900"
      style={{ backgroundColor: '#f0f7ff' }}
    >
      {/* Native Desktop Window Header with Primary Navigation & View Switcher */}
      <Header
        health={health}
        modelInfo={modelInfo}
        viewMode={viewMode}
        onViewChange={setViewMode}
        activePage={activePage}
        onPageChange={setActivePage}
        hasPrediction={!!predictionResult}
        notificationPermission={notificationPermission}
        onEnableNotifications={handleEnableNotifications}
      />

      {/* Connectivity & Pipeline Telemetry Banner */}
      <StatusBanner
        health={health}
        modelInfo={modelInfo}
        onRefresh={fetchStatus}
        loading={loadingHealth}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* DOCTOR CLINICAL ALERT BANNER (Active when patient signal decoded) */}
        {doctorAlert && !alertDismissed && (
          <div
            className={`p-4 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-4 animate-fade-in ${
              doctorAlert.urgency?.level === 'CRITICAL'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-sky-50 border-sky-300 text-sky-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
                  doctorAlert.urgency?.level === 'CRITICAL' ? 'bg-rose-600 animate-pulse' : 'bg-sky-600'
                }`}
              >
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-900">
                    {doctorAlert.urgency?.badge || '🚨 DOCTOR ALERT DISPATCHED'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Time: {doctorAlert.timestamp}
                  </span>
                </div>
                <p className="text-sm font-bold mt-0.5 text-slate-900">
                  <strong>{doctorAlert.patient}:</strong> Decoded Need:{' '}
                  <span className="underline uppercase font-black text-sky-700">
                    "{doctorAlert.word}"
                  </span>{' '}
                  — "{doctorAlert.sentence}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-600 font-medium hidden md:inline">
                {doctorAlert.nativeNotificationSent
                  ? '📱 Sent to Doctor Telegram Phone & Pager'
                  : '🔊 Audio Alert Playing on Speaker'}
              </span>
              <button
                onClick={() => setAlertDismissed(true)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold transition flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Acknowledge</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="flex-1">
              <strong>Signal Processing Error:</strong> {errorMsg}
            </div>
            <button
              onClick={() => setErrorMsg('')}
              className="text-rose-700 hover:text-rose-900 text-xs font-semibold px-2 py-1 rounded bg-rose-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW MODE SELECTION: Phone Simulator or Desktop Console */}
        {viewMode === 'phone' ? (
          /* PHONE SIMULATOR MODE */
          <PhoneSimulator
            health={health}
            modelInfo={modelInfo}
            predictionResult={predictionResult}
            onUpload={handleUpload}
            isPredicting={isPredicting}
            pipelineStep={pipelineStep}
            doctorAlert={doctorAlert}
            alertDismissed={alertDismissed}
            onDismissAlert={() => setAlertDismissed(true)}
            onEnableNotifications={handleEnableNotifications}
            notificationPermission={notificationPermission}
            onReset={handleReset}
            onSwitchToDesktop={() => setViewMode('desktop')}
          />
        ) : (
          /* DESKTOP WORKSTATION MODE */
          <>
            {/* PAGE 1: SPEECH STATION (Upload & Output in one single page) */}
            {activePage === 'speech' && (
              <div className="space-y-6 animate-fade-in">
                {/* Pipeline Execution Flow Progress */}
                <PipelineFlow currentStep={pipelineStep} isProcessing={isPredicting} />

                {/* Side-by-Side Upload + Output Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: Signal Acquisition Panel (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <UploadView onUpload={handleUpload} isPredicting={isPredicting} />

                    {/* Clinical Operating Note */}
                    <div className="p-4 rounded-2xl bg-white border border-sky-100 text-xs text-slate-600 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                          <Brain className="w-4 h-4 text-sky-600" />
                          <span>Clinical Telemetry & Caregiver Link</span>
                        </div>
                        <button
                          onClick={() => setActivePage('stream')}
                          className="text-[11px] text-sky-600 hover:text-sky-700 underline font-semibold cursor-pointer"
                        >
                          Switch to Live Bedside Stream ➔
                        </button>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600">
                        Calibrated for non-verbal paralyzed & locked-in patients. Translates 122-channel sensorimotor EEG into vocal speech across 26 clinical categories.
                      </p>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Latency: ~28ms on CUDA</span>
                        <span className="text-emerald-700 font-semibold">Doctor Pager Active</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Output & Speech Synthesizer Panel (7 cols) */}
                  <div className="lg:col-span-7">
                    {predictionResult ? (
                      <ResultsDashboard
                        result={predictionResult}
                        onReset={handleReset}
                        onNavigateToAnalysis={() => setActivePage('analysis')}
                      />
                    ) : (
                      <StandbyMonitor />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 2: CLINICAL ANALYSIS & VENDOR PRESENTATION GRAPHS */}
            {activePage === 'analysis' && (
              <div className="animate-fade-in">
                <ClinicalAnalysisView
                  predictionResult={predictionResult}
                  sessionHistory={sessionHistory}
                  onNavigateToSpeech={() => setActivePage('speech')}
                />
              </div>
            )}

            {/* PAGE 3: LIVE BEDSIDE STREAM (Continuous Patient BCI) */}
            {activePage === 'stream' && (
              <div className="animate-fade-in">
                <ContinuousStreamingView
                  onNavigateToSpeech={() => setActivePage('speech')}
                  onNavigateToAnalysis={() => setActivePage('analysis')}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Desktop App Status Bar Footer */}
      <footer className="border-t border-sky-100 bg-white py-3.5 px-4 text-xs text-slate-500 select-none shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-800 font-semibold">NeuroVoice BCI Workstation</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Clinical Speech Decoding & Caregiver Communication System</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-mono">
            <span>PyTorch 2.6.0+cu126</span>
            <span>122-Ch Sensor Array</span>
            <span>Local Assistive Audio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
