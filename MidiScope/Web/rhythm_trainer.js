/**
 * Free Play Rhythm Trainer Engine
 * 
 * Assesses arbitrary performance streams (songs, exercises, chords, improvisations)
 * against an isochronous metronome pulse and standard metric subdivisions.
 * Requires no prior knowledge of the song while checking if strokes land on the beat.
 */

export class FreePlayRhythmTrainer {
  constructor(audioEngine) {
    this.audio = audioEngine;

    // Metronome Configuration
    this.bpm = 108;
    this.beatsPerMeasure = 4;
    this.gridMode = 'smart'; // 'smart' (adaptive), 'quarter', 'eighth', 'sixteenth', 'triplet'
    this.toleranceMode = 'normal'; // 'normal' (±45ms), 'strict' (±30ms), 'relaxed' (±70ms)
    this.metronomeSoundEnabled = true;
    this.metronomeVolume = 1.0;

    // Trainer Status
    this.isActive = false;
    this.isMetronomeRunning = false;

    // High-precision Web Audio clock tracking
    this.metronomeStartTime = null;
    this.nextBeatTime = 0;
    this.currentBeatIndex = 0;
    this.schedulerTimer = null;
    this.phaseRafId = null;
    this.lookaheadMs = 25.0; // Interval for scheduler checks
    this.scheduleAheadSec = 0.1; // Schedule audio clicks 100ms in advance
    this.audioTimeOffset = 0; // audio.ctx.currentTime - performance.now() / 1000

    // Chord clustering & debounce (simultaneous key strikes within 25ms are 1 rhythmic stroke)
    this.chordDebounceMs = 25;
    this.pendingStrokeNotes = [];
    this.chordDebounceTimer = null;
    this.lastStrokeTime = 0;

    // Latency compensation in ms (hardware MIDI / audio buffer offset)
    this.latencyCompensationMs = this.loadLatencyCompensation();

    // Tap Tempo detection
    this.tapTimes = [];
    this.lastTapTime = 0;

    // Rolling statistics & tendency
    this.stats = {
      totalStrokes: 0,
      totalNotes: 0,
      perfectCount: 0,
      earlyCount: 0,
      lateCount: 0,
      offBeatCount: 0,
      streak: 0,
      bestStreak: 0,
      accuracy: 100,
      rhythmScore: 100,
      sumPoints: 0,
      rollingOffsets: [],
      avgOffsetMs: 0,
      tendency: 'pocket', // 'pocket', 'rushing', 'dragging'
      recentHits: []
    };

    // Active sounding notes map for duration measurement: midi -> onsetAudioTime
    this.activeStrokeNotes = new Map();

    // Event Callbacks
    this.onBeatTick = null;        // (beatIndex, isDownbeat, beatAudioTime)
    this.onPhaseUpdate = null;     // (phaseRatio 0..1, currentBeatIndex)
    this.onStrokeEvaluated = null; // (result, stats)
    this.onDurationDetected = null;// (midi, durationInfo)
    this.onStatsUpdated = null;    // (stats)
    this.onMetronomeToggle = null; // (isRunning)
  }

