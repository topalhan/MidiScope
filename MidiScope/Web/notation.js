/**
 * High-Performance Real-Time Sheet Music & Grand Staff Canvas Visualizer
 * Supports Live Chord View & Continuous Scrolling Timeline View.
 */

import { MusicTheory } from './chords.js';

// Standard SMuFL Bravura Vector Clefs (1 staff space = 355 font units)
const BRAVURA_G_CLEF_PATH = 'M 541 -598 C 539 -615 541 -616 550 -625 C 706 -770 824 -953 824 -1174 C 824 -1299 789 -1423 730 -1509 C 708 -1541 671 -1581 655 -1581 C 635 -1581 590 -1544 562 -1512 C 455 -1394 420 -1214 420 -1064 C 420 -981 431 -887 441 -828 C 444 -811 445 -808 428 -793 C 220 -622 0 -416 0 -125 C 0 125 171 363 524 363 C 557 363 595 360 624 354 C 639 351 642 350 645 367 C 662 464 684 589 684 657 C 684 870 540 896 455 896 C 377 896 340 873 340 854 C 340 844 353 840 386 829 C 431 816 482 778 482 694 C 482 615 432 547 344 547 C 248 547 190 624 190 713 C 190 806 246 948 464 948 C 560 948 747 904 747 660 C 747 577 721 441 706 351 C 703 334 704 336 724 327 C 870 269 966 147 966 -16 C 966 -200 831 -363 619 -363 C 582 -363 582 -363 577 -389 Z M 677 -1358 C 724 -1358 763 -1319 763 -1240 C 763 -1080 626 -950 513 -851 C 503 -842 497 -844 494 -863 C 488 -900 485 -949 485 -995 C 485 -1220 589 -1358 677 -1358 Z M 520 -377 C 524 -350 524 -351 498 -343 C 372 -300 289 -186 289 -63 C 289 66 357 158 455 192 C 467 196 484 200 494 200 C 505 200 511 193 511 184 C 511 174 500 170 490 166 C 429 140 386 78 386 12 C 386 -71 442 -132 530 -157 C 553 -163 556 -161 559 -145 L 631 284 C 634 300 632 300 611 304 C 588 308 559 311 530 311 C 278 311 115 171 115 -29 C 115 -114 130 -228 249 -363 C 336 -459 402 -513 469 -567 C 484 -579 487 -577 490 -562 Z M 619 -148 C 616 -166 618 -170 635 -168 C 752 -158 848 -60 848 66 C 848 157 793 230 713 271 C 696 279 693 279 690 262 Z';

const BRAVURA_F_CLEF_PATH = 'M 363 -377 C 112 -377 0 -194 0 -56 C 0 59 60 158 177 158 C 268 158 330 95 330 6 C 330 -86 262 -144 192 -144 C 153 -144 138 -134 120 -134 C 101 -134 96 -145 96 -160 C 96 -217 183 -323 330 -323 C 482 -323 549 -173 549 53 C 549 455 350 680 14 871 C 1 878 -7 886 -7 897 C -7 906 -1 914 12 914 C 19 914 27 912 36 907 C 390 734 765 478 765 40 C 765 -210 612 -377 363 -377 Z M 906 -259 C 861 -259 827 -225 827 -180 C 827 -135 861 -101 906 -101 C 950 -101 985 -135 985 -180 C 985 -225 950 -259 906 -259 Z M 907 102 C 863 102 829 135 829 180 C 829 225 863 258 907 258 C 952 258 985 225 985 180 C 985 135 952 102 907 102 Z';

// Standard SMuFL Bravura Vector Accidentals
const BRAVURA_FLAT_PATH = 'M 17 245 C 22 251 26 252 30 252 C 35 252 39 249 39 249 C 82 225 117 186 153 161 C 281 72 325 -16 325 -82 C 325 -164 262 -216 196 -220 C 171 -220 137 -209 117 -196 C 108 -189 92 -176 85 -176 C 82 -176 81 -176 78 -177 C 68 -181 62 -192 62 -202 C 63 -233 72 -579 72 -608 C 72 -624 59 -632 45 -632 C 24 -632 1 -618 0 -592 C 0 -592 6 230 17 245 Z M 68 117 C 68 117 63 30 63 -27 C 63 -50 65 -68 66 -73 C 76 -102 134 -144 167 -144 C 209 -144 226 -96 226 -60 C 226 17 160 95 98 134 C 92 137 88 138 84 138 C 71 138 68 124 68 117 Z';
const BRAVURA_SHARP_PATH = 'M 341 -170 C 351 -174 359 -186 359 -194 L 359 -297 C 359 -304 354 -308 348 -308 C 346 -308 344 -308 341 -307 C 341 -307 312 -295 305 -294 C 295 -294 285 -301 285 -312 L 285 -488 C 285 -497 276 -504 265 -504 C 251 -504 242 -497 242 -488 L 242 -301 C 240 -287 236 -268 223 -259 C 206 -249 157 -229 132 -223 C 120 -223 115 -240 115 -252 L 115 -425 C 115 -433 105 -441 95 -441 C 81 -441 72 -433 72 -425 L 72 -230 C 72 -210 63 -196 55 -192 C 46 -187 17 -176 17 -176 C 7 -173 0 -161 0 -153 L 0 -50 C 0 -42 4 -37 13 -37 L 16 -39 C 17 -39 39 -48 50 -53 L 52 -55 C 63 -55 72 -40 72 -29 L 72 114 C 72 130 65 143 56 147 C 48 150 17 163 17 163 C 7 166 0 177 0 186 L 0 288 C 0 297 4 301 13 301 L 16 300 C 17 300 37 291 50 287 C 52 285 53 285 55 285 C 65 285 72 301 72 308 L 72 485 C 72 494 81 501 91 501 C 105 501 115 494 115 485 L 115 285 C 115 266 122 256 130 253 L 217 217 C 217 217 219 217 219 217 L 222 216 C 235 216 242 233 242 242 L 242 422 C 242 431 251 438 261 438 C 276 438 285 431 285 422 L 285 217 C 285 206 291 189 301 184 C 311 180 341 168 341 168 C 351 164 359 153 359 144 L 359 42 C 359 35 354 30 348 30 C 346 30 344 30 341 32 L 304 46 C 295 46 285 37 285 20 L 285 -114 C 285 -124 292 -151 304 -156 Z M 242 65 C 233 94 166 122 132 122 C 124 122 117 120 115 115 C 112 109 111 78 111 43 C 111 -1 112 -52 115 -63 C 118 -88 184 -118 220 -118 C 230 -118 239 -115 242 -109 C 245 -102 248 -66 248 -27 C 248 12 245 52 242 65 Z';
const BRAVURA_NATURAL_PATH = 'M 203 -261 C 200 -261 199 -259 197 -259 C 197 -259 105 -226 68 -226 C 59 -226 53 -228 53 -233 L 53 -474 C 53 -484 45 -491 36 -491 L 17 -491 C 7 -491 0 -484 0 -474 L 0 268 C 0 276 4 281 13 281 L 16 279 C 17 279 20 279 22 278 C 42 269 122 235 164 235 C 179 235 189 239 189 251 L 189 465 C 189 475 196 482 206 482 L 225 482 C 233 482 242 475 242 465 L 242 -258 C 242 -265 236 -269 230 -269 C 229 -269 226 -269 225 -268 Z M 53 -56 C 53 -76 141 -114 176 -114 C 184 -114 189 -112 189 -107 L 189 42 C 189 68 107 101 71 101 C 60 101 53 98 53 92 Z';

// Standard SMuFL Bravura Vector Noteheads and Flags
const BRAVURA_NOTEHEADBLACK_PATH = 'M 140 180 C 268 180 425 62 425 -60 C 425 -134 367 -180 285 -180 C 127 -180 0 -63 0 60 C 0 135 62 180 140 180 Z';
const BRAVURA_NOTEHEADHALF_PATH = 'M 140 180 C 377 180 425 -13 425 -60 C 425 -134 366 -180 282 -180 C 68 -180 0 -14 0 60 C 0 137 60 180 140 180 Z M 108 125 C 78 125 60 109 50 92 C 46 84 42 73 42 63 C 42 -7 251 -121 318 -121 C 346 -121 361 -108 372 -91 C 376 -82 380 -73 380 -63 C 380 -1 177 125 108 125 Z';
const BRAVURA_NOTEHEADWHOLE_PATH = 'M 311 -180 C 120 -180 0 -101 0 -3 C 0 94 82 180 297 180 C 533 180 608 98 608 -3 C 608 -105 445 -180 311 -180 Z M 160 -91 C 176 -141 229 -148 274 -148 C 373 -148 452 -42 452 45 C 452 89 433 130 386 141 C 372 145 356 147 341 147 C 289 147 236 112 206 72 C 177 39 156 -10 156 -56 C 156 -68 157 -79 160 -91 Z';
const BRAVURA_FLAG8THUP_PATH = 'M 343 1138 C 343 1138 380 1001 380 888 C 380 708 305 539 215 395 C 141 281 81 157 58 19 C 53 -4 42 -13 27 -13 C 12 -13 0 -9 0 9 L 0 353 C 95 370 232 566 284 688 C 305 737 318 819 318 904 C 318 969 308 1037 284 1102 C 281 1110 279 1117 279 1123 C 279 1146 294 1159 302 1165 C 311 1171 336 1162 343 1138 Z';
const BRAVURA_FLAG8THDOWN_PATH = 'M 346 -1094 C 366 -1034 376 -962 376 -897 C 376 -812 340 -691 318 -642 C 265 -521 193 -405 0 -340 L 0 -1 C 0 13 12 20 23 20 C 36 20 55 12 58 -12 C 82 -148 189 -274 262 -387 C 353 -530 441 -701 441 -881 C 441 -994 412 -1096 400 -1142 C 396 -1158 387 -1164 377 -1164 C 356 -1164 331 -1136 346 -1094 Z';

