/* Shared drum hits and the 100 BPM band loop. Host and speaker both load this file. */
(function (root) {
  const BPM = 100;
  const STEP = 60 / BPM / 4;
  const STEPS = 64;
  const LOOP = STEP * STEPS;
  const DRUMS = {
    R: ["🥁 קיק", "🥁 סנייר", "🥁 האט סגור", "🥁 האט פתוח", "👏 קלאפ"],
    L: ["🥁 טום נמוך", "🥁 טום אמצע", "🥁 טום גבוה", "🥁 קראש", "🥁 קאובל"]
  };
  const BAND = {
    R: ["🥁 קצב", "🎸 בס", "🎹 פסנתר", "🎸 גיטרה", "🎻 מיתרים"],
    L: ["🎛️ ליד", "🎶 חליל", "🔔 מרימבה", "🎺 נשיפה", "🎤 מקהלה"]
  };
  const KIND = {
    R: ["kick", "snare", "hat", "ohat", "clap"],
    L: ["tomL", "tomM", "tomH", "crash", "rim"]
  };
  const PROG = [
    { bass: [65.41, 65.41, 98, 82.41], chord: [261.63, 329.63, 392], lead: [329.63, 392, 523.25, 392] },
    { bass: [55, 55, 82.41, 65.41], chord: [220, 261.63, 329.63], lead: [329.63, 523.25, 440, 329.63] },
    { bass: [43.65, 43.65, 65.41, 55], chord: [174.61, 220, 261.63], lead: [349.23, 440, 523.25, 440] },
    { bass: [49, 49, 73.42, 61.74], chord: [196, 246.94, 293.66], lead: [392, 493.88, 587.33, 493.88] }
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

    function bus() {
      const g = ac.createGain();
      g.gain.value = 1;
      g.connect(dest);
      return g;
    }
    const drumBus = bus();
    for (const k of ["R", "L"]) {
      hand[k] = ac.createGain();
      hand[k].gain.value = 0;
      hand[k].connect(dest);
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
    function tone(destNode, type, freq, t, dur, peak, glide) {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(1, freq), t);
      if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(1, glide), t + Math.min(0.12, dur));
      const g = ac.createGain();
      const pk = Math.max(0.0001, peak);
      g.gain.setValueAtTime(pk, t);
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
      hand[k].gain.setTargetAtTime(Math.max(0, Math.min(1, v || 0)), t, 0.05);
    }
    function setLayer(k, i, on) {
      if (!layers[k] || !layers[k][i]) return;
      on = !!on;
      layerOn[k][i] = on ? 1 : 0;
      const g = layers[k][i].gain;
      const t = ac.currentTime;
      g.cancelScheduledValues(t);
      const slow = (k === "R" && i === 4) || (k === "L" && i === 4);
      g.setTargetAtTime(on ? 1 : 0, t, on ? (slow ? 0.35 : 0.05) : (slow ? 0.4 : 0.12));
    }
    function flute(freq, time) {
      const o = ac.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, time);
      const lfo = ac.createOscillator();
      lfo.frequency.setValueAtTime(5, time);
      const lg = ac.createGain();
      lg.gain.setValueAtTime(5, time);
      lfo.connect(lg); lg.connect(o.frequency);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.12, time + 0.07);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);
      o.connect(g); g.connect(layers.L[1]);
      o.start(time); lfo.start(time);
      o.stop(time + 0.6); lfo.stop(time + 0.6);
      remember(o, g, time + 0.6);
      remember(lfo, lg, time + 0.6);
    }
    function fire(step, time) {
      const bar = Math.floor(step / 16) % 4;
      const s = step % 16;
      const q = Math.floor(s / 4);
      const P = PROG[bar];
      if (layerOn.R[0]) {
        if (s === 0 || s === 8) hit("kick", 0.9, time, layers.R[0]);
        if (s === 4 || s === 12) hit("snare", 0.75, time, layers.R[0]);
        if (s % 2 === 0 && s !== 14) hit("hat", 0.4, time, layers.R[0]);
        if (s === 14) hit("ohat", 0.5, time, layers.R[0]);
      }
      if (layerOn.R[1] && s % 4 === 0) tone(layers.R[1], "sine", P.bass[q], time, 0.32, 0.55);
      if (layerOn.R[2] && (s === 0 || s === 8)) P.chord.forEach(f => tone(layers.R[2], "triangle", s === 8 ? f * 2 : f, time, 0.75, 0.15));
      if (layerOn.R[3] && s % 4 === 0) P.chord.forEach((f, n) => tone(layers.R[3], "triangle", f, time + n * 0.018, 0.16, 0.16));
      if (layerOn.R[4] && s === 0) P.chord.forEach(f => shaped(layers.R[4], "sawtooth", f, time, 2.25, 0.07, "lowpass", 1200));
      if (layerOn.L[0] && s % 4 === 0) shaped(layers.L[0], "square", P.lead[q], time, 0.34, 0.1, "lowpass", 1800);
      if (layerOn.L[1] && (s === 0 || s === 8)) flute(P.lead[q], time);
      if (layerOn.L[2] && s % 2 === 0) tone(layers.L[2], "sine", P.chord[s % 3] * 2, time, 0.14, 0.22, P.chord[s % 3] * 1.4);
      if (layerOn.L[3] && s === 6) P.chord.forEach(f => shaped(layers.L[3], "sawtooth", f, time, 0.16, 0.12, "bandpass", 900));
      if (layerOn.L[4] && s === 0) P.chord.forEach(f => {
        tone(layers.L[4], "sine", f, time, 2.4, 0.05);
        tone(layers.L[4], "sine", f * 1.004, time, 2.4, 0.04);
      });
    }
    function align(pos) {
      pos = ((Number(pos) || 0) % LOOP + LOOP) % LOOP;
      const step = Math.floor(pos / STEP) % STEPS;
      const into = pos - Math.floor(pos / STEP) * STEP;
      const wantAc = ac.currentTime + (STEP - into);
      const wantStep = (step + 1) % STEPS;
      if (!aligned) {
        nextStep = wantStep;
        nextStepAc = wantAc;
        aligned = true;
        return;
      }
      if (Math.abs(nextStepAc - wantAc) > 0.04) {
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
        nextStepAc += STEP;
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
    function setLocal(on) {
      on = !!on;
      if (local === on) return;
      local = on;
      if (!on) stopLive();
      else align(getPos ? getPos() : 0);
    }
    return {
      layerOn: layerOn, triggerDrum: triggerDrum, setHand: setHand, setLayer: setLayer,
      setEnabled: setEnabled, setLocal: setLocal, align: align, pump: pump, stopAll: stopAll, hit: hit
    };
  }

  const api = { BPM: BPM, STEP: STEP, STEPS: STEPS, LOOP: LOOP, DRUMS: DRUMS, BAND: BAND, risingHits: risingHits, createEngine: createEngine };
  root.HM = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
