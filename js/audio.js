// ===== Web Audio Engine =====
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSoundMuyu() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  for (let i = 0; i < 3; i++) {
    const t = now + i * 0.35;

    const noiseLen = 0.03;
    const bufSize = ctx.sampleRate * noiseLen;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < bufSize; j++) {
      data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufSize * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseLen);

    const noiseFilt = ctx.createBiquadFilter();
    noiseFilt.type = 'bandpass';
    noiseFilt.frequency.value = 800;
    noiseFilt.Q.value = 2;

    noise.connect(noiseFilt);
    noiseFilt.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + noiseLen);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.15);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, t);
    osc2.frequency.exponentialRampToValueAtTime(360, t + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.15, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.15);
  }
}

function playSoundYinching() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  const baseFreq = 880;
  const harmonics = [
    { freq: baseFreq, gain: 0.35, decay: 4.0 },
    { freq: baseFreq * 2.76, gain: 0.2, decay: 2.5 },
    { freq: baseFreq * 5.4, gain: 0.1, decay: 1.5 },
    { freq: baseFreq * 8.93, gain: 0.04, decay: 0.8 },
  ];

  const noiseLen = 0.05;
  const bufSize = ctx.sampleRate * noiseLen;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let j = 0; j < bufSize; j++) {
    data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufSize * 0.15));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
  const noiseFilt = ctx.createBiquadFilter();
  noiseFilt.type = 'highpass';
  noiseFilt.frequency.value = 2000;
  noise.connect(noiseFilt);
  noiseFilt.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + noiseLen);

  harmonics.forEach(h => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = h.freq;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 4 + Math.random() * 2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = h.freq * 0.001;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(h.gain, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + h.decay);

    osc.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);
    osc.stop(now + h.decay + 0.1);
    lfo.stop(now + h.decay + 0.1);
  });
}

function playSoundSingingBowl() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  const baseFreq = 340;
  const beatPairs = [
    { f1: baseFreq, f2: baseFreq * 1.008, gain: 0.3, decay: 6.0 },
    { f1: baseFreq * 2.71, f2: baseFreq * 2.72, gain: 0.18, decay: 4.0 },
    { f1: baseFreq * 4.2, f2: baseFreq * 4.22, gain: 0.08, decay: 2.5 },
  ];

  const noiseLen = 0.08;
  const bufSize = ctx.sampleRate * noiseLen;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let j = 0; j < bufSize; j++) {
    data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufSize * 0.2));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.2, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
  const noiseFilt = ctx.createBiquadFilter();
  noiseFilt.type = 'bandpass';
  noiseFilt.frequency.value = 600;
  noiseFilt.Q.value = 1;
  noise.connect(noiseFilt);
  noiseFilt.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + noiseLen);

  beatPairs.forEach(pair => {
    [pair.f1, pair.f2].forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(pair.gain, now + 0.02);
      gain.gain.setValueAtTime(pair.gain, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + pair.decay);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + pair.decay + 0.1);
    });
  });
}

function playEndSound(soundId) {
  soundId = soundId || 'yinching';
  switch (soundId) {
    case 'muyu': playSoundMuyu(); break;
    case 'yinching': playSoundYinching(); break;
    case 'dingxia': playSoundDingxia(); break;
    case 'singing_bowl': playSoundSingingBowl(); break;
  }
}

function playSoundDingxia() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 丁夏 (Keisu / Inkin): small handheld brass bell with sharp clear ring
  // Higher and brighter than yinching, shorter sustain, sharper attack
  const baseFreq = 1200;

  // Two strikes: the characteristic "chin-kin" pattern
  const strikes = [
    { time: 0, freq: baseFreq, gain: 0.3 },
    { time: 0.6, freq: baseFreq * 1.5, gain: 0.25 },
  ];

  strikes.forEach(strike => {
    const t = now + strike.time;

    // Sharp metallic attack
    const noiseLen = 0.02;
    const bufSize = ctx.sampleRate * noiseLen;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < bufSize; j++) {
      data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufSize * 0.08));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseLen);
    const noiseFilt = ctx.createBiquadFilter();
    noiseFilt.type = 'highpass';
    noiseFilt.frequency.value = 4000;
    noise.connect(noiseFilt);
    noiseFilt.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + noiseLen);

    // Bright harmonics - inharmonic metallic series
    const harmonics = [
      { freq: strike.freq, gain: strike.gain, decay: 2.0 },
      { freq: strike.freq * 2.0, gain: strike.gain * 0.5, decay: 1.2 },
      { freq: strike.freq * 3.17, gain: strike.gain * 0.25, decay: 0.8 },
      { freq: strike.freq * 4.53, gain: strike.gain * 0.12, decay: 0.5 },
      { freq: strike.freq * 6.21, gain: strike.gain * 0.06, decay: 0.3 },
    ];

    harmonics.forEach(h => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = h.freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(h.gain, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, t + h.decay);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + h.decay + 0.1);
    });
  });
}
