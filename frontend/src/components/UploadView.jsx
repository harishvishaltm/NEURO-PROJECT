import React, { useState, useRef } from 'react';
import {
  Upload,
  FileUp,
  Database,
  User,
  AlertCircle,
  CheckCircle,
  Volume2,
  X,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

const ALLOWED_EXTS = ['.npz', '.mat', '.cnt'];

export default function UploadView({ onUpload, isPredicting }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dataset, setDataset] = useState('patient_needs');
  const [subject, setSubject] = useState('ALS_Patient_01');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (selected) => {
    setError('');
    if (!selected) return false;

    const ext = '.' + selected.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setError(`Unsupported format '${ext}'. Please choose a .npz, .mat, or .cnt EEG file.`);
      return false;
    }

    if (selected.size > 50 * 1024 * 1024) {
      setError('File exceeds maximum limit of 50MB.');
      return false;
    }

    setFile(selected);
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const handleClearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop an EEG signal recording from your device first.');
      return;
    }
    onUpload(file, dataset, subject);
  };

  return (
    <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-sky-50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shadow-2xs">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Signal Acquisition
            </h3>
            <p className="text-[11px] text-slate-500">
              Load 122-channel scalp EEG recording from local device
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
          .npz / .mat / .cnt
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
        {/* Authentic Local File Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200'
              : file
              ? 'border-emerald-400 bg-emerald-50/40'
              : 'border-sky-200 hover:border-sky-400 bg-sky-50/30 hover:bg-sky-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".npz,.mat,.cnt"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition shadow-xs ${
                file
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-br from-sky-500 to-sky-600 text-white'
              }`}
            >
              {file ? <FileCheck className="w-7 h-7" /> : <FileUp className="w-7 h-7" />}
            </div>

            {file ? (
              <div className="w-full">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm font-bold text-emerald-800 truncate max-w-[260px]">
                    {file.name}
                  </p>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="p-1 rounded-md bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-3 mt-1 text-[11px] text-slate-500">
                  <span>Size: {(file.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Validated Recording
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Drop EEG signal recording here or <span className="text-sky-600 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500">
                  Select 122-channel .npz, .mat, or .cnt recording from your local computer
                </p>
                <p className="text-[10px] text-slate-400 font-mono pt-1">
                  Sampling: 256 Hz • Epoch: 5.0 Seconds • Spatial CAR Filtering
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Clinical Profile Selector */}
        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-600" />
              Target Vocabulary Profile
            </label>
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 shadow-2xs font-medium"
            >
              <option value="patient_needs">Paralyzed Patient Essential Needs (26 Vital & Emotional Classes)</option>
              <option value="kara_one">Kara One Clinical Benchmark (pot, pat, /tiy/...)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-600" />
              Patient Calibration Profile
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 shadow-2xs font-medium"
            >
              <option value="ALS_Patient_01">ALS_Patient_01 (Sensorimotor Motor Impaired Profile)</option>
              <option value="ALS_Patient_02">ALS_Patient_02 (Locked-In Lateral Sclerosis Profile)</option>
              <option value="ALS_Patient_03">ALS_Patient_03 (Quadriplegic Assistive Profile)</option>
              <option value="MM05">MM05 (Kara One Benchmark Subject)</option>
            </select>
          </div>
        </div>

        {/* Action Button: Strictly active only when local file is loaded */}
        <button
          type="submit"
          disabled={!file || isPredicting}
          className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
            !file || isPredicting
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-sky-200 active:scale-[0.99]'
          }`}
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>
            {isPredicting
              ? 'Processing 122-Channel Neural Biosignals...'
              : file
              ? 'Decode Loaded EEG Recording & Synthesize Voice Audio'
              : 'Please Select EEG File From Local Device Above'}
          </span>
        </button>
      </form>
    </div>
  );
}
