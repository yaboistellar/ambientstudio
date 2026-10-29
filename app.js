/**
 * AMBIENT STUDIO — Silly Indie Game Lab Interactive Engine
 * Web Audio Arcade Synthesizer, Duck Booper, Silly Soundboard, Bouncy Canvas Visualizer
 */

(function () {
  'use strict';

  // --- 1. Audio Engine & Sound Synthesis (Web Audio API) ---
  let audioCtx = null;
  let isArcadeMusicActive = false;
  let musicInterval = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // --- Accessibility Screen Reader Announcer ---
  window.announceA11y = function (message) {
    let announcer = document.getElementById('a11yAnnouncer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'a11yAnnouncer';
      announcer.className = 'sr-only';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  };

  // --- Floating Comic Sound Bubbles & Confetti FX ---
  window.showComicSoundBubble = function (target, text) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.announceA11y(text.replace(/[*#]/g, ''));
      return;
    }

    const bubble = document.createElement('div');
    bubble.className = 'comic-sound-bubble';
    bubble.textContent = text;
    bubble.setAttribute('aria-hidden', 'true');

    if (target && target.getBoundingClientRect) {
      const rect = target.getBoundingClientRect();
      const rawLeft = rect.left + rect.width / 2;
      const clampPadding = 70;
      const clampedLeft = Math.max(clampPadding, Math.min(window.innerWidth - clampPadding, rawLeft));
      bubble.style.left = `${clampedLeft}px`;
      bubble.style.top = `${Math.max(15, rect.top - 12)}px`;
    } else {
      bubble.style.left = '50vw';
      bubble.style.top = '40vh';
    }

    document.body.appendChild(bubble);
    setTimeout(() => bubble.remove(), 900);
  };

  window.fireConfetti = function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#FF5E00', '#FFAE19', '#EA580C', '#FFFFFF', '#66C0F4'];
    for (let i = 0; i < 35; i++) {
      const conf = document.createElement('div');
      conf.style.position = 'fixed';
      conf.style.left = `${Math.random() * 100}vw`;
      conf.style.top = '-10px';
      conf.style.width = `${Math.random() * 8 + 6}px`;
      conf.style.height = `${Math.random() * 8 + 6}px`;
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      conf.style.zIndex = '14000';
      conf.style.pointerEvents = 'none';
      conf.style.opacity = '1';
      conf.style.transform = `rotate(${Math.random() * 360}deg)`;
      conf.style.transition = `transform ${Math.random() * 1.5 + 1.2}s cubic-bezier(0.25, 1, 0.5, 1), top ${Math.random() * 1.5 + 1.2}s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease 1.2s`;

      document.body.appendChild(conf);

      setTimeout(() => {
        conf.style.top = `${window.innerHeight + 50}px`;
        conf.style.transform = `rotate(${Math.random() * 720}deg) translateX(${(Math.random() - 0.5) * 160}px)`;
        conf.style.opacity = '0';
      }, 20);

      setTimeout(() => conf.remove(), 2600);
    }
  };

  // --- Sound 1: The Duck Quack (FM Synth + Formant) ---
  window.triggerSillyQuack = function (target) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.32);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(36, now);
    modGain.gain.setValueAtTime(140, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(4.2, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    mod.start(now);
    osc.start(now);
    mod.stop(now + 0.36);
    osc.stop(now + 0.36);

    notifyScopePulse(340, 'Duck Quack 340Hz', 1.8);
    window.showComicSoundBubble(target, 'QUACK!');
  };

  // --- Sound 2: The Spring Boing ---
  window.triggerSillyBoing = function (target) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Dual oscillator: fundamental sine for deep body + triangle for crisp spring twang
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(720, now + 0.28);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.85, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110, now);
    osc2.frequency.exponentialRampToValueAtTime(720, now + 0.28);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(0.45, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.42);
    osc2.stop(now + 0.42);

    notifyScopePulse(720, 'Spring Boing 720Hz', 2.0);
    window.showComicSoundBubble(target, 'BOING!');
  };

  // --- Sound 3: Space Laser Zap ---
  window.triggerSillyLaser = function (target) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);

    notifyScopePulse(950, 'Space Laser 950Hz', 2.2);
    window.showComicSoundBubble(target, 'PEW-PEW!');
  };

  // --- Sound 4: Quantum Mower Engine Buzz ---
  window.triggerSillyEngine = function (target) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.linearRampToValueAtTime(145, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.38);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.60, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);

    notifyScopePulse(145, 'Quantum Mower 145Hz', 1.6);
    window.showComicSoundBubble(target, 'VROOM!');
  };

  // --- Sound 5: Steam / Fanfare Chimes ---
  window.triggerChime = function () {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.45, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.48);
    });
    notifyScopePulse(1046, 'Steam Fanfare 1046Hz', 1.8);
  };

  // --- Sound 6: Fail Womp-Womp ---
  window.triggerSillyWomp = function (target) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    [
      { f: 230, t: 0, d: 0.24 },
      { f: 200, t: 0.24, d: 0.45 }
    ].forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      osc.frequency.linearRampToValueAtTime(note.f * 0.85, now + note.t + note.d);

      gain.gain.setValueAtTime(0.001, now + note.t);
      gain.gain.linearRampToValueAtTime(0.58, now + note.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.05);
    });

    notifyScopePulse(190, 'Fail Womp-Womp', 1.4);
    window.showComicSoundBubble(target, 'WOMP!');
  };

  // --- Sound 7: Victory Fanfare ---
  window.triggerSillyFanfare = function () {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.001, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.52, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.42);
    });
  };

  // --- Arcade Background Chiptune Melody Toggle ---
  function initArcadeMusic() {
    const btn = document.getElementById('soundToggleBtn');
    const label = document.getElementById('soundStateLabel');
    const emoji = document.getElementById('soundEmoji');
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (!isArcadeMusicActive) {
        startArcadeTune();
      } else {
        stopArcadeTune();
      }
    });

    function startArcadeTune() {
      const ctx = getAudioContext();
      isArcadeMusicActive = true;
      btn.classList.add('playing');
      btn.setAttribute('aria-checked', 'true');
      label.textContent = 'Arcade Tune: ON';
      emoji.textContent = '🔊';
      window.announceA11y('Arcade tune turned on');

      const notes = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 329.63, 293.66];
      let step = 0;

      musicInterval = setInterval(() => {
        if (!isArcadeMusicActive) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Authentic warm 8-bit triangle lead with audible presence
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[step % notes.length], now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);

        // Bouncy bass pulse every other beat for full arcade fullness
        if (step % 2 === 0) {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(notes[step % notes.length] / 2, now);

          bassGain.gain.setValueAtTime(0.001, now);
          bassGain.gain.linearRampToValueAtTime(0.30, now + 0.03);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

          bassOsc.connect(bassGain);
          bassGain.connect(ctx.destination);

          bassOsc.start(now);
          bassOsc.stop(now + 0.25);
        }

        step++;
      }, 260);
    }

    function stopArcadeTune() {
      isArcadeMusicActive = false;
      btn.classList.remove('playing');
      btn.setAttribute('aria-checked', 'false');
      label.textContent = 'Arcade Tune: Off';
      emoji.textContent = '🎵';
      window.announceA11y('Arcade tune turned off');
      if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
      }
    }
  }

  // --- 2. Live Goofy Waveform Canvas & Soundboard Interaction ---
  let scopeWaveFreq = 340;
  let scopeWaveIntensity = 1.0;
  let scopePhase = 0;

  function notifyScopePulse(freq, label, intensity = 1.0) {
    scopeWaveFreq = freq;
    scopeWaveIntensity = intensity;
    const lastSoundText = document.getElementById('lastSoundPlayedText');
    const liveFreqNumber = document.getElementById('liveFreqNumber');
    if (lastSoundText) lastSoundText.textContent = label;
    if (liveFreqNumber) liveFreqNumber.textContent = `${freq} Hz ACTIVE!`;
  }

  function initScopeCanvas() {
    const canvas = document.getElementById('scopeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Attach soundboard buttons
    document.getElementById('soundBtnQuack')?.addEventListener('click', () => {
      highlightPreset('soundBtnQuack');
      window.triggerSillyQuack();
      window.announceA11y('Playing sound: The Mega Duck Honk');
    });
    document.getElementById('soundBtnBoing')?.addEventListener('click', () => {
      highlightPreset('soundBtnBoing');
      window.triggerSillyBoing();
      window.announceA11y('Playing sound: The Trampoline Sprog');
    });
    document.getElementById('soundBtnLaser')?.addEventListener('click', () => {
      highlightPreset('soundBtnLaser');
      window.triggerSillyLaser();
      window.announceA11y('Playing sound: Space Cheese Blaster');
    });
    document.getElementById('soundBtnWomp')?.addEventListener('click', () => {
      highlightPreset('soundBtnWomp');
      window.triggerSillyWomp();
      window.announceA11y('Playing sound: Sad Trombone of Defeat');
    });
    document.getElementById('soundBtnEngine')?.addEventListener('click', () => {
      highlightPreset('soundBtnEngine');
      window.triggerSillyEngine();
      window.announceA11y('Playing sound: Void Pull-Cord Rev');
    });
    document.getElementById('soundBtnChime')?.addEventListener('click', () => {
      highlightPreset('soundBtnChime');
      window.triggerChime();
      window.announceA11y('Playing sound: The Steam Wishlist Arpeggio');
    });
    document.getElementById('soundBtnFanfare')?.addEventListener('click', () => {
      highlightPreset('soundBtnFanfare');
      window.triggerSillyFanfare();
      window.fireConfetti();
      window.announceA11y('Playing sound: Champion Confetti Fanfare');
    });

    // Custom Live Synthesizer Playground Controls
    let customWaveType = 'sawtooth';
    let customFreqVal = 440;

    document.querySelectorAll('.waveform-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.waveform-btn').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        customWaveType = btn.dataset.wave || 'sawtooth';
        window.announceA11y(`Selected ${customWaveType} waveform`);
      });
    });

    const freqInput = document.getElementById('freqSlider');
    const freqBadge = document.getElementById('freqSliderDisplay');
    if (freqInput && freqBadge) {
      freqInput.setAttribute('aria-valuenow', '440');
      freqInput.setAttribute('aria-valuetext', '440 Hertz');
      freqInput.addEventListener('input', (e) => {
        customFreqVal = parseInt(e.target.value, 10);
        freqBadge.textContent = `${customFreqVal} Hz`;
        freqInput.setAttribute('aria-valuenow', customFreqVal);
        freqInput.setAttribute('aria-valuetext', `${customFreqVal} Hertz`);
      });
    }

    const playCustomBtn = document.getElementById('playCustomToneBtn');
    if (playCustomBtn) {
      playCustomBtn.addEventListener('click', () => {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = customWaveType;
        osc.frequency.setValueAtTime(customFreqVal, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.58, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);

        notifyScopePulse(customFreqVal, `Custom ${customWaveType.toUpperCase()} ${customFreqVal}Hz`, 2.2);
        window.showComicSoundBubble(playCustomBtn, `*BZZT!* ${customFreqVal}Hz`);
      });
    }

    function highlightPreset(id) {
      document.querySelectorAll('.preset-card').forEach((el) => el.classList.remove('active'));
      document.getElementById(id)?.classList.add('active');
    }

    function renderScope() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center Line
      ctx.strokeStyle = 'rgba(255, 94, 0, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Bouncy Waveform
      scopePhase += 0.08;
      const centerY = h / 2;
      const baseAmp = 35 * scopeWaveIntensity;

      ctx.save();
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const norm = x / w;
        const wave =
          Math.sin(norm * 18 + scopePhase) * baseAmp +
          Math.sin(norm * 34 - scopePhase * 1.5) * (baseAmp * 0.4) +
          Math.sin(norm * 8 + scopePhase * 2) * (baseAmp * 0.3);

        const y = centerY + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#FFAE19');
      grad.addColorStop(0.5, '#FF5E00');
      grad.addColorStop(1, '#EA580C');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 3.2;
      ctx.shadowColor = '#FF5E00';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      // Decay scope intensity smoothly back to normal
      if (scopeWaveIntensity > 1.0) {
        scopeWaveIntensity -= 0.03;
      }

      requestAnimationFrame(renderScope);
    }

    renderScope();
  }

  // --- 3. Interactive Duck Booper & Confetti / Floating Badges ---
  let boopCount = 0;

  function initDuckBooper() {
    const boopBtn = document.getElementById('boopDuckBtn');
    const boopBadge = document.getElementById('boopCountBadge');
    if (!boopBtn || !boopBadge) return;

    boopBtn.addEventListener('click', (e) => {
      boopCount++;
      boopBadge.textContent = `${boopCount} boops!`;
      window.triggerSillyQuack();
      spawnFloatingToast(e.clientX, e.clientY, '+1 Quack!');
      window.announceA11y(`Duck booped! Total: ${boopCount} boops.`);
    });
  }

  // --- 4. Emergency Silly Button / Procrastination Clicker ---
  let sillyPoints = 0;
  const achievements = [
    { threshold: 1, text: '"First step into magnificent goofiness!"' },
    { threshold: 5, text: '"Certified Duck Rollerblade Whisperer"' },
    { threshold: 12, text: '"Toast Defender: Safe from the Crust "' },
    { threshold: 25, text: '"Zero-G Capybara: Unbothered Master"' },
    { threshold: 50, text: '"ULTRA-SILLY OVERLORD OF THE GALAXY!"' }
  ];

  function initEmergencyButton() {
    const btn = document.getElementById('bigSillyButton');
    const scoreDisplay = document.getElementById('toyScoreDisplay');
    const achievementDisplay = document.getElementById('toyAchievementText');
    if (!btn || !scoreDisplay) return;

    let selectedButtonSoundMode = 'random';
    document.querySelectorAll('.btn-mode-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.btn-mode-pill').forEach((p) => {
          p.classList.remove('active');
          p.setAttribute('aria-checked', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-checked', 'true');
        selectedButtonSoundMode = pill.dataset.mode || 'random';
        window.announceA11y(`Sound mode changed to ${pill.textContent.trim()}`);
      });
    });

    btn.addEventListener('click', (e) => {
      sillyPoints++;
      scoreDisplay.textContent = sillyPoints;
      window.announceA11y(`Silly point added. Total: ${sillyPoints} points.`);

      // Play sound based on mode
      if (selectedButtonSoundMode === 'quack') {
        window.triggerSillyQuack();
      } else if (selectedButtonSoundMode === 'boing') {
        window.triggerSillyBoing();
      } else if (selectedButtonSoundMode === 'laser') {
        window.triggerSillyLaser();
      } else if (selectedButtonSoundMode === 'mower') {
        window.triggerSillyEngine();
      } else {
        const rand = Math.random();
        if (rand < 0.25) window.triggerSillyBoing();
        else if (rand < 0.50) window.triggerSillyQuack();
        else if (rand < 0.75) window.triggerSillyLaser();
        else window.triggerSillyEngine();
      }

      // Check achievement text
      for (let i = achievements.length - 1; i >= 0; i--) {
        if (sillyPoints >= achievements[i].threshold) {
          if (achievementDisplay) achievementDisplay.textContent = achievements[i].text;
          break;
        }
      }

      // Check achievement cards ladder
      document.querySelectorAll('.achievement-card').forEach((card) => {
        const req = parseInt(card.dataset.threshold, 10);
        if (sillyPoints >= req && !card.classList.contains('unlocked')) {
          card.classList.add('unlocked');
          window.fireConfetti();
          const title = card.querySelector('.achievement-title')?.textContent || 'Achievement';
          window.announceA11y(`Achievement unlocked: ${title}!`);
        }
      });

      // Visual floating bonus
      const funEmojis = ['', '', '+1', '', '', '+1'];
      const picked = funEmojis[Math.floor(Math.random() * funEmojis.length)];
      spawnFloatingToast(e.clientX, e.clientY, `+1 SILLY ${picked}`);
    });

    document.getElementById('panicResetBtn')?.addEventListener('click', () => {
      sillyPoints = 0;
      scoreDisplay.textContent = '0';
      if (achievementDisplay) achievementDisplay.textContent = '"Back to zero! Press again to restart..."';
      document.querySelectorAll('.achievement-card').forEach((card) => card.classList.remove('unlocked'));
      window.triggerSillyWomp();
      window.announceA11y('Silly score reset to zero.');
    });
  }

  function spawnFloatingToast(x, y, text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.left = `${x || window.innerWidth / 2}px`;
    el.style.top = `${y || window.innerHeight / 2}px`;
    el.style.transform = 'translate(-50%, -50%)';
    el.style.color = '#FFAE19';
    el.style.fontFamily = "'Outfit', sans-serif";
    el.style.fontWeight = '800';
    el.style.fontSize = '1.3rem';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    el.style.textShadow = '0 2px 10px rgba(0,0,0,0.8)';

    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%, -100px) scale(1.2)';
      el.style.opacity = '0';
    });

    setTimeout(() => {
      el.remove();
    }, 850);
  }

  // --- 5. Ambient Embers Background Canvas ---
  function initAmbientCanvas() {
    const canvas = document.getElementById('ambientCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    const count = 30;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Ember {
      constructor() {
        this.reset(true);
      }
      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 15;
        this.size = Math.random() * 2.8 + 1;
        this.speedY = Math.random() * 0.45 + 0.15;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.4 + 0.1;
      }
      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        if (this.y < -10) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 110, 0, ${this.alpha})`;
        ctx.shadowColor = '#FF5E00';
        ctx.shadowBlur = 8;
        ctx.fill();
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(new Ember());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  // --- 6. Form Submission Handler (Live FormSubmit.co Integration) ---
  const RECIPIENT_EMAIL = 'tanshiralmusnad80@gmail.com';

  window.handleInquirySubmit = async function (e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const form = document.getElementById('inquiryForm');
    const submitBtn = document.getElementById('submitInquiryBtn');
    const successBanner = document.getElementById('formSuccessBanner');
    const errorBanner = document.getElementById('formErrorBanner');

    if (!form || !submitBtn) return;

    // Validate inputs using HTML5 validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Hide any previously displayed banners
    if (successBanner) successBanner.classList.add('hidden');
    if (errorBanner) errorBanner.classList.add('hidden');

    // Extract values across form schemas
    const nameInput = document.getElementById('clientName') || document.getElementById('contactName');
    const emailInput = document.getElementById('clientEmail') || document.getElementById('contactEmail');
    const topicSelect = document.getElementById('projectType') || document.getElementById('contactTopic');
    const locationInput = document.getElementById('projectLocation');
    const messageInput = document.getElementById('projectMessage') || document.getElementById('contactMessage');

    const senderName = nameInput ? nameInput.value.trim() : 'Anonymous Gamer';
    const senderEmail = emailInput ? emailInput.value.trim() : '';
    const topic = topicSelect ? (topicSelect.options[topicSelect.selectedIndex]?.text || topicSelect.value) : 'General Silly Note';
    const planet = locationInput ? locationInput.value.trim() : 'Earth';
    const messageText = messageInput ? messageInput.value.trim() : '';

    const originalBtnSpan = submitBtn.querySelector('span');
    const originalText = originalBtnSpan ? originalBtnSpan.textContent : 'Launch Message Into Space';

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    if (originalBtnSpan) {
      originalBtnSpan.textContent = 'Launching Pigeon Into Space...';
    }

    window.triggerSillyLaser();

    const payload = {
      name: senderName,
      email: senderEmail,
      topic: topic,
      planet: planet,
      message: messageText,
      timestamp: new Date().toISOString()
    };

    // Save to localStorage so messages are never lost
    try {
      const stored = JSON.parse(localStorage.getItem('ambient_messages') || '[]');
      stored.unshift(payload);
      localStorage.setItem('ambient_messages', JSON.stringify(stored.slice(0, 50)));
    } catch (err) {
      console.warn('LocalStorage save note:', err);
    }

    // Arcade feedback delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Non-blocking background sync attempt to FormSubmit
    try {
      fetch('https://formsubmit.co/ajax/' + RECIPIENT_EMAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ ...payload, _subject: '[Ambient Studio] Transmission from ' + senderName })
      }).catch(() => {});
    } catch (_) {}

    // Compose mailto dispatch directly to tanshiralmusnad80@gmail.com
    const mailSubject = encodeURIComponent('[Ambient Studio] ' + topic + ' from ' + senderName);
    const mailBody = encodeURIComponent(
      'Gamer Tag: ' + senderName + '\n' +
      'Sender Email: ' + senderEmail + '\n' +
      'Home Planet: ' + planet + '\n' +
      'Topic: ' + topic + '\n\n' +
      'Message:\n' + messageText
    );
    const mailtoUrl = 'mailto:' + RECIPIENT_EMAIL + '?subject=' + mailSubject + '&body=' + mailBody;

    // Launch mail client to send email
    try {
      window.location.href = mailtoUrl;
    } catch (_) {}

    // Show success!
    form.reset();
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    if (originalBtnSpan) {
      originalBtnSpan.textContent = originalText;
    }

    if (successBanner) {
      successBanner.classList.remove('hidden');
      successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    window.fireConfetti();
    window.triggerSillyFanfare();
    window.showToast('Message dispatched to ' + RECIPIENT_EMAIL + '!', '✓');
    window.announceA11y('Message successfully launched to ' + RECIPIENT_EMAIL);
  };

  // --- 7. Back To Top Button ---
  function initBackToTop() {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      window.triggerSillyBoing();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- 8. Games Catalogue Filter & Search (games.html) ---
  function initGamesCatalogueFilter() {
    const filterPills = document.querySelectorAll('.filter-pill');
    const searchInput = document.getElementById('gameSearchInput');
    const gameCards = document.querySelectorAll('.game-full-card');
    const noResults = document.getElementById('noResultsBanner');

    if (!filterPills.length || !gameCards.length) return;

    let activeFilter = 'all';
    let searchTerm = '';

    function applyFilter() {
      let visibleCount = 0;
      gameCards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        const text = card.textContent.toLowerCase();

        const matchesCat = activeFilter === 'all' || cat === activeFilter;
        const matchesSearch = !searchTerm || title.includes(searchTerm) || text.includes(searchTerm);

        if (matchesCat && matchesSearch) {
          card.style.display = 'grid';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (noResults) {
        if (visibleCount === 0) noResults.classList.remove('hidden');
        else noResults.classList.add('hidden');
      }

      window.announceA11y(`Showing ${visibleCount} silly game${visibleCount === 1 ? '' : 's'}.`);
    }

    filterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        filterPills.forEach((p) => {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
        activeFilter = pill.getAttribute('data-filter');
        window.triggerSillyBoing();
        applyFilter();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.trim().toLowerCase();
        applyFilter();
      });
    }
  }

  // --- 9. Interactive Modals Suite (Wishlist, Demo, Playtest, Toast) ---
  let lastActiveModalTrigger = null;

  window.openModal = function (modalId) {
    lastActiveModalTrigger = document.activeElement;
    window.closeAllModals(false);
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      const titleEl = modal.querySelector('h2, h3');
      if (titleEl) {
        window.announceA11y(`Opened dialog: ${titleEl.textContent.trim()}`);
      }

      setTimeout(() => {
        const focusable = modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }, 60);
    }
  };

  window.closeAllModals = function (restoreFocus = true) {
    let closedAny = false;
    document.querySelectorAll('.ambient-modal-overlay').forEach((modal) => {
      if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        closedAny = true;
      }
    });
    document.body.style.overflow = '';
    stopArcadeEngine();
    if (closedAny) {
      window.announceA11y('Dialog closed');
    }
    if (restoreFocus && lastActiveModalTrigger && typeof lastActiveModalTrigger.focus === 'function') {
      lastActiveModalTrigger.focus();
      lastActiveModalTrigger = null;
    }
  };

  window.showToast = function (msg, icon = '') {
    const toast = document.getElementById('ambientToast');
    const iconEl = document.getElementById('toastIcon');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;

    msgEl.textContent = msg;
    if (iconEl) iconEl.textContent = icon;
    toast.classList.add('active');
    window.announceA11y(msg);

    setTimeout(() => {
      toast.classList.remove('active');
    }, 2800);
  };

  window.scrollToInquiry = function () {
    const section = document.getElementById('inquiry');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      const input = document.getElementById('clientName');
      if (input) setTimeout(() => input.focus(), 500);
    }
  };

  // Steam Wishlist
  let wishlistCount = 48292;
  window.openWishlistModal = function (gameTitle) {
    const nameEl = document.getElementById('wishlistGameName');
    const counterEl = document.getElementById('wishlistCounterNumber');
    if (nameEl) nameEl.textContent = gameTitle || 'Duck Drift: Speedway Mayhem';

    wishlistCount++;
    if (counterEl) counterEl.textContent = wishlistCount.toLocaleString();

    window.triggerChime();
    window.fireConfetti();
    window.openModal('wishlistModal');
    window.showToast(` Added "${gameTitle}" to Steam Wishlist! (+10,000 Hype)`, '');
  };

  window.copyWishlistLink = function () {
    const btn = document.getElementById('copyShareBtn');
    const url = window.location.origin + '/games.html';
    navigator.clipboard.writeText(url)
      .then(() => {
        if (btn) btn.querySelector('span').textContent = ' Link Copied!';
        window.showToast('Steam share link copied to clipboard!', '');
        setTimeout(() => {
          if (btn) btn.querySelector('span').textContent = 'Copy Share Link';
        }, 2000);
      })
      .catch(() => {
        if (btn) btn.querySelector('span').textContent = ' Link Ready!';
      });
  };

  // Standalone Demo Package Generator
  let currentDemoTitle = 'Capybara Zero-G';
  window.downloadGameDemo = function (gameTitle) {
    currentDemoTitle = gameTitle || 'Capybara Zero-G';
    window.openModal('demoModal');

    const targetEl = document.getElementById('demoTargetTitle');
    const fill = document.getElementById('demoProgressFill');
    const label = document.getElementById('demoStatusLabel');
    const directBtn = document.getElementById('directDemoFileBtn');

    if (targetEl) targetEl.textContent = `${currentDemoTitle}: Standalone Demo`;
    if (directBtn) directBtn.style.display = 'none';
    if (fill) fill.style.width = '0%';
    if (label) label.textContent = 'Gathering silly assets...';

    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      if (fill) fill.style.width = `${progress}%`;

      if (progress === 50 && label) label.textContent = 'Synthesizing chiptune audio...';
      if (progress === 75 && label) label.textContent = 'Injecting unhinged physics...';
      if (progress >= 100) {
        clearInterval(interval);
        if (label) label.textContent = ' Standalone Demo Packaged!';
        if (directBtn) directBtn.style.display = 'inline-flex';
        window.triggerChime();
        window.triggerDirectFileDownload(currentDemoTitle);
        window.showToast(`Downloaded ${currentDemoTitle} demo build!`, '');
      }
    }, 220);
  };

  window.triggerDirectFileDownload = function (gameTitle) {
    const title = gameTitle || currentDemoTitle || 'AmbientStudio_Demo';
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    const demoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ambient Studio — ${title} Demo Build</title>
  <style>
    body { background: #08080a; color: #fff; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    h1 { color: #ff5e00; font-size: 2.2rem; margin: 0.5rem 0; }
    p { color: #b2b2c0; font-size: 1.1rem; max-width: 500px; line-height: 1.5; }
    .badge { background: #16151b; border: 2px solid #ff5e00; padding: 0.5rem 1.2rem; border-radius: 8px; color: #ffae19; font-weight: bold; margin-bottom: 1rem; }
    .play-btn { background: #ff5e00; color: #fff; border: none; padding: 0.8rem 1.8rem; font-size: 1.1rem; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 1.5rem; transition: transform 0.2s; }
    .play-btn:hover { transform: scale(1.05); background: #ff7a1a; }
  </style>
</head>
<body>
  <div class="badge">AMBIENT STUDIO STANDALONE OFFLINE DEMO</div>
  <h1>${title}</h1>
  <p>Thank you for downloading our silly indie game demo! Built with 100% goofy passion, zero microtransactions, and unhinged physics.</p>
  <button class="play-btn" onclick="alert('Quack! Sir Waddlesworth is ready to roll!')">START OFFLINE SESSION</button>
</body>
</html>`;
    const blob = new Blob([demoHtml], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${safeTitle}_Demo.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Playtest VIP Pass
  window.openPlaytestModal = function (gameTitle) {
    window.openModal('playtestModal');
    const formView = document.getElementById('playtestFormView');
    const passView = document.getElementById('playtestPassView');
    const assigned = document.getElementById('testerPassGame');
    const input = document.getElementById('playtestTagInput');

    if (formView) formView.style.display = 'block';
    if (passView) passView.style.display = 'none';
    if (assigned) assigned.textContent = gameTitle || 'Lawnmower in The Quantum Void';
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 200);
    }
  };

  window.generateTesterPass = function () {
    const input = document.getElementById('playtestTagInput');
    const tag = (input && input.value.trim()) || `Cosmic Pilot #${Math.floor(Math.random() * 899 + 100)}`;
    const passCode = `#SILLY-${Math.floor(1000 + Math.random() * 9000)}`;

    const nameEl = document.getElementById('testerPassName');
    const idEl = document.getElementById('testerPassId');
    const formView = document.getElementById('playtestFormView');
    const passView = document.getElementById('playtestPassView');

    if (nameEl) nameEl.textContent = tag;
    if (idEl) idEl.textContent = passCode;
    if (formView) formView.style.display = 'none';
    if (passView) passView.style.display = 'block';

    window.triggerSillyFanfare();
    window.fireConfetti();
    window.showToast(`Welcome to Playtest Squad, ${tag}!`, '');
  };

  window.copyTesterPassId = function () {
    const idEl = document.getElementById('testerPassId');
    const code = idEl ? idEl.textContent : '#SILLY-PASS';
    navigator.clipboard.writeText(code).then(() => {
      window.showToast(`Tester Pass ${code} copied!`, '');
    });
  };

  // Modal Accessibility: Escape key, Backdrop click, and Focus Trap
  document.addEventListener('keydown', (e) => {
    const activeModal = document.querySelector('.ambient-modal-overlay.active');
    if (!activeModal) return;

    if (e.key === 'Escape') {
      window.closeAllModals();
      return;
    }

    if (e.key === 'Tab') {
      const focusables = Array.from(activeModal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]'
      )).filter((el) => el.offsetParent !== null);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  document.querySelectorAll('.ambient-modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) window.closeAllModals();
    });
  });

  // --- 10. Retro Silly Arcade Cabinet Mini-Game Engine ---
  let arcadeRunning = false;
  let arcadeGameState = 'READY'; // 'READY' | 'PLAYING' | 'GAMEOVER'
  let activeArcadeGame = 'duck';
  let arcadeAnimFrame = null;
  let arcadeScore = 0;
  let arcadeHighScore = parseInt(localStorage.getItem('ambient_hi_score') || '350', 10);
  let arcadeLives = 3;
  let invulnTimer = 0;
  let gameTick = 0;
  let floatingScores = [];

  // Input state
  let keys = { left: false, right: false, action: false };

  // Game 1: Duck Drift State
  let duckX = 320;
  let duckRoadOffset = 0;
  let duckItems = [];
  let duckShake = 0;

  // Game 2: Toast Jump State
  let toastY = 220;
  let toastVy = 0;
  let toastOnGround = true;
  let toastObstacles = [];
  let toastGroundX = 0;

  // Game 3: Capybara Zero-G State
  let capyY = 140;
  let capyVy = 0;
  let capyItems = [];
  let capyStars = [];

  function initArcadeControlsUI() {
    const container = document.getElementById('arcadeActionButtons');
    if (!container) return;
    container.innerHTML = '';

    if (activeArcadeGame === 'duck') {
      container.innerHTML = `
        <button class="arcade-ctrl-btn" onmousedown="window.arcadeSteerLeft(event)" onmouseup="window.arcadeStopSteer(event)" ontouchstart="window.arcadeSteerLeft(event)" ontouchend="window.arcadeStopSteer(event)">◀ Steer Left</button>
        <button class="arcade-ctrl-btn" onmousedown="window.arcadeSteerRight(event)" onmouseup="window.arcadeStopSteer(event)" ontouchstart="window.arcadeSteerRight(event)" ontouchend="window.arcadeStopSteer(event)">Steer Right ▶</button>
      `;
    } else if (activeArcadeGame === 'toast') {
      container.innerHTML = `
        <button class="arcade-ctrl-btn arcade-ctrl-btn-primary" onclick="window.arcadeJump(event)" ontouchstart="window.arcadeJump(event)">Jump! (Space)</button>
      `;
    } else if (activeArcadeGame === 'capybara') {
      container.innerHTML = `
        <button class="arcade-ctrl-btn arcade-ctrl-btn-primary" onmousedown="window.arcadeBoost(event)" ontouchstart="window.arcadeBoost(event)">Thruster (Space)</button>
      `;
    }
  }

  function startPlayingIfReady() {
    if (arcadeGameState === 'READY') {
      arcadeGameState = 'PLAYING';
      invulnTimer = 120; // 2 seconds safety shield on start
      updateArcadeHUD();
      return true;
    }
    if (arcadeGameState === 'GAMEOVER') {
      window.restartCurrentGame();
      arcadeGameState = 'PLAYING';
      invulnTimer = 120;
      updateArcadeHUD();
      return true;
    }
    return false;
  }

  window.arcadeSteerLeft = function (e) {
    if (e && e.cancelable) e.preventDefault();
    startPlayingIfReady();
    keys.left = true;
  };
  window.arcadeSteerRight = function (e) {
    if (e && e.cancelable) e.preventDefault();
    startPlayingIfReady();
    keys.right = true;
  };
  window.arcadeStopSteer = function (e) {
    if (e && e.cancelable) e.preventDefault();
    keys.left = false;
    keys.right = false;
  };
  window.arcadeJump = function (e) {
    if (e && e.cancelable) e.preventDefault();
    startPlayingIfReady();
    if (activeArcadeGame === 'toast' && toastOnGround && arcadeGameState === 'PLAYING') {
      toastVy = -11.5;
      toastOnGround = false;
      window.triggerSillyBoing();
    }
  };
  window.arcadeBoost = function (e) {
    if (e && e.cancelable) e.preventDefault();
    startPlayingIfReady();
    if (activeArcadeGame === 'capybara' && arcadeGameState === 'PLAYING') {
      capyVy = -4.5;
      window.triggerSillyLaser();
    }
  };

  // Keyboard navigation for Arcade
  window.addEventListener('keydown', (e) => {
    if (!arcadeRunning) return;
    if (e.key === 'ArrowLeft' || e.key === 'KeyA' || e.code === 'KeyA') {
      startPlayingIfReady();
      keys.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'KeyD' || e.code === 'KeyD') {
      startPlayingIfReady();
      keys.right = true;
    }
    if (e.key === ' ' || e.code === 'Space' || e.key === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      startPlayingIfReady();
      if (activeArcadeGame === 'toast') window.arcadeJump();
      if (activeArcadeGame === 'capybara') window.arcadeBoost();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'KeyA' || e.code === 'KeyA') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'KeyD' || e.code === 'KeyD') keys.right = false;
  });

  window.launchArcadeGame = function (gameType = 'duck') {
    window.openModal('arcadeModal');
    window.switchArcadeGame(gameType);
  };

  window.switchArcadeGame = function (gameType) {
    activeArcadeGame = gameType;
    document.querySelectorAll('.arcade-nav-tab').forEach((tab) => {
      if (tab.getAttribute('data-game') === gameType) tab.classList.add('active');
      else tab.classList.remove('active');
    });

    initArcadeControlsUI();
    window.restartCurrentGame();
  };

  window.restartCurrentGame = function () {
    arcadeScore = 0;
    arcadeLives = 3;
    arcadeGameState = 'READY';
    invulnTimer = 0;
    duckShake = 0;
    gameTick = 0;
    keys.left = false;
    keys.right = false;
    floatingScores = [];

    // Reset game 1 (Duck)
    duckX = 320;
    duckItems = [];
    duckItems.push({ x: 320, y: -90, type: 'pizza', collected: false });
    duckItems.push({ x: 200, y: -260, type: 'hazard', collected: false });
    duckItems.push({ x: 440, y: -420, type: 'pizza', collected: false });
    duckItems.push({ x: 320, y: -580, type: 'hazard', collected: false });

    // Reset game 2 (Toast)
    toastY = 220;
    toastVy = 0;
    toastOnGround = true;
    toastObstacles = [];
    toastObstacles.push({ x: 480, y: 190, type: 'butter', collected: false });
    toastObstacles.push({ x: 720, y: 228, type: 'knife', collected: false });

    // Reset game 3 (Capybara)
    capyY = 140;
    capyVy = 0;
    capyItems = [];
    capyStars = [];
    for (let i = 0; i < 40; i++) {
      capyStars.push({ x: Math.random() * 640, y: Math.random() * 300, s: Math.random() * 2 + 1 });
    }
    capyItems.push({ x: 460, y: 130, type: 'cheese', collected: false });
    capyItems.push({ x: 740, y: 70, type: 'asteroid', collected: false });

    updateArcadeHUD();
    startArcadeEngine();
  };

  function spawnDuckEntity() {
    const lanes = [200, 320, 440];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const isPizza = Math.random() > 0.42;
    duckItems.push({
      x: lane,
      y: -60,
      type: isPizza ? 'pizza' : 'hazard',
      collected: false
    });
  }

  function spawnToastObstacle(initialX) {
    const isButter = Math.random() > 0.45;
    toastObstacles.push({
      x: initialX,
      y: isButter ? 185 : 228,
      type: isButter ? 'butter' : 'knife',
      collected: false
    });
  }

  function spawnCapyEntity(initialX) {
    const isCheese = Math.random() > 0.45;
    capyItems.push({
      x: initialX,
      y: Math.random() * 210 + 35,
      type: isCheese ? 'cheese' : 'asteroid',
      collected: false
    });
  }

  function addFloatingScore(x, y, text, color = '#FFAE19') {
    floatingScores.push({ x, y, text, color, vy: -1.6, alpha: 1.0 });
  }

  function updateArcadeHUD() {
    const scoreEl = document.getElementById('arcadeScore');
    const highEl = document.getElementById('arcadeHighScore');
    const livesEl = document.getElementById('arcadeLives');
    const statusEl = document.getElementById('arcadeStatus');

    if (scoreEl) scoreEl.textContent = String(arcadeScore).padStart(4, '0');
    if (highEl) highEl.textContent = String(arcadeHighScore).padStart(4, '0');

    if (livesEl) {
      if (arcadeLives === 3) livesEl.textContent = '3 / 3 LIVES';
      else if (arcadeLives === 2) livesEl.textContent = '2 / 3 LIVES';
      else if (arcadeLives === 1) livesEl.textContent = '1 / 3 LIVES';
      else livesEl.textContent = '0 / 3 LIVES';
    }

    if (statusEl) {
      if (arcadeGameState === 'READY') statusEl.textContent = 'READY (START)';
      else if (arcadeGameState === 'GAMEOVER') statusEl.textContent = 'GAME OVER';
      else statusEl.textContent = 'PLAYING';
    }
  }

  function startArcadeEngine() {
    if (arcadeRunning) return;
    arcadeRunning = true;
    const canvas = document.getElementById('arcadeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Attach click and touch to start / steer
    function handleArcadePointerInput(clientX) {
      if (startPlayingIfReady()) return;
      if (activeArcadeGame === 'toast') {
        window.arcadeJump();
      } else if (activeArcadeGame === 'capybara') {
        window.arcadeBoost();
      } else if (activeArcadeGame === 'duck') {
        const rect = canvas.getBoundingClientRect();
        const clickX = ((clientX - rect.left) / rect.width) * canvas.width;
        if (clickX < duckX) duckX -= 50;
        else duckX += 50;
        duckX = Math.max(160, Math.min(480, duckX));
      }
    }

    canvas.onclick = function (e) {
      handleArcadePointerInput(e.clientX);
    };

    canvas.addEventListener('touchstart', function (e) {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      if (touch) handleArcadePointerInput(touch.clientX);
    }, { passive: false });

    function loop() {
      if (!arcadeRunning) return;
      renderArcadeFrame(ctx, canvas);
      arcadeAnimFrame = requestAnimationFrame(loop);
    }
    loop();
  }

  function stopArcadeEngine() {
    arcadeRunning = false;
    keys.left = false;
    keys.right = false;
    if (arcadeAnimFrame) {
      cancelAnimationFrame(arcadeAnimFrame);
      arcadeAnimFrame = null;
    }
  }

  function renderArcadeFrame(ctx, canvas) {
    const W = canvas.width;
    const H = canvas.height;
    gameTick++;

    if (invulnTimer > 0) invulnTimer--;

    ctx.save();

    // Camera shake
    if (duckShake > 0) {
      ctx.translate((Math.random() - 0.5) * duckShake, (Math.random() - 0.5) * duckShake);
      duckShake *= 0.86;
      if (duckShake < 0.5) duckShake = 0;
    }

    ctx.fillStyle = '#08080A';
    ctx.fillRect(0, 0, W, H);

    if (activeArcadeGame === 'duck') {
      renderDuckGame(ctx, W, H);
    } else if (activeArcadeGame === 'toast') {
      renderToastGame(ctx, W, H);
    } else if (activeArcadeGame === 'capybara') {
      renderCapybaraGame(ctx, W, H);
    }

    // Render Floating Text Popups
    floatingScores.forEach((fs) => {
      fs.y += fs.vy;
      fs.alpha -= 0.024;
      ctx.save();
      ctx.globalAlpha = Math.max(0, fs.alpha);
      ctx.fillStyle = fs.color;
      ctx.font = '800 15px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(fs.text, fs.x, fs.y);
      ctx.restore();
    });
    floatingScores = floatingScores.filter((fs) => fs.alpha > 0);

    // Ready Prompt Overlay
    if (arcadeGameState === 'READY') {
      const pulse = Math.sin(gameTick * 0.08) * 0.15 + 0.85;
      ctx.fillStyle = 'rgba(8, 8, 12, 0.72)';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = `rgba(255, 94, 0, ${pulse * 0.3})`;
      ctx.fillRect(100, 95, 440, 85);
      ctx.strokeStyle = '#FF5E00';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(100, 95, 440, 85);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 20px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CLICK OR PRESS SPACE TO START!', 320, 132);

      ctx.fillStyle = '#FFAE19';
      ctx.font = '600 13px "Outfit", sans-serif';
      const promptText = activeArcadeGame === 'duck'
        ? 'Controls: Arrow Keys or [◀] [▶] to steer Sir Waddlesworth'
        : activeArcadeGame === 'toast'
        ? 'Controls: Press [SPACE] or Jump button to leap over knives!'
        : 'Controls: Press [SPACE] or Thruster to navigate zero gravity!';
      ctx.fillText(promptText, 320, 160);
    }

    // Game Over Overlay
    if (arcadeGameState === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(4, 4, 4, 0.88)';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#FF5E00';
      ctx.font = '800 26px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SILLY GAME OVER!', W / 2, H / 2 - 20);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 15px "Outfit", sans-serif';
      ctx.fillText(`Final Score: ${arcadeScore} pts    High Score: ${arcadeHighScore} pts`, W / 2, H / 2 + 12);

      ctx.fillStyle = '#FFAE19';
      ctx.font = '700 14px "Space Grotesk", sans-serif';
      ctx.fillText('Click anywhere or press [SPACE] to Play Again!', W / 2, H / 2 + 48);
    }

    ctx.restore();
  }

  // --- Game 1: Duck Drift Renderer ---
  function renderDuckGame(ctx, W, H) {
    const dy = 238; // Duck vertical position

    // Road boundaries
    ctx.fillStyle = '#100F15';
    ctx.beginPath();
    ctx.moveTo(130, 0);
    ctx.lineTo(510, 0);
    ctx.lineTo(540, H);
    ctx.lineTo(100, H);
    ctx.closePath();
    ctx.fill();

    // Curbs & Border Lines
    ctx.strokeStyle = '#FF5E00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(130, 0); ctx.lineTo(100, H);
    ctx.moveTo(510, 0); ctx.lineTo(540, H);
    ctx.stroke();

    // Scrolling Road Markings
    if (arcadeGameState === 'PLAYING') {
      duckRoadOffset = (duckRoadOffset + 6.5) % 40;
    }
    ctx.strokeStyle = 'rgba(255, 174, 25, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 18]);
    ctx.beginPath();
    ctx.moveTo(250, duckRoadOffset - 40); ctx.lineTo(240, H);
    ctx.moveTo(390, duckRoadOffset - 40); ctx.lineTo(400, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Update Duck position
    if (arcadeGameState === 'PLAYING') {
      if (keys.left) duckX -= 6.5;
      if (keys.right) duckX += 6.5;
      duckX = Math.max(150, Math.min(490, duckX));
    }

    // Update & Draw items
    if (arcadeGameState === 'PLAYING') {
      duckItems.forEach((item) => {
        item.y += 6.0;

        // Collision check
        if (!item.collected && Math.abs(item.y - dy) < 26 && Math.abs(item.x - duckX) < 36) {
          item.collected = true;
          if (item.type === 'pizza') {
            arcadeScore += 100;
            if (arcadeScore > arcadeHighScore) {
              arcadeHighScore = arcadeScore;
              localStorage.setItem('ambient_hi_score', arcadeHighScore);
            }
            addFloatingScore(item.x, item.y, '+100', '#FFAE19');
            window.triggerSillyQuack();
          } else {
            if (invulnTimer <= 0) {
              arcadeLives--;
              invulnTimer = 90; // 1.5s invulnerability
              duckShake = 16;
              addFloatingScore(duckX, dy - 20, 'OUCH! -1 LIFE', '#EF4444');
              window.triggerSillyWomp();
              if (arcadeLives <= 0) {
                arcadeGameState = 'GAMEOVER';
              }
            }
          }
          updateArcadeHUD();
        }
      });

      // Filter and respawn
      duckItems = duckItems.filter((it) => it.y < H + 60);
      if (duckItems.length < 4) {
        spawnDuckEntity();
      }
    }

    // Draw entities
    duckItems.forEach((it) => {
      if (it.collected) return;
      if (it.type === 'pizza') {
        // Pizza slice
        ctx.fillStyle = '#FFAE19';
        ctx.beginPath();
        ctx.moveTo(it.x, it.y - 12);
        ctx.lineTo(it.x - 14, it.y + 12);
        ctx.lineTo(it.x + 14, it.y + 12);
        ctx.closePath();
        ctx.fill();

        // Crust & Pepperoni dots
        ctx.strokeStyle = '#EA580C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(it.x - 14, it.y + 12);
        ctx.lineTo(it.x + 14, it.y + 12);
        ctx.stroke();

        ctx.fillStyle = '#C2410C';
        ctx.beginPath();
        ctx.arc(it.x, it.y + 2, 3, 0, Math.PI * 2);
        ctx.arc(it.x - 5, it.y + 7, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Hazard Traffic Cone
        ctx.fillStyle = '#FF5E00';
        ctx.beginPath();
        ctx.moveTo(it.x, it.y - 14);
        ctx.lineTo(it.x - 12, it.y + 12);
        ctx.lineTo(it.x + 12, it.y + 12);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(it.x - 8, it.y - 2, 16, 4);
      }
    });

    // Draw Sir Waddlesworth (Duck)
    ctx.save();
    // Blinking effect when invulnerable
    if (invulnTimer > 0 && Math.floor(gameTick / 6) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Flame Trail from skates
    if (arcadeGameState === 'PLAYING') {
      ctx.fillStyle = '#FF5E00';
      ctx.beginPath();
      ctx.arc(duckX - 10, dy + 22, 5, 0, Math.PI * 2);
      ctx.arc(duckX + 10, dy + 22, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFAE19';
      ctx.beginPath();
      ctx.arc(duckX - 10, dy + 22, 2.5, 0, Math.PI * 2);
      ctx.arc(duckX + 10, dy + 22, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Skates
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(duckX - 18, dy + 16, 14, 6);
    ctx.fillRect(duckX + 4, dy + 16, 14, 6);

    // Duck Body
    ctx.fillStyle = '#FFCC00';
    ctx.beginPath();
    ctx.ellipse(duckX, dy, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Duck Head
    ctx.beginPath();
    ctx.arc(duckX, dy - 13, 14, 0, Math.PI * 2);
    ctx.fill();

    // Pixel Sunglasses
    ctx.fillStyle = '#040404';
    ctx.fillRect(duckX - 11, dy - 16, 22, 7);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(duckX - 10, dy - 16, 3, 2);
    ctx.fillRect(duckX + 2, dy - 16, 3, 2);

    // Orange Duck Beak
    ctx.fillStyle = '#FF5E00';
    ctx.beginPath();
    ctx.ellipse(duckX, dy - 8, 9, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- Game 2: Toast Jump Renderer ---
  function renderToastGame(ctx, W, H) {
    const groundY = 248;

    // Kitchen counter table surface
    if (arcadeGameState === 'PLAYING') {
      toastGroundX = (toastGroundX - 5.5) % 40;
    }
    ctx.fillStyle = '#18171F';
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.strokeStyle = '#FF5E00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    // Kitchen tiles pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    for (let x = toastGroundX; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Update Toast Physics
    if (arcadeGameState === 'PLAYING') {
      toastY += toastVy;
      toastVy += 0.65; // Gravity
      if (toastY >= groundY - 24) {
        toastY = groundY - 24;
        toastVy = 0;
        toastOnGround = true;
      }

      // Update Obstacles
      toastObstacles.forEach((obs) => {
        obs.x -= 5.5;

        // Collision check
        if (!obs.collected && Math.abs(obs.x - 120) < 32 && Math.abs(obs.y - toastY) < 30) {
          obs.collected = true;
          if (obs.type === 'butter') {
            arcadeScore += 100;
            if (arcadeScore > arcadeHighScore) {
              arcadeHighScore = arcadeScore;
              localStorage.setItem('ambient_hi_score', arcadeHighScore);
            }
            addFloatingScore(obs.x, obs.y, '+100', '#FFAE19');
            window.triggerSillyBoing();
          } else {
            if (invulnTimer <= 0) {
              arcadeLives--;
              invulnTimer = 90;
              duckShake = 16;
              addFloatingScore(120, toastY - 20, 'CRISPY! -1 LIFE', '#EF4444');
              window.triggerSillyWomp();
              if (arcadeLives <= 0) arcadeGameState = 'GAMEOVER';
            }
          }
          updateArcadeHUD();
        }
      });

      toastObstacles = toastObstacles.filter((o) => o.x > -50);
      if (toastObstacles.length < 3) {
        spawnToastObstacle(W + Math.random() * 200 + 120);
      }
    }

    // Draw Obstacles
    toastObstacles.forEach((obs) => {
      if (obs.collected) return;
      if (obs.type === 'butter') {
        // Golden butter pat
        ctx.fillStyle = '#FFAE19';
        ctx.fillRect(obs.x - 12, obs.y - 10, 24, 18);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obs.x - 12, obs.y - 10, 24, 18);
      } else {
        // Angry fiery toaster spike / knife
        ctx.fillStyle = '#EA580C';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y - 28);
        ctx.lineTo(obs.x - 12, obs.y + 15);
        ctx.lineTo(obs.x + 12, obs.y + 15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFAE19';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y - 18);
        ctx.lineTo(obs.x - 6, obs.y + 15);
        ctx.lineTo(obs.x + 6, obs.y + 15);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw Sourdough Bread Character
    const bx = 120;
    const by = toastY;

    ctx.save();
    if (invulnTimer > 0 && Math.floor(gameTick / 6) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Crust
    ctx.fillStyle = '#C2410C';
    ctx.beginPath();
    ctx.roundRect(bx - 18, by - 20, 36, 40, [10, 10, 4, 4]);
    ctx.fill();

    // Crumb (Inner bread)
    ctx.fillStyle = '#FFAE19';
    ctx.beginPath();
    ctx.roundRect(bx - 15, by - 17, 30, 34, [8, 8, 3, 3]);
    ctx.fill();

    // Butter melting on head
    ctx.fillStyle = '#FFE680';
    ctx.fillRect(bx - 6, by - 24, 12, 6);

    // Panicked Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bx - 6, by - 6, 5, 0, Math.PI * 2);
    ctx.arc(bx + 6, by - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bx - 5, by - 6, 2.2, 0, Math.PI * 2);
    ctx.arc(bx + 7, by - 6, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Terrified mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by + 6, 4.5, 0, Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  // --- Game 3: Capybara Zero-G Renderer ---
  function renderCapybaraGame(ctx, W, H) {
    // Space stars background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    capyStars.forEach((star) => {
      if (arcadeGameState === 'PLAYING') {
        star.x -= star.s * 0.8;
        if (star.x < 0) star.x = W;
      }
      ctx.fillRect(star.x, star.y, star.s, star.s);
    });

    // Physics
    if (arcadeGameState === 'PLAYING') {
      capyY += capyVy;
      capyVy += 0.16; // Zero-G slow gravity
      capyVy = Math.max(-5.5, Math.min(5.5, capyVy));

      if (capyY <= 30) {
        capyY = 30;
        capyVy = 0.5;
      }
      if (capyY >= H - 35) {
        capyY = H - 35;
        capyVy = -0.5;
      }

      // Items update
      capyItems.forEach((it) => {
        it.x -= 4.2;

        // Collision check
        if (!it.collected && Math.abs(it.x - 140) < 36 && Math.abs(it.y - capyY) < 32) {
          it.collected = true;
          if (it.type === 'cheese') {
            arcadeScore += 100;
            if (arcadeScore > arcadeHighScore) {
              arcadeHighScore = arcadeScore;
              localStorage.setItem('ambient_hi_score', arcadeHighScore);
            }
            addFloatingScore(it.x, it.y, '+100', '#FFAE19');
            window.triggerSillyLaser();
          } else {
            if (invulnTimer <= 0) {
              arcadeLives--;
              invulnTimer = 90;
              duckShake = 16;
              addFloatingScore(140, capyY - 20, 'BOOP! -1 LIFE', '#EF4444');
              window.triggerSillyWomp();
              if (arcadeLives <= 0) arcadeGameState = 'GAMEOVER';
            }
          }
          updateArcadeHUD();
        }
      });

      capyItems = capyItems.filter((i) => i.x > -50);
      if (capyItems.length < 3) {
        spawnCapyEntity(W + Math.random() * 200 + 100);
      }
    }

    // Draw Items
    capyItems.forEach((it) => {
      if (it.collected) return;
      if (it.type === 'cheese') {
        // Colossal Orange Cheese Puff
        ctx.fillStyle = '#FFAE19';
        ctx.beginPath();
        ctx.arc(it.x, it.y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF5E00';
        ctx.beginPath();
        ctx.arc(it.x - 4, it.y - 4, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Space debris asteroid
        ctx.fillStyle = '#4B4A54';
        ctx.beginPath();
        ctx.arc(it.x, it.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FF5E00';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // Draw Chill Capybara
    const cx = 140;
    const cy = capyY;

    ctx.save();
    if (invulnTimer > 0 && Math.floor(gameTick / 6) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Thruster Particle
    if (capyVy < 0 && arcadeGameState === 'PLAYING') {
      ctx.fillStyle = '#FF5E00';
      ctx.beginPath();
      ctx.arc(cx - 24, cy + 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFAE19';
      ctx.beginPath();
      ctx.arc(cx - 24, cy + 6, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Capybara Body
    ctx.fillStyle = '#9A3412';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 24, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Capybara Head
    ctx.beginPath();
    ctx.ellipse(cx + 14, cy - 4, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Zen Closed Eye ^_^
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx + 15, cy - 6, 3.5, 0, Math.PI);
    ctx.stroke();

    // Space Helmet Bubble
    ctx.strokeStyle = 'rgba(102, 192, 244, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx + 15, cy - 4, 17, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // --- 11. Mobile Navigation Drawer Controller ---
  function initMobileNav() {
    const toggleBtn = document.getElementById('mobileNavToggle');
    const mainNav = document.getElementById('mainNav') || document.querySelector('.nav-links');
    if (!toggleBtn || !mainNav) return;

    let backdrop = document.getElementById('mobileNavBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'mobileNavBackdrop';
      backdrop.className = 'mobile-nav-backdrop';
      document.body.appendChild(backdrop);
    }

    function openMenu() {
      toggleBtn.classList.add('open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      mainNav.classList.add('open');
      backdrop.classList.add('active');
      document.body.classList.add('mobile-nav-locked');
      window.announceA11y('Navigation menu opened');
    }

    function closeMenu(restoreFocus = true) {
      if (!mainNav.classList.contains('open')) return;
      toggleBtn.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      mainNav.classList.remove('open');
      backdrop.classList.remove('active');
      document.body.classList.remove('mobile-nav-locked');
      window.announceA11y('Navigation menu closed');
      if (restoreFocus) toggleBtn.focus();
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mainNav.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    backdrop.addEventListener('click', closeMenu);

    // Close on any link click
    mainNav.querySelectorAll('.nav-anchor').forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('open')) {
        closeMenu();
      }
    });

    // Close on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860 && mainNav.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  // --- Initialize on DOM Loaded ---
  document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initArcadeMusic();
    initScopeCanvas();
    initDuckBooper();
    initEmergencyButton();
    initAmbientCanvas();
    initBackToTop();
    initGamesCatalogueFilter();
  });
})();