export class NotationRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.options = {
      theme: 'dark',           // 'dark' or 'light'
      preferFlats: false,       // true for flats, false for sharps
      showNoteNames: true,      // show letter name near note
      mode: 'live',             // 'live' or 'scrolling'
      lineSpacing: 16,          // distance between staff lines in px
      activeGlowColor: '#38bdf8',// vibrant sky-blue glow
      bassActiveColor: '#a855f7',// vibrant purple glow for bass
      scrollSpeed: 120,         // pixels per second in scrolling mode
      splitPoint: 60,           // Middle C split point for treble/bass
      showIntervalContour: true,// Color-coded interval ribbons (Step=Green, Skip=Orange, Leap=Purple)
      accidentalAlert: true,    // Accidental Alert flash for notes deviating from key signature
      keySignature: 'C Major',  // Active key signature for diatonic vs deviation reference
      disrupterMode: 'none',     // 'none', 'vanishing_bar', 'advance_curtain'
      decoupledEyeCursor: false, // true = display decoupled eye cursor 1 measure ahead
      bpm: 108,                 // Metronome tempo for duration calculation
      rhythmTrainerActive: false, // Free Play scrolling rhythm score with timing badges
      beatsPerMeasure: 4,       // Time signature metric for barlines
      staffLayout: 'vertical',  // 'vertical' (2 staves scrolling vertically) or 'horizontal' (single staff)
      showBassClef: 'auto',     // 'auto' (show only when piece has bass notes), 'always', 'never'
      ...options
    };

    // Active held notes: Map of midiNote -> { midi, velocity, startTime, releasedTime, active }
    this.activeNotes = new Map();
    // History of played notes for scrolling timeline mode
    this.noteHistory = []; // { midi, velocity, startTime, endTime, active }
    // Melodic phrase buffer for live Free Play contour & broken thirds
    this.recentPhrase = [];
    // Free Play Rhythm Trainer scrolling stream: array of stroke columns with millisecond accuracy
    this.rhythmStream = [];
    this.rhythmScrollX = 0;

    // Fading notes cache for smooth visual release
    this.fadingNotes = new Map();

    // HiDPI metrics
    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;

    // Time tracking
    this.lastFrameTime = performance.now();
    this.animationFrameId = null;

    // Mistake Review & Interactive Navigation
    this.activeReviewMistakeIndex = -1;
    this.prevMistakeBtnBounds = null;
    this.nextMistakeBtnBounds = null;
    this.reviewPillBounds = null;
    this.noteHitboxes = [];
    this.onReviewNoteChanged = null;
    this.freePlayReviewNote = null;

    // Score dragging & scrolling (Horizontal & Vertical Multi-Line)
    this.manualScrollOffset = 0;
    this.smoothVerticalScroll = 0;
    this.manualVerticalScrollOffset = 0;
    this.isUserDragging = false;
    this.dragStartX = 0;
    this.dragStartScroll = 0;

    // Strict Sight-Reading playhead & Recovery tracking
    this.playheadBeats = 0;
    this.flashRecoveryTimestamp = 0;

    // Waterfall Mode State & Particle Systems
    this.waterfallParticles = [];
    this.waterfallFloatingTexts = [];
    this.canvasWaterfallKeys = {};
    this.canvasPressedMidi = null;
    this.smoothWaitBeats = 0;
    this.waterfallRestartBtnBounds = null;
    this.onCanvasKeyNoteOn = null;
    this.onCanvasKeyNoteOff = null;
    this.onWaterfallRestart = null;

    this.initCanvas();
    this.setupInteractionEvents();
    this.startRenderLoop();
  }

  initCanvas() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || this.canvas.clientWidth || 800;
    this.height = rect.height || this.canvas.clientHeight || 380;

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    if (this.options.mode === 'practice' || this.practiceData || this.options.rhythmTrainerActive) {
      this.setCanvasCursor('grab');
    }
  }

  resize() {
    this.initCanvas();
  }

  setOption(key, value) {
    this.options[key] = value;
    if (key === 'staffLayout') {
      if (value !== 'waterfall' && this.options.mode === 'waterfall') {
        this.options.mode = this.practiceData ? 'practice' : 'live';
      }
    } else if (key === 'mode') {
      if (value !== 'waterfall' && this.options.staffLayout === 'waterfall') {
        this.options.staffLayout = 'vertical';
      }
    }
    if (key === 'mode' || key === 'staffLayout') {
      if (this.isWaterfallActive() || this.options.mode === 'practice') {
        this.setCanvasCursor('grab');
      } else {
        this.setCanvasCursor('default');
      }
    }
  }

  isWaterfallActive() {
    if (this.options.staffLayout === 'waterfall') return true;
    if (this.options.mode === 'waterfall') {
      if (this.options.staffLayout === 'vertical' || this.options.staffLayout === 'horizontal') {
        return false;
      }
      return true;
    }
    return false;
  }

  setKeySignature(key) {
    this.setOption('keySignature', key);
  }

  /**
   * Determine whether the Bass Clef staff should be shown.
   * If option is 'always' -> true
   * If option is 'never' -> false
   * If option is 'auto' (default) -> only show if the active piece contains notes below splitPoint (Middle C / 60)
   */
  shouldShowBassClef() {
    if (this.options.showBassClef === 'always') return true;
    if (this.options.showBassClef === 'never') return false;

    // 'auto': only show if the active piece contains notes below splitPoint
    if (this.options.mode === 'practice' && this.practiceData && this.practiceData.melody && Array.isArray(this.practiceData.melody.notes)) {
      return this.practiceData.melody.notes.some(n => typeof n.midi === 'number' && n.midi < this.options.splitPoint);
    }

    return true;
  }

  setDisrupterMode(mode) {
    this.options.disrupterMode = mode;
  }

  setDecoupledEyeCursor(enabled) {
    this.options.decoupledEyeCursor = !!enabled;
  }

  /**
   * Set high-contrast theme-aware cursor on the staff canvas
   */
  setCanvasCursor(cursorType) {
    if (!this.canvas) return;
    this.canvas.dataset.cursor = cursorType;
    if (cursorType === 'grab') {
      this.canvas.style.cursor = 'var(--cursor-canvas-grab, grab)';
    } else if (cursorType === 'grabbing') {
      this.canvas.style.cursor = 'var(--cursor-canvas-grabbing, grabbing)';
    } else if (cursorType === 'pointer') {
      this.canvas.style.cursor = 'var(--cursor-canvas-pointer, pointer)';
    } else {
      this.canvas.style.cursor = cursorType || 'default';
    }
  }

  /**
   * Set up pointer and touch interaction for mistake review and score panning
   */
  setupInteractionEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const isInside = (pos, b) => b && pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height;

    this.canvas.addEventListener('pointerdown', (e) => {
      const pos = getPos(e);

      // 0. Waterfall Mode Interactions (Clicking Keys or Restart Button)
      if (this.isWaterfallActive()) {
        if (this.waterfallRestartBtnBounds && isInside(pos, this.waterfallRestartBtnBounds)) {
          e.preventDefault();
          this.onWaterfallRestart?.();
          return;
        }
        const hitMidi = this.getWaterfallKeyAtPos(pos);
        if (hitMidi !== null) {
          e.preventDefault();
          this.canvasPressedMidi = hitMidi;
          this.onCanvasKeyNoteOn?.(hitMidi);
          return;
        }
      }

      // 1. Check Prev Mistake Button click
      if (this.prevMistakeBtnBounds && isInside(pos, this.prevMistakeBtnBounds)) {
        e.preventDefault();
        this.previousMistake();
        return;
      }

      // 2. Check Next Mistake Button click
      if (this.nextMistakeBtnBounds && isInside(pos, this.nextMistakeBtnBounds)) {
        e.preventDefault();
        this.nextMistake();
        return;
      }

      // 3. Direct click on mistake notes on staff when finished
      if (this.practiceData && this.practiceData.isFinished) {
        for (const hb of this.noteHitboxes) {
          if (isInside(pos, hb.bounds)) {
            const results = this.practiceData.noteResults || [];
            const res = results[hb.index];
            if (res && (res.mistakes > 0 || res.status === 'mistake' || res.status === 'missed')) {
              e.preventDefault();
              this.jumpToMistake(hb.index);
              return;
            }
          }
        }
      }

      // 4. Score horizontal drag panning
      if (this.options.mode === 'practice' || this.practiceData || this.options.rhythmTrainerActive) {
        this.isUserDragging = true;
        this.dragStartX = pos.x;
        this.dragStartScroll = this.manualScrollOffset;
        this.setCanvasCursor('grabbing');
        try { this.canvas.setPointerCapture?.(e.pointerId); } catch (_) {}
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const pos = getPos(e);

      if (this.isWaterfallActive()) {
        if (this.canvasPressedMidi !== null) {
          const hitMidi = this.getWaterfallKeyAtPos(pos);
          if (hitMidi !== null && hitMidi !== this.canvasPressedMidi) {
            this.onCanvasKeyNoteOff?.(this.canvasPressedMidi);
            this.canvasPressedMidi = hitMidi;
            this.onCanvasKeyNoteOn?.(hitMidi);
          }
        }
        const hoverMidi = this.getWaterfallKeyAtPos(pos);
        if (hoverMidi !== null || (this.waterfallRestartBtnBounds && isInside(pos, this.waterfallRestartBtnBounds))) {
          this.setCanvasCursor('pointer');
        } else {
          this.setCanvasCursor('default');
        }
        return;
      }

      if (this.isUserDragging) {
        const deltaX = pos.x - this.dragStartX;
        this.manualScrollOffset = this.dragStartScroll - deltaX;
      } else if (this.options.mode === 'practice' || this.practiceData || this.options.rhythmTrainerActive) {
        let isClickable = false;
        if ((this.prevMistakeBtnBounds && isInside(pos, this.prevMistakeBtnBounds)) ||
            (this.nextMistakeBtnBounds && isInside(pos, this.nextMistakeBtnBounds))) {
          isClickable = true;
        } else if (this.practiceData && this.practiceData.isFinished && this.noteHitboxes) {
          for (const hb of this.noteHitboxes) {
            if (isInside(pos, hb.bounds)) {
              const res = (this.practiceData.noteResults || [])[hb.index];
              if (res && (res.mistakes > 0 || res.status === 'mistake' || res.status === 'missed')) {
                isClickable = true;
                break;
              }
            }
          }
        }
        if (isClickable) {
          this.setCanvasCursor('pointer');
        } else {
          this.setCanvasCursor('grab');
        }
      }
    });

    const endDrag = (e) => {
      this.isUserDragging = false;
      if (this.canvasPressedMidi !== null) {
        this.onCanvasKeyNoteOff?.(this.canvasPressedMidi);
        this.canvasPressedMidi = null;
      }
      if (this.isWaterfallActive()) {
        this.setCanvasCursor('default');
      } else if (this.options.mode === 'practice' || this.practiceData || this.options.rhythmTrainerActive) {
        this.setCanvasCursor('grab');
      } else {
        this.setCanvasCursor('default');
      }
      try { this.canvas.releasePointerCapture?.(e.pointerId); } catch (_) {}
    };

    this.canvas.addEventListener('pointerup', endDrag);
    this.canvas.addEventListener('pointercancel', endDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // Mouse wheel / trackpad scrolling
    this.canvas.addEventListener('wheel', (e) => {
      if (this.isWaterfallActive()) return;
      if (this.options.mode === 'practice' || this.practiceData || this.options.rhythmTrainerActive) {
        e.preventDefault();
        if (this.options.staffLayout === 'vertical') {
          const delta = (Math.abs(e.deltaY) > 0.001 ? e.deltaY : e.deltaX) * 0.003;
          this.manualVerticalScrollOffset = (this.manualVerticalScrollOffset || 0) + delta;
        } else {
          const delta = (Math.abs(e.deltaX) > 0.001 ? e.deltaX : e.deltaY) * 0.8;
          this.manualScrollOffset += delta;
        }
      }
    }, { passive: false });

    // Double click to reset / re-center score
    this.canvas.addEventListener('dblclick', (e) => {
      if (this.options.mode === 'practice' || this.practiceData || this.options.rhythmTrainerActive) {
        e.preventDefault();
        this.manualScrollOffset = 0;
        this.manualVerticalScrollOffset = 0;
      }
    });

    // Keyboard Arrow navigation for inspecting score
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (this.options.mode === 'practice' || this.practiceData || this.options.rhythmTrainerActive) {
        if (this.options.staffLayout === 'vertical') {
          if (e.code === 'ArrowUp') {
            this.manualVerticalScrollOffset = Math.max(0, (this.manualVerticalScrollOffset || 0) - 1);
            e.preventDefault();
          } else if (e.code === 'ArrowDown') {
            this.manualVerticalScrollOffset = (this.manualVerticalScrollOffset || 0) + 1;
            e.preventDefault();
          } else if (e.code === 'Home') {
            this.manualVerticalScrollOffset = 0;
            e.preventDefault();
          }
        } else {
          if (e.code === 'ArrowLeft') {
            this.manualScrollOffset = Math.max(0, this.manualScrollOffset - 80);
            e.preventDefault();
          } else if (e.code === 'ArrowRight') {
            this.manualScrollOffset += 80;
            e.preventDefault();
          } else if (e.code === 'Home') {
            this.manualScrollOffset = 0;
            e.preventDefault();
          }
        }
      }
    });
  }

  getMistakeNoteIndices() {
    if (!this.practiceData || !this.practiceData.melody || !this.practiceData.noteResults) return [];
    const indices = [];
    const results = this.practiceData.noteResults;
    for (let i = 0; i < results.length && i < this.practiceData.melody.notes.length; i++) {
      if (results[i].mistakes > 0 || results[i].status === 'mistake' || results[i].status === 'missed') {
        indices.push(i);
      }
    }
    return indices;
  }

  jumpToMistake(mistakeIndex) {
    this.activeReviewMistakeIndex = mistakeIndex;
    this.manualScrollOffset = 0;
    this.manualVerticalScrollOffset = 0;
    this.notifyReviewNoteChanged();
  }

  nextMistake() {
    const mistakes = this.getMistakeNoteIndices();
    if (mistakes.length === 0) return;
    const next = mistakes.find(idx => idx > this.activeReviewMistakeIndex);
    this.activeReviewMistakeIndex = (next !== undefined) ? next : mistakes[0];
    this.manualScrollOffset = 0;
    this.manualVerticalScrollOffset = 0;
    this.notifyReviewNoteChanged();
  }

  previousMistake() {
    const mistakes = this.getMistakeNoteIndices();
    if (mistakes.length === 0) return;
    const prev = [...mistakes].reverse().find(idx => idx < this.activeReviewMistakeIndex);
    this.activeReviewMistakeIndex = (prev !== undefined) ? prev : mistakes[mistakes.length - 1];
    this.manualScrollOffset = 0;
    this.manualVerticalScrollOffset = 0;
    this.notifyReviewNoteChanged();
  }

  notifyReviewNoteChanged() {
    if (this.onReviewNoteChanged && this.practiceData && this.practiceData.melody && this.activeReviewMistakeIndex >= 0) {
      const melody = this.practiceData.melody;
      if (this.activeReviewMistakeIndex < melody.notes.length) {
        const targetNote = melody.notes[this.activeReviewMistakeIndex];
        const res = (this.practiceData.noteResults && this.practiceData.noteResults[this.activeReviewMistakeIndex]) || null;
        this.onReviewNoteChanged({
          index: this.activeReviewMistakeIndex,
          targetMidi: targetNote.midi,
          targetNote,
          wrongMidi: res ? res.lastWrongMidi : null,
          mistakes: res ? res.mistakes : 0,
          timing: res ? res.timing : null
        });
      }
    }
  }

  /**
   * Set or clear active note for Free Play mistake inspection
   */
  setFreePlayReviewNote(note) {
    this.freePlayReviewNote = note;
  }

  /**
   * Handle note strike (Note On)
   */
  noteOn(midi, velocity = 100) {
    const now = performance.now();
    const noteData = {
      midi,
      velocity: Math.max(20, Math.min(127, velocity)),
      startTime: now,
      releasedTime: null,
      active: true
    };

    this.activeNotes.set(midi, noteData);
    this.fadingNotes.delete(midi);

    // In scrolling mode, add to history
    this.noteHistory.push({
      midi,
      velocity: noteData.velocity,
      startTime: now,
      endTime: null,
      active: true
    });

    // In live mode, add to recent melodic phrase
    this.recentPhrase.push({
      midi,
      velocity: noteData.velocity,
      startTime: now,
      endTime: null,
      active: true
    });

    // In Rhythm Trainer mode, add immediately to scrolling score stream (0ms input latency)
    if (this.options.rhythmTrainerActive || this.options.mode === 'rhythm_trainer') {
      const existingPending = this.rhythmStream[this.rhythmStream.length - 1];
      if (existingPending && existingPending.pending && (now - existingPending.timestamp) < 35) {
        if (!existingPending.notes.some(n => n.midi === midi)) {
          existingPending.notes.push({
            midi,
            velocity: noteData.velocity,
            active: true,
            startTime: now,
            releasedTime: null,
            duration: 1.0
          });
        }
      } else {
        this.rhythmStream.push({
          id: Date.now() + Math.random(),
          timestamp: now,
          pending: true,
          rating: null,
          offsetMs: null,
          duration: 1.0,
          notes: [{
            midi,
            velocity: noteData.velocity,
            active: true,
            startTime: now,
            releasedTime: null,
            duration: 1.0
          }]
        });
        if (this.rhythmStream.length > 500) {
          this.rhythmStream.shift();
        }
      }
    }

    // Limit history memory
    if (this.noteHistory.length > 500) {
      this.noteHistory.shift();
    }
    if (this.recentPhrase.length > 12) {
      this.recentPhrase.shift();
    }
  }

  /**
   * Handle note release (Note Off)
   */
  noteOff(midi) {
    const now = performance.now();
    const existing = this.activeNotes.get(midi);
    if (existing) {
      existing.active = false;
      existing.releasedTime = now;
      existing.duration = this.computeNoteDuration(existing, now);
      this.fadingNotes.set(midi, { ...existing });
      this.activeNotes.delete(midi);
    }

    // In Rhythm Trainer mode, mark note released and lock duration
    if (this.options.rhythmTrainerActive || this.options.mode === 'rhythm_trainer') {
      for (let i = this.rhythmStream.length - 1; i >= 0; i--) {
        const stroke = this.rhythmStream[i];
        const note = stroke.notes.find(n => n.midi === midi && n.active);
        if (note) {
          note.active = false;
          note.releasedTime = now;
          note.duration = this.computeNoteDuration(note, now);
          stroke.duration = Math.max(...stroke.notes.map(n => n.duration || 1.0));
          break;
        }
      }
    }

    // Update history note end time and lock duration
    for (let i = this.noteHistory.length - 1; i >= 0; i--) {
      if (this.noteHistory[i].midi === midi && this.noteHistory[i].active) {
        this.noteHistory[i].active = false;
        this.noteHistory[i].endTime = now;
        this.noteHistory[i].duration = this.computeNoteDuration(this.noteHistory[i], now);
        break;
      }
    }

    // Update phrase note end time and lock duration
    for (let i = this.recentPhrase.length - 1; i >= 0; i--) {
      if (this.recentPhrase[i].midi === midi && this.recentPhrase[i].active) {
        this.recentPhrase[i].active = false;
        this.recentPhrase[i].endTime = now;
        this.recentPhrase[i].duration = this.computeNoteDuration(this.recentPhrase[i], now);
        break;
      }
    }
  }

  /**
   * Record rhythm stroke evaluation into scrolling stream
   */
  recordRhythmStroke(result) {
    if (!result) return;
    const now = performance.now();
    let stroke = null;
    for (let i = this.rhythmStream.length - 1; i >= 0; i--) {
      const s = this.rhythmStream[i];
      if (s.pending || (now - s.timestamp) < 120) {
        stroke = s;
        break;
      }
    }

    if (stroke) {
      stroke.pending = false;
      stroke.offsetMs = result.offsetMs;
      stroke.rating = result.rating;
      stroke.subdivision = result.subdivision;
      stroke.metricLabel = result.metricLabel;
      stroke.notes.forEach(n => {
        n.offsetMs = result.offsetMs;
        n.timingRating = result.rating;
      });
    } else {
      stroke = {
        id: Date.now() + Math.random(),
        timestamp: now,
        pending: false,
        offsetMs: result.offsetMs,
        rating: result.rating,
        subdivision: result.subdivision,
        metricLabel: result.metricLabel,
        duration: 1.0,
        notes: (result.notes || []).map(n => ({
          midi: n.midi,
          velocity: n.velocity || 100,
          active: true,
          startTime: now,
          releasedTime: null,
          duration: 1.0,
          offsetMs: result.offsetMs,
          timingRating: result.rating
        }))
      };
      this.rhythmStream.push(stroke);
      if (this.rhythmStream.length > 500) {
        this.rhythmStream.shift();
      }
    }
  }

  /**
   * Update duration for note in rhythm stream upon release
   */
  updateRhythmNoteDuration(midi, durationInfo) {
    if (!durationInfo) return;
    const now = performance.now();
    for (let i = this.rhythmStream.length - 1; i >= 0; i--) {
      const stroke = this.rhythmStream[i];
      const note = stroke.notes.find(n => n.midi === midi);
      if (note) {
        note.active = false;
        note.releasedTime = now;
        note.duration = durationInfo.standardBeats;
        stroke.duration = Math.max(...stroke.notes.map(n => n.duration || 1.0));
        break;
      }
    }
  }

  /**
   * Clear recorded rhythm stream (for fresh song run)
   */
  clearRhythmStream() {
    this.rhythmStream = [];
    this.rhythmScrollX = 0;
    this.manualScrollOffset = 0;
  }

  /**
   * Attach timing assessment result to live sounding notes (for Free Play Rhythm Trainer)
   */
  setNoteTiming(midi, timingInfo) {
    if (!timingInfo || !timingInfo.rating || timingInfo.rating === 'unscored') return;
    const note = this.activeNotes.get(midi);
    if (note) {
      note.timingRating = timingInfo.rating;
      note.offsetMs = timingInfo.offsetMs;
    }
    const recent = this.recentPhrase.find(n => n.midi === midi && n.active);
    if (recent) {
      recent.timingRating = timingInfo.rating;
      recent.offsetMs = timingInfo.offsetMs;
    }
    const hist = this.noteHistory.find(n => n.midi === midi && n.active);
    if (hist) {
      hist.timingRating = timingInfo.rating;
      hist.offsetMs = timingInfo.offsetMs;
    }
  }

  /**
   * Dynamically detect musical duration (beats) from held/released time & active BPM
   */
  computeNoteDuration(note, timestamp) {
    if (note.duration !== undefined && typeof note.duration === 'number') {
      return note.duration;
    }

    const bpm = this.options.bpm || 108;
    const beatMs = 60000.0 / bpm;

    let elapsedMs = 0;
    if (note.active) {
      elapsedMs = Math.max(0, (timestamp || performance.now()) - (note.startTime || timestamp));
    } else if (note.releasedTime || note.endTime) {
      const end = note.releasedTime || note.endTime;
      elapsedMs = Math.max(0, end - (note.startTime || end));
    } else {
      return 1.0; // default quarter note
    }

    const rawBeats = elapsedMs / beatMs;

    // While note is actively sounding:
    // Starts as quarter note, and as held longer, transitions to half and whole note
    if (note.active) {
      if (rawBeats >= 3.25) return 4.0; // Whole Note
      if (rawBeats >= 2.4) return 3.0;  // Dotted Half Note
      if (rawBeats >= 1.45) return 2.0; // Half Note
      return 1.0; // Quarter Note
    }

    // Once key is released, quantize into nearest standard musical duration
    if (rawBeats >= 3.25) return 4.0; // Whole note (4 beats)
    if (rawBeats >= 2.4) return 3.0;  // Dotted half note (3 beats)
    if (rawBeats >= 1.45) return 2.0; // Half note (2 beats)
    if (rawBeats >= 1.2) return 1.5;  // Dotted quarter note (1.5 beats)
    if (rawBeats >= 0.65) return 1.0; // Quarter note (1 beat)
    if (rawBeats >= 0.35) return 0.5; // Eighth note (0.5 beat)
    return 0.25;                      // Sixteenth note (0.25 beat)
  }

  /**
   * Get human-readable name, Unicode note glyph, and beats for a duration
   */
  getDurationInfo(durationBeats) {
    const d = typeof durationBeats === 'number' ? durationBeats : 1.0;
    if (d >= 3.5) return { name: 'Whole Note', symbol: '𝅝', beats: 4, isHollow: true, isWhole: true };
    if (d >= 2.4) return { name: 'Dotted Half Note', symbol: '𝅗𝅥.', beats: 3, isHollow: true, isWhole: false, isDotted: true };
    if (d >= 1.45) return { name: 'Half Note', symbol: '𝅗𝅥', beats: 2, isHollow: true, isWhole: false };
    if (d >= 1.2) return { name: 'Dotted Quarter', symbol: '♩.', beats: 1.5, isHollow: false, isWhole: false, isDotted: true };
    if (d >= 0.65) return { name: 'Quarter Note', symbol: '♩', beats: 1, isHollow: false, isWhole: false };
    if (d >= 0.35) return { name: 'Eighth Note', symbol: '♪', beats: 0.5, isHollow: false, isWhole: false, flagCount: 1 };
    return { name: 'Sixteenth Note', symbol: '♬', beats: 0.25, isHollow: false, isWhole: false, flagCount: 2 };
  }

  clearNotes() {
    this.activeNotes.clear();
    this.fadingNotes.clear();
    this.recentPhrase = [];
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      try {
        this.render(timestamp);
      } catch (err) {
        console.error('Error in notation render frame:', err);
      } finally {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(loop);
  }

  ensureRenderLoop() {
    if (!this.animationFrameId) {
      this.startRenderLoop();
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Main Render Frame
   */
  render(timestamp) {
    const dt = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clean canvas
    ctx.clearRect(0, 0, w, h);

    // If Waterfall mode is active, render Waterfall directly and return
    if (this.isWaterfallActive()) {
      this.renderWaterfallMode(ctx, w, h, timestamp);
      return;
    }

    // Colors according to theme
    const isDark = this.options.theme === 'dark';
    const staffLineColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.42)';
    const staffBarColor  = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.65)';
    const clefColor      = isDark ? '#e2e8f0' : '#1e293b';

    const showBass = this.shouldShowBassClef();

    // Layout dimensions: dynamically scales with canvas height and width
    const isMobile = w < 640;
    const lineSpacing = Math.max(11, Math.min(16, Math.round(h * 0.040)));
    const staffHeight = lineSpacing * 4;
    const staffGap = showBass ? lineSpacing * 4.5 : 0;
    const totalGrandStaffHeight = showBass ? (staffHeight * 2 + staffGap) : staffHeight;

    const startY = Math.max(isMobile ? 32 : 36, (h - totalGrandStaffHeight) / 2);
    const trebleTopY = startY;
    const trebleBottomY = trebleTopY + staffHeight;
    const bassTopY = showBass ? (trebleBottomY + staffGap) : null;
    const bassBottomY = showBass ? (bassTopY + staffHeight) : null;

    const marginX = isMobile ? 18 : 50;
    const staffWidth = w - marginX * 2;

    // Draw Grand Staff infrastructure (for non-practice or horizontal single staff mode)
    if (this.options.mode !== 'practice' || this.options.staffLayout === 'horizontal') {
      this.drawGrandStaffLines(ctx, marginX, staffWidth, trebleTopY, bassTopY, lineSpacing, staffLineColor, staffBarColor);
    }

    const isRhythmTrainer = this.options.rhythmTrainerActive || this.options.mode === 'rhythm_trainer';

    if (this.options.mode !== 'practice' && !isRhythmTrainer) {
      this.drawClefs(ctx, marginX + (isMobile ? 14 : 20), trebleTopY, bassTopY, lineSpacing, clefColor);
    }

    // Clean up faded notes older than 450ms
    for (const [midi, note] of this.fadingNotes.entries()) {
      if (timestamp - note.releasedTime > 450) {
        this.fadingNotes.delete(midi);
      }
    }

    if (this.options.mode === 'practice') {
      this.renderPracticeMode(ctx, marginX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp);
    } else if (isRhythmTrainer) {
      this.renderRhythmTrainerMode(ctx, marginX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp);
    } else if (this.options.mode === 'live') {
      this.renderLiveMode(ctx, marginX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp);
    } else {
      this.renderScrollingMode(ctx, marginX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp);
    }

    if (this.freePlayReviewNote && this.options.mode !== 'practice') {
      this.renderFreePlayReviewHighlight(ctx, marginX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp);
    }
  }

  /**
   * Render glowing pulse beacon and callout card for active note review in Free Play
   */
  renderFreePlayReviewHighlight(ctx, marginX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp) {
    if (!this.freePlayReviewNote) return;
    const item = this.freePlayReviewNote;
    const midi = item.midi;
    const info = MusicTheory.getNoteInfo(midi, this.options.preferFlats);
    const clef = midi >= this.options.splitPoint ? 'treble' : 'bass';
    const staffPos = MusicTheory.getStaffPosition(info.diatonicStep, clef);
    const bottomY = clef === 'treble' ? trebleBottomY : bassBottomY;
    const noteY = bottomY - staffPos * (lineSpacing / 2);
    const noteX = marginX + staffWidth * 0.42;

    ctx.save();

    // 1. Ledger lines
    this.drawLedgerLines(ctx, noteX, staffPos, bottomY, lineSpacing);

    // 2. Pulse Beacon
    const isMistake = !!item.isMistake;
    const beaconColor = isMistake
      ? (item.keyEvaluation?.isDeviation ? '#f43f5e' : '#fbbf24')
      : '#10b981';
    const pulse = 0.5 + 0.5 * Math.sin(timestamp / 130);

    ctx.beginPath();
    ctx.arc(noteX, noteY, (lineSpacing * 1.15) + pulse * 6, 0, Math.PI * 2);
    ctx.fillStyle = beaconColor;
    ctx.globalAlpha = 0.22 + pulse * 0.18;
    ctx.fill();
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = beaconColor;
    ctx.globalAlpha = 0.85;
    ctx.stroke();

    // 3. Notehead
    ctx.globalAlpha = 1.0;
    this.drawNotehead(ctx, { x: noteX, y: noteY, midi, color: beaconColor }, lineSpacing, 1.0, timestamp);

    // 4. Accidental & Note Tag
    this.drawAccidental(ctx, { x: noteX, y: noteY, midi, info, active: true, clef }, lineSpacing, 1.0);

    // 5. Floating Review Callout Card
    const trebleTopY = trebleBottomY - lineSpacing * 4;
    const calloutY = Math.max(22, trebleTopY - lineSpacing * 1.6);

    let calloutText = `${info.fullName}`;
    if (item.keyEvaluation?.isDeviation) {
      const closest = (item.keyEvaluation.closestDiatonicNotes && item.keyEvaluation.closestDiatonicNotes.length > 0)
        ? item.keyEvaluation.closestDiatonicNotes.join(' / ')
        : 'In-key';
      calloutText = `⚠️ Played ${info.fullName} • Not in ${item.keySignature || 'Key'} (Closest: ${closest})`;
    } else if (item.timingEvaluation && item.timingEvaluation.rating && item.timingEvaluation.rating !== 'perfect') {
      const off = item.timingEvaluation.offsetMs || 0;
      calloutText = `⏱️ Played ${info.fullName} (${off >= 0 ? '+' : ''}${off}ms ${item.timingEvaluation.rating.toUpperCase()})`;
    } else {
      calloutText = `✨ Played ${info.fullName} • In Scale (${item.keySignature || 'Diatonic'})`;
    }

    ctx.font = '700 11px "Inter", sans-serif';
    const textW = ctx.measureText(calloutText).width;
    const padX = 10;
    const cardW = padX * 2 + textW;
    const cardH = 22;
    const cardX = Math.max(marginX, Math.min(marginX + staffWidth - cardW, noteX - cardW / 2));

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = beaconColor;
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(cardX, calloutY - cardH, cardW, cardH, 5);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(cardX, calloutY - cardH, cardW, cardH);
      ctx.strokeRect(cardX, calloutY - cardH, cardW, cardH);
    }

    // Downward arrow pointing to notehead
    ctx.fillStyle = beaconColor;
    ctx.beginPath();
    ctx.moveTo(noteX - 5, calloutY);
    ctx.lineTo(noteX + 5, calloutY);
    ctx.lineTo(noteX, calloutY + 6);
    ctx.closePath();
    ctx.fill();

    // Callout text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(calloutText, cardX + cardW / 2, calloutY - cardH / 2);

    ctx.restore();
  }

  /**
   * Draw the 5 lines of Treble & Bass staves plus connecting brackets
   */
  drawGrandStaffLines(ctx, x, width, trebleTopY, bassTopY, spacing, lineColor, barColor) {
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = lineColor;

    // Treble staff (5 lines)
    for (let i = 0; i < 5; i++) {
      const y = trebleTopY + i * spacing;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.stroke();
    }

    const hasBass = (bassTopY !== null && bassTopY !== undefined);

    // Bass staff (5 lines) - only if bassTopY is provided
    if (hasBass) {
      for (let i = 0; i < 5; i++) {
        const y = bassTopY + i * spacing;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.stroke();
      }
    }

    // Left Bar Line
    ctx.lineWidth = 2;
    ctx.strokeStyle = barColor;
    const trebleTop = trebleTopY;
    const bottomLineY = hasBass ? (bassTopY + spacing * 4) : (trebleTopY + spacing * 4);

    ctx.beginPath();
    ctx.moveTo(x, trebleTop);
    ctx.lineTo(x, bottomLineY);
    ctx.stroke();

    // Right Bar Line (measure end)
    ctx.beginPath();
    ctx.moveTo(x + width, trebleTop);
    ctx.lineTo(x + width, bottomLineY);
    ctx.stroke();

    // Curly Grand Staff Brace on left (only for Grand Staff with both staves)
    if (hasBass) {
      this.drawStaffBrace(ctx, x - 18, trebleTop - 6, bottomLineY + 6);
    }

    ctx.restore();
  }

  /**
   * Draw classic grand staff bracket/brace
   */
  drawStaffBrace(ctx, x, topY, bottomY) {
    const midY = (topY + bottomY) / 2;
    const height = bottomY - topY;
    const depth = 14;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = this.options.theme === 'dark' ? '#94a3b8' : '#475569';
    ctx.fillStyle = this.options.theme === 'dark' ? '#94a3b8' : '#475569';
    ctx.lineWidth = 2.5;

    // Vertical curve with central point
    ctx.moveTo(x + 4, topY);
    ctx.bezierCurveTo(x - depth * 0.4, topY + height * 0.15, x - depth, midY - height * 0.1, x - depth, midY);
    ctx.bezierCurveTo(x - depth, midY + height * 0.1, x - depth * 0.4, bottomY - height * 0.15, x + 4, bottomY);

    // Inner contour
    ctx.bezierCurveTo(x - depth * 0.2, bottomY - height * 0.15, x - depth * 0.6, midY + height * 0.08, x - depth * 0.6, midY);
    ctx.bezierCurveTo(x - depth * 0.6, midY - height * 0.08, x - depth * 0.2, topY + height * 0.15, x + 4, topY);

    ctx.fill();
    ctx.restore();
  }

  /**
   * Vector rendering of Treble and Bass clefs
   */
  drawClefs(ctx, x, trebleTopY, bassTopY, spacing, color) {
    ctx.save();
    ctx.fillStyle = color;

    if (!this.gClefPath2D && typeof Path2D !== 'undefined') {
      this.gClefPath2D = new Path2D(BRAVURA_G_CLEF_PATH);
    }
    if (!this.fClefPath2D && typeof Path2D !== 'undefined') {
      this.fClefPath2D = new Path2D(BRAVURA_F_CLEF_PATH);
    }

    const scale = spacing / 355.0;

    // --- TREBLE CLEF ---
    // Scaled to fit 5 lines with calligraphic weight
    // G4 line is Line 2 (4th line from top = trebleTopY + 3 * spacing)
    const gLineY = trebleTopY + 3 * spacing;
    ctx.save();
    ctx.translate(x + 2, gLineY);
    ctx.scale(scale, scale);
    if (this.gClefPath2D) {
      ctx.fill(this.gClefPath2D);
    }
    ctx.restore();

    // --- BASS CLEF (Only if bassTopY is provided) ---
    if (bassTopY !== null && bassTopY !== undefined) {
      // F3 line is Line 4 (2nd line from top = bassTopY + 1 * spacing)
      const fLineY = bassTopY + 1 * spacing;
      ctx.save();
      ctx.translate(x + 2, fLineY);
      ctx.scale(scale, scale);
      if (this.fClefPath2D) {
        ctx.fill(this.fClefPath2D);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Vector rendering of Flat accidental for key signature and notes
   */
  renderVectorFlat(ctx, x, y, spacing, color) {
    ctx.save();
    if (color) {
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
    }
    if (!this.flatPath2D && typeof Path2D !== 'undefined') {
      this.flatPath2D = new Path2D(BRAVURA_FLAT_PATH);
    }
    if (this.flatPath2D) {
      const scale = spacing / 340.0;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fill(this.flatPath2D);
      ctx.restore();
    } else {
      const h = spacing * 1.1;
      const w = spacing * 0.48;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.3, y - h * 0.65);
      ctx.lineTo(x - w * 0.3, y + h * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - w * 0.3, y + h * 0.35);
      ctx.bezierCurveTo(x + w * 1.1, y + h * 0.15, x + w * 0.8, y - h * 0.25, x - w * 0.3, y - h * 0.05);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Vector rendering of Sharp accidental for key signature and notes
   */
  renderVectorSharp(ctx, x, y, spacing, color) {
    ctx.save();
    if (color) {
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
    }
    if (!this.sharpPath2D && typeof Path2D !== 'undefined') {
      this.sharpPath2D = new Path2D(BRAVURA_SHARP_PATH);
    }
    if (this.sharpPath2D) {
      const scale = spacing / 340.0;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fill(this.sharpPath2D);
      ctx.restore();
    } else {
      const w = spacing * 0.46;
      const h = spacing * 0.95;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x - w / 3, y - h / 2);
      ctx.lineTo(x - w / 3, y + h / 2);
      ctx.moveTo(x + w / 3, y - h / 2 + 2);
      ctx.lineTo(x + w / 3, y + h / 2 + 2);
      ctx.stroke();
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.6, y - spacing * 0.2 + 2);
      ctx.lineTo(x + w * 0.6, y - spacing * 0.2 - 2);
      ctx.moveTo(x - w * 0.6, y + spacing * 0.2 + 2);
      ctx.lineTo(x + w * 0.6, y + spacing * 0.2 - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Vector rendering of Natural accidental for note alterations
   */
  renderVectorNatural(ctx, x, y, spacing, color) {
    ctx.save();
    if (color) {
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
    }
    if (!this.naturalPath2D && typeof Path2D !== 'undefined') {
      this.naturalPath2D = new Path2D(BRAVURA_NATURAL_PATH);
    }
    if (this.naturalPath2D) {
      const scale = spacing / 340.0;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fill(this.naturalPath2D);
      ctx.restore();
    } else {
      ctx.lineWidth = 1.6;
      const w = spacing * 0.44;
      const h = spacing * 0.95;
      ctx.beginPath();
      ctx.moveTo(accX - w / 2, accY - h / 2);
      ctx.lineTo(accX - w / 2, accY + h * 0.2);
      ctx.moveTo(accX + w / 2, accY - h * 0.2);
      ctx.lineTo(accX + w / 2, accY + h / 2);
      ctx.stroke();
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(accX - w / 2, accY - h * 0.18);
      ctx.lineTo(accX + w / 2, accY - h * 0.18 + 2);
      ctx.moveTo(accX - w / 2, accY + h * 0.18 - 2);
      ctx.lineTo(accX + w / 2, accY + h * 0.18);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Draw Key Signature on both Treble and Bass staves
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} startX - Left start x of key signature
   * @param {number} trebleBottomY - Bottom line of treble staff
   * @param {number} bassBottomY - Bottom line of bass staff
   * @param {number} spacing - Staff line spacing
   * @param {string|object} keyNameOrDef - Key signature name or definition object
   * @param {string} color - Glyph stroke/fill color
   * @returns {{ width: number, count: number }}
   */
  drawKeySignature(ctx, startX, trebleBottomY, bassBottomY, spacing, keyNameOrDef, color) {
    const keyDef = typeof keyNameOrDef === 'object' && keyNameOrDef !== null
      ? keyNameOrDef
      : MusicTheory.getKeySignature(keyNameOrDef || this.options.keySignature || 'C Major');

    if (!keyDef || (!keyDef.flats?.length && !keyDef.sharps?.length)) {
      return { width: 0, count: 0 };
    }

    const isFlats = keyDef.flats && keyDef.flats.length > 0;
    const count = isFlats ? keyDef.flats.length : keyDef.sharps.length;
    if (count === 0) return { width: 0, count: 0 };

    // Standard accidental staff step positions (from bottom line 0, step = spacing / 2):
    // Treble flats: Bb4 (4), Eb5 (7), Ab4 (3), Db5 (6), Gb4 (2), Cb5 (5), Fb4 (1)
    // Bass flats:   Bb2 (2), Eb3 (5), Ab2 (1), Db3 (4), Gb2 (0), Cb3 (3), Fb2 (-1)
    // Treble sharps: F#5 (8), C#5 (5), G#5 (9), D#5 (6), A#4 (3), E#5 (7), B#4 (4)
    // Bass sharps:   F#3 (6), C#3 (3), G#3 (7), D#3 (4), A#2 (1), E#3 (5), B#2 (2)
    const trebleSteps = isFlats ? [4, 7, 3, 6, 2, 5, 1] : [8, 5, 9, 6, 3, 7, 4];
    const bassSteps   = isFlats ? [2, 5, 1, 4, 0, 3, -1] : [6, 3, 7, 4, 1, 5, 2];

    const stepAdvance = spacing * 0.88;
    const halfStep = spacing / 2;

    for (let i = 0; i < count; i++) {
      const accX = startX + i * stepAdvance;

      const tStep = trebleSteps[i % trebleSteps.length];
      const tY = trebleBottomY - tStep * halfStep;

      const hasBass = (bassBottomY !== null && bassBottomY !== undefined);

      if (isFlats) {
        this.renderVectorFlat(ctx, accX, tY, spacing, color);
        if (hasBass) {
          const bStep = bassSteps[i % bassSteps.length];
          const bY = bassBottomY - bStep * halfStep;
          this.renderVectorFlat(ctx, accX, bY, spacing, color);
        }
      } else {
        this.renderVectorSharp(ctx, accX, tY, spacing, color);
        if (hasBass) {
          const bStep = bassSteps[i % bassSteps.length];
          const bY = bassBottomY - bStep * halfStep;
          this.renderVectorSharp(ctx, accX, bY, spacing, color);
        }
      }
    }

    const totalWidth = (count - 1) * stepAdvance + Math.round(spacing * 0.95);
    return { width: totalWidth, count };
  }

  /**
   * Render Live Mode: Active held chord/notes displayed centrally on Grand Staff
   */
  /**
   * Render Live Mode: Active held chord/notes and melodic contour ribbons displayed on Grand Staff
   */
  renderLiveMode(ctx, staffX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp) {
    const preferFlats = this.options.preferFlats;
    const now = performance.now();

    // Prune phrase notes older than 3500ms if inactive
    this.recentPhrase = this.recentPhrase.filter(n => n.active || (now - (n.endTime || n.startTime) < 3500));

    // If no active held notes and no recent phrase:
    if (this.activeNotes.size === 0 && this.recentPhrase.length === 0) {
      this.drawIdleStaffGuide(ctx, staffX, staffWidth, trebleBottomY, bassBottomY, lineSpacing);
      return;
    }

    // Cluster phrase notes into chord columns by start time (within 65ms = struck together)
    const columns = [];
    const sortedPhrase = [...this.recentPhrase].sort((a, b) => a.startTime - b.startTime);

    sortedPhrase.forEach(item => {
      let col = columns.find(c => Math.abs(c.startTime - item.startTime) < 65);
      if (!col) {
        col = {
          startTime: item.startTime,
          endTime: item.endTime,
          notes: []
        };
        columns.push(col);
      }
      if (!col.notes.some(n => n.midi === item.midi)) {
        col.notes.push(item);
      }
      if (item.active) col.hasActive = true;
    });

    // Fallback: ensure active notes are present
    if (this.activeNotes.size > 0 && columns.length === 0) {
      columns.push({
        startTime: now,
        endTime: null,
        hasActive: true,
        notes: Array.from(this.activeNotes.values())
      });
    }

    // Position columns horizontally across the staff
    const numCols = columns.length;
    let startX = staffX + staffWidth * 0.52;
    let colSpacing = 0;

    if (numCols > 1) {
      colSpacing = Math.min(84, Math.max(48, (staffWidth * 0.65) / (numCols - 1)));
      const totalSpan = (numCols - 1) * colSpacing;
      startX = staffX + staffWidth * 0.5 - totalSpan / 2;
    }

    // 1. Compute positions and render note items for each column
    columns.forEach((col, cIdx) => {
      const colX = numCols === 1 ? startX : (startX + cIdx * colSpacing);
      col.x = colX;

      // Group into treble & bass
      col.notes.forEach(noteData => {
        const info = MusicTheory.getNoteInfo(noteData.midi, preferFlats);
        const clef = noteData.midi >= this.options.splitPoint ? 'treble' : 'bass';
        const staffPos = MusicTheory.getStaffPosition(info.diatonicStep, clef);
        const bottomY = clef === 'treble' ? trebleBottomY : bassBottomY;
        const noteY = bottomY - staffPos * (lineSpacing / 2);

        noteData.info = info;
        noteData.clef = clef;
        noteData.staffPos = staffPos;
        noteData.x = colX;
        noteData.y = noteY;

        let alpha = 1.0;
        if (!noteData.active && (noteData.endTime || noteData.releasedTime)) {
          const rel = noteData.endTime || noteData.releasedTime;
          const elapsed = now - rel;
          alpha = Math.max(0.2, 1.0 - elapsed / 3500);
        }
        noteData.alpha = alpha;
      });

      // Render treble chord / notes in this column
      const trebleNotes = col.notes.filter(n => n.clef === 'treble').sort((a, b) => a.midi - b.midi);
      if (trebleNotes.length > 0) {
        this.renderStaffChord(ctx, trebleNotes, colX, trebleBottomY, 'treble', lineSpacing, timestamp);
      }

      // Render bass chord / notes in this column
      const bassNotes = col.notes.filter(n => n.clef === 'bass').sort((a, b) => a.midi - b.midi);
      if (bassNotes.length > 0) {
        this.renderStaffChord(ctx, bassNotes, colX, bassBottomY, 'bass', lineSpacing, timestamp);
      }

      // Harmonic Interval Ribbons (within same column if 2+ notes)
      if (this.options.showIntervalContour && col.notes.length >= 2) {
        const sortedCol = [...col.notes].sort((a, b) => a.midi - b.midi);
        for (let j = 0; j < sortedCol.length - 1; j++) {
          const a = sortedCol[j];
          const b = sortedCol[j + 1];
          const linkAlpha = Math.min(a.alpha, b.alpha);
          this.drawIntervalRibbon(ctx, a, b, lineSpacing, linkAlpha, true);
        }
      }
    });

    // 2. Melodic Interval Contour Ribbons (between consecutive columns)
    if (this.options.showIntervalContour && columns.length >= 2) {
      for (let k = 0; k < columns.length - 1; k++) {
        const colA = columns[k];
        const colB = columns[k + 1];
        // Connect lead / melody note of column A to column B (highest pitch)
        const leadA = [...colA.notes].sort((a, b) => b.midi - a.midi)[0];
        const leadB = [...colB.notes].sort((a, b) => b.midi - a.midi)[0];
        if (leadA && leadB) {
          const linkAlpha = Math.min(leadA.alpha, leadB.alpha);
          this.drawIntervalRibbon(ctx, leadA, leadB, lineSpacing, linkAlpha, false);
        }
      }
    }
  }

  /**
   * Render a cluster / chord of notes on a single clef
   */
  renderStaffChord(ctx, notes, centerX, bottomLineY, clef, lineSpacing, timestamp) {
    if (notes.length === 0) return;

    // Detect adjacent seconds to shift notehead slightly if needed
    for (let i = 0; i < notes.length; i++) {
      notes[i].shiftX = 0;
      if (i > 0) {
        const prev = notes[i - 1];
        if (Math.abs(notes[i].staffPos - prev.staffPos) === 1) {
          // Second interval: alternate shift
          notes[i].shiftX = prev.shiftX === 0 ? lineSpacing * 1.05 : 0;
        }
      }
    }

    // Determine average stem direction:
    // If highest note is far above middle line (staffPos 4), stem down.
    // Standard rule: if average staffPos >= 4, stems down; else stems up.
    const avgPos = notes.reduce((sum, n) => sum + n.staffPos, 0) / notes.length;
    const stemDirection = avgPos >= 4 ? 'down' : 'up';

    // Calculate Y coordinates
    notes.forEach(note => {
      note.y = bottomLineY - note.staffPos * (lineSpacing / 2);
      note.x = centerX + note.shiftX;
    });

    // 1. Draw Ledger Lines first so they sit cleanly under noteheads
    notes.forEach(note => {
      this.drawLedgerLines(ctx, note.x, note.staffPos, bottomLineY, lineSpacing);
    });

    // 2. Draw Unified Chord Stem (skip if all notes are whole notes!)
    const maxDur = Math.max(...notes.map(n => this.computeNoteDuration(n, timestamp)));
    if (maxDur < 3.25) {
      this.drawChordStem(ctx, notes, stemDirection, lineSpacing, maxDur);
    }

    // 3. Draw Noteheads, Glows, Accidentals & Labels
    notes.forEach(note => {
      let alpha = 1.0;
      if (note.isFading && note.releasedTime) {
        const elapsed = timestamp - note.releasedTime;
        alpha = Math.max(0, 1 - elapsed / 450);
      }

      this.drawNotehead(ctx, note, lineSpacing, alpha, timestamp);
      this.drawAccidental(ctx, note, lineSpacing, alpha);

      if (this.options.showNoteNames) {
        this.drawNoteLabel(ctx, note, lineSpacing, alpha);
      }
    });
  }

  /**
   * Draw ledger lines for notes outside standard 5 lines (staffPos <= -2 or >= 10)
   * Note: staffPos -1 (space below staff) and 9 (space above staff) do not have ledger lines.
   */
  drawLedgerLines(ctx, x, staffPos, bottomLineY, spacing) {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this.options.theme === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.8)';
    const ledgerWidth = spacing * 1.8;

    // Notes below bottom line (staffPos <= -2)
    if (staffPos <= -2) {
      const lowestLine = (staffPos % 2 === 0) ? staffPos : staffPos + 1;
      for (let pos = -2; pos >= lowestLine; pos -= 2) {
        const y = bottomLineY - pos * (spacing / 2);
        ctx.beginPath();
        ctx.moveTo(x - ledgerWidth / 2, y);
        ctx.lineTo(x + ledgerWidth / 2, y);
        ctx.stroke();
      }
    }

    // Notes above top line (staffPos >= 10)
    if (staffPos >= 10) {
      const highestLine = (staffPos % 2 === 0) ? staffPos : staffPos - 1;
      for (let pos = 10; pos <= highestLine; pos += 2) {
        const y = bottomLineY - pos * (spacing / 2);
        ctx.beginPath();
        ctx.moveTo(x - ledgerWidth / 2, y);
        ctx.lineTo(x + ledgerWidth / 2, y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Draw note stem connecting chord notes, with curved flags for eighth/sixteenth notes
   */
  drawChordStem(ctx, notes, direction, spacing, duration = 1.0) {
    if (notes.length === 0) return;

    ctx.save();
    ctx.lineWidth = Math.max(1.1, spacing * 0.095);
    ctx.strokeStyle = this.options.theme === 'dark' ? '#f8fafc' : '#0f172a';

    const scale = spacing / 355.0;
    const headHalfW = 212.5 * scale;

    const minY = Math.min(...notes.map(n => n.y));
    const maxY = Math.max(...notes.map(n => n.y));
    const stemLength = spacing * 3.4;

    if (!this.flag8thUpPath2D && typeof Path2D !== 'undefined') {
      this.flag8thUpPath2D = new Path2D(BRAVURA_FLAG8THUP_PATH);
      this.flag8thDownPath2D = new Path2D(BRAVURA_FLAG8THDOWN_PATH);
    }

    let stemX, startY, endY;
    if (direction === 'up') {
      // Stem on right edge of notehead
      stemX = notes[0].x + headHalfW - 0.6;
      startY = maxY;
      endY = minY - stemLength;

      ctx.beginPath();
      ctx.moveTo(stemX, startY);
      ctx.lineTo(stemX, endY);
      ctx.stroke();

      // Flag for Eighth Note (<= 0.55)
      if (duration <= 0.55) {
        ctx.fillStyle = ctx.strokeStyle;
        if (this.flag8thUpPath2D) {
          ctx.save();
          ctx.translate(stemX, endY);
          ctx.scale(scale, scale);
          ctx.fill(this.flag8thUpPath2D);
          ctx.restore();
        }
      }
    } else {
      // Stem on left edge of notehead
      stemX = notes[0].x - headHalfW + 0.6;
      startY = minY;
      endY = maxY + stemLength;

      ctx.beginPath();
      ctx.moveTo(stemX, startY);
      ctx.lineTo(stemX, endY);
      ctx.stroke();

      // Flag for downward stem
      if (duration <= 0.55) {
        ctx.fillStyle = ctx.strokeStyle;
        if (this.flag8thDownPath2D) {
          ctx.save();
          ctx.translate(stemX, endY);
          ctx.scale(scale, scale);
          ctx.fill(this.flag8thDownPath2D);
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Draw color-coded connecting ribbon or line between two noteheads
   * Green for steps (2nd), Orange for skips (3rd), Purple for leaps (4th+)
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} n1 - starting note { x, y, midi }
   * @param {object} n2 - ending note { x, y, midi }
   * @param {number} lineSpacing
   * @param {number} alpha
   * @param {boolean} isHarmonic - true if simultaneous chord notes (vertical), false if melodic (horizontal)
   */
  drawIntervalRibbon(ctx, n1, n2, lineSpacing, alpha = 1.0, isHarmonic = false) {
    if (!n1 || !n2 || n1.x === undefined || n1.y === undefined || n2.x === undefined || n2.y === undefined) return;

    const interval = MusicTheory.classifyInterval(n1.midi, n2.midi, this.options.preferFlats);
    if (interval.category === 'unison' && isHarmonic) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0.18, Math.min(1.0, alpha));

    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      ctx.restore();
      return;
    }

    let cp1x, cp1y, cp2x, cp2y;
    if (isHarmonic) {
      // Harmonic chord ribbon: subtle outer arch so it doesn't obscure the stem
      const arch = Math.min(30, Math.abs(dy) * 0.35 + 8);
      cp1x = n1.x + arch;
      cp1y = n1.y + dy * 0.25;
      cp2x = n2.x + arch;
      cp2y = n1.y + dy * 0.75;
    } else {
      // Melodic contour ribbon: smooth horizontal S-curve bezier
      const tension = Math.min(0.48, Math.max(0.32, Math.abs(dx) / 180));
      cp1x = n1.x + dx * tension;
      cp1y = n1.y;
      cp2x = n2.x - dx * tension;
      cp2y = n2.y;
    }

    // 1. Draw glowing ribbon shadow
    ctx.shadowColor = interval.glow;
    ctx.shadowBlur = 10;

    // 2. Draw tapered ribbon stroke
    const ribbonWidth = Math.max(2.5, Math.min(5.5, lineSpacing * 0.32));
    ctx.strokeStyle = interval.rgba;
    ctx.lineWidth = ribbonWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, n2.x, n2.y);
    ctx.stroke();

    // 3. Draw floating micro interval badge at midpoint
    const t = 0.5;
    const midX = (1 - t) * (1 - t) * (1 - t) * n1.x + 3 * (1 - t) * (1 - t) * t * cp1x + 3 * (1 - t) * t * t * cp2x + t * t * t * n2.x;
    const midY = (1 - t) * (1 - t) * (1 - t) * n1.y + 3 * (1 - t) * (1 - t) * t * cp1y + 3 * (1 - t) * t * t * cp2y + t * t * t * n2.y;

    const badgeText = interval.shortLabel; // e.g. "2nd", "3rd", "5th"
    ctx.font = '700 9.5px "Inter", system-ui, sans-serif';
    const textMetrics = ctx.measureText(badgeText);
    const badgePadX = 4.5;
    const badgeW = textMetrics.width + badgePadX * 2;
    const badgeH = 15;
    const badgeX = midX - badgeW / 2;
    const badgeY = midY - badgeH / 2;

    // Pill background
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.fillStyle = this.options.theme === 'dark' ? '#090d16' : '#ffffff';
    ctx.strokeStyle = interval.color;
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 7);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();
    ctx.stroke();

    // Pill text
    ctx.shadowBlur = 0;
    ctx.fillStyle = interval.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, midX, midY + 0.5);

    ctx.restore();
  }

  /**
   * Draw elliptical notehead with velocity glow and animation
   */
  drawNotehead(ctx, note, spacing, alpha, timestamp) {
    ctx.save();
    ctx.globalAlpha = alpha;

    const rx = spacing * 0.62;
    const ry = spacing * 0.44;
    const rot = -0.32; // ~-18 degrees

    // Determine Key Signature and accidental deviation
    const noteMidi = (typeof note.midi === 'number') ? note.midi : ((note.info && typeof note.info.midi === 'number') ? note.info.midi : 60);
    const keySig = (this.practiceData && this.practiceData.melody && this.practiceData.melody.key) || this.options.keySignature || 'C Major';
    const accDev = MusicTheory.isAccidentalDeviation(noteMidi, keySig);
    const isAlert = this.options.accidentalAlert && accDev.isDeviation;

    // Outer warning pulse / glow for Accidental Alert Flash
    if (isAlert) {
      ctx.save();
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(note.x, note.y, (rx + 7) * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fill();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.stroke();
      ctx.restore();
    }

    // Velocity-based glow
    if (note.active) {
      const velNorm = (note.velocity || 100) / 127;
      const glowColor = isAlert 
        ? '#f59e0b' 
        : (note.clef === 'treble' ? this.options.activeGlowColor : this.options.bassActiveColor);

      // Outer radial pulse on note strike
      const elapsed = timestamp - (note.startTime || timestamp);
      if (elapsed < 300) {
        const pulse = (1 - elapsed / 300);
        ctx.beginPath();
        ctx.arc(note.x, note.y, (rx + 8) * (1 + pulse * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = alpha * pulse * 0.4 * velNorm;
        ctx.fill();
        ctx.globalAlpha = alpha;
      }

      // Notehead glow
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isAlert ? 22 : (14 + 10 * velNorm);

      // Free Play Rhythm Trainer timing halo
      if (note.timingRating) {
        ctx.save();
        const ringColor = note.timingRating === 'perfect' ? '#10b981' :
                          note.timingRating === 'early' ? '#f59e0b' :
                          note.timingRating === 'late' ? '#38bdf8' : '#f43f5e';
        ctx.shadowColor = ringColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(note.x, note.y, rx + 5, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 2.0;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Compute musical duration (Whole, Dotted Half, Half, Quarter, Eighth, Sixteenth)
    const dur = note.duration || this.computeNoteDuration(note, timestamp);
    const isWhole = dur >= 3.5;
    const isHollow = dur >= 1.45 && !isWhole;
    const isDotted = (dur >= 2.4 && dur < 3.25) || (dur >= 1.2 && dur < 1.45);

    let headColor;
    if (note.active) {
      headColor = isAlert ? '#fbbf24' : (note.clef === 'treble' ? '#38bdf8' : '#c084fc');
    } else {
      headColor = isAlert ? (this.options.theme === 'dark' ? '#fbbf24' : '#d97706')
                          : (this.options.theme === 'dark' ? '#f8fafc' : '#0f172a');
    }

    if (!this.noteheadBlackPath2D && typeof Path2D !== 'undefined') {
      this.noteheadBlackPath2D = new Path2D(BRAVURA_NOTEHEADBLACK_PATH);
      this.noteheadHalfPath2D = new Path2D(BRAVURA_NOTEHEADHALF_PATH);
      this.noteheadWholePath2D = new Path2D(BRAVURA_NOTEHEADWHOLE_PATH);
      this.flag8thUpPath2D = new Path2D(BRAVURA_FLAG8THUP_PATH);
      this.flag8thDownPath2D = new Path2D(BRAVURA_FLAG8THDOWN_PATH);
    }

    const scale = spacing / 355.0;
    ctx.save();
    ctx.fillStyle = headColor;
    if (isWhole && this.noteheadWholePath2D) {
      ctx.translate(note.x - 304 * scale, note.y);
      ctx.scale(scale, scale);
      ctx.fill(this.noteheadWholePath2D);
    } else if (isHollow && this.noteheadHalfPath2D) {
      ctx.translate(note.x - 212.5 * scale, note.y);
      ctx.scale(scale, scale);
      ctx.fill(this.noteheadHalfPath2D);
    } else if (this.noteheadBlackPath2D) {
      ctx.translate(note.x - 212.5 * scale, note.y);
      ctx.scale(scale, scale);
      ctx.fill(this.noteheadBlackPath2D);
    } else {
      ctx.beginPath();
      ctx.ellipse(note.x, note.y, rx, ry, rot, 0, Math.PI * 2);
      if (isHollow) {
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = headColor;
        ctx.stroke();
      } else {
        ctx.fill();
      }
    }
    ctx.restore();

    // Augmentation Dot if dotted note
    if (isDotted) {
      ctx.save();
      const dotRadius = Math.round(spacing * 0.18);
      const dotX = note.x + (212.5 * scale) + spacing * 0.38;
      const isLine = Math.abs(note.staffPos % 2) === 0;
      const dotY = isLine ? (note.y - spacing * 0.5) : note.y;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = headColor;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw musical accidental (# or b or natural)
   */
  drawAccidental(ctx, note, spacing, alpha) {
    if (!note) return;

    const noteMidi = (typeof note.midi === 'number') ? note.midi : ((note.info && typeof note.info.midi === 'number') ? note.info.midi : 60);
    const keySig = (this.practiceData && this.practiceData.melody && this.practiceData.melody.key) || this.options.keySignature || 'C Major';

    const displayAcc = note.displayAccidental !== undefined
      ? note.displayAccidental
      : MusicTheory.getNoteAccidentalForScore(noteMidi, keySig, note.explicitAccidental);

    // If no accidental should be displayed for this note in this key signature, skip!
    if (!displayAcc) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    const accX = note.x - spacing * 1.5;
    const accY = note.y;

    const accDev = MusicTheory.isAccidentalDeviation(noteMidi, keySig);
    const isAlert = this.options.accidentalAlert && accDev.isDeviation;

    if (isAlert) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#f59e0b';
    } else {
      ctx.fillStyle = note.active ? (note.clef === 'treble' ? '#38bdf8' : '#c084fc') : (this.options.theme === 'dark' ? '#f8fafc' : '#0f172a');
      ctx.strokeStyle = ctx.fillStyle;
    }

    if (displayAcc === '#' || displayAcc === '♯') {
      this.renderVectorSharp(ctx, accX, accY, spacing, isAlert ? '#f59e0b' : null);
    } else if (displayAcc === 'b' || displayAcc === '♭') {
      this.renderVectorFlat(ctx, accX, accY, spacing, isAlert ? '#f59e0b' : null);
    } else if (displayAcc === '♮' || displayAcc === 'natural') {
      this.renderVectorNatural(ctx, accX, accY, spacing, isAlert ? '#f59e0b' : null);
    }

    ctx.restore();
  }

  /**
   * Draw pitch name tag (e.g. "C4", "G#5") near note
   */
  drawNoteLabel(ctx, note, spacing, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.9;
    ctx.font = `600 ${Math.round(spacing * 0.7)}px "Inter", system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const labelX = note.x + spacing * 1.25;
    const labelY = note.y;

    // Text glow
    ctx.fillStyle = note.active ? (note.clef === 'treble' ? '#7dd3fc' : '#d8b4fe') : (this.options.theme === 'dark' ? '#94a3b8' : '#64748b');
    ctx.fillText(note.info.fullName, labelX, labelY);

    ctx.restore();
  }

  /**
   * Draw idle placeholder guide when no keys are pressed
   */
  drawIdleStaffGuide(ctx, staffX, staffWidth, trebleBottomY, bassBottomY, lineSpacing) {
    ctx.save();
    const isDark = this.options.theme === 'dark';
    ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.5)';
    ctx.font = '500 13px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const midY = (trebleBottomY + bassBottomY - lineSpacing * 4) / 2;
    ctx.fillText('Play notes on your MIDI keyboard or piano below to see them here', staffX + staffWidth / 2, midY);

    // Draw Middle C ledger guide line lightly
    const middleCY = trebleBottomY + lineSpacing;
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(staffX + 50, middleCY);
    ctx.lineTo(staffX + staffWidth - 20, middleCY);
    ctx.stroke();

    ctx.font = '10px "Inter", sans-serif';
    ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.35)';
    ctx.fillText('Middle C (C4)', staffX + staffWidth - 60, middleCY - 6);

    // Interval Contour & Accidental Alert visual legend pill
    if (this.options.showIntervalContour || this.options.accidentalAlert) {
      const legendY = trebleBottomY - lineSpacing * 4.6;
      const legendCenterX = staffX + staffWidth / 2;
      ctx.setLineDash([]);
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.7)' : 'rgba(71, 85, 105, 0.75)';
      ctx.fillText('Intervals:  🟢 Step (2nd)   🟠 Skip (3rd)   🟣 Leap (4th+)   •   Key: ' + (this.options.keySignature || 'C Major') + ' (⚠️ Accidental Alert)', legendCenterX, legendY);
    }

    ctx.restore();
  }

  /**
   * Render Continuous Scrolling Timeline Mode
   * Notes stream horizontally from right to left like a live sheet roll
   */
  renderScrollingMode(ctx, staffX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp) {
    const playheadX = staffX + 110;
    const speed = this.options.scrollSpeed; // px per second
    const preferFlats = this.options.preferFlats;
    const keySig = this.options.keySignature || 'C Major';

    ctx.save();

    // Draw Playhead Line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(playheadX, trebleBottomY - lineSpacing * 6);
    ctx.lineTo(playheadX, bassBottomY + lineSpacing * 3);
    ctx.stroke();
    ctx.setLineDash([]);

    // Visible notes collection for interval contour linking
    const visibleTimelineNotes = [];

    // Draw Scrolling notes
    for (let i = this.noteHistory.length - 1; i >= 0; i--) {
      const item = this.noteHistory[i];
      const timeSinceStart = (timestamp - item.startTime) / 1000;
      const durationSec = item.active ? (timestamp - item.startTime) / 1000 : (item.endTime - item.startTime) / 1000;

      // X coordinate: note moves left as time advances
      const startX = playheadX + (item.active ? 0 : (item.endTime - timestamp) / 1000 * speed);
      const noteWidth = Math.max(lineSpacing * 1.2, durationSec * speed);

      // Stop if scrolled off screen to left
      if (startX + noteWidth < staffX) {
        continue;
      }

      const info = MusicTheory.getNoteInfo(item.midi, preferFlats);
      const clef = item.midi >= this.options.splitPoint ? 'treble' : 'bass';
      const staffPos = MusicTheory.getStaffPosition(info.diatonicStep, clef);
      const bottomY = clef === 'treble' ? trebleBottomY : bassBottomY;
      const y = bottomY - staffPos * (lineSpacing / 2);

      // Accidental Alert check
      const accDev = MusicTheory.isAccidentalDeviation(item.midi, keySig);
      const isAlert = this.options.accidentalAlert && accDev.isDeviation;

      // Draw horizontal note bar (duration ribbon)
      const barX = playheadX - timeSinceStart * speed;
      const barW = Math.max(16, durationSec * speed);

      // Collect note center for contour ribbon
      visibleTimelineNotes.push({
        midi: item.midi,
        x: barX + barW * 0.5,
        y,
        startTime: item.startTime,
        active: item.active
      });

      // Draw ledger lines if needed
      this.drawLedgerLines(ctx, barX + barW, staffPos, bottomY, lineSpacing);

      // Draw ribbon
      ctx.beginPath();
      const radius = 5;
      const rx = barX;
      const rw = barW;
      const ry = y - lineSpacing * 0.35;
      const rh = lineSpacing * 0.7;

      if (isAlert) {
        ctx.fillStyle = item.active ? 'rgba(251, 191, 36, 0.95)' : 'rgba(245, 158, 11, 0.85)';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = item.active ? 16 : 8;
      } else {
        ctx.fillStyle = clef === 'treble' ? 'rgba(56, 189, 248, 0.85)' : 'rgba(192, 132, 252, 0.85)';
        if (item.active) {
          ctx.shadowColor = clef === 'treble' ? '#38bdf8' : '#a855f7';
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowBlur = 0;
        }
      }

      if (ctx.roundRect) {
        ctx.roundRect(rx, ry, rw, rh, radius);
      } else {
        ctx.rect(rx, ry, rw, rh);
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Note label & accidental tag
      ctx.font = '600 10px "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      if (rw > 28) {
        const alertPrefix = isAlert ? '⚠️ ' : '';
        ctx.fillText(alertPrefix + info.fullName, rx + 6, y);
      }
    }

    // Interval contour ribbons between consecutive timeline notes
    if (this.options.showIntervalContour && visibleTimelineNotes.length >= 2) {
      const sortedTimeline = [...visibleTimelineNotes].sort((a, b) => a.startTime - b.startTime);
      for (let k = 0; k < sortedTimeline.length - 1; k++) {
        const n1 = sortedTimeline[k];
        const n2 = sortedTimeline[k + 1];
        this.drawIntervalRibbon(ctx, n1, n2, lineSpacing, 0.65, false);
      }
    }

    ctx.restore();
  }

  /**
   * Render Free Play Rhythm Trainer Mode:
   * A continuous scrolling sheet music score where played notes remain permanently,
   * measure barlines are drawn by time signature, notes scroll smoothly,
   * and each stroke displays its exact timing accuracy in milliseconds (±ms)
   */
  renderRhythmTrainerMode(ctx, staffX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp) {
    const isDark = this.options.theme === 'dark';
    const preferFlats = this.options.preferFlats;
    const isMobile = this.width < 640;

    const trebleTopY = trebleBottomY - lineSpacing * 4;
    const bassTopY = bassBottomY - lineSpacing * 4;
    const staffRightX = staffX + staffWidth;

    const beatsPerMeasure = this.options.beatsPerMeasure || 4;
    const timeSig = [beatsPerMeasure, 4];

    // 1. Clefs, Key Signature, Time Signature & Divider
    const activeKey = this.options.keySignature || 'C Major';
    const activeKeyDef = MusicTheory.getKeySignature(activeKey);
    const keySigAccCount = activeKeyDef ? (activeKeyDef.flats?.length || activeKeyDef.sharps?.length || 0) : 0;

    const clefMarginLeft = isMobile ? 12 : 18;
    const clefWidth = Math.ceil(966 * (lineSpacing / 355.0));
    const clefX = staffX + clefMarginLeft;
    const clefRightEdge = clefX + clefWidth;

    this.drawClefs(ctx, clefX, trebleTopY, bassTopY, lineSpacing, isDark ? '#e2e8f0' : '#1e293b');

    const keySigGap = isMobile ? 10 : 14;
    const keySigStepW = lineSpacing * 0.88;
    const keySigW = keySigAccCount > 0 ? Math.round((keySigAccCount - 1) * keySigStepW + lineSpacing * 0.95) : 0;
    const keySigStartX = clefRightEdge + keySigGap;
    const keySigRightEdge = keySigAccCount > 0 ? (keySigStartX + keySigW) : clefRightEdge;

    if (keySigAccCount > 0) {
      this.drawKeySignature(ctx, keySigStartX, trebleBottomY, bassBottomY, lineSpacing, activeKeyDef, isDark ? '#e2e8f0' : '#1e293b');
    }

    const timeSigGap = isMobile ? 12 : 16;
    const timeSigW = Math.round(lineSpacing * 1.6);
    const timeSigStartX = keySigRightEdge + timeSigGap;
    const timeSigCenterX = timeSigStartX + Math.round(timeSigW / 2);
    const timeSigRightEdge = timeSigStartX + timeSigW;

    this.drawTimeSignature(ctx, timeSigCenterX, trebleBottomY, bassBottomY, lineSpacing, timeSig);

    const clefDividerX = timeSigRightEdge + (isMobile ? 14 : 20);
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(15, 23, 42, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(clefDividerX, trebleTopY);
    ctx.lineTo(clefDividerX, trebleBottomY);
    ctx.moveTo(clefDividerX, bassTopY);
    ctx.lineTo(clefDividerX, bassBottomY);
    ctx.stroke();
    ctx.restore();

    const notesStartX = clefDividerX + (isMobile ? 18 : 26);
    const availableWidth = staffRightX - notesStartX;

    // 2. Empty State Message
    if (this.rhythmStream.length === 0) {
      ctx.save();
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.65)' : 'rgba(100, 116, 139, 0.75)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const midY = (trebleBottomY + bassTopY) / 2;
      ctx.fillText('🎼 Play any song on the beat — notes will stay, scroll, and display timing (±ms)', notesStartX + availableWidth * 0.45, midY);
      ctx.restore();
      return;
    }

    // 3. Precompute Non-Linear Duration Spacing & Measure Barlines
    const strokeXPositions = [];
    const barlineXPositions = [];
    let curX = notesStartX + 20;
    let currentMeasureBeats = 0;

    this.rhythmStream.forEach((stroke, i) => {
      // Dynamic duration if note currently held
      stroke.notes.forEach(n => {
        if (n.active) {
          n.duration = this.computeNoteDuration(n, timestamp);
        }
      });
      const strokeDur = Math.max(...stroke.notes.map(n => n.duration || 1.0));
      stroke.duration = strokeDur;

      if (i > 0) {
        const prevStroke = this.rhythmStream[i - 1];
        const prevDur = prevStroke.duration || 1.0;
        let spacing = Math.max(isMobile ? 54 : 70, (isMobile ? 70 : 88) * Math.pow(Math.max(0.25, prevDur), 0.55));

        // Accidental clearance
        const hasAccidental = stroke.notes.some(n => {
          const info = MusicTheory.getNoteInfo(n.midi, preferFlats);
          return info.accidental;
        });
        if (hasAccidental) spacing += 14;

        if (currentMeasureBeats + prevDur >= beatsPerMeasure - 0.01) {
          const barX = curX + spacing * 0.48;
          barlineXPositions.push(barX);
          spacing += 26;
          currentMeasureBeats = (currentMeasureBeats + prevDur) % beatsPerMeasure;
        } else {
          currentMeasureBeats += prevDur;
        }

        curX += spacing;
      } else {
        const hasAccidental = stroke.notes.some(n => {
          const info = MusicTheory.getNoteInfo(n.midi, preferFlats);
          return info.accidental;
        });
        if (hasAccidental) curX += 14;
      }

      strokeXPositions.push(curX);
    });

    // 4. Smooth Horizontal Focal Scrolling
    const latestX = strokeXPositions[strokeXPositions.length - 1];
    const focalAnchorX = notesStartX + Math.min(isMobile ? 140 : 280, availableWidth * 0.40);
    const targetScrollX = Math.max(0, latestX - focalAnchorX);

    this.rhythmScrollX = this.rhythmScrollX || 0;
    this.rhythmScrollX += (targetScrollX - this.rhythmScrollX) * 0.16;

    const maxScroll = Math.max(0, latestX - focalAnchorX);
    this.manualScrollOffset = Math.max(-120, Math.min(maxScroll + 300, this.manualScrollOffset || 0));
    const effectiveScrollX = Math.max(0, this.rhythmScrollX - this.manualScrollOffset);

    // 5. Clip & Translate Notes Area
    ctx.save();
    ctx.beginPath();
    ctx.rect(notesStartX - 4, 0, staffRightX - notesStartX + 10, this.height);
    ctx.clip();
    ctx.translate(-effectiveScrollX, 0);

    // 6. Draw Measure Barlines
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.42)' : 'rgba(15, 23, 42, 0.35)';
    ctx.lineWidth = 1.2;
    barlineXPositions.forEach(bx => {
      ctx.beginPath();
      ctx.moveTo(bx, trebleTopY);
      ctx.lineTo(bx, trebleBottomY);
      ctx.moveTo(bx, bassTopY);
      ctx.lineTo(bx, bassBottomY);
      ctx.stroke();
    });
    ctx.restore();

    // 7. Render Each Note Column & Timing Accuracy Badges
    const visibleNotesForRibbon = [];

    this.rhythmStream.forEach((stroke, idx) => {
      const colX = strokeXPositions[idx];

      // Cull strokes outside visible canvas
      if (colX - effectiveScrollX < notesStartX - 100 || colX - effectiveScrollX > staffRightX + 100) {
        return;
      }

      // Prepare notes with clef and staff positions
      stroke.notes.forEach(note => {
        const info = MusicTheory.getNoteInfo(note.midi, preferFlats);
        const clef = note.midi >= this.options.splitPoint ? 'treble' : 'bass';
        const staffPos = MusicTheory.getStaffPosition(info.diatonicStep, clef);

        note.info = info;
        note.clef = clef;
        note.staffPos = staffPos;
        note.timingRating = note.timingRating || stroke.rating;
        note.offsetMs = (note.offsetMs !== undefined && note.offsetMs !== null) ? note.offsetMs : stroke.offsetMs;
      });

      // Split into treble & bass
      const trebleNotes = stroke.notes.filter(n => n.clef === 'treble').sort((a, b) => a.midi - b.midi);
      const bassNotes = stroke.notes.filter(n => n.clef === 'bass').sort((a, b) => a.midi - b.midi);

      if (trebleNotes.length > 0) {
        this.renderStaffChord(ctx, trebleNotes, colX, trebleBottomY, 'treble', lineSpacing, timestamp);
      }
      if (bassNotes.length > 0) {
        this.renderStaffChord(ctx, bassNotes, colX, bassBottomY, 'bass', lineSpacing, timestamp);
      }

      // Collect highest note for melodic contour ribbon
      const leadNote = [...stroke.notes].sort((a, b) => b.midi - a.midi)[0];
      if (leadNote) {
        visibleNotesForRibbon.push({
          x: colX,
          y: leadNote.y,
          alpha: 1.0,
          midi: leadNote.midi
        });
      }

      // 8. Millisecond Accuracy Badge Over Note
      if (stroke.offsetMs !== undefined && stroke.offsetMs !== null && stroke.rating && stroke.rating !== 'unscored') {
        ctx.save();
        const ro = stroke.offsetMs;
        const offStr = (ro >= 0 ? '+' : '') + ro + 'ms';

        // Position badge above treble staff or above highest notehead
        let highestY = trebleTopY;
        if (trebleNotes.length > 0) {
          highestY = Math.min(...trebleNotes.map(n => n.y));
        }
        const badgeY = Math.min(trebleTopY - lineSpacing * 1.1, highestY - lineSpacing * 1.3);

        ctx.font = '700 9px "Inter", sans-serif';
        const textW = ctx.measureText(offStr).width;
        const badgeW = textW + 8;
        const badgeH = 13;
        const badgeX = colX - badgeW / 2;

        const absOff = Math.abs(ro);
        let bgCol, borderCol, textCol;
        if (stroke.rating === 'perfect' || absOff <= 45) {
          bgCol = 'rgba(34, 197, 94, 0.22)';
          borderCol = 'rgba(34, 197, 94, 0.8)';
          textCol = '#86efac';
        } else if (stroke.rating === 'early' || stroke.rating === 'late' || absOff <= 120) {
          bgCol = 'rgba(245, 158, 11, 0.22)';
          borderCol = 'rgba(245, 158, 11, 0.85)';
          textCol = '#fde047';
        } else {
          bgCol = 'rgba(244, 63, 94, 0.22)';
          borderCol = 'rgba(244, 63, 94, 0.85)';
          textCol = '#fecdd3';
        }

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(badgeX, badgeY - badgeH, badgeW, badgeH);
        ctx.fillStyle = bgCol;
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY - badgeH, badgeW, badgeH, 3);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(badgeX, badgeY - badgeH, badgeW, badgeH);
          ctx.strokeRect(badgeX, badgeY - badgeH, badgeW, badgeH);
        }

        ctx.fillStyle = textCol;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(offStr, colX, badgeY - badgeH / 2);
        ctx.restore();
      }
    });

    // Melodic interval ribbons between consecutive strokes
    if (this.options.showIntervalContour && visibleNotesForRibbon.length >= 2) {
      for (let k = 0; k < visibleNotesForRibbon.length - 1; k++) {
        const a = visibleNotesForRibbon[k];
        const b = visibleNotesForRibbon[k + 1];
        this.drawIntervalRibbon(ctx, a, b, lineSpacing, 0.75, false);
      }
    }

    ctx.restore();
  }

  /**
   * Set active practice state from Trainer
   */
  setPracticeState(data) {
    const melodyChanged = (!this.practiceData && data) || (this.practiceData && data && this.practiceData.melody?.id !== data.melody?.id);
    const becameFinished = (!this.practiceData?.isFinished && data?.isFinished);
    const isRestarted = (!data?.isFinished && (
      this.practiceData?.isFinished ||
      (data?.noteIndex === 0 && (this.practiceData?.noteIndex > 0 || (this.smoothScrollX && this.smoothScrollX > 0) || this.manualScrollOffset !== 0 || this.activeReviewMistakeIndex >= 0))
    ));

    this.practiceData = data;
    if (data) {
      if (this.options.staffLayout !== 'waterfall') {
        this.options.mode = 'practice';
      }
      this.setCanvasCursor('grab');
      if (data.melody && data.melody.key) {
        this.options.keySignature = data.melody.key;
      }
    }

    if (melodyChanged || isRestarted) {
      this.activeReviewMistakeIndex = -1;
      this.manualScrollOffset = 0;
      this.smoothVerticalScroll = 0;
      this.manualVerticalScrollOffset = 0;
      this.playheadBeats = 0;
      this.smoothScrollX = 0;
      this.scrollX = 0;
      this.waterfallParticles = [];
      this.waterfallFloatingTexts = [];
      this.smoothWaitBeats = 0;
      this.prevMistakeBtnBounds = null;
      this.nextMistakeBtnBounds = null;
      this.reviewPillBounds = null;
      this.clearNotes();
    }

    if (becameFinished) {
      this.manualScrollOffset = 0;
      this.manualVerticalScrollOffset = 0;
      const mistakes = this.getMistakeNoteIndices();
      if (mistakes.length > 0) {
        this.activeReviewMistakeIndex = mistakes[0];
        this.notifyReviewNoteChanged();
      }
    }

    this.ensureRenderLoop();
  }

  resetScoreToBeginning() {
    this.activeReviewMistakeIndex = -1;
    this.manualScrollOffset = 0;
    this.smoothVerticalScroll = 0;
    this.manualVerticalScrollOffset = 0;
    this.playheadBeats = 0;
    this.smoothScrollX = 0;
    this.scrollX = 0;
    this.prevMistakeBtnBounds = null;
    this.nextMistakeBtnBounds = null;
    this.reviewPillBounds = null;
    this.clearNotes();
    this.ensureRenderLoop();
  }

  triggerMistakeFlash() {
    this.flashMistakeTimestamp = performance.now();
  }

  setPlayheadBeats(beats) {
    this.playheadBeats = beats;
  }

  triggerRecoveryFlash() {
    this.flashRecoveryTimestamp = performance.now();
  }

  /**
   * Draw active played notes in dedicated Live INPUT column
   */
  drawActivePlayedNotes(ctx, targetX, trebleBottomY, bassBottomY, lineSpacing) {
    if (this.activeNotes.size === 0) return;

    const count = this.activeNotes.size;
    let idx = 0;
    const preferFlats = this.options.preferFlats;
    const stepHeight = lineSpacing * 0.5;

    const targetNote = this.practiceData ? (this.practiceData.melody?.notes[this.practiceData.noteIndex] || null) : null;
    const prevNote = (this.practiceData && this.practiceData.noteIndex > 0)
      ? (this.practiceData.melody?.notes[this.practiceData.noteIndex - 1] || null)
      : null;

    for (const [midi, noteData] of this.activeNotes.entries()) {
      const info = MusicTheory.getNoteInfo(midi, preferFlats);
      const isTreble = midi >= this.options.splitPoint;
      const clef = isTreble ? 'treble' : 'bass';
      const staffPos = MusicTheory.getStaffPosition(info.diatonicStep, clef);
      const bottomY = isTreble ? trebleBottomY : bassBottomY;
      const noteY = bottomY - staffPos * stepHeight;

      const headW = lineSpacing * 1.35;
      const headH = lineSpacing * 0.95;

      const xOffset = (count > 1) ? (idx - (count - 1) * 0.5) * 24 : 0;
      const noteX = targetX + xOffset;

      let color = '#38bdf8'; // Electric Sky 400 default

      if (this.practiceData && !this.practiceData.isFinished) {
        if ((targetNote && midi === targetNote.midi) || (prevNote && midi === prevNote.midi)) {
          color = '#22c55e'; // Emerald 500 (correct note hit)
        } else {
          color = '#f43f5e'; // Rose 500 (wrong note struck)
        }
      }

      // Ledger lines
      this.drawLedgerLines(ctx, noteX, staffPos, bottomY, lineSpacing);

      ctx.save();

      // Radiant pulse glow
      ctx.beginPath();
      ctx.arc(noteX, noteY, headW * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Notehead (tilted)
      ctx.beginPath();
      ctx.ellipse(noteX, noteY, headW * 0.5, headH * 0.5, -0.28, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Stem
      const stemUp = staffPos < 4;
      const stemX = stemUp ? (noteX + headW * 0.40) : (noteX - headW * 0.40);
      const stemLen = lineSpacing * 3.2;
      const stemEndY = stemUp ? (noteY - stemLen) : (noteY + stemLen);
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(stemX, noteY);
      ctx.lineTo(stemX, stemEndY);
      ctx.stroke();

      // Accidental
      if (info.accidental) {
        this.drawAccidental(ctx, { x: noteX, y: noteY, midi, info, active: true, clef }, lineSpacing, 1.0);
      }

      // Active pitch tag
      ctx.font = '700 11px "Inter", sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelY = stemUp ? (noteY + lineSpacing * 1.1) : (noteY - lineSpacing * 1.4);
      ctx.fillText(info.fullName, noteX, labelY);

      ctx.restore();
      idx++;
    }
  }

  /**
   * Compute exact horizontal geometry for each piano key and note lane
   */
  computeWaterfallLayout(startMidi, endMidi, marginX, usableW, hitY, keyboardH) {
    const isBlack = (midi) => [1, 3, 6, 8, 10].includes(midi % 12);
    const whiteMidis = [];
    for (let m = startMidi; m <= endMidi; m++) {
      if (!isBlack(m)) whiteMidis.push(m);
    }
    const numWhite = Math.max(1, whiteMidis.length);
    const whiteKeyW = usableW / numWhite;
    const blackKeyW = Math.max(9, whiteKeyW * 0.62);
    const blackKeyH = keyboardH * 0.62;

    const keys = {};
    whiteMidis.forEach((m, idx) => {
      const x = marginX + idx * whiteKeyW;
      keys[m] = {
        midi: m,
        x,
        y: hitY,
        width: whiteKeyW,
        height: keyboardH,
        isBlack: false,
        laneX: x + 1,
        laneW: Math.max(2, whiteKeyW - 2)
      };
    });

    for (let m = startMidi; m <= endMidi; m++) {
      if (isBlack(m)) {
        const prevW = keys[m - 1];
        const nextW = keys[m + 1];
        let x = marginX;
        if (prevW && nextW) {
          x = (prevW.x + prevW.width) - blackKeyW / 2;
        } else if (prevW) {
          x = (prevW.x + prevW.width) - blackKeyW / 2;
        } else if (nextW) {
          x = nextW.x - blackKeyW / 2;
        }
        keys[m] = {
          midi: m,
          x,
          y: hitY,
          width: blackKeyW,
          height: blackKeyH,
          isBlack: true,
          laneX: x + 1,
          laneW: Math.max(2, blackKeyW - 2)
        };
      }
    }
    return { keys, whiteKeyW, blackKeyW, numWhite };
  }

  /**
   * Find MIDI key under pointer position on canvas keyboard
   */
  getWaterfallKeyAtPos(pos) {
    if (!this.canvasWaterfallKeys) return null;
    // Check black keys first because they layer on top
    for (const [mStr, key] of Object.entries(this.canvasWaterfallKeys)) {
      if (key.isBlack && pos.x >= key.x && pos.x <= key.x + key.width && pos.y >= key.y && pos.y <= key.y + key.height) {
        return Number(mStr);
      }
    }
    // Then check white keys
    for (const [mStr, key] of Object.entries(this.canvasWaterfallKeys)) {
      if (!key.isBlack && pos.x >= key.x && pos.x <= key.x + key.width && pos.y >= key.y && pos.y <= key.y + key.height) {
        return Number(mStr);
      }
    }
    return null;
  }

  /**
   * Trigger celebratory hit sparks and floating rating badge
   */
  triggerWaterfallHit(noteIndex, targetNote, isFirstTry, timing) {
    const midi = (targetNote && typeof targetNote.midi === 'number') ? targetNote.midi : null;
    if (midi === null) return;
    const lane = this.canvasWaterfallKeys?.[midi];
    const spawnX = lane ? (lane.x + lane.width / 2) : (this.width / 2);
    const spawnY = this.height - (this.width < 640 ? 68 : 84);

    const rating = timing?.rating || (isFirstTry ? 'perfect' : 'good');
    const colors = rating === 'perfect' 
      ? ['#fde047', '#facc15', '#38bdf8', '#4ade80', '#fbbf24']
      : ['#38bdf8', '#818cf8', '#a7f3d0', '#60a5fa'];

    for (let i = 0; i < 20; i++) {
      const angle = Math.PI * 1.5 + (Math.random() - 0.5) * 1.5;
      const speed = Math.random() * 7 + 3;
      this.waterfallParticles.push({
        x: spawnX + (Math.random() - 0.5) * 10,
        y: spawnY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3.5 + 2,
        life: 0,
        maxLife: Math.floor(Math.random() * 25 + 30)
      });
    }

    let badgeText = 'GOOD! 👍';
    let badgeColor = '#34d399';
    if (rating === 'perfect') {
      badgeText = timing?.text ? `PERFECT! ${timing.text}` : 'PERFECT! ✨';
      badgeColor = '#fbbf24';
    } else if (rating === 'early') {
      badgeText = timing?.text || 'EARLY ⚡';
      badgeColor = '#38bdf8';
    } else if (rating === 'late') {
      badgeText = timing?.text || 'LATE ⏳';
      badgeColor = '#c084fc';
    }

    this.waterfallFloatingTexts.push({
      x: spawnX,
      y: spawnY - 14,
      vy: -1.4,
      text: badgeText,
      color: badgeColor,
      life: 0,
      maxLife: 45
    });
  }

  /**
   * Trigger mistake warning sparks and error badge
   */
  triggerWaterfallMistake(noteIndex, expectedInfo, playedInfo) {
    const midi = (playedInfo && typeof playedInfo.midi === 'number') ? playedInfo.midi : null;
    const lane = midi !== null ? this.canvasWaterfallKeys?.[midi] : null;
    const spawnX = lane ? (lane.x + lane.width / 2) : (this.width / 2);
    const spawnY = this.height - (this.width < 640 ? 68 : 84);

    for (let i = 0; i < 14; i++) {
      const angle = Math.PI * 1.5 + (Math.random() - 0.5) * 1.8;
      const speed = Math.random() * 5 + 2;
      this.waterfallParticles.push({
        x: spawnX + (Math.random() - 0.5) * 8,
        y: spawnY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#f43f5e',
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: 25
      });
    }

    this.waterfallFloatingTexts.push({
      x: spawnX,
      y: spawnY - 14,
      vy: -1.2,
      text: 'MISTAKE ❌',
      color: '#f43f5e',
      life: 0,
      maxLife: 40
    });
  }

  /**
   * Render Interactive Waterfall Synthesia Mode:
   * Notes cascade vertically downward onto an interactive piano keyboard.
   * As notes reach the target line, the player strikes the corresponding keys.
   */
  renderWaterfallMode(ctx, w, h, timestamp) {
    const isDark = this.options.theme === 'dark';
    const isMobile = w < 640;
    const keyboardH = isMobile ? 68 : 84;
    const hitY = h - keyboardH;
    const marginX = isMobile ? 8 : 16;
    const usableW = w - marginX * 2;

    const melody = this.practiceData?.melody;
    const notes = melody?.notes || [];
    const noteCount = notes.length;
    const results = this.practiceData?.noteResults || [];
    const currentIdx = this.practiceData?.noteIndex ?? 0;
    const isFinished = !!this.practiceData?.isFinished;
    const isTimeDriven = (this.practiceData?.mode === 'tempo' || this.practiceData?.mode === 'strict' || this.practiceData?.mode === 'first_read');

    // 1. Determine MIDI Range for Keyboard & Lanes
    let startMidi = 36; // C2
    let endMidi = 96;   // C7 (61 keys standard)

    if (w < 768 && noteCount > 0) {
      // Dynamic framing on small mobile screens
      const midis = notes.map(n => n.midi).filter(m => typeof m === 'number');
      if (midis.length > 0) {
        const minM = Math.min(...midis);
        const maxM = Math.max(...midis);
        startMidi = Math.max(36, Math.floor((minM - 2) / 12) * 12);
        endMidi = Math.min(96, Math.ceil((maxM + 3) / 12) * 12);
        if (endMidi - startMidi < 36) {
          if (startMidi > 36) startMidi = Math.max(36, startMidi - 12);
          if (endMidi < 96) endMidi = Math.min(96, endMidi + 12);
        }
      }
    }

    const layout = this.computeWaterfallLayout(startMidi, endMidi, marginX, usableW, hitY, keyboardH);
    this.canvasWaterfallKeys = layout.keys;

    // 2. Clear & Draw Deep Atmospheric Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (isDark) {
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.7, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
    } else {
      bgGrad.addColorStop(0, '#f1f5f9');
      bgGrad.addColorStop(0.7, '#e2e8f0');
      bgGrad.addColorStop(1, '#cbd5e1');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 3. Draw Vertical Lanes
    for (const [mStr, key] of Object.entries(layout.keys)) {
      const midi = Number(mStr);
      if (key.isBlack) {
        ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.28)' : 'rgba(0, 0, 0, 0.04)';
      } else {
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(255, 255, 255, 0.4)';
      }
      ctx.fillRect(key.laneX, 0, key.laneW, hitY);

      // Lane separator
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(key.laneX + key.laneW, 0);
      ctx.lineTo(key.laneX + key.laneW, hitY);
      ctx.stroke();

      // Octave C markers at top
      if (midi % 12 === 0) {
        const octave = Math.floor(midi / 12) - 1;
        ctx.font = '700 9px "Inter", sans-serif';
        ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 165, 233, 0.4)';
        ctx.textAlign = 'center';
        ctx.fillText(`C${octave}`, key.laneX + key.laneW / 2, 14);
      }
    }

    // 4. Calculate Beat Progression & Timing
    const noteBeats = [];
    let cumulativeBeats = 0;
    for (let i = 0; i < noteCount; i++) {
      noteBeats.push(cumulativeBeats);
      cumulativeBeats += Math.max(0.1, notes[i].duration || 1);
    }

    let currentBeats = 0;
    if (isTimeDriven) {
      if (this.practiceData?.isCountingIn) {
        const cBeat = this.practiceData.countInBeat || 1;
        const cTot = this.practiceData.countInTotal || 4;
        currentBeats = -(cTot - cBeat + 1);
      } else {
        currentBeats = this.playheadBeats || this.practiceData?.playheadBeats || 0;
      }
    } else {
      // Wait-for-note mode: smooth gliding towards current target note
      const targetBeat = noteBeats[currentIdx] || 0;
      if (typeof this.smoothWaitBeats !== 'number' || Math.abs(this.smoothWaitBeats - targetBeat) > 5) {
        this.smoothWaitBeats = targetBeat;
      } else {
        this.smoothWaitBeats += (targetBeat - this.smoothWaitBeats) * 0.14;
      }
      currentBeats = this.smoothWaitBeats;
    }

    const lookaheadBeats = isMobile ? 5.0 : 6.0;
    const pixelsPerBeat = hitY / lookaheadBeats;

    // 5. Draw Horizontal Beat & Measure Grid Lines
    const beatsPerMeasure = melody?.timeSignature?.[0] || 4;
    const minGridBeat = Math.floor(currentBeats - 1);
    const maxGridBeat = Math.ceil(currentBeats + lookaheadBeats + 1);

    for (let b = Math.max(0, minGridBeat); b <= maxGridBeat; b++) {
      const lineY = hitY - (b - currentBeats) * pixelsPerBeat;
      if (lineY < 0 || lineY > hitY) continue;

      const isMeasure = (b % beatsPerMeasure === 0);
      ctx.strokeStyle = isMeasure
        ? (isDark ? 'rgba(56, 189, 248, 0.24)' : 'rgba(14, 165, 233, 0.28)')
        : (isDark ? 'rgba(255, 255, 255, 0.045)' : 'rgba(0, 0, 0, 0.05)');
      ctx.lineWidth = isMeasure ? 1.5 : 1.0;
      ctx.beginPath();
      ctx.moveTo(marginX, lineY);
      ctx.lineTo(marginX + usableW, lineY);
      ctx.stroke();

      if (isMeasure && b >= 0) {
        const mNum = Math.floor(b / beatsPerMeasure) + 1;
        ctx.font = '600 10px "Inter", sans-serif';
        ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 165, 233, 0.6)';
        ctx.textAlign = 'left';
        ctx.fillText(`Bar ${mNum}`, marginX + 4, lineY - 3);
      }
    }

    // 6. Draw Active Laser Beams from pressed keys upward
    const pressedMidis = new Set(this.activeNotes.keys());
    if (this.canvasPressedMidi !== null) pressedMidis.add(this.canvasPressedMidi);

    for (const midi of pressedMidis) {
      const key = layout.keys[midi];
      if (!key) continue;
      const isTreble = midi >= 60;
      const flareGrad = ctx.createLinearGradient(0, hitY, 0, 0);
      flareGrad.addColorStop(0, isTreble ? 'rgba(56, 189, 248, 0.45)' : 'rgba(168, 85, 247, 0.45)');
      flareGrad.addColorStop(0.4, isTreble ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)');
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = flareGrad;
      ctx.fillRect(key.laneX, 0, key.laneW, hitY);
    }

    // 7. Draw Falling Notes
    const currentTargetNote = (!isFinished && notes[currentIdx]) ? notes[currentIdx] : null;

    if (noteCount > 0) {
      for (let i = 0; i < noteCount; i++) {
        const note = notes[i];
        if (typeof note.midi !== 'number') continue;
        const lane = layout.keys[note.midi];
        if (!lane) continue;

        const startBeat = noteBeats[i];
        const dur = Math.max(0.25, note.duration || 1);
        const bottomY = hitY - (startBeat - currentBeats) * pixelsPerBeat;
        const barH = Math.max(16, dur * pixelsPerBeat);
        const topY = bottomY - barH;

        if (topY > h + 10 || bottomY < -20) continue;

        const isCurrentTarget = (i === currentIdx && !isFinished);
        const res = results[i];
        const isPastHit = bottomY > hitY + 5;

        let strokeCol = '#38bdf8';
        let topCol = '#38bdf8';
        let botCol = '#0284c7';
        let shadowCol = '#38bdf8';

        if (res) {
          if (res.status === 'correct') {
            topCol = '#34d399';
            botCol = '#059669';
            strokeCol = '#6ee7b7';
            shadowCol = '#10b981';
          } else if (res.status === 'mistake') {
            topCol = '#fb7185';
            botCol = '#e11d48';
            strokeCol = '#fda4af';
            shadowCol = '#f43f5e';
          } else if (res.status === 'missed') {
            topCol = 'rgba(244, 63, 94, 0.4)';
            botCol = 'rgba(159, 18, 57, 0.3)';
            strokeCol = 'rgba(244, 63, 94, 0.5)';
            shadowCol = 'transparent';
          }
        } else if (isCurrentTarget) {
          const pulse = (Math.sin(timestamp * 0.008) + 1) * 0.5;
          topCol = pulse > 0.5 ? '#fde047' : '#38bdf8';
          botCol = pulse > 0.5 ? '#eab308' : '#0284c7';
          strokeCol = '#ffffff';
          shadowCol = pulse > 0.5 ? '#fde047' : '#38bdf8';
        } else {
          const isTreble = note.midi >= 60;
          if (isTreble) {
            topCol = '#38bdf8';
            botCol = '#2563eb';
            strokeCol = '#7dd3fc';
            shadowCol = '#0284c7';
          } else {
            topCol = '#c084fc';
            botCol = '#7c3aed';
            strokeCol = '#e9d5ff';
            shadowCol = '#9333ea';
          }
        }

        ctx.save();
        if (isPastHit && res) {
          ctx.globalAlpha = 0.55;
        }

        if (isCurrentTarget || (!isPastHit && Math.abs(bottomY - hitY) < 40)) {
          ctx.shadowColor = shadowCol;
          ctx.shadowBlur = isCurrentTarget ? 16 : 8;
        }

        const noteGrad = ctx.createLinearGradient(0, topY, 0, bottomY);
        noteGrad.addColorStop(0, topCol);
        noteGrad.addColorStop(1, botCol);
        ctx.fillStyle = noteGrad;

        const cornerRadius = Math.min(6, Math.floor(lane.laneW / 3));
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(lane.laneX, topY, lane.laneW, barH, cornerRadius);
          ctx.fill();
          ctx.strokeStyle = strokeCol;
          ctx.lineWidth = isCurrentTarget ? 2 : 1;
          ctx.stroke();
        } else {
          ctx.fillRect(lane.laneX, topY, lane.laneW, barH);
        }

        // Inner glass highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(lane.laneX + 1, topY + 2, 2, Math.max(4, barH - 4));

        // Note Name Label
        if (barH >= 16 && lane.laneW >= 12) {
          ctx.font = `800 ${Math.min(12, Math.max(9, Math.floor(lane.laneW * 0.42)))}px "Inter", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 4;
          const labelY = Math.min(bottomY - 10, topY + barH / 2);
          ctx.fillText(note.name || MusicTheory.getNoteInfo(note.midi, this.options.preferFlats).displayName, lane.laneX + lane.laneW / 2, labelY);
        }

        // Target chevron pointer
        if (isCurrentTarget) {
          const distToHit = bottomY - hitY;
          if (Math.abs(distToHit) < 45) {
            ctx.save();
            ctx.fillStyle = '#fde047';
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            const ax = lane.laneX + lane.laneW / 2;
            const ay = Math.min(hitY - 2, bottomY + 3);
            ctx.moveTo(ax, ay + 6);
            ctx.lineTo(ax - 5, ay);
            ctx.lineTo(ax + 5, ay);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }

        ctx.restore();
      }
    } else {
      // Free play prompt
      ctx.save();
      ctx.font = '600 14px "Inter", sans-serif';
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.75)' : 'rgba(71, 85, 105, 0.85)';
      ctx.textAlign = 'center';
      ctx.fillText('🌊 Waterfall Mode • Play any key on your keyboard below to see notes illuminate!', w / 2, hitY * 0.45);
      ctx.restore();
    }

    // 8. Draw Glowing Hit Baseline (Target Zone)
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    const hitGrad = ctx.createLinearGradient(marginX, 0, marginX + usableW, 0);
    hitGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    hitGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.95)');
    hitGrad.addColorStop(1, 'rgba(168, 85, 247, 0.4)');

    ctx.strokeStyle = hitGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(marginX, hitY);
    ctx.lineTo(marginX + usableW, hitY);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(marginX, hitY);
    ctx.lineTo(marginX + usableW, hitY);
    ctx.stroke();
    ctx.restore();

    // 9. Draw Canvas Piano Keyboard
    const qwertyHints = {};
    if (this.options.qwertyKeyMap) {
      Object.assign(qwertyHints, this.options.qwertyKeyMap);
    }

    // 9A. White Keys Pass
    for (const [mStr, key] of Object.entries(layout.keys)) {
      if (key.isBlack) continue;
      const midi = Number(mStr);
      const isPressed = pressedMidis.has(midi);
      const isTarget = currentTargetNote && currentTargetNote.midi === midi;

      const yOffset = isPressed ? 3 : 0;
      const keyH = key.height - yOffset;
      const keyY = key.y + yOffset;

      ctx.save();
      const whiteGrad = ctx.createLinearGradient(0, keyY, 0, keyY + keyH);
      if (isPressed) {
        whiteGrad.addColorStop(0, '#7dd3fc');
        whiteGrad.addColorStop(0.5, '#38bdf8');
        whiteGrad.addColorStop(1, '#0284c7');
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
      } else if (isTarget) {
        const tPulse = (Math.sin(timestamp * 0.008) + 1) * 0.5;
        whiteGrad.addColorStop(0, '#fef08a');
        whiteGrad.addColorStop(0.5, '#fde047');
        whiteGrad.addColorStop(1, isDark ? '#e2e8f0' : '#ffffff');
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10 * tPulse;
      } else if (isDark) {
        whiteGrad.addColorStop(0, '#f8fafc');
        whiteGrad.addColorStop(0.85, '#e2e8f0');
        whiteGrad.addColorStop(1, '#cbd5e1');
      } else {
        whiteGrad.addColorStop(0, '#ffffff');
        whiteGrad.addColorStop(0.85, '#f8fafc');
        whiteGrad.addColorStop(1, '#f1f5f9');
      }

      ctx.fillStyle = whiteGrad;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(key.x, keyY, key.width - 1, keyH, [0, 0, 4, 4]);
        ctx.fill();
        ctx.strokeStyle = isPressed ? '#0284c7' : (isDark ? '#64748b' : '#94a3b8');
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillRect(key.x, keyY, key.width - 1, keyH);
      }

      // Middle C (60) marker dot
      if (midi === 60) {
        ctx.fillStyle = isPressed ? '#ffffff' : '#0284c7';
        ctx.beginPath();
        ctx.arc(key.x + key.width / 2, keyY + keyH - 24, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Key Note Label
      ctx.font = '700 10.5px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = isPressed ? '#ffffff' : '#334155';
      const info = MusicTheory.getNoteInfo(midi, this.options.preferFlats);
      ctx.fillText(info.displayName, key.x + key.width / 2, keyY + keyH - 6);

      ctx.restore();
    }

    // 9B. Black Keys Pass
    for (const [mStr, key] of Object.entries(layout.keys)) {
      if (!key.isBlack) continue;
      const midi = Number(mStr);
      const isPressed = pressedMidis.has(midi);
      const isTarget = currentTargetNote && currentTargetNote.midi === midi;

      const yOffset = isPressed ? 2 : 0;
      const keyH = key.height - yOffset;
      const keyY = key.y + yOffset;

      ctx.save();
      const blackGrad = ctx.createLinearGradient(0, keyY, 0, keyY + keyH);
      if (isPressed) {
        blackGrad.addColorStop(0, '#a855f7');
        blackGrad.addColorStop(0.5, '#7c3aed');
        blackGrad.addColorStop(1, '#4f46e5');
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 14;
      } else if (isTarget) {
        const tPulse = (Math.sin(timestamp * 0.008) + 1) * 0.5;
        blackGrad.addColorStop(0, '#fde047');
        blackGrad.addColorStop(0.5, '#eab308');
        blackGrad.addColorStop(1, '#713f12');
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10 * tPulse;
      } else {
        blackGrad.addColorStop(0, '#27272a');
        blackGrad.addColorStop(0.7, '#18181b');
        blackGrad.addColorStop(1, '#09090b');
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 3;
      }

      ctx.fillStyle = blackGrad;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(key.x, keyY, key.width, keyH, [0, 0, 3, 3]);
        ctx.fill();
        ctx.strokeStyle = isPressed ? '#c084fc' : '#3f3f46';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillRect(key.x, keyY, key.width, keyH);
      }

      // Top rim highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(key.x + 1, keyY + 1, key.width - 2, 2);

      // Black Key Label
      ctx.font = '700 8.5px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = isPressed ? '#ffffff' : (isTarget ? '#000000' : '#cbd5e1');
      const info = MusicTheory.getNoteInfo(midi, this.options.preferFlats);
      ctx.fillText(info.displayName.replace(/[0-9]/g, ''), key.x + key.width / 2, keyY + keyH - 4);

      ctx.restore();
    }

    // 10. Update & Render Particle Bursts
    for (let i = this.waterfallParticles.length - 1; i >= 0; i--) {
      const p = this.waterfallParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.life++;
      p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
      if (p.life >= p.maxLife) {
        this.waterfallParticles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 11. Update & Render Floating Hit Ratings
    for (let i = this.waterfallFloatingTexts.length - 1; i >= 0; i--) {
      const ft = this.waterfallFloatingTexts[i];
      ft.y += ft.vy;
      ft.life++;
      ft.alpha = Math.max(0, 1 - (ft.life / ft.maxLife));
      if (ft.life >= ft.maxLife) {
        this.waterfallFloatingTexts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = '800 12px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 12. Top HUD Pill Overlays
    ctx.save();
    const hudY = 16;
    const badgeW = isMobile ? 120 : 210;
    const badgeH = 24;

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(14, 165, 233, 0.4)';
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(marginX, hudY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();
    }

    ctx.font = '800 11px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('🌊 WATERFALL', marginX + 8, hudY + badgeH / 2);

    if (!isMobile && melody) {
      ctx.font = '600 10.5px "Inter", sans-serif';
      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      const title = melody.title ? `• ${melody.title}` : '';
      ctx.fillText(title, marginX + 90, hudY + badgeH / 2);
    }

    const modeName = this.practiceData?.mode === 'pitch_perfect' ? 'Pitch Perfect' : (this.practiceData?.mode === 'wait' ? 'Wait for Note' : (this.practiceData?.mode === 'strict' ? 'Strict Time' : 'In-Tempo'));
    const rightPillW = isMobile ? 90 : 160;
    const rightPillX = marginX + usableW - rightPillW;

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.8)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(rightPillX, hudY, rightPillW, badgeH, 6);
      ctx.fill();
      ctx.stroke();
    }

    ctx.font = '700 10px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    const progressText = noteCount > 0 ? `${currentIdx + 1}/${noteCount} (${modeName})` : modeName;
    ctx.fillText(progressText, rightPillX + rightPillW / 2, hudY + badgeH / 2);
    ctx.restore();

    // 13. Count-In Banner Overlay
    if (this.practiceData?.isCountingIn) {
      const count = this.practiceData.countInBeat || 1;
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(0, 0, w, hitY);

      ctx.font = '900 48px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 20;
      ctx.fillText(`${count}`, w / 2, hitY / 2 - 10);

      ctx.font = '700 14px "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText('Get ready to play as notes reach the keys!', w / 2, hitY / 2 + 35);
      ctx.restore();
    }

    // 14. Finished Celebration Card Overlay
    if (isFinished) {
      const cardW = Math.min(340, w - 40);
      const cardH = 140;
      const cardX = (w - cardW) / 2;
      const cardY = (hitY - cardH) / 2;

      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
      ctx.shadowBlur = 18;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 12);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(cardX, cardY, cardW, cardH);
      }

      ctx.font = '900 16px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#10b981';
      ctx.fillText('🎉 Melody Complete!', w / 2, cardY + 16);

      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      ctx.fillText(`Played ${noteCount} notes on Waterfall Keyboard`, w / 2, cardY + 44);

      // Restart Button
      const btnW = 140;
      const btnH = 34;
      const btnX = (w - btnW) / 2;
      const btnY = cardY + cardH - 46;
      this.waterfallRestartBtnBounds = { x: btnX, y: btnY, width: btnW, height: btnH };

      const btnGrad = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
      btnGrad.addColorStop(0, '#0284c7');
      btnGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = btnGrad;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 8);
        ctx.fill();
      } else {
        ctx.fillRect(btnX, btnY, btnW, btnH);
      }

      ctx.font = '700 12px "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔄 Play Again', w / 2, btnY + btnH / 2);

      ctx.restore();
    } else {
      this.waterfallRestartBtnBounds = null;
    }
  }

  /**
   * Render Interactive Melody Practice Sheet Music Mode
   * Dispatches to either 2-Staff Vertical Scrolling layout, Single-Staff Horizontal layout, or Waterfall layout
   */
  renderPracticeMode(ctx, staffX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp) {
    if (this.options.staffLayout === 'waterfall') {
      this.renderWaterfallMode(ctx, this.width, this.height, timestamp);
    } else if (this.options.staffLayout === 'horizontal') {
      this.renderHorizontalPracticeMode(ctx, staffX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp);
    } else {
      this.renderVerticalPracticeMode(ctx, staffX, staffWidth, lineSpacing, timestamp);
    }
  }

  /**
   * Render Interactive Melody Practice with 2-Staff Vertical Scrolling
   * Always maintains 2 sets of grand staves on the screen.
   * As the user finishes the first line, they continue playing onto the second line,
   * while the staves scroll up smoothly and populate new notes in a new staff line below.
   */
  renderVerticalPracticeMode(ctx, staffX, staffWidth, lineSpacing, timestamp) {
    const H = this.height;
    if (!this.practiceData || !this.practiceData.melody) {
      this.drawIdleStaffGuide(ctx, staffX, staffWidth, H * 0.35, H * 0.65, lineSpacing);
      return;
    }

    this.noteHitboxes = [];
    const isDark = this.options.theme === 'dark';
    const melody = this.practiceData.melody;
    const activeKey = (melody && melody.key) || this.options.keySignature || 'C Major';
    const activeKeyDef = MusicTheory.getKeySignature(activeKey);
    const preferFlats = (activeKeyDef && activeKeyDef.flats && activeKeyDef.flats.length > 0) || this.options.preferFlats;
    const isMobile = this.width < 640;

    const showBass = this.shouldShowBassClef();

    const currentIdx = this.practiceData.noteIndex;
    const results = this.practiceData.noteResults || [];
    const isFinished = !!this.practiceData.isFinished;
    const totalNotes = melody.notes.length;
    const timeSig = melody.timeSignature || [4, 4];
    const beatsPerMeasure = timeSig[0] || 4;

    const mistakeIndices = this.getMistakeNoteIndices();
    const hasMistakes = mistakeIndices.length > 0;

    // Auto-focus first mistake upon finish if none selected
    if (isFinished && hasMistakes && (this.activeReviewMistakeIndex === -1 || !mistakeIndices.includes(this.activeReviewMistakeIndex))) {
      this.activeReviewMistakeIndex = mistakeIndices[0];
      this.notifyReviewNoteChanged();
    }

    // 1. Calculate Beat Timelines & Measures
    let cumulativeBeats = 0;
    const noteBeats = [];
    melody.notes.forEach((note) => {
      noteBeats.push(cumulativeBeats);
      cumulativeBeats += Math.max(0.1, note.duration || 1);
    });
    const totalBeats = Math.max(beatsPerMeasure, cumulativeBeats);
    const totalMeasures = Math.max(1, Math.ceil(totalBeats / beatsPerMeasure));

    // Staff vertical line spacing & clef metrics
    const vSpacing = Math.max(10, Math.min(13.5, Math.round(H * 0.027)));
    const clefMarginLeft = isMobile ? 12 : 18;
    const clefWidth = Math.ceil(966 * (vSpacing / 355.0));
    const clefX = staffX + clefMarginLeft;
    const clefRightEdge = clefX + clefWidth;

    // Distribution across systems (reserve space for clefs, key signature, and time signature)
    const keySigAccCount = activeKeyDef ? (activeKeyDef.flats?.length || activeKeyDef.sharps?.length || 0) : 0;
    const keySigGap = isMobile ? 10 : 14;
    const keySigStepW = vSpacing * 0.88;
    const keySigW = keySigAccCount > 0 ? Math.round((keySigAccCount - 1) * keySigStepW + vSpacing * 0.95) : 0;
    const keySigStartX = clefRightEdge + keySigGap;
    const keySigRightEdge = keySigAccCount > 0 ? (keySigStartX + keySigW) : clefRightEdge;

    const timeSigGap = isMobile ? 12 : 16;
    const timeSigW = Math.round(vSpacing * 1.6);
    const timeSigStartX = keySigRightEdge + timeSigGap;
    const timeSigCenterX = timeSigStartX + Math.round(timeSigW / 2);
    const timeSigRightEdge = timeSigStartX + timeSigW;

    const postHeaderGap = isMobile ? 16 : 22;
    const notesAreaStartX = timeSigRightEdge + postHeaderGap;
    const clefSectionW = notesAreaStartX - staffX;
    const notesAreaWidth = staffWidth - clefSectionW - (isMobile ? 12 : 20);

    const targetMeasureW = isMobile ? 170 : 230;
    const measuresPerLine = Math.max(2, Math.min(4, Math.floor(notesAreaWidth / targetMeasureW)));
    const measureWidth = notesAreaWidth / measuresPerLine;
    const totalSystems = Math.max(1, Math.ceil(totalMeasures / measuresPerLine));

    // Map each note to measure, system, and exact x position
    const notePositions = [];
    const noteToSystemMap = [];

    melody.notes.forEach((note, i) => {
      const startB = noteBeats[i];
      const mIdx = Math.min(totalMeasures - 1, Math.floor(startB / beatsPerMeasure));
      const sIdx = Math.min(totalSystems - 1, Math.floor(mIdx / measuresPerLine));
      const mInSys = mIdx % measuresPerLine;
      const beatInM = startB - mIdx * beatsPerMeasure;
      const frac = Math.max(0, Math.min(0.95, beatInM / beatsPerMeasure));

      const noteX = notesAreaStartX + mInSys * measureWidth + 20 + frac * (measureWidth - 36);

      notePositions.push({
        systemIndex: sIdx,
        measureIndex: mIdx,
        x: noteX
      });
      noteToSystemMap.push(sIdx);
    });

    // 2. Active System & Smooth Vertical Scrolling
    let activeSystemIdx = 0;
    if (isFinished && this.activeReviewMistakeIndex >= 0 && this.activeReviewMistakeIndex < totalNotes) {
      activeSystemIdx = noteToSystemMap[this.activeReviewMistakeIndex] || 0;
    } else if (currentIdx >= 0 && currentIdx < totalNotes) {
      activeSystemIdx = noteToSystemMap[currentIdx] || 0;
    } else if (isFinished) {
      activeSystemIdx = Math.max(0, totalSystems - 2);
    }

    const targetVerticalScroll = activeSystemIdx;
    if (this.smoothVerticalScroll === undefined || isNaN(this.smoothVerticalScroll)) {
      this.smoothVerticalScroll = targetVerticalScroll;
    } else {
      this.smoothVerticalScroll += (targetVerticalScroll - this.smoothVerticalScroll) * 0.16;
      if (Math.abs(targetVerticalScroll - this.smoothVerticalScroll) < 0.002) {
        this.smoothVerticalScroll = targetVerticalScroll;
      }
    }

    if (isNaN(this.manualVerticalScrollOffset)) this.manualVerticalScrollOffset = 0;
    const effectiveScroll = Math.max(0, Math.min(Math.max(0, totalSystems - 2), this.smoothVerticalScroll + this.manualVerticalScrollOffset));

    // 3. Layout Dimensions for 2 Systems on Screen
    const staffHeight = vSpacing * 4;
    const staffGap = showBass ? vSpacing * 3.6 : 0;
    const systemStaffHeight = showBass ? (staffHeight * 2 + staffGap) : staffHeight;

    const interSystemGap = showBass
      ? Math.max(38, Math.min(56, Math.round(H * 0.10)))
      : Math.max(52, Math.min(78, Math.round(H * 0.16)));
    const slotHeight = systemStaffHeight + interSystemGap;
    const topBaseY = Math.max(26, Math.round((H - (systemStaffHeight * 2 + interSystemGap)) / 2));

    const staffLineColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.42)';
    const staffBarColor  = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.65)';
    const clefColor      = isDark ? '#e2e8f0' : '#1e293b';

    // 4. Render Visible Systems
    for (let s = 0; s < totalSystems; s++) {
      const sysTopTrebleY = topBaseY + (s - effectiveScroll) * slotHeight;
      const sysBottomTrebleY = sysTopTrebleY + staffHeight;
      const sysTopBassY = showBass ? (sysBottomTrebleY + staffGap) : null;
      const sysBottomBassY = showBass ? (sysTopBassY + staffHeight) : null;
      const sysBottomEdge = showBass ? sysBottomBassY : sysBottomTrebleY;

      // Skip systems completely outside viewport
      if (sysTopTrebleY + systemStaffHeight < -30 || sysTopTrebleY > H + 40) {
        continue;
      }

      ctx.save();

      // Opacity fade for systems scrolling off the very top or bottom
      let sysAlpha = 1.0;
      if (sysTopTrebleY < topBaseY - 15) {
        sysAlpha = Math.max(0, 1 - (topBaseY - 15 - sysTopTrebleY) / slotHeight);
      } else if (sysBottomEdge > H - 15) {
        sysAlpha = Math.max(0, 1 - (sysBottomEdge - (H - 15)) / slotHeight);
      }
      ctx.globalAlpha = sysAlpha;

      // A. Staff Lines & Bracket
      this.drawGrandStaffLines(ctx, staffX, staffWidth, sysTopTrebleY, sysTopBassY, vSpacing, staffLineColor, staffBarColor);

      // B. Clefs
      this.drawClefs(ctx, clefX, sysTopTrebleY, sysTopBassY, vSpacing, clefColor);

      // Key Signature (Drawn on every system)
      if (keySigAccCount > 0) {
        this.drawKeySignature(ctx, keySigStartX, sysBottomTrebleY, sysBottomBassY, vSpacing, activeKeyDef, clefColor);
      }

      // C. Time Signature (Only on First System)
      if (s === 0) {
        this.drawTimeSignature(ctx, timeSigCenterX, sysBottomTrebleY, sysBottomBassY, vSpacing, timeSig);
      }

      // D. Measure Barlines & Numbers for this System
      const startM = s * measuresPerLine;
      const endM = Math.min(totalMeasures, (s + 1) * measuresPerLine);

      for (let m = startM; m <= endM; m++) {
        const mInSys = m - startM;
        const barX = notesAreaStartX + mInSys * measureWidth;
        const isSongEnd = (m === totalMeasures);

        if (mInSys > 0 || isSongEnd) {
          ctx.save();
          if (isSongEnd && mInSys === (endM - startM)) {
            // Double barline at end of piece
            ctx.strokeStyle = isDark ? 'rgba(203, 213, 225, 0.75)' : 'rgba(15, 23, 42, 0.75)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(barX - 4, sysTopTrebleY);
            ctx.lineTo(barX - 4, sysBottomTrebleY);
            if (showBass && sysTopBassY && sysBottomBassY) {
              ctx.moveTo(barX - 4, sysTopBassY);
              ctx.lineTo(barX - 4, sysBottomBassY);
            }
            ctx.stroke();

            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(barX, sysTopTrebleY);
            ctx.lineTo(barX, sysBottomTrebleY);
            if (showBass && sysTopBassY && sysBottomBassY) {
              ctx.moveTo(barX, sysTopBassY);
              ctx.lineTo(barX, sysBottomBassY);
            }
            ctx.stroke();
          } else if (mInSys > 0 && mInSys < measuresPerLine) {
            // Standard measure barline
            ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(15, 23, 42, 0.35)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(barX, sysTopTrebleY);
            ctx.lineTo(barX, sysBottomTrebleY);
            if (showBass && sysTopBassY && sysBottomBassY) {
              ctx.moveTo(barX, sysTopBassY);
              ctx.lineTo(barX, sysBottomBassY);
            }
            ctx.stroke();

            // Measure Number Badge
            ctx.font = '700 8.5px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
            const numW = 16;
            const numH = 12;
            const pillY = sysTopTrebleY - 14;
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(barX - numW / 2, pillY, numW, numH, 3);
              ctx.fill();
            } else {
              ctx.fillRect(barX - numW / 2, pillY, numW, numH);
            }
            ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
            ctx.fillText(String(m + 1), barX, pillY + numH / 2);
          }
          ctx.restore();
        }
      }

      // E. Contour Ribbons across consecutive notes in this system
      if (this.options.showIntervalContour && melody.notes.length >= 2) {
        for (let i = 0; i < melody.notes.length - 1; i++) {
          if (noteToSystemMap[i] === s && noteToSystemMap[i + 1] === s) {
            const n1 = melody.notes[i];
            const n2 = melody.notes[i + 1];
            const info1 = MusicTheory.getNoteInfo(n1.midi, preferFlats);
            const clef1 = (showBass && n1.midi < this.options.splitPoint) ? 'bass' : 'treble';
            const pos1 = MusicTheory.getStaffPosition(info1.diatonicStep, clef1);
            const y1 = (clef1 === 'treble' ? sysBottomTrebleY : sysBottomBassY) - pos1 * (vSpacing / 2);

            const info2 = MusicTheory.getNoteInfo(n2.midi, preferFlats);
            const clef2 = (showBass && n2.midi < this.options.splitPoint) ? 'bass' : 'treble';
            const pos2 = MusicTheory.getStaffPosition(info2.diatonicStep, clef2);
            const y2 = (clef2 === 'treble' ? sysBottomTrebleY : sysBottomBassY) - pos2 * (vSpacing / 2);

            this.drawIntervalRibbon(ctx, { x: notePositions[i].x, y: y1, midi: n1.midi }, { x: notePositions[i + 1].x, y: y2, midi: n2.midi }, vSpacing, 0.45, false);
          }
        }
      }

      // F. Notes in this System
      if (!this.noteheadBlackPath2D && typeof Path2D !== 'undefined') {
        this.noteheadBlackPath2D = new Path2D(BRAVURA_NOTEHEADBLACK_PATH);
        this.noteheadHalfPath2D = new Path2D(BRAVURA_NOTEHEADHALF_PATH);
        this.noteheadWholePath2D = new Path2D(BRAVURA_NOTEHEADWHOLE_PATH);
        this.flag8thUpPath2D = new Path2D(BRAVURA_FLAG8THUP_PATH);
        this.flag8thDownPath2D = new Path2D(BRAVURA_FLAG8THDOWN_PATH);
      }

      const vScale = vSpacing / 355.0;
      const headHalfW = 212.5 * vScale;
      const rx = vSpacing * 0.62;
      const ry = vSpacing * 0.44;

      // 1. Collect and prepare note entries for this system
      const sysNotes = [];
      melody.notes.forEach((note, i) => {
        if (noteToSystemMap[i] !== s) return;
        const pos = notePositions[i];
        const noteX = pos.x;

        const info = MusicTheory.getNoteInfo(note.midi, preferFlats);
        const clef = (showBass && note.midi < this.options.splitPoint) ? 'bass' : 'treble';
        const staffPos = MusicTheory.getStaffPosition(info.diatonicStep, clef);
        const bottomY = clef === 'treble' ? sysBottomTrebleY : sysBottomBassY;
        const noteY = bottomY - staffPos * (vSpacing / 2);

        const isTarget = (i === currentIdx && !isFinished);
        const isPast = (i < currentIdx);
        const isReviewActive = (isFinished && i === this.activeReviewMistakeIndex);

        const res = results[i] || null;
        const hadMistakes = res && (res.mistakes > 0 || res.status === 'mistake' || res.status === 'missed');
        const wrongMidi = res ? res.lastWrongMidi : null;
        const wrongInfo = wrongMidi !== null ? MusicTheory.getNoteInfo(wrongMidi, preferFlats) : null;
        const wrongName = wrongInfo ? wrongInfo.fullName : '?';

        // Hitbox for clicking notes
        this.noteHitboxes.push({
          bounds: {
            x: noteX - 16,
            y: sysTopTrebleY - 20,
            width: 32,
            height: systemStaffHeight + 40
          },
          index: i
        });

        // Note Color
        let noteColor;
        const isHollow = note.duration >= 1.45 && note.duration < 3.5;
        const isWhole = note.duration >= 3.5;
        const isDotted = Math.abs(note.duration - 1.5) < 0.08 || Math.abs(note.duration - 3.0) < 0.08 || Math.abs(note.duration - 0.75) < 0.08;
        const isEighth = note.duration <= 0.65;

        if (isReviewActive) {
          noteColor = '#f43f5e';
        } else if (isTarget) {
          noteColor = '#38bdf8';
        } else if (isPast) {
          if (hadMistakes) {
            noteColor = '#f43f5e';
          } else if (res && res.status === 'reviewed') {
            noteColor = '#38bdf8';
          } else if (res && res.timing && Math.abs(res.timing.offsetMs) > 100) {
            noteColor = '#f59e0b';
          } else {
            noteColor = '#22c55e';
          }
        } else {
          noteColor = isDark ? '#e2e8f0' : '#1e293b';
        }

        sysNotes.push({
          note,
          index: i,
          noteX,
          noteY,
          mIdx: pos.measureIndex,
          info,
          clef,
          staffPos,
          bottomY,
          isHollow,
          isWhole,
          isDotted,
          isEighth,
          isTarget,
          isPast,
          isReviewActive,
          hadMistakes,
          wrongName,
          res,
          noteColor
        });
      });

      // 2. Compute Beam Groups for consecutive eighth notes in the same measure
      const beamGroups = [];
      let curGroup = [];
      for (let k = 0; k < sysNotes.length; k++) {
        const ent = sysNotes[k];
        if (ent.isEighth) {
          if (curGroup.length === 0) {
            curGroup.push(ent);
          } else {
            const prevEnt = curGroup[curGroup.length - 1];
            if (prevEnt.mIdx === ent.mIdx && ent.index === prevEnt.index + 1 && prevEnt.clef === ent.clef) {
              curGroup.push(ent);
            } else {
              if (curGroup.length >= 2) beamGroups.push(curGroup);
              curGroup = [ent];
            }
          }
        } else {
          if (curGroup.length >= 2) beamGroups.push(curGroup);
          curGroup = [];
        }
      }
      if (curGroup.length >= 2) beamGroups.push(curGroup);

      const beamedNoteIndices = new Set();
      beamGroups.forEach(grp => grp.forEach(e => beamedNoteIndices.add(e.index)));

      // 3. Compute stem endpoints for beamed groups
      beamGroups.forEach(grp => {
        const avgStaffPos = grp.reduce((acc, e) => acc + e.staffPos, 0) / grp.length;
        const stemDir = avgStaffPos >= 4 ? 'down' : 'up';
        const first = grp[0];
        const last = grp[grp.length - 1];
        const baseStemLen = vSpacing * 3.4;

        grp.forEach(e => {
          e.stemDir = stemDir;
          e.stemX = stemDir === 'up' ? (e.noteX + headHalfW - 0.6) : (e.noteX - headHalfW + 0.6);
          e.stemStartY = e.noteY;
        });

        let beamY1 = stemDir === 'up' ? (first.noteY - baseStemLen) : (first.noteY + baseStemLen);
        let beamY2 = stemDir === 'up' ? (last.noteY - baseStemLen) : (last.noteY + baseStemLen);
        const maxSlope = 0.35;
        const dx = Math.max(1, last.stemX - first.stemX);
        const clampedSlope = Math.max(-maxSlope, Math.min(maxSlope, (beamY2 - beamY1) / dx));
        beamY2 = beamY1 + clampedSlope * dx;

        grp.forEach(e => {
          e.stemEndY = beamY1 + clampedSlope * (e.stemX - first.stemX);
        });

        // Draw solid beam connecting the stem tips
        const beamThick = Math.round(vSpacing * 0.28);
        const beamOffset = stemDir === 'up' ? beamThick : -beamThick;
        ctx.save();
        ctx.fillStyle = isDark ? '#cbd5e1' : '#1e293b';
        ctx.beginPath();
        ctx.moveTo(first.stemX, beamY1);
        ctx.lineTo(last.stemX, beamY2);
        ctx.lineTo(last.stemX, beamY2 + beamOffset);
        ctx.lineTo(first.stemX, beamY1 + beamOffset);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // 4. Compute stems for isolated (non-beamed) notes
      sysNotes.forEach(ent => {
        if (!beamedNoteIndices.has(ent.index) && !ent.isWhole) {
          ent.stemDir = ent.staffPos >= 4 ? 'down' : 'up';
          ent.stemX = ent.stemDir === 'up' ? (ent.noteX + headHalfW - 0.6) : (ent.noteX - headHalfW + 0.6);
          ent.stemStartY = ent.noteY;
          ent.stemEndY = ent.stemDir === 'up' ? (ent.noteY - vSpacing * 3.4) : (ent.noteY + vSpacing * 3.4);
        }
      });

      // 5. Draw Slurs (from XML annotations or phrasing)
      for (let k = 0; k < sysNotes.length; k++) {
        const n1 = sysNotes[k];
        let n2 = null;
        if (n1.note.slurStart) {
          for (let m = k + 1; m < sysNotes.length; m++) {
            if (sysNotes[m].note.slurStop) {
              n2 = sysNotes[m];
              break;
            }
          }
        } else if (n1.isEighth && k < sysNotes.length - 1 && sysNotes[k + 1].isEighth && beamedNoteIndices.has(n1.index) && !sysNotes.some(x => x.note.slurStart)) {
          if (n1.mIdx === sysNotes[k + 1].mIdx && k % 2 === 0) {
            n2 = sysNotes[k + 1];
          }
        }

        if (n2) {
          const slurStemsUp = (n1.stemDir === 'up' && n2.stemDir === 'up');
          ctx.save();
          ctx.fillStyle = isDark ? 'rgba(203, 213, 225, 0.85)' : 'rgba(30, 41, 59, 0.85)';
          if (slurStemsUp) {
            const yStart = n1.noteY + vSpacing * 0.82;
            const yEnd = n2.noteY + vSpacing * 0.82;
            const midX = (n1.noteX + n2.noteX) / 2;
            const midY = Math.max(yStart, yEnd) + vSpacing * 0.72;
            ctx.beginPath();
            ctx.moveTo(n1.noteX, yStart);
            ctx.quadraticCurveTo(midX, midY, n2.noteX, yEnd);
            ctx.quadraticCurveTo(midX, midY - 1.8, n1.noteX, yStart);
            ctx.closePath();
            ctx.fill();
          } else {
            const yStart = n1.noteY - vSpacing * 0.82;
            const yEnd = n2.noteY - vSpacing * 0.82;
            const midX = (n1.noteX + n2.noteX) / 2;
            const midY = Math.min(yStart, yEnd) - vSpacing * 0.72;
            ctx.beginPath();
            ctx.moveTo(n1.noteX, yStart);
            ctx.quadraticCurveTo(midX, midY, n2.noteX, yEnd);
            ctx.quadraticCurveTo(midX, midY + 1.8, n1.noteX, yStart);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // 5.5 Pre-calculate clean pitch label baseline for this system so labels never cover notes/ledger lines
      let sysContentBottomY = (showBass && sysBottomBassY) ? sysBottomBassY : sysBottomTrebleY;
      sysNotes.forEach(ent => {
        const nhBottom = ent.noteY + vSpacing * 0.65;
        if (nhBottom > sysContentBottomY) sysContentBottomY = nhBottom;
        if (ent.stemDir === 'down' && ent.stemEndY) {
          if (ent.stemEndY > sysContentBottomY) sysContentBottomY = ent.stemEndY;
        }
        if (ent.staffPos <= -2) {
          const lowestLine = (ent.staffPos % 2 === 0) ? ent.staffPos : ent.staffPos + 1;
          const ledgerY = ent.bottomY - lowestLine * (vSpacing / 2) + 3;
          if (ledgerY > sysContentBottomY) sysContentBottomY = ledgerY;
        }
        const ribbonBottom = ent.noteY + vSpacing * 0.95;
        if (ribbonBottom > sysContentBottomY) sysContentBottomY = ribbonBottom;
      });
      const sysLabelLaneY = sysContentBottomY + Math.max(9, vSpacing * 0.7);

      // 6. Render each note in this system
      sysNotes.forEach(ent => {
        const { note, index, noteX, noteY, info, clef, staffPos, bottomY, isHollow, isWhole, isDotted, isEighth, isTarget, isPast, isReviewActive, hadMistakes, wrongName, res, noteColor } = ent;
        const i = index;

        // Ledger Lines
        this.drawLedgerLines(ctx, noteX, staffPos, bottomY, vSpacing);

        // Active Mistake Review Beacon Pulse
        if (isReviewActive) {
          const pulse = 0.5 + 0.5 * Math.sin(timestamp / 130);
          ctx.save();
          ctx.beginPath();
          ctx.arc(noteX, noteY, (vSpacing * 1.1) + pulse * 6, 0, Math.PI * 2);
          ctx.fillStyle = '#f43f5e';
          ctx.globalAlpha = 0.22 + pulse * 0.18;
          ctx.fill();
          ctx.lineWidth = 2.0;
          ctx.strokeStyle = '#fb7185';
          ctx.stroke();
          ctx.restore();
        }

        // Target note pulse halo & caret
        if (isTarget) {
          const isFlashingRed = this.flashMistakeTimestamp && (timestamp - this.flashMistakeTimestamp < 420);
          const glowColor = isFlashingRed ? '#ef4444' : '#38bdf8';

          const pulse = 0.5 + 0.5 * Math.sin(timestamp / 140);
          ctx.save();
          ctx.beginPath();
          ctx.arc(noteX, noteY, (vSpacing * 0.95) + pulse * 5, 0, Math.PI * 2);
          ctx.fillStyle = glowColor;
          ctx.globalAlpha = 0.22 + pulse * 0.18;
          ctx.fill();
          ctx.globalAlpha = 1.0;

          // Downward target caret
          const caretY = sysTopTrebleY - vSpacing * 1.1;
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.moveTo(noteX, caretY + 6);
          ctx.lineTo(noteX - 5, caretY);
          ctx.lineTo(noteX + 5, caretY);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Draw Note Stem
        if (!isWhole && ent.stemX !== undefined) {
          ctx.save();
          ctx.lineWidth = Math.max(1.1, vSpacing * 0.095);
          ctx.strokeStyle = noteColor;
          ctx.beginPath();
          ctx.moveTo(ent.stemX, ent.stemStartY);
          ctx.lineTo(ent.stemX, ent.stemEndY);
          ctx.stroke();

          // Isolated 8th note flag
          if (isEighth && !beamedNoteIndices.has(ent.index)) {
            ctx.fillStyle = noteColor;
            ctx.save();
            ctx.translate(ent.stemX, ent.stemEndY);
            ctx.scale(vScale, vScale);
            if (ent.stemDir === 'up' && this.flag8thUpPath2D) {
              ctx.fill(this.flag8thUpPath2D);
            } else if (ent.stemDir === 'down' && this.flag8thDownPath2D) {
              ctx.fill(this.flag8thDownPath2D);
            }
            ctx.restore();
          }
          ctx.restore();
        }

        // Draw Authentic Notehead (Bravura SMuFL vector)
        ctx.save();
        ctx.fillStyle = noteColor;
        if (isWhole && this.noteheadWholePath2D) {
          ctx.translate(noteX - 304 * vScale, noteY);
          ctx.scale(vScale, vScale);
          ctx.fill(this.noteheadWholePath2D);
        } else if (isHollow && this.noteheadHalfPath2D) {
          ctx.translate(noteX - 212.5 * vScale, noteY);
          ctx.scale(vScale, vScale);
          ctx.fill(this.noteheadHalfPath2D);
        } else if (this.noteheadBlackPath2D) {
          ctx.translate(noteX - 212.5 * vScale, noteY);
          ctx.scale(vScale, vScale);
          ctx.fill(this.noteheadBlackPath2D);
        } else {
          ctx.beginPath();
          ctx.ellipse(noteX, noteY, rx, ry, -0.32, 0, Math.PI * 2);
          if (isHollow) {
            ctx.lineWidth = 2.0;
            ctx.strokeStyle = noteColor;
            ctx.stroke();
          } else {
            ctx.fill();
          }
        }
        ctx.restore();

        // Staccato Dot
        if (note.staccato) {
          ctx.save();
          const staccatoY = (ent.stemDir === 'up') ? (noteY + vSpacing * 0.8) : (noteY - vSpacing * 0.8);
          ctx.fillStyle = noteColor;
          ctx.beginPath();
          ctx.arc(noteX, staccatoY, Math.round(vSpacing * 0.16), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Augmentation Dot
        if (isDotted) {
          ctx.save();
          const dotRadius = Math.round(vSpacing * 0.18);
          const dotX = noteX + headHalfW + vSpacing * 0.38;
          const onLine = (staffPos % 2 === 0);
          const dotY = onLine ? (noteY - vSpacing * 0.5) : noteY;
          ctx.fillStyle = noteColor;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Accidental
        const scoreAcc = MusicTheory.getNoteAccidentalForScore(note.midi, activeKey, note.explicitAccidental);
        if (scoreAcc) {
          this.drawAccidental(ctx, { x: noteX, y: noteY, midi: note.midi, info: ent.info, explicitAccidental: note.explicitAccidental, displayAccidental: scoreAcc, active: isTarget || isReviewActive, clef: ent.clef }, vSpacing, 1.0);
        }

        // Pitch Name Label
        if (this.options.showNoteNames) {
          ctx.save();
          const pillW = isReviewActive ? 38 : 30;
          const pillH = 15;
          const pillX = noteX - pillW / 2;
          const pillY = sysLabelLaneY;
          const noteName = (info && info.fullName) ? info.fullName : MusicTheory.getNoteInfo(note.midi, preferFlats).fullName;

          if (isReviewActive || isTarget) {
            ctx.fillStyle = isReviewActive ? '#f43f5e' : '#38bdf8';
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(pillX, pillY, pillW, pillH, 3);
              ctx.fill();
            } else {
              ctx.fillRect(pillX, pillY, pillW, pillH);
            }
            ctx.font = '800 9.5px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#0f172a';
            ctx.fillText(noteName, noteX, pillY + pillH / 2);
          } else {
            ctx.fillStyle = isDark ? '#0f172a' : '#f1f5f9';
            ctx.strokeStyle = isPast ? (hadMistakes ? 'rgba(244, 63, 94, 0.5)' : 'rgba(34, 197, 94, 0.5)') : (isDark ? '#334155' : '#cbd5e1');
            ctx.lineWidth = 1;
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(pillX, pillY, pillW, pillH, 3);
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.fillRect(pillX, pillY, pillW, pillH);
              ctx.strokeRect(pillX, pillY, pillW, pillH);
            }
            ctx.font = '600 9px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isPast ? (hadMistakes ? '#f87171' : '#4ade80') : (isDark ? '#94a3b8' : '#475569');
            ctx.fillText(noteName, noteX, pillY + pillH / 2);
          }
          ctx.restore();
        }

        // Rhythm Timing Accuracy Badge (±ms Offset)
        if (isPast && res && res.timing && res.timing.offsetMs !== undefined && res.timing.offsetMs !== null && (!hadMistakes || !isFinished)) {
          ctx.save();
          const ro = res.timing.offsetMs;
          const offStr = (ro >= 0 ? '+' : '') + ro + 'ms';
          const badgeY = sysTopTrebleY - vSpacing * 0.95;

          ctx.font = '700 8.5px "Inter", sans-serif';
          const textW = ctx.measureText(offStr).width;
          const badgeW = textW + 8;
          const badgeH = 13;
          const badgeX = noteX - badgeW / 2;

          const absOff = Math.abs(ro);
          let bgCol, borderCol, textCol;
          if (absOff <= 65) {
            bgCol = isDark ? 'rgba(34, 197, 94, 0.22)' : 'rgba(34, 197, 94, 0.15)';
            borderCol = isDark ? 'rgba(34, 197, 94, 0.8)' : '#16a34a';
            textCol = isDark ? '#86efac' : '#15803d';
          } else if (absOff <= 150) {
            bgCol = isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.15)';
            borderCol = isDark ? 'rgba(245, 158, 11, 0.8)' : '#d97706';
            textCol = isDark ? '#fde047' : '#b45309';
          } else {
            bgCol = isDark ? 'rgba(244, 63, 94, 0.22)' : 'rgba(244, 63, 94, 0.15)';
            borderCol = isDark ? 'rgba(244, 63, 94, 0.8)' : '#e11d48';
            textCol = isDark ? '#fecdd3' : '#be123c';
          }

          ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
          ctx.fillRect(badgeX, badgeY - badgeH, badgeW, badgeH);
          ctx.fillStyle = bgCol;
          ctx.strokeStyle = borderCol;
          ctx.lineWidth = 1;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY - badgeH, badgeW, badgeH, 3);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(badgeX, badgeY - badgeH, badgeW, badgeH);
            ctx.strokeRect(badgeX, badgeY - badgeH, badgeW, badgeH);
          }

          ctx.fillStyle = textCol;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(offStr, noteX, badgeY - badgeH / 2);
          ctx.restore();
        }

        // Mistake Callout Badge (with timing if available)
        if (hadMistakes && isFinished) {
          ctx.save();
          const flagY = sysTopTrebleY - vSpacing * 1.1;
          let flagText = wrongName;
          if (res && res.timing && res.timing.offsetMs !== undefined && res.timing.offsetMs !== null) {
            const ro = res.timing.offsetMs;
            flagText += ` (${ro >= 0 ? '+' : ''}${ro}ms)`;
          }
          ctx.font = '700 8.5px "Inter", sans-serif';
          const textW = ctx.measureText(flagText).width;
          const flagW = textW + 14;
          const flagH = 14;
          const flagX = noteX - flagW / 2;

          ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
          ctx.strokeStyle = isReviewActive ? '#f43f5e' : 'rgba(244, 63, 94, 0.7)';
          ctx.lineWidth = isReviewActive ? 1.5 : 1;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(flagX, flagY - flagH, flagW, flagH, 3);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(flagX, flagY - flagH, flagW, flagH);
            ctx.strokeRect(flagX, flagY - flagH, flagW, flagH);
          }
          ctx.fillStyle = isReviewActive ? '#fecdd3' : (isDark ? '#fb7185' : '#e11d48');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`✗ ${flagText}`, noteX, flagY - flagH / 2);
          ctx.restore();
        }
      });

      // G. Playhead for In-Tempo / Strict Sight-Reading
      const isTimeDriven = (this.practiceData.mode === 'tempo' || this.practiceData.mode === 'strict' || this.practiceData.mode === 'first_read');
      const playheadBeats = (this.playheadBeats !== undefined && this.playheadBeats !== null)
        ? this.playheadBeats
        : (this.practiceData.playheadBeats || 0);

      if (isTimeDriven && !isFinished && !this.practiceData.isCountingIn && !this.practiceData.isAnalyzing) {
        const curSysStartBeat = s * measuresPerLine * beatsPerMeasure;
        const curSysEndBeat = curSysStartBeat + (endM - startM) * beatsPerMeasure;
        if (playheadBeats >= curSysStartBeat && playheadBeats <= curSysEndBeat) {
          const fracInSys = Math.max(0, Math.min(1, (playheadBeats - curSysStartBeat) / Math.max(1, curSysEndBeat - curSysStartBeat)));
          const playheadX = notesAreaStartX + fracInSys * (endM - startM) * measureWidth;

          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(playheadX, sysTopTrebleY - 6);
          ctx.lineTo(playheadX, sysBottomBassY + 6);
          ctx.stroke();

          // Top and Bottom Pointer Triangles
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(playheadX, sysTopTrebleY);
          ctx.lineTo(playheadX - 5, sysTopTrebleY - 7);
          ctx.lineTo(playheadX + 5, sysTopTrebleY - 7);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(playheadX, sysBottomBassY);
          ctx.lineTo(playheadX - 5, sysBottomBassY + 7);
          ctx.lineTo(playheadX + 5, sysBottomBassY + 7);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();
    }

    // 5. Header Review Controls / Note Progress
    const headerY = Math.max(8, topBaseY - 22);
    const staffRightX = staffX + staffWidth;

    if (isFinished && hasMistakes) {
      const curOrder = mistakeIndices.indexOf(this.activeReviewMistakeIndex) + 1;
      const totalM = mistakeIndices.length;
      const btnW = 28;
      const btnH = 20;
      const pillW = 104;
      const groupW = btnW + 6 + pillW + 6 + btnW;
      const groupX = staffRightX - groupW;

      this.prevMistakeBtnBounds = { x: groupX, y: headerY, width: btnW, height: btnH };
      this.reviewPillBounds = { x: groupX + btnW + 6, y: headerY, width: pillW, height: btnH };
      this.nextMistakeBtnBounds = { x: groupX + btnW + 6 + pillW + 6, y: headerY, width: btnW, height: btnH };

      ctx.save();
      ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
      ctx.lineWidth = 1;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.prevMistakeBtnBounds.x, this.prevMistakeBtnBounds.y, btnW, btnH, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(this.prevMistakeBtnBounds.x, this.prevMistakeBtnBounds.y, btnW, btnH);
      }
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.beginPath();
      const pcx = this.prevMistakeBtnBounds.x + btnW / 2;
      const pcy = this.prevMistakeBtnBounds.y + btnH / 2;
      ctx.moveTo(pcx + 3, pcy - 4);
      ctx.lineTo(pcx + 3, pcy + 4);
      ctx.lineTo(pcx - 3, pcy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.12)';
      ctx.strokeStyle = isDark ? '#f43f5e' : '#e11d48';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.reviewPillBounds.x, this.reviewPillBounds.y, pillW, btnH, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(this.reviewPillBounds.x, this.reviewPillBounds.y, pillW, btnH);
      }
      ctx.font = '700 10.5px "Inter", sans-serif';
      ctx.fillStyle = isDark ? '#fb7185' : '#be123c';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Review ${curOrder || 1} of ${totalM}`, this.reviewPillBounds.x + pillW / 2, this.reviewPillBounds.y + btnH / 2);

      ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.nextMistakeBtnBounds.x, this.nextMistakeBtnBounds.y, btnW, btnH, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(this.nextMistakeBtnBounds.x, this.nextMistakeBtnBounds.y, btnW, btnH);
      }
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.beginPath();
      const ncx = this.nextMistakeBtnBounds.x + btnW / 2;
      const ncy = this.nextMistakeBtnBounds.y + btnH / 2;
      ctx.moveTo(ncx - 3, ncy - 4);
      ctx.lineTo(ncx - 3, ncy + 4);
      ctx.lineTo(ncx + 3, ncy);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      this.prevMistakeBtnBounds = null;
      this.nextMistakeBtnBounds = null;
      this.reviewPillBounds = null;

      ctx.save();
      ctx.font = '700 11px "Inter", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const progressStr = isFinished ? '🎉 Complete' : `Line ${activeSystemIdx + 1} of ${totalSystems} • Note ${Math.min(currentIdx + 1, totalNotes)} of ${totalNotes}`;
      ctx.fillText(progressStr, staffRightX, headerY + 8);
      ctx.restore();
    }
  }

  /**
   * Render Interactive Melody Practice Sheet Music Mode (Single Staff Horizontal Scrolling)
   */
  renderHorizontalPracticeMode(ctx, staffX, staffWidth, trebleBottomY, bassBottomY, lineSpacing, timestamp) {
    if (!this.practiceData || !this.practiceData.melody) {
      this.drawIdleStaffGuide(ctx, staffX, staffWidth, trebleBottomY, bassBottomY, lineSpacing);
      return;
    }

    this.noteHitboxes = [];
    const isDark = this.options.theme === 'dark';
    const preferFlats = this.options.preferFlats;
    const isMobile = this.width < 640;

    const melody = this.practiceData.melody;
    const currentIdx = this.practiceData.noteIndex;
    const results = this.practiceData.noteResults || [];
    const isFinished = !!this.practiceData.isFinished;
    const totalNotes = melody.notes.length;
    const timeSig = melody.timeSignature || [4, 4];
    const beatsPerMeasure = timeSig[0] || 4;

    const showBass = (bassBottomY !== null && bassBottomY !== undefined);
    const trebleTopY = trebleBottomY - lineSpacing * 4;
    const bassTopY = showBass ? (bassBottomY - lineSpacing * 4) : null;

    const mistakeIndices = this.getMistakeNoteIndices();
    const hasMistakes = mistakeIndices.length > 0;

    // Auto-focus first mistake upon melody finish if none selected
    if (isFinished && hasMistakes && (this.activeReviewMistakeIndex === -1 || !mistakeIndices.includes(this.activeReviewMistakeIndex))) {
      this.activeReviewMistakeIndex = mistakeIndices[0];
      this.notifyReviewNoteChanged();
    }

    // 1. Staff Header Controls & Banner
    const headerY = Math.max(10, trebleTopY - 26);
    const staffRightX = staffX + staffWidth;

    if (isFinished && hasMistakes) {
      // Header Review Navigation Controls
      const curOrder = mistakeIndices.indexOf(this.activeReviewMistakeIndex) + 1;
      const totalM = mistakeIndices.length;

      const btnW = 28;
      const btnH = 20;
      const pillW = 104;
      const groupW = btnW + 6 + pillW + 6 + btnW;
      const groupX = staffRightX - groupW;

      this.prevMistakeBtnBounds = { x: groupX, y: headerY, width: btnW, height: btnH };
      this.reviewPillBounds = { x: groupX + btnW + 6, y: headerY, width: pillW, height: btnH };
      this.nextMistakeBtnBounds = { x: groupX + btnW + 6 + pillW + 6, y: headerY, width: btnW, height: btnH };

      // Prev Button
      ctx.save();
      ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
      ctx.lineWidth = 1;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.prevMistakeBtnBounds.x, this.prevMistakeBtnBounds.y, btnW, btnH, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(this.prevMistakeBtnBounds.x, this.prevMistakeBtnBounds.y, btnW, btnH);
      }
      // Left Arrow
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.beginPath();
      const pcx = this.prevMistakeBtnBounds.x + btnW / 2;
      const pcy = this.prevMistakeBtnBounds.y + btnH / 2;
      ctx.moveTo(pcx + 3, pcy - 4);
      ctx.lineTo(pcx + 3, pcy + 4);
      ctx.lineTo(pcx - 3, pcy);
      ctx.closePath();
      ctx.fill();

      // Review Pill Badge
      ctx.fillStyle = isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.12)';
      ctx.strokeStyle = isDark ? '#f43f5e' : '#e11d48';
      ctx.lineWidth = 1;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.reviewPillBounds.x, this.reviewPillBounds.y, pillW, btnH, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(this.reviewPillBounds.x, this.reviewPillBounds.y, pillW, btnH);
      }
      ctx.font = '700 10.5px "Inter", sans-serif';
      ctx.fillStyle = isDark ? '#fb7185' : '#be123c';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Review ${curOrder || 1} of ${totalM}`, this.reviewPillBounds.x + pillW / 2, this.reviewPillBounds.y + btnH / 2);

      // Next Button
      ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.nextMistakeBtnBounds.x, this.nextMistakeBtnBounds.y, btnW, btnH, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(this.nextMistakeBtnBounds.x, this.nextMistakeBtnBounds.y, btnW, btnH);
      }
      // Right Arrow
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.beginPath();
      const ncx = this.nextMistakeBtnBounds.x + btnW / 2;
      const ncy = this.nextMistakeBtnBounds.y + btnH / 2;
      ctx.moveTo(ncx - 3, ncy - 4);
      ctx.lineTo(ncx - 3, ncy + 4);
      ctx.lineTo(ncx + 3, ncy);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else {
      this.prevMistakeBtnBounds = null;
      this.nextMistakeBtnBounds = null;
      this.reviewPillBounds = null;

      // Regular note progress badge in header
      ctx.save();
      ctx.font = '700 11px "Inter", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const progressStr = isFinished ? '🎉 Complete' : `Note ${Math.min(currentIdx + 1, totalNotes)} of ${totalNotes}`;
      ctx.fillText(progressStr, staffRightX, headerY + 8);
      ctx.restore();
    }

    // 2. Clefs, Key Signature, Time Signature, and Section Divider
    const activeKey = (melody && melody.key) || this.options.keySignature || 'C Major';
    const activeKeyDef = MusicTheory.getKeySignature(activeKey);
    const keySigAccCount = activeKeyDef ? (activeKeyDef.flats?.length || activeKeyDef.sharps?.length || 0) : 0;

    const clefMarginLeft = isMobile ? 12 : 18;
    const clefWidth = Math.ceil(966 * (lineSpacing / 355.0));
    const clefX = staffX + clefMarginLeft;
    const clefRightEdge = clefX + clefWidth;

    this.drawClefs(ctx, clefX, trebleTopY, bassTopY, lineSpacing, isDark ? '#e2e8f0' : '#1e293b');

    const keySigGap = isMobile ? 10 : 14;
    const keySigStepW = lineSpacing * 0.88;
    const keySigW = keySigAccCount > 0 ? Math.round((keySigAccCount - 1) * keySigStepW + lineSpacing * 0.95) : 0;
    const keySigStartX = clefRightEdge + keySigGap;
    const keySigRightEdge = keySigAccCount > 0 ? (keySigStartX + keySigW) : clefRightEdge;

    if (keySigAccCount > 0) {
      this.drawKeySignature(ctx, keySigStartX, trebleBottomY, bassBottomY, lineSpacing, activeKeyDef, isDark ? '#e2e8f0' : '#1e293b');
    }

    const timeSigGap = isMobile ? 12 : 16;
    const timeSigW = Math.round(lineSpacing * 1.6);
    const timeSigStartX = keySigRightEdge + timeSigGap;
    const timeSigCenterX = timeSigStartX + Math.round(timeSigW / 2);
    const timeSigRightEdge = timeSigStartX + timeSigW;

    this.drawTimeSignature(ctx, timeSigCenterX, trebleBottomY, bassBottomY, lineSpacing, timeSig);

    // Section barline separating clefs/time sig from the dedicated INPUT column
    const clefDividerX = timeSigRightEdge + (isMobile ? 14 : 20);
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(15, 23, 42, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(clefDividerX, trebleTopY);
    ctx.lineTo(clefDividerX, trebleBottomY);
    if (showBass && bassTopY && bassBottomY) {
      ctx.moveTo(clefDividerX, bassTopY);
      ctx.lineTo(clefDividerX, bassBottomY);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Dedicated Live MIDI INPUT Column
    const inputColumnX = clefDividerX + (isMobile ? 26 : 34);
    const targetMelodyNote = melody.notes[currentIdx] || null;

    let inputColor = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.5)';
    if (this.activeNotes.size > 0) {
      if (!isFinished) {
        let anyMatch = false;
        for (const midi of this.activeNotes.keys()) {
          if ((targetMelodyNote && midi === targetMelodyNote.midi) ||
              (currentIdx > 0 && midi === melody.notes[currentIdx - 1]?.midi)) {
            anyMatch = true;
            break;
          }
        }
        inputColor = anyMatch ? '#22c55e' : '#f43f5e';
      } else {
        inputColor = '#38bdf8';
      }
    }

    // INPUT column header label
    ctx.save();
    ctx.font = '800 9.5px "Inter", sans-serif';
    ctx.fillStyle = inputColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('INPUT', inputColumnX, trebleTopY - lineSpacing * 0.4);

    // INPUT column subtle vertical guide line
    ctx.strokeStyle = inputColor;
    ctx.lineWidth = 1.0;
    ctx.globalAlpha = this.activeNotes.size > 0 ? 0.5 : 0.18;
    ctx.beginPath();
    ctx.moveTo(inputColumnX, trebleTopY - lineSpacing * 0.2);
    ctx.lineTo(inputColumnX, bassBottomY + lineSpacing * 0.2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // Draw active played MIDI notes in this dedicated Live Input column
    this.drawActivePlayedNotes(ctx, inputColumnX, trebleBottomY, bassBottomY, lineSpacing);

    // Section barline separating Live Input column from Scrolling Melody Score
    const scoreDividerX = inputColumnX + (isMobile ? 26 : 34);
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.55)' : 'rgba(15, 23, 42, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(scoreDividerX, trebleTopY);
    ctx.lineTo(scoreDividerX, trebleBottomY);
    if (showBass && bassTopY && bassBottomY) {
      ctx.moveTo(scoreDividerX, bassTopY);
      ctx.lineTo(scoreDividerX, bassBottomY);
    }
    ctx.stroke();
    ctx.restore();

    // 4. Precompute Generous Non-Linear Duration Spacing & Measure Barlines
    const notesStartX = scoreDividerX + (isMobile ? 18 : 26);
    const availableWidth = staffRightX - notesStartX - 12;

    const noteXPositions = [];
    const barlineXPositions = [];
    let curX = notesStartX + 20;
    let currentMeasureBeats = 0;

    melody.notes.forEach((note, i) => {
      const info = MusicTheory.getNoteInfo(note.midi, preferFlats);

      if (i > 0) {
        const prevNote = melody.notes[i - 1];
        let spacing = Math.max(isMobile ? 58 : 72, (isMobile ? 74 : 90) * Math.pow(Math.max(0.25, prevNote.duration), 0.55));
        if (info.accidental) spacing += 16;

        if (currentMeasureBeats + prevNote.duration >= beatsPerMeasure - 0.01) {
          const barX = curX + spacing * 0.5;
          barlineXPositions.push(barX);
          spacing += 28;
          currentMeasureBeats = (currentMeasureBeats + prevNote.duration) % beatsPerMeasure;
        } else {
          currentMeasureBeats += prevNote.duration;
        }

        curX += spacing;
      } else {
        if (info.accidental) curX += 14;
      }

      noteXPositions.push(curX);
    });

    if (noteXPositions.length > 0) {
      const lastNote = melody.notes[melody.notes.length - 1];
      const lastSpacing = Math.max(65, 85 * Math.pow(Math.max(0.25, lastNote.duration), 0.55));
      barlineXPositions.push(noteXPositions[noteXPositions.length - 1] + lastSpacing * 0.75);
    }

    // Dynamic focal scrolling & drag offset
    const totalMelodyWidth = noteXPositions.length > 0 ? (noteXPositions[noteXPositions.length - 1] - notesStartX + 120) : availableWidth;
    let scrollX = 0;

    const isTimeDriven = (this.practiceData.mode === 'tempo' || this.practiceData.mode === 'strict' || this.practiceData.mode === 'first_read');
    const playheadBeats = (this.playheadBeats !== undefined && this.playheadBeats !== null)
      ? this.playheadBeats
      : (this.practiceData.playheadBeats || 0);

    // Interpolate raw X position for any musical beat along score timeline
    const getXForBeat = (targetBeats) => {
      if (noteXPositions.length === 0) return notesStartX + 20;
      let beatAcc = 0;
      for (let i = 0; i < melody.notes.length; i++) {
        const n = melody.notes[i];
        const nStart = beatAcc;
        const nEnd = beatAcc + (n.duration || 1);
        if (targetBeats >= nStart && targetBeats <= nEnd) {
          const frac = (targetBeats - nStart) / Math.max(0.01, n.duration || 1);
          const curX = noteXPositions[i];
          const nextX = (i + 1 < noteXPositions.length) ? noteXPositions[i + 1] : (curX + 80);
          return curX + frac * (nextX - curX);
        }
        beatAcc = nEnd;
      }
      if (targetBeats > beatAcc) {
        return noteXPositions[noteXPositions.length - 1] + (targetBeats - beatAcc) * 60;
      }
      return noteXPositions[0];
    };

    const playheadXRaw = getXForBeat(playheadBeats);
    const activeTargetX = (currentIdx >= 0 && currentIdx < totalNotes) ? noteXPositions[currentIdx] : notesStartX;

    // Sight-reading focal anchor: keep active note comfortably positioned around 25-32% from the left,
    // leaving ample room ahead (~65-75% of staff width) to read upcoming notes.
    const focalAnchorX = notesStartX + Math.min(isMobile ? 120 : 250, Math.max(70, availableWidth * 0.28));
    const lastNoteX = (noteXPositions.length > 0) ? noteXPositions[noteXPositions.length - 1] : notesStartX;
    const maxScroll = Math.max(0, lastNoteX - focalAnchorX + 60);

    // Minimum safety lookahead buffer: active note must NEVER be closer to the right staff boundary than this
    const minLookaheadRight = Math.min(isMobile ? 160 : 320, Math.max(120, availableWidth * 0.38));
    const maxAllowedScreenX = staffRightX - minLookaheadRight;

    let targetScrollX = 0;
    if (isTimeDriven && !isFinished && !this.practiceData.isCountingIn && !this.practiceData.isAnalyzing) {
      // Continuous smooth auto-scrolling locked to whichever is further ahead: playhead or active note
      const leadX = Math.max(playheadXRaw, activeTargetX);
      targetScrollX = Math.max(0, leadX - focalAnchorX);
    } else if (isFinished && this.activeReviewMistakeIndex >= 0 && this.activeReviewMistakeIndex < totalNotes) {
      const mistakeX = noteXPositions[this.activeReviewMistakeIndex];
      const reviewFocusX = notesStartX + (isMobile ? 40 : 80);
      targetScrollX = Math.max(0, mistakeX - reviewFocusX);
    } else if (isFinished) {
      // Hold completed melody comfortably in view at final note position instead of jarringly resetting to 0
      targetScrollX = Math.max(0, lastNoteX - focalAnchorX);
    } else {
      // In wait mode / interactive note reading:
      // When at the beginning (<= focalAnchorX), keep score resting stably at 0.
      // As notes advance past focalAnchorX, scroll smoothly to keep active note comfortably anchored.
      targetScrollX = Math.max(0, activeTargetX - focalAnchorX);
    }

    // Right-Edge Safety Horizon: If active note would ever get too close to the right edge, scroll immediately
    if (!isFinished && activeTargetX - targetScrollX > maxAllowedScreenX) {
      targetScrollX = Math.max(targetScrollX, activeTargetX - maxAllowedScreenX);
    }
    targetScrollX = Math.min(targetScrollX, maxScroll);

    // Immediate zero-align when starting from top of playthrough without manual panning
    if (currentIdx === 0 && !isFinished && !this.isUserDragging && this.manualScrollOffset === 0) {
      this.smoothScrollX = 0;
      this.activeReviewMistakeIndex = -1;
      targetScrollX = 0;
    }

    // Smooth interpolation to prevent abrupt visual jumps
    if (this.smoothScrollX === undefined || isNaN(this.smoothScrollX) || Math.abs(this.smoothScrollX - targetScrollX) > 600) {
      this.smoothScrollX = targetScrollX;
    } else {
      this.smoothScrollX += (targetScrollX - this.smoothScrollX) * 0.22;
    }

    // Hard safety enforcement: under no circumstances allow active target note to be drawn past maxAllowedScreenX
    if (!isFinished && activeTargetX - this.smoothScrollX > maxAllowedScreenX) {
      this.smoothScrollX = activeTargetX - maxAllowedScreenX;
    }

    // Apply manual drag / wheel offset
    if (isNaN(this.manualScrollOffset)) {
      this.manualScrollOffset = 0;
    }
    const maxScrollLimit = Math.max(maxScroll, totalMelodyWidth - availableWidth + 40);
    scrollX = Math.max(0, Math.min(maxScrollLimit, this.smoothScrollX + this.manualScrollOffset));
    if (isNaN(scrollX)) {
      scrollX = 0;
    }
    this.scrollX = scrollX;

    let horizContentBottomY = (showBass && bassBottomY) ? bassBottomY : trebleBottomY;
    melody.notes.forEach((note) => {
      const clef = (showBass && note.midi < 60) ? 'bass' : 'treble';
      const bottomY = clef === 'bass' ? bassBottomY : trebleBottomY;
      const staffPos = MusicTheory.getStaffPosition(note.midi, clef, activeKey);
      const noteY = bottomY - staffPos * (lineSpacing / 2);
      const nhBottom = noteY + lineSpacing * 0.65;
      if (nhBottom > horizContentBottomY) horizContentBottomY = nhBottom;
      if (staffPos <= -2) {
        const lowestLine = (staffPos % 2 === 0) ? staffPos : staffPos + 1;
        const ledgerY = bottomY - lowestLine * (lineSpacing / 2) + 3;
        if (ledgerY > horizContentBottomY) horizContentBottomY = ledgerY;
      }
      const ribbonBottom = noteY + lineSpacing * 0.95;
      if (ribbonBottom > horizContentBottomY) horizContentBottomY = ribbonBottom;
    });
    const labelBaselineY = horizContentBottomY + Math.max(9, lineSpacing * 0.7);

    // Clip rendering area to prevent drawing over clefs or INPUT column
    ctx.save();
    ctx.beginPath();
    ctx.rect(notesStartX - 6, 0, availableWidth + 22, this.height);
    ctx.clip();

    // 5. Draw Measure Barlines with Measure Numbers
    barlineXPositions.forEach((barXRaw, m) => {
      const barX = barXRaw - scrollX;
      if (barX < notesStartX - 40 || barX > staffRightX + 40) return;

      const isLast = (m === barlineXPositions.length - 1);
      ctx.save();
      if (isLast) {
        // Double barline
        ctx.strokeStyle = isDark ? 'rgba(203, 213, 225, 0.75)' : 'rgba(15, 23, 42, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(barX - 5, trebleTopY);
        ctx.lineTo(barX - 5, trebleBottomY);
        if (showBass && bassTopY && bassBottomY) {
          ctx.moveTo(barX - 5, bassTopY);
          ctx.lineTo(barX - 5, bassBottomY);
        }
        ctx.stroke();

        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(barX, trebleTopY);
        ctx.lineTo(barX, trebleBottomY);
        if (showBass && bassTopY && bassBottomY) {
          ctx.moveTo(barX, bassTopY);
          ctx.lineTo(barX, bassBottomY);
        }
        ctx.stroke();
      } else {
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(15, 23, 42, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(barX, trebleTopY);
        ctx.lineTo(barX, trebleBottomY);
        if (showBass && bassTopY && bassBottomY) {
          ctx.moveTo(barX, bassTopY);
          ctx.lineTo(barX, bassBottomY);
        }
        ctx.stroke();

        // Measure Number Pill
        ctx.font = '700 9px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
        const numW = 18;
        const numH = 13;
        const pillY = trebleTopY - 15;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(barX - numW / 2, pillY, numW, numH, 3);
          ctx.fill();
        } else {
          ctx.fillRect(barX - numW / 2, pillY, numW, numH);
        }
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText(String(m + 2), barX, pillY + numH / 2);
      }
      ctx.restore();
    });

    // 5.5 Optional Interval Contour Ribbons across practice score
    if (this.options.showIntervalContour && melody.notes.length >= 2) {
      for (let i = 0; i < melody.notes.length - 1; i++) {
        const n1 = melody.notes[i];
        const n2 = melody.notes[i + 1];
        const x1 = noteXPositions[i] - scrollX;
        const x2 = noteXPositions[i + 1] - scrollX;

        // Only draw for visible notes on screen
        if (x2 >= notesStartX - 40 && x1 <= staffRightX + 40) {
          const info1 = MusicTheory.getNoteInfo(n1.midi, preferFlats);
          const clef1 = (showBass && n1.midi < this.options.splitPoint) ? 'bass' : 'treble';
          const pos1 = MusicTheory.getStaffPosition(info1.diatonicStep, clef1);
          const y1 = (clef1 === 'treble' ? trebleBottomY : bassBottomY) - pos1 * (lineSpacing / 2);

          const info2 = MusicTheory.getNoteInfo(n2.midi, preferFlats);
          const clef2 = (showBass && n2.midi < this.options.splitPoint) ? 'bass' : 'treble';
          const pos2 = MusicTheory.getStaffPosition(info2.diatonicStep, clef2);
          const y2 = (clef2 === 'treble' ? trebleBottomY : bassBottomY) - pos2 * (lineSpacing / 2);

          this.drawIntervalRibbon(ctx, { x: x1, y: y1, midi: n1.midi }, { x: x2, y: y2, midi: n2.midi }, lineSpacing, 0.45, false);
        }
      }
    }

    // 6. Prepare Melody Notes & Beaming for Horizontal Practice Mode
    let curMeasureBeatsAcc = 0;
    let curMeasureIdx = 0;
    const noteMeasureIndices = [];
    melody.notes.forEach((note, i) => {
      if (i > 0) {
        const prevNote = melody.notes[i - 1];
        if (curMeasureBeatsAcc + prevNote.duration >= beatsPerMeasure - 0.01) {
          curMeasureIdx++;
          curMeasureBeatsAcc = (curMeasureBeatsAcc + prevNote.duration) % beatsPerMeasure;
        } else {
          curMeasureBeatsAcc += prevNote.duration;
        }
      }
      noteMeasureIndices.push(curMeasureIdx);
    });

    const vScale = lineSpacing / 355.0;
    const headHalfW = 212.5 * vScale;
    const renderedNotes = [];

    if (!this.noteheadBlackPath2D && typeof Path2D !== 'undefined') {
      this.noteheadBlackPath2D = new Path2D(BRAVURA_NOTEHEADBLACK_PATH);
      this.noteheadHalfPath2D = new Path2D(BRAVURA_NOTEHEADHALF_PATH);
      this.noteheadWholePath2D = new Path2D(BRAVURA_NOTEHEADWHOLE_PATH);
      this.flag8thUpPath2D = new Path2D(BRAVURA_FLAG8THUP_PATH);
      this.flag8thDownPath2D = new Path2D(BRAVURA_FLAG8THDOWN_PATH);
    }

    melody.notes.forEach((note, i) => {
      const noteX = noteXPositions[i] - scrollX;

      // Record note hitbox for direct clicking
      this.noteHitboxes.push({
        bounds: {
          x: noteX - 16,
          y: trebleTopY - 24,
          width: 32,
          height: (showBass && bassBottomY ? (bassBottomY - trebleTopY) : (lineSpacing * 4)) + 48
        },
        index: i
      });

      // Skip notes far off screen
      if (noteX < notesStartX - 60 || noteX > staffRightX + 60) return;

      const info = MusicTheory.getNoteInfo(note.midi, preferFlats);
      const clef = (showBass && note.midi < this.options.splitPoint) ? 'bass' : 'treble';
      const staffPos = MusicTheory.getStaffPosition(info.diatonicStep, clef);
      const bottomY = clef === 'treble' ? trebleBottomY : bassBottomY;
      const noteY = bottomY - staffPos * (lineSpacing / 2);

      const isTarget = i === currentIdx && !isFinished;
      const isPast = i < currentIdx;
      const isReviewActive = isFinished && i === this.activeReviewMistakeIndex;

      const res = results[i] || null;
      const hadMistakes = res && (res.mistakes > 0 || res.status === 'mistake' || res.status === 'missed');
      const wrongMidi = res ? res.lastWrongMidi : null;
      const wrongInfo = wrongMidi !== null ? MusicTheory.getNoteInfo(wrongMidi, preferFlats) : null;
      const wrongName = wrongInfo ? wrongInfo.fullName : '?';

      const isHollow = note.duration >= 2;
      const isWhole = note.duration >= 4;
      const isDotted = Math.abs(note.duration - 1.5) < 0.05 ||
                       Math.abs(note.duration - 3.0) < 0.05 ||
                       Math.abs(note.duration - 0.75) < 0.05;
      const isEighth = note.duration <= 0.65;

      let noteColor;
      if (isReviewActive) {
        noteColor = '#f43f5e'; // Vibrant Rose for active mistake review
      } else if (isTarget) {
        noteColor = '#38bdf8'; // Electric Sky for target
      } else if (isPast) {
        if (hadMistakes) {
          noteColor = '#f43f5e'; // Rose if mistake was made
        } else if (res && res.status === 'reviewed') {
          noteColor = '#38bdf8'; // Sky blue for ghost-fingered / audited notes
        } else if (res && res.timing && Math.abs(res.timing.offsetMs) > 100) {
          noteColor = '#f59e0b'; // Amber for loose timing
        } else {
          noteColor = '#22c55e'; // Clean Green
        }
      } else {
        noteColor = isDark ? '#e2e8f0' : '#1e293b'; // Slate readable
      }

      const mIdx = note.measureIndex !== undefined ? note.measureIndex : (noteMeasureIndices[i] || 0);

      renderedNotes.push({
        note, i, noteX, noteY, info, clef, staffPos, bottomY,
        isTarget, isPast, isReviewActive, hadMistakes, wrongName, res,
        noteColor, isHollow, isWhole, isDotted, isEighth, mIdx
      });
    });

    // Automatic 8th-note beaming
    const beamGroups = [];
    let curGroup = [];
    for (let k = 0; k < renderedNotes.length; k++) {
      const ent = renderedNotes[k];
      if (ent.isEighth && !ent.isWhole) {
        if (curGroup.length === 0) {
          curGroup.push(ent);
        } else {
          const prev = curGroup[curGroup.length - 1];
          if (prev.mIdx === ent.mIdx && prev.clef === ent.clef && Math.abs(ent.noteX - prev.noteX) < lineSpacing * 10) {
            curGroup.push(ent);
          } else {
            if (curGroup.length >= 2) beamGroups.push(curGroup);
            curGroup = [ent];
          }
        }
      } else {
        if (curGroup.length >= 2) beamGroups.push(curGroup);
        curGroup = [];
      }
    }
    if (curGroup.length >= 2) beamGroups.push(curGroup);

    const beamedNoteIndices = new Set();
    beamGroups.forEach(grp => grp.forEach(e => beamedNoteIndices.add(e.i)));

    // Compute stem endpoints for beamed groups
    beamGroups.forEach(grp => {
      const avgStaffPos = grp.reduce((acc, e) => acc + e.staffPos, 0) / grp.length;
      const stemDir = avgStaffPos >= 4 ? 'down' : 'up';
      const first = grp[0];
      const last = grp[grp.length - 1];
      const baseStemLen = lineSpacing * 3.4;

      grp.forEach(e => {
        e.stemDir = stemDir;
        e.stemX = stemDir === 'up' ? (e.noteX + headHalfW - 0.6) : (e.noteX - headHalfW + 0.6);
        e.stemStartY = e.noteY;
      });

      let beamY1 = stemDir === 'up' ? (first.noteY - baseStemLen) : (first.noteY + baseStemLen);
      let beamY2 = stemDir === 'up' ? (last.noteY - baseStemLen) : (last.noteY + baseStemLen);
      const maxSlope = 0.35;
      const dx = Math.max(1, last.stemX - first.stemX);
      const clampedSlope = Math.max(-maxSlope, Math.min(maxSlope, (beamY2 - beamY1) / dx));
      beamY2 = beamY1 + clampedSlope * dx;

      grp.forEach(e => {
        e.stemEndY = beamY1 + clampedSlope * (e.stemX - first.stemX);
      });

      // Draw solid beam connecting the stem tips
      const beamThick = Math.round(lineSpacing * 0.28);
      const beamOffset = stemDir === 'up' ? beamThick : -beamThick;
      ctx.save();
      ctx.fillStyle = isDark ? '#cbd5e1' : '#1e293b';
      ctx.beginPath();
      ctx.moveTo(first.stemX, beamY1);
      ctx.lineTo(last.stemX, beamY2);
      ctx.lineTo(last.stemX, beamY2 + beamOffset);
      ctx.lineTo(first.stemX, beamY1 + beamOffset);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Compute stems for isolated (non-beamed) notes
    renderedNotes.forEach(ent => {
      if (!beamedNoteIndices.has(ent.i) && !ent.isWhole) {
        ent.stemDir = ent.staffPos >= 4 ? 'down' : 'up';
        ent.stemX = ent.stemDir === 'up' ? (ent.noteX + headHalfW - 0.6) : (ent.noteX - headHalfW + 0.6);
        ent.stemStartY = ent.noteY;
        ent.stemEndY = ent.stemDir === 'up' ? (ent.noteY - lineSpacing * 3.4) : (ent.noteY + lineSpacing * 3.4);
      }
    });

    // Draw Slurs (from XML annotations or phrasing)
    for (let k = 0; k < renderedNotes.length; k++) {
      const n1 = renderedNotes[k];
      let n2 = null;
      if (n1.note.slurStart) {
        for (let m = k + 1; m < renderedNotes.length; m++) {
          if (renderedNotes[m].note.slurStop) {
            n2 = renderedNotes[m];
            break;
          }
        }
      } else if (n1.isEighth && k < renderedNotes.length - 1 && renderedNotes[k + 1].isEighth && beamedNoteIndices.has(n1.i) && !renderedNotes.some(x => x.note.slurStart)) {
        if (n1.mIdx === renderedNotes[k + 1].mIdx && k % 2 === 0) {
          n2 = renderedNotes[k + 1];
        }
      }

      if (n2) {
        const slurStemsUp = (n1.stemDir === 'up' && n2.stemDir === 'up');
        ctx.save();
        ctx.fillStyle = isDark ? 'rgba(203, 213, 225, 0.85)' : 'rgba(30, 41, 59, 0.85)';
        if (slurStemsUp) {
          const yStart = n1.noteY + lineSpacing * 0.82;
          const yEnd = n2.noteY + lineSpacing * 0.82;
          const midX = (n1.noteX + n2.noteX) / 2;
          const midY = Math.max(yStart, yEnd) + lineSpacing * 0.72;
          ctx.beginPath();
          ctx.moveTo(n1.noteX, yStart);
          ctx.quadraticCurveTo(midX, midY, n2.noteX, yEnd);
          ctx.quadraticCurveTo(midX, midY - 1.8, n1.noteX, yStart);
          ctx.closePath();
          ctx.fill();
        } else {
          const yStart = n1.noteY - lineSpacing * 0.82;
          const yEnd = n2.noteY - lineSpacing * 0.82;
          const midX = (n1.noteX + n2.noteX) / 2;
          const midY = Math.min(yStart, yEnd) - lineSpacing * 0.72;
          ctx.beginPath();
          ctx.moveTo(n1.noteX, yStart);
          ctx.quadraticCurveTo(midX, midY, n2.noteX, yEnd);
          ctx.quadraticCurveTo(midX, midY + 1.8, n1.noteX, yStart);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Render each note in horizontal mode
    renderedNotes.forEach(ent => {
      const { note, i, noteX, noteY, info, clef, staffPos, bottomY, isHollow, isWhole, isDotted, isEighth, isTarget, isPast, isReviewActive, hadMistakes, wrongName, res, noteColor } = ent;

      // Draw Ledger Lines
      this.drawLedgerLines(ctx, noteX, staffPos, bottomY, lineSpacing);

      // Review Active Beacon Pulse
      if (isReviewActive) {
        const pulse = 0.5 + 0.5 * Math.sin(timestamp / 130);
        ctx.save();
        ctx.beginPath();
        ctx.arc(noteX, noteY, (lineSpacing * 1.1) + pulse * 6, 0, Math.PI * 2);
        ctx.fillStyle = '#f43f5e';
        ctx.globalAlpha = 0.22 + pulse * 0.18;
        ctx.fill();
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#fb7185';
        ctx.stroke();
        ctx.restore();
      }

      // Target note pulse halo & caret
      if (isTarget) {
        const isFlashingRed = this.flashMistakeTimestamp && (timestamp - this.flashMistakeTimestamp < 420);
        const glowColor = isFlashingRed ? '#ef4444' : '#38bdf8';

        const pulse = 0.5 + 0.5 * Math.sin(timestamp / 140);
        ctx.save();
        ctx.beginPath();
        ctx.arc(noteX, noteY, (lineSpacing * 0.95) + pulse * 5, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = 0.22 + pulse * 0.18;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Downward target caret
        const caretY = trebleTopY - lineSpacing * 1.2;
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.moveTo(noteX, caretY + 7);
        ctx.lineTo(noteX - 5, caretY);
        ctx.lineTo(noteX + 5, caretY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw Note Stem
      if (!isWhole && ent.stemX !== undefined) {
        ctx.save();
        ctx.lineWidth = Math.max(1.1, lineSpacing * 0.095);
        ctx.strokeStyle = noteColor;
        ctx.beginPath();
        ctx.moveTo(ent.stemX, ent.stemStartY);
        ctx.lineTo(ent.stemX, ent.stemEndY);
        ctx.stroke();

        // Isolated 8th note flag
        if (isEighth && !beamedNoteIndices.has(ent.i)) {
          ctx.fillStyle = noteColor;
          ctx.save();
          ctx.translate(ent.stemX, ent.stemEndY);
          ctx.scale(vScale, vScale);
          if (ent.stemDir === 'up' && this.flag8thUpPath2D) {
            ctx.fill(this.flag8thUpPath2D);
          } else if (ent.stemDir === 'down' && this.flag8thDownPath2D) {
            ctx.fill(this.flag8thDownPath2D);
          }
          ctx.restore();
        }
        ctx.restore();
      }

      // Draw Authentic Notehead (Bravura SMuFL vector)
      ctx.save();
      ctx.fillStyle = noteColor;
      if (isWhole && this.noteheadWholePath2D) {
        ctx.translate(noteX - 304 * vScale, noteY);
        ctx.scale(vScale, vScale);
        ctx.fill(this.noteheadWholePath2D);
      } else if (isHollow && this.noteheadHalfPath2D) {
        ctx.translate(noteX - 212.5 * vScale, noteY);
        ctx.scale(vScale, vScale);
        ctx.fill(this.noteheadHalfPath2D);
      } else if (this.noteheadBlackPath2D) {
        ctx.translate(noteX - 212.5 * vScale, noteY);
        ctx.scale(vScale, vScale);
        ctx.fill(this.noteheadBlackPath2D);
      } else {
        const rx = lineSpacing * 0.62;
        const ry = lineSpacing * 0.44;
        ctx.beginPath();
        ctx.ellipse(noteX, noteY, rx, ry, -0.32, 0, Math.PI * 2);
        if (isHollow) {
          ctx.lineWidth = 2.0;
          ctx.strokeStyle = noteColor;
          ctx.stroke();
        } else {
          ctx.fill();
        }
      }
      ctx.restore();

      // Staccato Dot
      if (note.staccato) {
        ctx.save();
        const staccatoY = (ent.stemDir === 'up') ? (noteY + lineSpacing * 0.8) : (noteY - lineSpacing * 0.8);
        ctx.fillStyle = noteColor;
        ctx.beginPath();
        ctx.arc(noteX, staccatoY, Math.round(lineSpacing * 0.16), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Augmentation Dot
      if (isDotted) {
        ctx.save();
        const dotRadius = Math.round(lineSpacing * 0.18);
        const dotX = noteX + headHalfW + lineSpacing * 0.38;
        const onLine = (staffPos % 2 === 0);
        const dotY = onLine ? (noteY - lineSpacing * 0.5) : noteY;
        ctx.fillStyle = noteColor;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Accidental
      const scoreAcc = MusicTheory.getNoteAccidentalForScore(note.midi, activeKey, note.explicitAccidental);
      if (scoreAcc) {
        this.drawAccidental(ctx, { x: noteX, y: noteY, midi: note.midi, info, explicitAccidental: note.explicitAccidental, displayAccidental: scoreAcc, active: isTarget || isReviewActive, clef }, lineSpacing, 1.0);
      }

      // Pitch Name Label Lane
      if (this.options.showNoteNames) {
        ctx.save();
        const pillW = isReviewActive ? 42 : 34;
        const pillH = 18;
        const pillX = noteX - pillW / 2;
        const pillY = labelBaselineY;
        const noteName = (info && info.fullName) ? info.fullName : MusicTheory.getNoteInfo(note.midi, preferFlats).fullName;

        if (isReviewActive) {
          ctx.fillStyle = '#f43f5e'; // Rose 500
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, pillH, 4);
            ctx.fill();
          } else {
            ctx.fillRect(pillX, pillY, pillW, pillH);
          }
          ctx.font = '800 11px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#0f172a'; // Deep slate contrast
          ctx.fillText(noteName, noteX, pillY + pillH / 2);
        } else if (isTarget) {
          ctx.fillStyle = '#38bdf8';
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, pillH, 4);
            ctx.fill();
          } else {
            ctx.fillRect(pillX, pillY, pillW, pillH);
          }
          ctx.font = '800 11px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#0f172a';
          ctx.fillText(noteName, noteX, pillY + pillH / 2);
        } else {
          ctx.fillStyle = isDark ? '#0f172a' : '#f1f5f9';
          ctx.strokeStyle = isPast ? (hadMistakes ? 'rgba(244, 63, 94, 0.5)' : 'rgba(34, 197, 94, 0.5)') : (isDark ? '#334155' : '#cbd5e1');
          ctx.lineWidth = 1;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, pillH, 4);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(pillX, pillY, pillW, pillH);
            ctx.strokeRect(pillX, pillY, pillW, pillH);
          }
          ctx.font = '600 10px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isPast ? (hadMistakes ? '#f87171' : '#4ade80') : (isDark ? '#94a3b8' : '#475569');
          ctx.fillText(noteName, noteX, pillY + pillH / 2);
        }
        ctx.restore();
      }

      // Floating Mistake Callout Card & Flags
      if (hadMistakes) {
        if (isReviewActive) {
          ctx.save();
          const calloutY = trebleTopY - lineSpacing * 1.8;
          let calloutText = `Played ${wrongName} (Expected ${info.fullName})`;
          if (res.mistakes > 1) {
            calloutText += ` [${res.mistakes} tries]`;
          }
          if (res.timing && res.timing.offsetMs !== null) {
            const ro = res.timing.offsetMs;
            calloutText += ` | ${ro >= 0 ? '+' : ''}${ro}ms`;
          }

          ctx.font = '700 11px "Inter", sans-serif';
          const textW = ctx.measureText(calloutText).width;
          const iconSize = 13;
          const padX = 8;
          const cardW = padX * 2 + iconSize + 6 + textW;
          const cardH = 22;
          const cardX = noteX - cardW / 2;

          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.5;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(cardX, calloutY - cardH, cardW, cardH, 5);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(cardX, calloutY - cardH, cardW, cardH);
            ctx.strokeRect(cardX, calloutY - cardH, cardW, cardH);
          }

          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(noteX - 5, calloutY);
          ctx.lineTo(noteX + 5, calloutY);
          ctx.lineTo(noteX, calloutY + 6);
          ctx.closePath();
          ctx.fill();

          const iconX = cardX + padX;
          const iconY = calloutY - cardH + (cardH - iconSize) / 2;
          ctx.beginPath();
          ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.4;
          const ins = 3.2;
          ctx.beginPath();
          ctx.moveTo(iconX + ins, iconY + ins);
          ctx.lineTo(iconX + iconSize - ins, iconY + iconSize - ins);
          ctx.moveTo(iconX + iconSize - ins, iconY + ins);
          ctx.lineTo(iconX + ins, iconY + iconSize - ins);
          ctx.stroke();

          ctx.fillStyle = '#fecdd3';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(calloutText, iconX + iconSize + 6, calloutY - cardH / 2);
          ctx.restore();
        } else if (isFinished) {
          ctx.save();
          const flagY = trebleTopY - lineSpacing * 1.3;
          const flagText = wrongName;
          ctx.font = '700 9.5px "Inter", sans-serif';
          const textW = ctx.measureText(flagText).width;
          const iconSize = 10;
          const padX = 5;
          const flagW = padX * 2 + iconSize + 4 + textW;
          const flagH = 16;
          const flagX = noteX - flagW / 2;

          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
          ctx.lineWidth = 1;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(flagX, flagY - flagH, flagW, flagH, 4);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(flagX, flagY - flagH, flagW, flagH);
          }

          const iconX = flagX + padX;
          const iconY = flagY - flagH + (flagH - iconSize) / 2;
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          const ins = 2.4;
          ctx.beginPath();
          ctx.moveTo(iconX + ins, iconY + ins);
          ctx.lineTo(iconX + iconSize - ins, iconY + iconSize - ins);
          ctx.moveTo(iconX + iconSize - ins, iconY + ins);
          ctx.lineTo(iconX + ins, iconY + iconSize - ins);
          ctx.stroke();

          ctx.fillStyle = '#fb7185';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(flagText, iconX + iconSize + 4, flagY - flagH / 2);
          ctx.restore();
        }
      }

      // Timing Accuracy Badge
      if (isPast && res && res.timing && res.timing.offsetMs !== undefined && res.timing.offsetMs !== null && (!hadMistakes || !isFinished)) {
        ctx.save();
        const ro = res.timing.offsetMs;
        const offStr = (ro >= 0 ? '+' : '') + ro + 'ms';
        const badgeY = trebleTopY - lineSpacing * 1.1;

        ctx.font = '700 9px "Inter", sans-serif';
        const textW = ctx.measureText(offStr).width;
        const badgeW = textW + 8;
        const badgeH = 13;
        const badgeX = noteX - badgeW / 2;

        const absOff = Math.abs(ro);
        let bgCol, borderCol, textCol;
        if (absOff <= 65) {
          bgCol = isDark ? 'rgba(34, 197, 94, 0.22)' : 'rgba(34, 197, 94, 0.15)';
          borderCol = isDark ? 'rgba(34, 197, 94, 0.8)' : '#16a34a';
          textCol = isDark ? '#86efac' : '#15803d';
        } else if (absOff <= 150) {
          bgCol = isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.15)';
          borderCol = isDark ? 'rgba(245, 158, 11, 0.8)' : '#d97706';
          textCol = isDark ? '#fde047' : '#b45309';
        } else {
          bgCol = isDark ? 'rgba(244, 63, 94, 0.22)' : 'rgba(244, 63, 94, 0.15)';
          borderCol = isDark ? 'rgba(244, 63, 94, 0.8)' : '#e11d48';
          textCol = isDark ? '#fecdd3' : '#be123c';
        }

        ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
        ctx.fillRect(badgeX, badgeY - badgeH, badgeW, badgeH);
        ctx.fillStyle = bgCol;
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY - badgeH, badgeW, badgeH, 3);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(badgeX, badgeY - badgeH, badgeW, badgeH);
          ctx.strokeRect(badgeX, badgeY - badgeH, badgeW, badgeH);
        }

        ctx.fillStyle = textCol;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(offStr, noteX, badgeY - badgeH / 2);
        ctx.restore();
      }
    });

    // 8.5 Render The Vanishing Bar (Working Memory Buffer Drill)
    if (this.options.disrupterMode === 'vanishing_bar' && !isFinished && !this.practiceData.isCountingIn && !this.practiceData.isAnalyzing && barlineXPositions.length > 0) {
      const activeMeasure = Math.floor(Math.max(0, playheadBeats) / beatsPerMeasure);
      const totalMeasures = barlineXPositions.length;

      for (let m = 0; m <= activeMeasure && m < totalMeasures; m++) {
        const mStartRaw = (m === 0) ? (notesStartX - 4) : barlineXPositions[m - 1];
        const mEndRaw = barlineXPositions[m];
        const mStartX = mStartRaw - scrollX;
        const mEndX = mEndRaw - scrollX;
        const mW = mEndX - mStartX;

        if (mEndX < notesStartX - 20 || mStartX > staffRightX + 20) continue;

        ctx.save();
        const maskY = trebleTopY - 14;
        const maskH = (bassBottomY - trebleTopY) + 28;
        const isActiveBar = (m === activeMeasure);

        if (isActiveBar) {
          ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(241, 245, 249, 0.93)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([5, 3]);
        } else {
          ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(241, 245, 249, 0.82)';
          ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.55)' : 'rgba(203, 213, 225, 0.55)';
          ctx.lineWidth = 1.0;
        }

        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(mStartX, maskY, mW, maskH, 6);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(mStartX, maskY, mW, maskH);
          ctx.strokeRect(mStartX, maskY, mW, maskH);
        }
        ctx.setLineDash([]);

        if (isActiveBar && mW > 60) {
          const badgeW = Math.min(mW - 12, 180);
          const badgeH = 20;
          const badgeX = mStartX + (mW - badgeW) / 2;
          const badgeY = trebleTopY - 26;

          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.2;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
            ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
          }

          ctx.font = '800 9px "Inter", sans-serif';
          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`🧠 BUFFER BAR ${m + 1} (PLAY FROM MEMORY)`, badgeX + badgeW / 2, badgeY + badgeH / 2);
        }

        ctx.restore();
      }
    }

    // 8.6 Render The Advance Curtain (No-Lingering Shutter)
    if (this.options.disrupterMode === 'advance_curtain' && !isFinished && !this.practiceData.isCountingIn && !this.practiceData.isAnalyzing) {
      const curtainX = playheadXRaw - scrollX;
      if (curtainX > notesStartX) {
        ctx.save();
        const maskY = trebleTopY - 14;
        const maskH = (bassBottomY - trebleTopY) + 28;
        const curtainLeft = notesStartX - 6;
        const curtainWidth = Math.max(0, curtainX - curtainLeft);

        const curtainGrad = ctx.createLinearGradient(curtainLeft, 0, curtainX, 0);
        curtainGrad.addColorStop(0, isDark ? 'rgba(2, 6, 23, 0.96)' : 'rgba(248, 250, 252, 0.96)');
        curtainGrad.addColorStop(0.85, isDark ? 'rgba(15, 23, 42, 0.93)' : 'rgba(241, 245, 249, 0.93)');
        curtainGrad.addColorStop(1.0, isDark ? 'rgba(30, 41, 59, 0.90)' : 'rgba(226, 232, 240, 0.90)');

        ctx.fillStyle = curtainGrad;
        ctx.fillRect(curtainLeft, maskY, curtainWidth, maskH);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(curtainX, maskY);
        ctx.lineTo(curtainX, maskY + maskH);
        ctx.stroke();

        const badgeW = 76;
        const badgeH = 18;
        const badgeX = curtainX - badgeW;
        const badgeY = trebleTopY - 24;

        if (badgeX > curtainLeft) {
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.0;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
            ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
          }
          ctx.font = '800 8.5px "Inter", sans-serif';
          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⛔ NO LINGER', badgeX + badgeW / 2, badgeY + badgeH / 2);
        }

        ctx.restore();
      }
    }

    // 9. Render Decoupled Eye Cursor (Look-Ahead Pacing Guide: 1 Measure Ahead)
    if (this.options.decoupledEyeCursor && !isFinished && !this.practiceData.isCountingIn && !this.practiceData.isAnalyzing) {
      const eyeBeats = playheadBeats + beatsPerMeasure;
      const eyeXRaw = getXForBeat(eyeBeats);
      const eyeX = eyeXRaw - scrollX;

      if (eyeX >= notesStartX - 10 && eyeX <= staffRightX + 10) {
        ctx.save();
        const eyeColor = '#38bdf8'; // Electric Sky 400

        // Wide aura beam
        ctx.beginPath();
        ctx.rect(eyeX - 10, trebleTopY - 14, 20, (bassBottomY - trebleTopY) + 28);
        const grad = ctx.createLinearGradient(eyeX - 10, 0, eyeX + 10, 0);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.32)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Eye Cursor dashed vertical guideline
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = eyeColor;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(eyeX, trebleTopY - 10);
        ctx.lineTo(eyeX, bassBottomY + 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // Top pointer cap (downward triangle)
        const capY = trebleTopY - 12;
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.moveTo(eyeX, capY + 8);
        ctx.lineTo(eyeX - 6, capY);
        ctx.lineTo(eyeX + 6, capY);
        ctx.closePath();
        ctx.fill();

        // Bottom pointer cap (upward triangle)
        const bCapY = bassBottomY + 12;
        ctx.beginPath();
        ctx.moveTo(eyeX, bCapY - 8);
        ctx.lineTo(eyeX - 5, bCapY);
        ctx.lineTo(eyeX + 5, bCapY);
        ctx.closePath();
        ctx.fill();

        // Top Eye Banner Badge
        const eyeBadgeW = 86;
        const eyeBadgeH = 20;
        const eyeBadgeX = eyeX - eyeBadgeW / 2;
        const eyeBadgeY = trebleTopY - 32;

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = 1.2;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(eyeBadgeX, eyeBadgeY, eyeBadgeW, eyeBadgeH, 4);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(eyeBadgeX, eyeBadgeY, eyeBadgeW, eyeBadgeH);
          ctx.strokeRect(eyeBadgeX, eyeBadgeY, eyeBadgeW, eyeBadgeH);
        }
        ctx.font = '800 10px "Inter", sans-serif';
        ctx.fillStyle = '#7dd3fc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👁 LOOK HERE', eyeX, eyeBadgeY + eyeBadgeH / 2);

        ctx.restore();
      }
    }

    // 10. Render Audio Playhead Cursor (Time-Driven Modes: In-Tempo, Strict & First-Read)
    if (isTimeDriven && !isFinished && !this.practiceData.isCountingIn && !this.practiceData.isAnalyzing) {
      const playheadX = playheadXRaw - scrollX;
      if (playheadX >= notesStartX - 10 && playheadX <= staffRightX + 10) {
        ctx.save();

        const isRecoveryActive = this.flashRecoveryTimestamp && (timestamp - this.flashRecoveryTimestamp < 700);
        const isDimmed = this.options.decoupledEyeCursor; // Dim audio playhead if eye cursor is guiding user
        const cursorColor = isRecoveryActive ? '#10b981' : '#38bdf8';

        if (isDimmed) {
          ctx.globalAlpha = 0.38;
        }

        // Wide aura glow beam
        ctx.beginPath();
        ctx.rect(playheadX - 8, trebleTopY - 14, 16, (bassBottomY - trebleTopY) + 28);
        const grad = ctx.createLinearGradient(playheadX - 8, 0, playheadX + 8, 0);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(0.5, isRecoveryActive ? 'rgba(16, 185, 129, 0.40)' : (isDimmed ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.28)'));
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Sharp playhead line
        ctx.lineWidth = isDimmed ? 1.4 : 2.4;
        ctx.strokeStyle = cursorColor;
        ctx.beginPath();
        ctx.moveTo(playheadX, trebleTopY - 10);
        ctx.lineTo(playheadX, bassBottomY + 10);
        ctx.stroke();

        // Top pointer cap (downward triangle)
        const capY = trebleTopY - 12;
        ctx.fillStyle = cursorColor;
        ctx.beginPath();
        ctx.moveTo(playheadX, capY + 8);
        ctx.lineTo(playheadX - (isDimmed ? 4 : 6), capY);
        ctx.lineTo(playheadX + (isDimmed ? 4 : 6), capY);
        ctx.closePath();
        ctx.fill();

        // Bottom pointer cap (upward triangle)
        const bCapY = bassBottomY + 12;
        ctx.beginPath();
        ctx.moveTo(playheadX, bCapY - 8);
        ctx.lineTo(playheadX - (isDimmed ? 3 : 5), bCapY);
        ctx.lineTo(playheadX + (isDimmed ? 3 : 5), bCapY);
        ctx.closePath();
        ctx.fill();

        // Recovery Flash Banner Badge if triggered
        if (isRecoveryActive) {
          const recY = trebleTopY - 26;
          ctx.font = '800 10.5px "Inter", sans-serif';
          ctx.fillStyle = '#10b981';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡ IN-TEMPO RECOVERY!', playheadX, recY);
        }

        ctx.restore();
      }
    }

    ctx.restore(); // end clip
  }

  /**
   * Draw classic musical Time Signature (e.g. 4/4, 3/4, 3/8)
   */
  drawTimeSignature(ctx, x, trebleBottomY, bassBottomY, spacing, sig) {
    const topNum = sig[0] || 4;
    const botNum = sig[1] || 4;
    const isDark = this.options.theme === 'dark';

    ctx.save();
    ctx.font = `800 ${Math.round(spacing * 1.7)}px "Inter", serif`;
    ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Treble Time Sig
    const tTopY = trebleBottomY - spacing * 3.0;
    const tBotY = trebleBottomY - spacing * 1.0;
    ctx.fillText(String(topNum), x, tTopY);
    ctx.fillText(String(botNum), x, tBotY);

    // Bass Time Sig (Only if bassBottomY is provided)
    if (bassBottomY !== null && bassBottomY !== undefined) {
      const bTopY = bassBottomY - spacing * 3.0;
      const bBotY = bassBottomY - spacing * 1.0;
      ctx.fillText(String(topNum), x, bTopY);
      ctx.fillText(String(botNum), x, bBotY);
    }

    ctx.restore();
  }
}

