/* Shared drum hits and the band loop: 122 BPM, 8 bars, Am–F–C–G. */
(function (root) {
  const STEPS = 128;
  let bpm = 122;
  function clampBpm(next) {
    const n = Math.round(Number(next) || 122);
    return Math.max(90, Math.min(124, n));
  }
  function stepDur() { return 60 / bpm / 4; }
  function loopDur() { return stepDur() * STEPS; }
  function setBpm(next) { bpm = clampBpm(next); syncApi(); }
  function masterFromPercent(pct) {
    const p = Math.max(0, Math.min(100, Math.round(Number(pct))));
    return ((Number.isFinite(p) ? p : 100) / 100) * 1.85;
  }
  function makeLimiter(ac) {
    const lim = ac.createDynamicsCompressor();
    lim.threshold.value = -1.5;
    lim.knee.value = 0;
    lim.ratio.value = 20;
    lim.attack.value = 0.002;
    lim.release.value = 0.06;
    return lim;
  }
  const DRUMS = {
    R: ["🥁 קיק", "🥁 סנייר", "🥁 האט סגור", "🥁 האט פתוח", "👏 קלאפ"],
    L: ["🥁 טום נמוך", "🥁 טום אמצע", "🥁 טום גבוה", "🥁 קראש", "🥁 קאובל"]
  };
  const BAND = {
    R: ["🥁 קצב", "🎸 בס", "🎹 פסנתר", "🎸 גיטרה", "🎻 מיתרים"],
    L: ["🎛️ ליד", "🎶 חליל", "🔔 מרימבה", "🎺 נשיפה", "🎤 מקהלה"]
  };
  const ORCH = {
    R: ["🎻 כינורות I", "🎻 כינורות II", "🎻 ויולות", "🎻 צ'לי", "🎻 קונטרבס"],
    L: ["🎶 חליל", "🎶 אבוב", "🎺 קרנות", "🎺 חצוצרות", "🔔 נבל"]
  };
  const KIND = {
    R: ["kick", "snare", "hat", "ohat", "clap"],
    L: ["tomL", "tomM", "tomH", "crash", "rim"]
  };
  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  /* 8 bars: Am F C G Am F C G. r = bass root, p = piano voicing, g = guitar/high. */
  const CH = [
    { r: 33, p: [57, 60, 64], g: [69, 72, 76] },
    { r: 29, p: [53, 57, 60], g: [65, 69, 72] },
    { r: 36, p: [60, 64, 67], g: [72, 76, 79] },
    { r: 31, p: [55, 59, 62], g: [67, 71, 74] },
    { r: 33, p: [57, 60, 64], g: [69, 72, 76] },
    { r: 29, p: [53, 57, 60], g: [65, 69, 72] },
    { r: 36, p: [60, 64, 67], g: [72, 76, 79] },
    { r: 31, p: [55, 59, 62], g: [67, 71, 74] }
  ];
  /* [step in bar, midi, length in sixteenths] */
  const LEAD = [
    [[0, 64, 2], [3, 67, 1], [6, 69, 2], [10, 72, 2], [14, 67, 2]],
    [[0, 65, 2], [2, 69, 1], [4, 72, 3], [8, 69, 2], [12, 67, 2], [15, 64, 1]],
    [[0, 67, 2], [3, 64, 2], [6, 67, 2], [8, 72, 2], [11, 74, 2], [14, 72, 2]],
    [[0, 71, 2], [3, 74, 2], [6, 71, 2], [8, 67, 2], [11, 69, 2], [14, 65, 2]],
    [[0, 69, 2], [2, 72, 2], [4, 76, 3], [8, 74, 2], [10, 72, 2], [12, 69, 2], [15, 67, 1]],
    [[0, 72, 2], [4, 69, 2], [6, 65, 2], [8, 69, 2], [12, 72, 2], [14, 69, 2]],
    [[0, 76, 2], [3, 74, 2], [6, 72, 2], [8, 67, 3], [12, 64, 2], [14, 67, 2]],
    [[0, 74, 2], [4, 71, 2], [8, 67, 2], [10, 69, 2], [12, 71, 2], [14, 74, 2]]
  ];
  const FLUTE = [
    [[4, 81, 4], [10, 76, 4]],
    [[2, 84, 4], [8, 81, 4], [14, 77, 2]],
    [[0, 79, 3], [6, 76, 4], [12, 84, 3]],
    [[3, 83, 4], [8, 79, 4], [14, 74, 2]],
    [[2, 81, 3], [6, 88, 4], [12, 84, 3]],
    [[0, 84, 4], [8, 81, 4], [14, 77, 2]],
    [[4, 88, 4], [10, 84, 4]],
    [[0, 86, 3], [6, 83, 4], [12, 86, 3]]
  ];
  const BASS = [[0, 0, 2.1], [3, 12, 1.05], [6, 7, 1.8], [8, 0, 1.15], [10, 12, 1.7], [13, 3, 0.9], [14, 7, 1.15]];
  /* Philharmonic: Dm Bb F C, twice. Separate from the band progression. */
  const OCH = [
    { r: 38, c: [50, 53, 57] },
    { r: 34, c: [46, 50, 53] },
    { r: 41, c: [53, 57, 60] },
    { r: 36, c: [48, 52, 55] },
    { r: 38, c: [50, 53, 57] },
    { r: 34, c: [46, 50, 53] },
    { r: 41, c: [53, 57, 60] },
    { r: 36, c: [48, 52, 55] }
  ];
  const VLN1 = [
    [[0, 74, 6], [6, 77, 4], [10, 81, 4], [14, 77, 2]],
    [[0, 70, 4], [4, 74, 4], [8, 77, 6], [14, 74, 2]],
    [[0, 69, 4], [4, 72, 4], [8, 77, 4], [12, 76, 4]],
    [[0, 79, 6], [6, 76, 4], [10, 72, 4], [14, 74, 2]],
    [[0, 81, 8], [8, 77, 4], [12, 74, 4]],
    [[0, 70, 4], [4, 74, 6], [10, 77, 4], [14, 79, 2]],
    [[0, 81, 4], [4, 77, 4], [8, 72, 4], [12, 69, 4]],
    [[0, 76, 4], [4, 79, 6], [10, 77, 2], [12, 74, 4]]
  ];
  const VLN2 = [
    [[0, 69, 6], [6, 72, 4], [10, 74, 4], [14, 72, 2]],
    [[0, 65, 4], [4, 69, 4], [8, 72, 6], [14, 70, 2]],
    [[0, 65, 4], [4, 69, 4], [8, 72, 4], [12, 71, 4]],
    [[0, 74, 6], [6, 71, 4], [10, 67, 4], [14, 69, 2]],
    [[0, 77, 8], [8, 74, 4], [12, 69, 4]],
    [[0, 65, 4], [4, 69, 6], [10, 72, 4], [14, 74, 2]],
    [[0, 77, 4], [4, 74, 4], [8, 69, 4], [12, 65, 4]],
    [[0, 72, 4], [4, 76, 6], [10, 74, 2], [12, 69, 4]]
  ];
  const VLA = [
    [[0, 57, 8], [8, 53, 8]],
    [[0, 58, 8], [8, 53, 8]],
    [[0, 57, 8], [8, 60, 8]],
    [[0, 55, 8], [8, 52, 8]],
    [[0, 57, 8], [8, 62, 8]],
    [[0, 58, 16]],
    [[0, 57, 8], [8, 53, 8]],
    [[0, 55, 8], [8, 50, 8]]
  ];
  const CELLO = [
    [[0, 50, 8], [8, 53, 6], [14, 52, 2]],
    [[0, 46, 4], [4, 50, 4], [8, 53, 8]],
    [[0, 53, 8], [8, 57, 4], [12, 55, 4]],
    [[0, 48, 4], [4, 52, 4], [8, 55, 8]],
    [[0, 50, 6], [6, 57, 4], [10, 53, 6]],
    [[0, 46, 8], [8, 50, 8]],
    [[0, 53, 4], [4, 57, 4], [8, 60, 4], [12, 57, 4]],
    [[0, 55, 8], [8, 50, 8]]
  ];
  const OFL = [
    [[2, 81, 6], [10, 86, 5]],
    [[4, 82, 6], [12, 77, 4]],
    [[0, 77, 8], [8, 84, 6]],
    [[2, 86, 6], [10, 79, 5]],
    [[0, 86, 8], [8, 81, 6]],
    [[4, 82, 8], [12, 86, 4]],
    [[0, 89, 6], [8, 84, 4], [12, 81, 4]],
    [[0, 84, 4], [4, 88, 8], [12, 81, 4]]
  ];
  const OBOE = [
    [[4, 70, 4], [8, 74, 6]],
    [[0, 70, 4], [6, 65, 4], [12, 70, 4]],
    [[2, 69, 6], [10, 72, 4]],
    [[0, 71, 4], [6, 67, 4], [12, 64, 4]],
    [[4, 74, 6], [12, 69, 4]],
    [[0, 70, 8], [8, 74, 6]],
    [[2, 72, 4], [8, 69, 6]],
    [[0, 76, 4], [6, 72, 4], [12, 67, 4]]
  ];

  function risingHits(prev, curr, last, now, ms) {
    const out = [];
    for (let i = 0; i < 5; i++) if (curr[i] && !prev[i] && now - (last[i] || 0) >= ms) out.push(i);
    return out;
  }

  function createEngine(ac, dest, getPos) {
    const live = [];
    const layerOn = { R: [0, 0, 0, 0, 0], L: [0, 0, 0, 0, 0] };
    const hand = {}, layers = { R: [], L: [] };
    let noiseBuf = null, timer = null, enabled = false, local = true, aligned = false;
    let nextStep = 0, nextStepAc = 0;

    function bus(target) {
      const g = ac.createGain();
      g.gain.value = 1;
      g.connect(target || dest);
      return g;
    }
    const drumBus = bus(dest);
    drumBus.gain.value = 1.7;
    const bandComp = ac.createDynamicsCompressor();
    bandComp.threshold.value = -16;
    bandComp.knee.value = 6;
    bandComp.ratio.value = 3;
    bandComp.attack.value = 0.004;
    bandComp.release.value = 0.12;
    const bandDry = ac.createGain();
    bandDry.gain.value = 1.75;
    const bandWet = ac.createGain();
    bandWet.gain.value = 0.34;
    const rate = ac.sampleRate || 44100;
    const irLen = Math.floor(rate * 0.9);
    const ir = ac.createBuffer(2, irLen, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < irLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.6);
    }
    const reverb = ac.createConvolver();
    reverb.buffer = ir;
    bandComp.connect(bandDry); bandDry.connect(dest);
    bandComp.connect(reverb); reverb.connect(bandWet); bandWet.connect(dest);
    const orchComp = ac.createDynamicsCompressor();
    orchComp.threshold.value = -16;
    orchComp.knee.value = 8;
    orchComp.ratio.value = 2.4;
    orchComp.attack.value = 0.01;
    orchComp.release.value = 0.25;
    const orchDry = ac.createGain();
    orchDry.gain.value = 1.6;
    const orchWet = ac.createGain();
    orchWet.gain.value = 0.55;
    const hallLen = Math.floor(rate * 2.8);
    const hall = ac.createBuffer(2, hallLen, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = hall.getChannelData(ch);
      for (let i = 0; i < hallLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / hallLen, 1.55);
    }
    const hallVerb = ac.createConvolver();
    hallVerb.buffer = hall;
    orchComp.connect(orchDry); orchDry.connect(dest);
    orchComp.connect(hallVerb); hallVerb.connect(orchWet); orchWet.connect(dest);
    let arrangement = "band";
    for (const k of ["R", "L"]) {
      hand[k] = ac.createGain();
      hand[k].gain.value = 0;
      hand[k].connect(bandComp);
      for (let i = 0; i < 5; i++) {
        const g = ac.createGain();
        g.gain.value = 0;
        g.connect(hand[k]);
        layers[k].push(g);
      }
    }

    function noise() {
      if (noiseBuf) return noiseBuf;
      const n = (ac.sampleRate || 44100) * 2;
      noiseBuf = ac.createBuffer(1, n, ac.sampleRate || 44100);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return noiseBuf;
    }
    function remember(osc, gainNode, endTime) {
      const node = { osc: osc, gain: gainNode };
      live.push(node);
      const ms = Math.max(40, (endTime - ac.currentTime) * 1000 + 80);
      setTimeout(() => { const i = live.indexOf(node); if (i >= 0) live.splice(i, 1); }, ms);
    }
    function tone(destNode, type, freq, t, dur, peak, glide, attack) {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(1, freq), t);
      if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(1, glide), t + Math.min(0.1, dur * 0.45));
      const g = ac.createGain();
      const pk = Math.max(0.0001, peak);
      const a = Math.max(0.004, Math.min(attack || 0.006, dur * 0.45));
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(pk, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(destNode);
      o.start(t); o.stop(t + dur + 0.03);
      remember(o, g, t + dur);
    }
    function shaped(destNode, type, freq, t, dur, peak, filterType, filterFreq) {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(1, freq), t);
      const f = ac.createBiquadFilter();
      f.type = filterType;
      f.frequency.setValueAtTime(filterFreq, t);
      const g = ac.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, peak), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(destNode);
      o.start(t); o.stop(t + dur + 0.03);
      remember(o, g, t + dur);
    }
    function burst(destNode, t, dur, peak, filterType, freq) {
      const src = ac.createBufferSource();
      src.buffer = noise();
      const f = ac.createBiquadFilter();
      f.type = filterType;
      f.frequency.setValueAtTime(freq, t);
      const g = ac.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, peak), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(destNode);
      src.start(t); src.stop(t + dur + 0.02);
      remember(src, g, t + dur);
    }
    function hit(kind, vol, time, destNode) {
      const d = destNode || drumBus;
      const t = time == null ? ac.currentTime : time;
      const v = Math.max(0.02, Math.min(1, Number(vol) || 0));
      if (kind === "kick") {
        const o = ac.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(160, t);
        o.frequency.exponentialRampToValueAtTime(46, t + 0.14);
        const g = ac.createGain();
        g.gain.setValueAtTime(v * 0.95, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(g); g.connect(d);
        o.start(t); o.stop(t + 0.32);
        remember(o, g, t + 0.32);
        burst(d, t, 0.03, v * 0.25, "highpass", 900);
      } else if (kind === "snare") {
        burst(d, t, 0.16, v * 0.65, "bandpass", 1800);
        tone(d, "triangle", 190, t, 0.12, v * 0.35, 140);
      } else if (kind === "hat") burst(d, t, 0.04, v * 0.35, "highpass", 7000);
      else if (kind === "ohat") burst(d, t, 0.38, v * 0.3, "highpass", 6000);
      else if (kind === "clap") {
        burst(d, t, 0.04, v * 0.45, "bandpass", 1400);
        burst(d, t + 0.012, 0.05, v * 0.4, "bandpass", 1400);
        burst(d, t + 0.028, 0.1, v * 0.32, "bandpass", 1100);
      } else if (kind === "tomL") tone(d, "sine", 130, t, 0.32, v * 0.85, 70);
      else if (kind === "tomM") tone(d, "sine", 190, t, 0.26, v * 0.8, 105);
      else if (kind === "tomH") tone(d, "sine", 270, t, 0.2, v * 0.75, 160);
      else if (kind === "crash") {
        burst(d, t, 1.1, v * 0.36, "highpass", 4500);
        tone(d, "square", 310, t, 0.4, v * 0.06, 180);
      } else if (kind === "rim") {
        tone(d, "square", 540, t, 0.16, v * 0.2);
        tone(d, "square", 800, t, 0.16, v * 0.16);
        burst(d, t, 0.02, v * 0.22, "highpass", 2000);
      }
    }
    function triggerDrum(handId, index, vol, when) {
      const kind = KIND[handId] && KIND[handId][index];
      if (!kind) return;
      hit(kind, vol, when == null ? ac.currentTime : when, drumBus);
    }
    function setHand(k, v) {
      if (!hand[k]) return;
      const t = ac.currentTime;
      hand[k].gain.cancelScheduledValues(t);
      hand[k].gain.setTargetAtTime(Math.max(0, Math.min(1.5, v || 0)), t, 0.05);
    }
    function setLayer(k, i, on) {
      if (!layers[k] || !layers[k][i]) return;
      on = !!on;
      layerOn[k][i] = on ? 1 : 0;
      const g = layers[k][i].gain;
      const t = ac.currentTime;
      g.cancelScheduledValues(t);
      const slow = arrangement === "orch" ? (k === "R" && i < 4) || (k === "L" && i === 2) : (k === "R" && i === 4) || (k === "L" && i === 4);
      g.setTargetAtTime(on ? 1 : 0, t, on ? (slow ? 0.35 : 0.05) : (slow ? 0.4 : 0.12));
    }
    function flute(freq, time, dur) {
      const d = Math.max(0.08, dur || 0.4);
      const o = ac.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, time);
      const lfo = ac.createOscillator();
      lfo.frequency.setValueAtTime(5.2, time);
      const lg = ac.createGain();
      lg.gain.setValueAtTime(6, time);
      lfo.connect(lg); lg.connect(o.frequency);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.22, time + Math.min(0.05, d * 0.25));
      g.gain.exponentialRampToValueAtTime(0.0001, time + d);
      o.connect(g); g.connect(layers.L[1]);
      o.start(time); lfo.start(time);
      o.stop(time + d + 0.05); lfo.stop(time + d + 0.05);
      remember(o, g, time + d);
      remember(lfo, lg, time + d);
    }
    function playAt(list, stepInBar, fn) {
      for (let i = 0; i < list.length; i++) if (list[i][0] === stepInBar) fn(list[i]);
    }
    function strings(destNode, note, time, dur, peak, open) {
      const f0 = midi(note);
      [1, 1.007, 0.993].forEach((ratio, i) => {
        const o = ac.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(Math.max(1, f0 * ratio), time);
        const lfo = ac.createOscillator();
        lfo.frequency.setValueAtTime(4.4 + i * 0.35, time);
        const lg = ac.createGain();
        lg.gain.setValueAtTime(Math.max(1, f0 * 0.0045), time);
        lfo.connect(lg); lg.connect(o.frequency);
        const f = ac.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(open || 1400, time);
        const g = ac.createGain();
        const pk = Math.max(0.0001, peak);
        const att = Math.min(0.32, Math.max(0.08, dur * 0.28));
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(pk, time + att);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        o.connect(f); f.connect(g); g.connect(destNode);
        o.start(time); lfo.start(time);
        o.stop(time + dur + 0.05); lfo.stop(time + dur + 0.05);
        remember(o, g, time + dur);
        remember(lfo, lg, time + dur);
      });
    }
    function pizz(destNode, note, time, peak) {
      const f0 = midi(note);
      tone(destNode, "triangle", f0, time, 0.24, peak, f0 * 0.72, 0.004);
      burst(destNode, time, 0.025, peak * 0.28, "highpass", 1600);
    }
    function timp(destNode, note, time, peak) {
      const f0 = Math.max(48, midi(note));
      const o = ac.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f0 * 1.35, time);
      o.frequency.exponentialRampToValueAtTime(f0, time + 0.2);
      const g = ac.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, peak), time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);
      o.connect(g); g.connect(destNode);
      o.start(time); o.stop(time + 0.65);
      remember(o, g, time + 0.65);
      burst(destNode, time, 0.04, peak * 0.28, "lowpass", 420);
    }
    function reed(destNode, note, time, dur, peak) {
      shaped(destNode, "sawtooth", midi(note), time, dur, peak * 0.65, "bandpass", 1350);
      tone(destNode, "triangle", midi(note), time, dur, peak * 0.4, 0, 0.05);
    }
    function horn(destNode, note, time, dur, peak, bright) {
      shaped(destNode, "sawtooth", midi(note), time, dur, peak, "lowpass", bright ? 2100 : 820);
      tone(destNode, "triangle", midi(note), time, dur, peak * 0.45, 0, bright ? 0.04 : 0.14);
    }
    function lineAt(list, stepInBar, fn) {
      for (let i = 0; i < list.length; i++) if (list[i][0] === stepInBar) fn(list[i]);
    }
    function fireOrch(step, time) {
      const sd = stepDur();
      const bar = Math.floor(step / 16) % 8;
      const s = step % 16;
      const chord = OCH[bar];
      if (layerOn.R[0]) lineAt(VLN1[bar], s, n => strings(layers.R[0], n[1], time, sd * n[2] * 0.98, 0.18, 1900));
      if (layerOn.R[1]) lineAt(VLN2[bar], s, n => strings(layers.R[1], n[1], time, sd * n[2] * 0.98, 0.14, 1500));
      if (layerOn.R[2]) lineAt(VLA[bar], s, n => strings(layers.R[2], n[1], time, sd * n[2] * 0.98, 0.13, 1000));
      if (layerOn.R[3]) lineAt(CELLO[bar], s, n => strings(layers.R[3], n[1], time, sd * n[2] * 0.98, 0.17, 780));
      if (layerOn.R[4]) {
        if (s % 4 === 0) pizz(layers.R[4], chord.r + (s === 12 ? 12 : s === 4 ? 7 : 0), time, 0.62);
        if (s === 0) strings(layers.R[4], chord.r, time, sd * 14.5, 0.07, 420);
      }
      if (layerOn.L[0]) lineAt(OFL[bar], s, n => flute(midi(n[1]), time, sd * n[2] * 0.96));
      if (layerOn.L[1]) lineAt(OBOE[bar], s, n => reed(layers.L[1], n[1], time, sd * n[2] * 0.95, 0.22));
      if (layerOn.L[2] && s === 0) chord.c.forEach(m => horn(layers.L[2], m, time, sd * 15.2, 0.12, false));
      if (layerOn.L[3] && (s === 0 || s === 8 || (s === 4 && bar % 2 === 0))) horn(layers.L[3], chord.c[s === 0 ? 2 : 1] + 12, time, sd * (s === 0 ? 6 : 2.5), 0.2, true);
      if (layerOn.L[4]) {
        if (s === 0 || s === 8) timp(layers.L[4], chord.r, time, s === 0 ? 0.75 : 0.48);
        if ((bar === 3 || bar === 7) && s >= 12) timp(layers.L[4], chord.r, time, 0.36);
        if (s % 2 === 0) tone(layers.L[4], "sine", midi(chord.c[(s / 2) % 3] + 24), time, sd * 1.15, 0.18, midi(chord.c[0] + 12), 0.004);
      }
    }
    function fire(step, time) {
      if (arrangement === "orch") { fireOrch(step, time); return; }
      const sd = stepDur();
      const bar = Math.floor(step / 16) % 8;
      const s = step % 16;
      const chord = CH[bar];
      const fill = (bar === 3 || bar === 7) && s >= 12;
      if (layerOn.R[0]) {
        if (fill) {
          if (s === 12) { hit("snare", 0.78, time, layers.R[0]); hit("clap", 0.42, time, layers.R[0]); }
          if (s === 13) hit("tomH", 0.72, time, layers.R[0]);
          if (s === 14) hit("tomM", 0.74, time, layers.R[0]);
          if (s === 15) { hit("tomL", 0.8, time, layers.R[0]); hit("snare", 0.36, time, layers.R[0]); }
        } else {
          if (s % 4 === 0) hit("kick", 0.95, time, layers.R[0]);
          if (s === 4 || s === 12) { hit("snare", 0.7, time, layers.R[0]); hit("clap", 0.38, time, layers.R[0]); }
          if (s % 4 === 2) hit("ohat", 0.48, time, layers.R[0]);
          else hit("hat", s % 4 === 0 ? 0.34 : 0.2, time, layers.R[0]);
        }
        if ((bar === 0 || bar === 4) && s === 0) hit("crash", 0.42, time, layers.R[0]);
      }
      if (layerOn.R[1]) playAt(BASS, s, n => tone(layers.R[1], "sine", midi(chord.r + n[1]), time, sd * n[2], 0.9, 0, 0.004));
      if (layerOn.R[1] && s === 15 && (bar === 3 || bar === 7)) tone(layers.R[1], "sine", midi(33), time, sd * 0.9, 0.78, 0, 0.004);
      if (layerOn.R[2]) {
        if (s === 0) chord.p.forEach(m => tone(layers.R[2], "triangle", midi(m), time, sd * 1.7, 0.24, 0, 0.008));
        if (s % 4 === 2) chord.p.forEach(m => tone(layers.R[2], "triangle", midi(m + 12), time, sd * 0.85, 0.18, 0, 0.005));
        if (s === 11 && bar % 2 === 1) chord.g.forEach(m => tone(layers.R[2], "triangle", midi(m), time, sd * 0.7, 0.16, 0, 0.005));
      }
      if (layerOn.R[3]) {
        if (s % 4 === 0) chord.g.forEach((m, n) => tone(layers.R[3], "triangle", midi(m), time + n * 0.012, sd * 1.25, s === 0 ? 0.22 : 0.16, 0, 0.004));
        if (s === 3 || s === 7 || s === 11 || s === 15) tone(layers.R[3], "triangle", midi(chord.g[(s / 4) | 0] || chord.g[0]), time, sd * 0.7, 0.18, midi(chord.g[0]), 0.004);
      }
      if (layerOn.R[4] && s === 0) chord.p.forEach(m => shaped(layers.R[4], "sawtooth", midi(m), time, sd * 15.2, 0.13, "lowpass", bar >= 4 ? 1600 : 1100));
      if (layerOn.L[0]) playAt(LEAD[bar], s, n => shaped(layers.L[0], "square", midi(n[1]), time, sd * n[2] * 0.92, 0.22, "lowpass", 2100));
      if (layerOn.L[1]) playAt(FLUTE[bar], s, n => flute(midi(n[1]), time, sd * n[2] * 0.95));
      if (layerOn.L[2] && (s % 2 === 0 || s === 3 || s === 11)) {
        const toneIdx = (s + bar) % 3;
        const hi = chord.g[toneIdx] + (s >= 8 ? 12 : 0);
        tone(layers.L[2], "sine", midi(hi), time, sd * 0.95, s % 4 === 0 ? 0.38 : 0.26, midi(hi - 12), 0.004);
      }
      if (layerOn.L[3] && (s === 4 || s === 12 || (s === 14 && bar % 2 === 1))) chord.p.forEach(m => shaped(layers.L[3], "sawtooth", midi(m + 12), time, sd * 1.05, 0.22, "bandpass", 980));
      if (layerOn.L[4] && s === 0) chord.g.forEach(m => {
        tone(layers.L[4], "sine", midi(m), time, sd * 15.4, 0.11, 0, 0.28);
        tone(layers.L[4], "sine", midi(m) * 1.004, time, sd * 15.4, 0.09, 0, 0.32);
      });
    }
    function align(pos) {
      const loop = loopDur();
      const step = stepDur();
      pos = ((Number(pos) || 0) % loop + loop) % loop;
      const idx = Math.floor(pos / step) % STEPS;
      const into = pos - Math.floor(pos / step) * step;
      const wantAc = ac.currentTime + (step - into);
      const wantStep = (idx + 1) % STEPS;
      if (!aligned) {
        nextStep = wantStep;
        nextStepAc = wantAc;
        aligned = true;
        return;
      }
      if (Math.abs(nextStepAc - wantAc) > 0.035) {
        nextStep = wantStep;
        nextStepAc = wantAc;
      }
    }
    function pump() {
      if (!enabled || !local) return;
      const horizon = ac.currentTime + 0.2;
      let n = 0;
      while (nextStepAc < horizon && n++ < 8) {
        fire(nextStep, Math.max(nextStepAc, ac.currentTime));
        nextStep = (nextStep + 1) % STEPS;
        nextStepAc += stepDur();
      }
    }
    function tick() {
      timer = setTimeout(tick, 25);
      if (!enabled) return;
      try { align(getPos ? getPos() : 0); pump(); } catch (e) { console.error(e); }
    }
    function setEnabled(on) {
      on = !!on;
      enabled = on;
      if (on) {
        align(getPos ? getPos() : 0);
        if (!timer) timer = setTimeout(tick, 25);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
    function stopLive() {
      const t = ac.currentTime;
      for (const n of live) {
        try { n.gain.gain.cancelScheduledValues(t); n.gain.gain.setValueAtTime(0, t); } catch (e) {}
        try { n.osc.stop(t); } catch (e) {}
      }
      live.length = 0;
    }
    function stopAll() {
      enabled = false;
      aligned = false;
      if (timer) { clearTimeout(timer); timer = null; }
      stopLive();
      const t = ac.currentTime;
      for (const k of ["R", "L"]) {
        try { hand[k].gain.cancelScheduledValues(t); hand[k].gain.setValueAtTime(0, t); } catch (e) {}
        for (let i = 0; i < 5; i++) {
          layerOn[k][i] = 0;
          try { layers[k][i].gain.cancelScheduledValues(t); layers[k][i].gain.setValueAtTime(0, t); } catch (e) {}
        }
      }
    }
    function setArrangement(kind) {
      arrangement = kind === "orch" ? "orch" : "band";
      for (const k of ["R", "L"]) {
        try { hand[k].disconnect(); } catch (e) {}
        hand[k].connect(arrangement === "orch" ? orchComp : bandComp);
      }
    }
    function realign() { aligned = false; align(getPos ? getPos() : 0); }
    function setLocal(on) {
      on = !!on;
      if (local === on) return;
      local = on;
      if (!on) stopLive();
      else align(getPos ? getPos() : 0);
    }
    return {
      layerOn: layerOn, triggerDrum: triggerDrum, setHand: setHand, setLayer: setLayer,
      setEnabled: setEnabled, setLocal: setLocal, setArrangement: setArrangement, align: align, realign: realign, pump: pump, stopAll: stopAll, hit: hit
    };
  }

  const api = { BPM: bpm, STEP: stepDur(), STEPS: STEPS, LOOP: loopDur(), DRUMS: DRUMS, BAND: BAND, ORCH: ORCH, risingHits: risingHits, createEngine: createEngine, setBpm: setBpm, masterFromPercent: masterFromPercent, makeLimiter: makeLimiter };
  function syncApi() { api.BPM = bpm; api.STEP = stepDur(); api.LOOP = loopDur(); api.STEPS = STEPS; }
  syncApi();
  root.HM = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