  loadLatencyCompensation() {
    try {
      const saved = localStorage.getItem('midisheet_latency_compensation_ms');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        return isNaN(val) ? 0 : Math.max(-500, Math.min(500, val));
      }
    } catch (e) {
      console.warn('Could not read latency compensation:', e);
    }
    return 0;
  }

  setLatencyCompensation(ms) {
    this.latencyCompensationMs = Math.max(-500, Math.min(500, Math.round(Number(ms) || 0)));
  }

  // --- Configuration Setters ---

  setBpm(bpm) {
    const clamped = Math.max(40, Math.min(240, Math.round(bpm)));
    if (this.bpm === clamped) return this.bpm;
    this.bpm = clamped;

    if (this.isMetronomeRunning) {
      // Re-anchor next beat smoothly without skipping or dragging
      const now = this.getAudioTime();
      const beatDur = 60.0 / this.bpm;
      this.nextBeatTime = Math.max(now + 0.01, this.nextBeatTime);
    }

    if (this.onStatsUpdated) this.onStatsUpdated(this.stats);
    return this.bpm;
  }

  setBeatsPerMeasure(beats) {
    const b = Math.max(2, Math.min(12, parseInt(beats, 10) || 4));
    this.beatsPerMeasure = b;
    if (this.currentBeatIndex >= this.beatsPerMeasure) {
      this.currentBeatIndex = 0;
    }
  }

  setGridMode(mode) {
    const valid = ['smart', 'quarter', 'eighth', 'sixteenth', 'triplet'];
    if (valid.includes(mode)) {
      this.gridMode = mode;
    }
  }

  setToleranceMode(mode) {
    const valid = ['normal', 'strict', 'relaxed'];
    if (valid.includes(mode)) {
      this.toleranceMode = mode;
    }
  }

  setSoundEnabled(enabled) {
    this.metronomeSoundEnabled = !!enabled;
  }

  setVolume(vol) {
    this.metronomeVolume = Math.max(0, Math.min(1.0, Number(vol) || 1.0));
  }

  // --- Tap Tempo ---

  registerTap() {
    const now = performance.now();
    if (now - this.lastTapTime > 2500) {
      this.tapTimes = [];
    }
    this.lastTapTime = now;
    this.tapTimes.push(now);

    if (this.tapTimes.length > 5) {
      this.tapTimes.shift();
    }

    if (this.tapTimes.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < this.tapTimes.length; i++) {
        totalDiff += (this.tapTimes[i] - this.tapTimes[i - 1]);
      }
      const avgIntervalMs = totalDiff / (this.tapTimes.length - 1);
      const computedBpm = Math.round(60000.0 / avgIntervalMs);
      return this.setBpm(computedBpm);
    }
    return this.bpm;
  }

  // --- Audio Clock Sync ---

  getAudioTime() {
    if (this.audio && this.audio.ctx && this.audio.ctx.state !== 'closed') {
      return this.audio.ctx.currentTime;
    }
    return performance.now() / 1000.0;
  }

  // --- Metronome Transport ---

  startMetronome() {
    if (this.isMetronomeRunning) return;

    if (this.audio && this.audio.ctx && this.audio.ctx.state === 'suspended') {
      this.audio.ctx.resume();
    }

    this.isMetronomeRunning = true;
    const now = this.getAudioTime();
    this.metronomeStartTime = now;
    this.nextBeatTime = now + 0.05; // tiny pre-roll so beat 1 triggers cleanly
    this.currentBeatIndex = 0;

    // Run Web Audio scheduler loop
    this.schedulerTimer = setInterval(() => this.scheduleBeats(), this.lookaheadMs);

    // Run continuous phase animation loop
    this.startPhaseLoop();

    if (this.onMetronomeToggle) {
      this.onMetronomeToggle(true);
    }
  }

  stopMetronome() {
    if (!this.isMetronomeRunning) return;
    this.isMetronomeRunning = false;

    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.phaseRafId) {
      cancelAnimationFrame(this.phaseRafId);
      this.phaseRafId = null;
    }

    if (this.onMetronomeToggle) {
      this.onMetronomeToggle(false);
    }
  }

  toggleMetronome() {
    if (this.isMetronomeRunning) {
      this.stopMetronome();
      return false;
    } else {
      this.startMetronome();
      return true;
    }
  }

  scheduleBeats() {
    const beatDur = 60.0 / this.bpm;
    const scheduleUntil = this.getAudioTime() + this.scheduleAheadSec;

    while (this.nextBeatTime < scheduleUntil) {
      const isDownbeat = (this.currentBeatIndex === 0);
      const beatIdx = this.currentBeatIndex;
      const scheduledTime = this.nextBeatTime;

      // 1. Audio Click
      if (this.metronomeSoundEnabled && this.audio) {
        this.audio.playMetronomeClick(isDownbeat, scheduledTime);
      }

      // 2. Dispatch UI beat callback synchronized to schedule
      const delayMs = Math.max(0, (scheduledTime - this.getAudioTime()) * 1000);
      setTimeout(() => {
        if (this.isMetronomeRunning && this.onBeatTick) {
          this.onBeatTick(beatIdx, isDownbeat, scheduledTime);
        }
      }, delayMs);

      // Advance
      this.nextBeatTime += beatDur;
      this.currentBeatIndex = (this.currentBeatIndex + 1) % this.beatsPerMeasure;
    }
  }

  startPhaseLoop() {
    const updatePhase = () => {
      if (!this.isMetronomeRunning) return;

      const beatDur = 60.0 / this.bpm;
      const now = this.getAudioTime();
      // Time relative to previous beat:
      // nextBeatTime is the upcoming beat. Previous beat was nextBeatTime - beatDur
      const prevBeatTime = this.nextBeatTime - beatDur;
      let phase = (now - prevBeatTime) / beatDur;
      phase = Math.max(0, Math.min(1.0, phase));

      // Calculate current beat display index (0-indexed)
      const beatDisplayIdx = ((this.currentBeatIndex - 1 + this.beatsPerMeasure) % this.beatsPerMeasure);

      if (this.onPhaseUpdate) {
        this.onPhaseUpdate(phase, beatDisplayIdx);
      }

      this.phaseRafId = requestAnimationFrame(updatePhase);
    };

    this.phaseRafId = requestAnimationFrame(updatePhase);
  }

  // --- Reset Stats ---

  resetStats() {
    this.stats = {
      totalStrokes: 0,
      totalNotes: 0,
      perfectCount: 0,
      earlyCount: 0,
      lateCount: 0,
      offBeatCount: 0,
      streak: 0,
      bestStreak: 0,
      accuracy: 100,
      rhythmScore: 100,
      sumPoints: 0,
      rollingOffsets: [],
      avgOffsetMs: 0,
      tendency: 'pocket',
      recentHits: []
    };
    if (this.onStatsUpdated) {
      this.onStatsUpdated(this.stats);
    }
  }

  // --- Live Note Processing & Rhythm Assessment ---

  /**
   * Handle incoming note strike (MIDI, Virtual Piano, Computer Keyboard)
   */
  onNotePlayed(midi, velocity = 100) {
    const now = this.getAudioTime();
    this.activeStrokeNotes.set(midi, now);

    if (!this.isActive) return null;

    this.stats.totalNotes++;

    // Collect notes arriving within debounce window into a single harmonic stroke
    this.pendingStrokeNotes.push({ midi, velocity });

    if (this.chordDebounceTimer) {
      // Already waiting to evaluate this stroke onset
      return null;
    }

    // Capture the primary stroke onset time
    const strokeOnset = now;

    this.chordDebounceTimer = setTimeout(() => {
      this.evaluateStroke(strokeOnset, [...this.pendingStrokeNotes]);
      this.pendingStrokeNotes = [];
      this.chordDebounceTimer = null;
    }, this.chordDebounceMs);

    return null;
  }

  /**
   * Handle note release to detect played duration (Whole, Half, Quarter, 8th, 16th)
   */
  onNoteReleased(midi) {
    const onset = this.activeStrokeNotes.get(midi);
    if (!onset) return null;
    this.activeStrokeNotes.delete(midi);

    const now = this.getAudioTime();
    const durationMs = Math.max(0, (now - onset) * 1000.0);
    const beatDurMs = (60.0 / this.bpm) * 1000.0;
    const rawBeats = durationMs / beatDurMs;

    const durationInfo = this.quantizeDuration(rawBeats, durationMs);
    this.lastDetectedDuration = durationInfo;
    if (this.onDurationDetected) {
      this.onDurationDetected(midi, durationInfo);
    }
    return durationInfo;
  }

  /**
   * Quantize raw duration in beats into classical note duration
   */
  quantizeDuration(rawBeats, durationMs) {
    let name = 'Quarter Note';
    let symbol = '♩';
    let standardBeats = 1.0;
    let isHollow = false;
    let isWhole = false;

    if (rawBeats >= 3.25) {
      name = 'Whole Note';
      symbol = '𝅝';
      standardBeats = 4.0;
      isHollow = true;
      isWhole = true;
    } else if (rawBeats >= 2.4) {
      name = 'Dotted Half Note';
      symbol = '𝅗𝅥.';
      standardBeats = 3.0;
      isHollow = true;
    } else if (rawBeats >= 1.45) {
      name = 'Half Note';
      symbol = '𝅗𝅥';
      standardBeats = 2.0;
      isHollow = true;
    } else if (rawBeats >= 1.2) {
      name = 'Dotted Quarter Note';
      symbol = '♩.';
      standardBeats = 1.5;
    } else if (rawBeats >= 0.65) {
      name = 'Quarter Note';
      symbol = '♩';
      standardBeats = 1.0;
    } else if (rawBeats >= 0.35) {
      name = 'Eighth Note';
      symbol = '♪';
      standardBeats = 0.5;
    } else {
      name = 'Sixteenth Note';
      symbol = '♬';
      standardBeats = 0.25;
    }

    return {
      name,
      symbol,
      standardBeats,
      rawBeats: Math.round(rawBeats * 100) / 100,
      durationMs: Math.round(durationMs),
      isHollow,
      isWhole
    };
  }

  /**
   * Evaluate a rhythmic stroke (single note or chord) against metronome grid
   */
  evaluateStroke(strokeOnsetSec, notes) {
    if (!this.isMetronomeRunning || this.metronomeStartTime === null) {
      // Metronome not running: record stroke but indicate metronome paused
      const evalResult = {
        rating: 'unscored',
        offsetMs: 0,
        subdivision: 'Unscored',
        text: 'Metronome Off',
        notes
      };
      if (this.onStrokeEvaluated) this.onStrokeEvaluated(evalResult, this.stats);
      return evalResult;
    }

    const beatDur = 60.0 / this.bpm;
    // Apply hardware latency compensation:
    // If audio is delayed by 20ms, the player played 20ms earlier than registered.
    const effectiveSec = strokeOnsetSec - (this.latencyCompensationMs / 1000.0);
    const elapsedSec = effectiveSec - this.metronomeStartTime;
    const fractionalBeat = elapsedSec / beatDur;

    // Tolerance thresholds by mode
    let perfectTol = 45; // ms
    let goodTol = 120;    // ms
    if (this.toleranceMode === 'strict') {
      perfectTol = 30;
      goodTol = 80;
    } else if (this.toleranceMode === 'relaxed') {
      perfectTol = 70;
      goodTol = 180;
    }

    // Grid snapping logic
    const gridResult = this.snapToGrid(fractionalBeat, beatDur);
    const offsetMs = gridResult.offsetMs;
    const absOffset = Math.abs(offsetMs);

    let rating = 'off_beat';
    let points = 25;
    let text = '';

    if (absOffset <= perfectTol) {
      rating = 'perfect';
      points = 100;
      text = `🟢 PERFECT (${offsetMs >= 0 ? '+' : ''}${Math.round(offsetMs)}ms)`;
      this.stats.perfectCount++;
      this.stats.streak++;
    } else if (absOffset <= goodTol) {
      points = 75;
      this.stats.streak++;
      if (offsetMs < 0) {
        rating = 'early';
        text = `🟡 EARLY (${Math.round(offsetMs)}ms)`;
        this.stats.earlyCount++;
      } else {
        rating = 'late';
        text = `🟡 LATE (+${Math.round(offsetMs)}ms)`;
        this.stats.lateCount++;
      }
    } else {
      rating = 'off_beat';
      points = 20;
      text = `🔴 OFF-BEAT (${offsetMs >= 0 ? '+' : ''}${Math.round(offsetMs)}ms)`;
      this.stats.offBeatCount++;
      this.stats.streak = 0; // Reset streak on off-beat
    }

    this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.streak);
    this.stats.totalStrokes++;
    this.stats.sumPoints += points;

    // Rolling accuracy (% of max points)
    this.stats.rhythmScore = Math.round(this.stats.sumPoints / this.stats.totalStrokes);

    // Exact on-pocket percentage (perfect + early + late vs off-beat)
    const onBeatCount = this.stats.perfectCount + this.stats.earlyCount + this.stats.lateCount;
    this.stats.accuracy = Math.round((onBeatCount / this.stats.totalStrokes) * 100);

    // Rolling Tendency Analysis (last 20 strokes)
    this.stats.rollingOffsets.push(offsetMs);
    if (this.stats.rollingOffsets.length > 20) {
      this.stats.rollingOffsets.shift();
    }
    const sumOff = this.stats.rollingOffsets.reduce((a, b) => a + b, 0);
    this.stats.avgOffsetMs = Math.round(sumOff / this.stats.rollingOffsets.length);

    if (this.stats.avgOffsetMs < -18) {
      this.stats.tendency = 'rushing';
    } else if (this.stats.avgOffsetMs > 18) {
      this.stats.tendency = 'dragging';
    } else {
      this.stats.tendency = 'pocket';
    }

    const evalResult = {
      rating,
      offsetMs: Math.round(offsetMs),
      subdivision: gridResult.subdivision,
      metricLabel: gridResult.metricLabel,
      text,
      points,
      notes,
      timestamp: performance.now()
    };

    // Add to recent hits tape (last 12)
    this.stats.recentHits.unshift(evalResult);
    if (this.stats.recentHits.length > 12) {
      this.stats.recentHits.pop();
    }

    if (this.onStrokeEvaluated) {
      this.onStrokeEvaluated(evalResult, this.stats);
    }
    if (this.onStatsUpdated) {
      this.onStatsUpdated(this.stats);
    }

    return evalResult;
  }

  /**
   * Snap fractional beat to metric grid points based on active gridMode
   */
  snapToGrid(fractionalBeat, beatDurSec) {
    const beatMs = beatDurSec * 1000.0;

    // 1. Quarter note (main beats: 0.0, 1.0, 2.0...)
    const nearestQuarterBeat = Math.round(fractionalBeat);
    const quarterDeltaMs = (fractionalBeat - nearestQuarterBeat) * beatMs;

    // 2. Eighth note (0.0, 0.5, 1.0, 1.5...)
    const nearestEighthBeat = Math.round(fractionalBeat * 2) / 2;
    const eighthDeltaMs = (fractionalBeat - nearestEighthBeat) * beatMs;

    // 3. Sixteenth note (0.0, 0.25, 0.5, 0.75...)
    const nearest16thBeat = Math.round(fractionalBeat * 4) / 4;
    const sixteenthDeltaMs = (fractionalBeat - nearest16thBeat) * beatMs;

    // 4. Triplet (0.0, 0.333, 0.667...)
    const nearestTripletBeat = Math.round(fractionalBeat * 3) / 3;
    const tripletDeltaMs = (fractionalBeat - nearestTripletBeat) * beatMs;

    let chosenDeltaMs = quarterDeltaMs;
    let chosenBeatPosition = nearestQuarterBeat;
    let subdivisionType = 'quarter';

    switch (this.gridMode) {
      case 'quarter':
        chosenDeltaMs = quarterDeltaMs;
        chosenBeatPosition = nearestQuarterBeat;
        subdivisionType = 'quarter';
        break;

      case 'eighth':
        chosenDeltaMs = eighthDeltaMs;
        chosenBeatPosition = nearestEighthBeat;
        subdivisionType = (chosenBeatPosition % 1.0 === 0) ? 'quarter' : 'eighth';
        break;

      case 'sixteenth':
        chosenDeltaMs = sixteenthDeltaMs;
        chosenBeatPosition = nearest16thBeat;
        const frac16 = Math.abs(chosenBeatPosition % 1.0);
        if (frac16 === 0) subdivisionType = 'quarter';
        else if (Math.abs(frac16 - 0.5) < 0.01) subdivisionType = 'eighth';
        else subdivisionType = 'sixteenth';
        break;

      case 'triplet':
        chosenDeltaMs = tripletDeltaMs;
        chosenBeatPosition = nearestTripletBeat;
        subdivisionType = (chosenBeatPosition % 1.0 === 0) ? 'quarter' : 'triplet';
        break;

      case 'smart':
      default:
        // Smart Adaptive Grid:
        // Checks Quarter, Eighth, Sixteenth, Triplet. Selects the subdivision
        // with the smallest absolute timing error.
        const candidates = [
          { type: 'quarter', delta: quarterDeltaMs, pos: nearestQuarterBeat },
          { type: 'eighth', delta: eighthDeltaMs, pos: nearestEighthBeat },
          { type: 'sixteenth', delta: sixteenthDeltaMs, pos: nearest16thBeat },
          { type: 'triplet', delta: tripletDeltaMs, pos: nearestTripletBeat }
        ];

        candidates.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
        const best = candidates[0];
        chosenDeltaMs = best.delta;
        chosenBeatPosition = best.pos;
        subdivisionType = best.type;
        break;
    }

    // Build human-friendly metric label:
    // Determine measure beat (1-indexed) and fractional name
    const measureBeats = this.beatsPerMeasure || 4;
    const measureIntBeat = ((Math.floor(chosenBeatPosition) % measureBeats) + measureBeats) % measureBeats + 1;
    const frac = ((chosenBeatPosition % 1.0) + 1.0) % 1.0;

    let metricLabel = `Beat ${measureIntBeat}`;
    if (measureIntBeat === 1 && frac < 0.05) {
      metricLabel = 'Downbeat (1)';
    } else if (Math.abs(frac - 0.5) < 0.05) {
      metricLabel = `Beat ${measureIntBeat} &`;
    } else if (Math.abs(frac - 0.25) < 0.05) {
      metricLabel = `Beat ${measureIntBeat} e`;
    } else if (Math.abs(frac - 0.75) < 0.05) {
      metricLabel = `Beat ${measureIntBeat} a`;
    } else if (Math.abs(frac - 0.333) < 0.05 || Math.abs(frac - 0.667) < 0.05) {
      metricLabel = `Beat ${measureIntBeat} Triplet`;
    }

    return {
      offsetMs: chosenDeltaMs,
      subdivision: subdivisionType,
      metricLabel,
      gridBeatPosition: chosenBeatPosition
    };
  }
}
