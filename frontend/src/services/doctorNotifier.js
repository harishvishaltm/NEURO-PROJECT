/**
 * Doctor & Caregiver Mobile Notification Service
 * Supports:
 * 1. Native Web Push / Mobile Browser Notifications
 * 2. Device Vibration (Haptic Feedback)
 * 3. Web Audio Medical Alert Chimes
 * 4. In-App Clinical Dispatch Records
 */

export const getUrgencyLevel = (word = '') => {
  const w = word.toLowerCase();
  if (['pain', 'help', 'breathe', 'scared'].includes(w)) {
    return {
      level: 'CRITICAL',
      color: 'rose',
      badge: '🚨 Critical Doctor Alert',
      soundFreq: [880, 1174, 880, 1174],
    };
  }
  if (['bathroom', 'medicine', 'anxious', 'cold', 'hot', 'frustrated'].includes(w)) {
    return {
      level: 'URGENT',
      color: 'amber',
      badge: '⚠️ Urgent Medical Need',
      soundFreq: [660, 880],
    };
  }
  return {
    level: 'STANDARD',
    color: 'cyan',
    badge: 'ℹ️ Patient Assistance',
    soundFreq: [520, 660],
  };
};

/**
 * Play a hospital/clinic synthesizer chime via Web Audio API
 */
export const playMedicalChime = (urgencyLevel = 'STANDARD') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const frequencies = urgencyLevel === 'CRITICAL' ? [880, 1174] : [659, 880];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.16);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.16);
      osc.stop(ctx.currentTime + idx * 0.16 + 0.35);
    });
  } catch (e) {
    console.warn('Medical chime sound error:', e);
  }
};

/**
 * Request permission for native system / mobile notifications
 */
export const requestDoctorNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return { supported: false, status: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    return { supported: true, status: permission };
  } catch (err) {
    return { supported: true, status: 'denied' };
  }
};

/**
 * Dispatch Doctor Alert to Mobile & Browser
 */
export const dispatchDoctorAlert = ({ word, sentence, patient = 'ALS Patient 01' }) => {
  const urgency = getUrgencyLevel(word);

  // 1. Play Medical Audio Chime
  playMedicalChime(urgency.level);

  // 2. Trigger Haptic Vibration on mobile devices
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (urgency.level === 'CRITICAL') {
      navigator.vibrate([250, 100, 250, 100, 400]);
    } else {
      navigator.vibrate([200, 100, 200]);
    }
  }

  // 3. Native Device Notification (Desktop / Android / iOS PWA)
  let nativeNotificationSent = false;
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`🚨 DOCTOR ALERT: ${patient} needs ${word.toUpperCase()}`, {
        body: `"${sentence}"\nUrgency: ${urgency.level} • Immediate Caregiver Attention Required`,
        icon: '/favicon.ico',
        tag: `eeg-alert-${Date.now()}`,
        requireInteraction: urgency.level === 'CRITICAL',
      });
      nativeNotificationSent = true;
    } catch (err) {
      console.warn('Native notification failed:', err);
    }
  }

  return {
    id: 'ALT-' + Date.now().toString(36).toUpperCase(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    patient,
    word: word.toUpperCase(),
    sentence,
    urgency,
    nativeNotificationSent,
  };
};
