/**
 * API Client for EEG-Based Imagined Speech Communication System
 */

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const api = {
  /**
   * Health Check
   */
  async getHealth() {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return res.json();
  },

  /**
   * Model Info & Architecture metadata
   */
  async getModelInfo() {
    const res = await fetch(`${API_BASE}/api/model-info`);
    if (!res.ok) throw new Error(`Failed to fetch model info (${res.status})`);
    return res.json();
  },

  /**
   * List prepared demo EEG samples
   */
  async getDemoSamples() {
    const res = await fetch(`${API_BASE}/api/demo-samples`);
    if (!res.ok) throw new Error(`Failed to list demo samples (${res.status})`);
    return res.json();
  },

  /**
   * Run inference on a demo sample
   */
  async predictDemo(sampleId) {
    const res = await fetch(`${API_BASE}/api/predict-demo/${encodeURIComponent(sampleId)}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Prediction failed on demo ${sampleId}`);
    }
    return res.json();
  },

  /**
   * Upload an EEG file (.npz, .mat, .cnt) for inference
   */
  async predictUpload(file, dataset = 'kara_one', subject = 'MM05') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset', dataset);
    formData.append('subject', subject);

    const res = await fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Prediction failed on uploaded file');
    }
    return res.json();
  },

  /**
   * Direct vector inference
   */
  async predictVector(payload) {
    const res = await fetch(`${API_BASE}/api/predict-vector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Direct vector prediction failed');
    }
    return res.json();
  },

  /**
   * Convert decoded word into assistive communicative sentence via LLM
   */
  async generateSentence(word, useMemory = false) {
    const res = await fetch(`${API_BASE}/api/generate-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, use_memory: useMemory }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Sentence generation failed');
    }
    return res.json();
  },

  /**
   * Synthesize text to speech
   */
  async textToSpeech(text, wordHint = null) {
    const res = await fetch(`${API_BASE}/api/text-to-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, word_hint: wordHint }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Speech synthesis failed');
    }
    return res.json();
  },

  /**
   * Helper to resolve audio URL
   */
  resolveAudioUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  },

  /**
   * Get direct download link for an EEG sample (.npz or .mat)
   */
  getDownloadSampleUrl(filename) {
    return `${API_BASE}/api/download-sample/${encodeURIComponent(filename)}`;
  },

  /**
   * Get direct download link for all demo samples in a ZIP archive
   */
  getDownloadAllUrl() {
    return `${API_BASE}/api/download-all-samples`;
  },

  /**
   * Dispatch Clinical Alert to Doctor Phone (Telegram + Pager)
   */
  async notifyDoctor(payload) {
    const res = await fetch(`${API_BASE}/api/notify-doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to dispatch doctor notification');
    }
    return res.json();
  },
};

