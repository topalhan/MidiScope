export const BUILD_ID = '20261029.0825';
/**
 * Main Application Coordinator
 * Integrates NotationRenderer, AudioEngine, MidiManager, Virtual Piano Keyboard,
 * and MelodyTrainer with accuracy assessment.
 */

import { MusicTheory } from './chords.js';
import { NotationRenderer } from './notation.js?v=20261029.0825';
import { AudioEngine } from './audio.js';
import { MidiManager } from './midi.js';
import { MelodyTrainer } from './trainer.js?v=20261014.0820';
import { MELODIES } from './melodies.js';
import { parseMidiFile, inspectMidiChannels } from './midiparser.js';
import { parseMusicXml, inspectMusicXml } from './musicxmlparser.js';
import { DailyRoutineController } from './routine.js?v=20261014.0820';
import { FreePlayRhythmTrainer } from './rhythm_trainer.js?v=20261014.0820';
import { exportToMidi, exportToMusicXml, downloadFile, generateAiPrompt } from './exporter.js';

class App {
  constructor() {
    this.audio = new AudioEngine();
    this.midi = new MidiManager();
    this.trainer = new MelodyTrainer();
    this.notation = null;

    // Active playing notes across all sources: Map of midi -> { count, source }
    this.activeNotes = new Map();

    // Virtual piano configuration
    this.startMidi = 36; // C2
    this.endMidi = 96;   // C7 (61 keys total)

    // UI & Hardware state
    this.appMode = 'freeplay'; // 'freeplay' or 'practice'
    this.windMode = true;      // Wind Instrument / EWI mode (monophonic legato + breath gating enabled by default)
    this.breathPressure = 0;   // 0 to 1
    this.breathCutoffThreshold = 0.08; // ~10 out of 127 default threshold
    this.breathIdleLevel = 0;
    this.preferFlats = false;
    this.showKeyLabels = 'all'; // 'all', 'qwerty', 'none'
    this.isPedalDown = false;

    // DOM references
    this.canvas = document.getElementById('staff-canvas');
    this.pianoContainer = document.getElementById('piano-keys');
    this.chordNameEl = document.getElementById('chord-name');
    this.chordQualityEl = document.getElementById('chord-quality');
    this.activeNotesListEl = document.getElementById('active-notes-list');
    this.midiStatusBadge = document.getElementById('midi-status-badge');
    this.deviceSelect = document.getElementById('midi-device-select');
    this.midiLogContainer = document.getElementById('midi-log-entries');
    this.pedalIndicator = document.getElementById('pedal-indicator');
    this.octaveDisplay = document.getElementById('current-octave-display');
    this.btnToggleWindMode = document.getElementById('btn-toggle-wind-mode');
    this.breathMeterContainer = document.getElementById('breath-meter-container');
    this.breathMeterBar = document.getElementById('breath-meter-bar');
    this.audioOutputSelect = document.getElementById('select-audio-output');
    this.btnToggleLowLatency = document.getElementById('btn-toggle-low-latency');
    this.audioLatencyBadge = document.getElementById('audio-latency-badge');
    this.audioLatencyDot = document.getElementById('audio-latency-dot');
    this.audioLatencyValue = document.getElementById('audio-latency-value');
    this.toggleReverb = document.getElementById('toggle-reverb');

    // Latency Calibration controls
    this.latencyCalibValue = document.getElementById('latency-calib-value');
    this.btnCalibMinus = document.getElementById('btn-calib-minus');
    this.btnCalibPlus = document.getElementById('btn-calib-plus');
    this.btnAutoCalib = document.getElementById('btn-auto-calib');
    this.modalLatencyCalibValue = document.getElementById('modal-latency-calib-value') || this.latencyCalibValue;
    this.btnModalCalibMinus = document.getElementById('btn-modal-calib-minus') || this.btnCalibMinus;
    this.btnModalCalibPlus = document.getElementById('btn-modal-calib-plus') || this.btnCalibPlus;

    // App Mode Tabs & Practice HUD elements
    // Universal Master Metronome in Header
    this.btnMasterMetronome = document.getElementById('btn-master-metronome');
    this.masterMetronomeIcon = document.getElementById('master-metronome-icon');
    this.masterMetronomeStatus = document.getElementById('master-metronome-status');
    this.btnMasterBpmMinus = document.getElementById('btn-master-bpm-minus');
    this.btnMasterBpmPlus = document.getElementById('btn-master-bpm-plus');
    this.masterBpmDisplay = document.getElementById('master-bpm-display');
    this.btnMasterTapTempo = document.getElementById('btn-master-tap-tempo');
    this.btnMasterClickToggle = document.getElementById('btn-master-click-toggle');
    this.masterClickIcon = document.getElementById('master-click-icon');
    this.masterBeatDots = document.getElementById('master-beat-dots');

    this.tabFreePlay = document.getElementById('tab-free-play');
    this.tabPractice = document.getElementById('tab-practice');
    this.freeplayHud = document.getElementById('freeplay-hud');

    // Free Play Rhythm Trainer DOM & Engine
    this.freePlayRhythmTrainer = new FreePlayRhythmTrainer(this.audio);
    this.btnToggleFreeplayRhythm = document.getElementById('btn-toggle-freeplay-rhythm');
    this.freeplayRhythmBadge = document.getElementById('freeplay-rhythm-badge');
    this.freeplayRhythmPanel = document.getElementById('freeplay-rhythm-panel');
    this.btnFreeplayMetronome = document.getElementById('btn-freeplay-metronome');
    this.freeplayMetronomeIcon = document.getElementById('freeplay-metronome-icon');
    this.freeplayMetronomeText = document.getElementById('freeplay-metronome-text');
    this.freeplayBpmDisplay = document.getElementById('freeplay-bpm-display');
    this.btnFreeplayBpmMinus5 = document.getElementById('btn-freeplay-bpm-minus5');
    this.btnFreeplayBpmMinus = document.getElementById('btn-freeplay-bpm-minus');
    this.btnFreeplayBpmPlus = document.getElementById('btn-freeplay-bpm-plus');
    this.btnFreeplayBpmPlus5 = document.getElementById('btn-freeplay-bpm-plus5');
    this.btnFreeplayTapTempo = document.getElementById('btn-freeplay-tap-tempo');
    this.selectFreeplayTimesig = document.getElementById('select-freeplay-timesig');
    this.selectFreeplayGrid = document.getElementById('select-freeplay-grid');
    this.selectFreeplayTolerance = document.getElementById('select-freeplay-tolerance');
    this.btnFreeplayClickToggle = document.getElementById('btn-freeplay-click-toggle');
    this.freeplayClickIcon = document.getElementById('freeplay-click-icon');
    this.freeplayClickText = document.getElementById('freeplay-click-text');
    this.freeplayBeatLabel = document.getElementById('freeplay-beat-label');
    this.freeplayBeatDots = document.getElementById('freeplay-beat-dots');
    this.freeplayPhaseBar = document.getElementById('freeplay-phase-bar');
    this.pocketNeedle = document.getElementById('pocket-needle');
    this.freeplayLiveHitPill = document.getElementById('freeplay-live-hit-pill');
    this.freeplaySubdivisionBadge = document.getElementById('freeplay-subdivision-badge');
    this.freeplayChordSyncText = document.getElementById('freeplay-chord-sync-text');
    this.freeplayAccuracyDisplay = document.getElementById('freeplay-accuracy-display');
    this.freeplayStreakCount = document.getElementById('freeplay-streak-count');
    this.freeplayBestStreak = document.getElementById('freeplay-best-streak');
    this.freeplayTendencyDisplay = document.getElementById('freeplay-tendency-display');
    this.freeplayCountPerfect = document.getElementById('freeplay-count-perfect');
    this.freeplayCountEarly = document.getElementById('freeplay-count-early');
    this.freeplayCountLate = document.getElementById('freeplay-count-late');
    this.freeplayCountOff = document.getElementById('freeplay-count-off');
    this.btnFreeplayResetStats = document.getElementById('btn-freeplay-reset-stats');

    // Free Play Notes & Mistake Review DOM & State
    this.btnToggleFreeplayReview = document.getElementById('btn-toggle-freeplay-review');
    this.freeplayReviewBadge = document.getElementById('freeplay-review-badge');
    this.freeplayReviewPanel = document.getElementById('freeplay-review-panel');
    this.freeplayReviewKeyBadge = document.getElementById('freeplay-review-key-badge');
    this.btnFreeplayPrevMistake = document.getElementById('btn-freeplay-prev-mistake');
    this.btnFreeplayNextMistake = document.getElementById('btn-freeplay-next-mistake');
    this.freeplayMistakeStepperText = document.getElementById('freeplay-mistake-stepper-text');
    this.btnFreeplayClearNotes = document.getElementById('btn-freeplay-clear-notes');
    this.btnFreeplayCopyNotes = document.getElementById('btn-freeplay-copy-notes');
    this.btnFreeplayCloseReview = document.getElementById('btn-freeplay-close-review');
    this.freeplayReviewFilterGroup = document.getElementById('freeplay-review-filter-group');
    this.freeplayScaleAccuracy = document.getElementById('freeplay-scale-accuracy');
    this.freeplayRhythmAccuracy = document.getElementById('freeplay-rhythm-accuracy');
    this.freeplayNoteDetailCard = document.getElementById('freeplay-note-detail-card');
    this.detailNoteBadge = document.getElementById('detail-note-badge');
    this.detailNoteStatus = document.getElementById('detail-note-status');
    this.detailNoteTime = document.getElementById('detail-note-time');
    this.detailNoteDuration = document.getElementById('detail-note-duration');
    this.detailNoteExplanation = document.getElementById('detail-note-explanation');
    this.btnDetailPlaySound = document.getElementById('btn-detail-play-sound');
    this.freeplayNotesContainer = document.getElementById('freeplay-notes-container');
    this.freeplayNotesEmpty = document.getElementById('freeplay-notes-empty');
    this.countAllNotes = document.getElementById('count-all-notes');
    this.countMistakeNotes = document.getElementById('count-mistake-notes');
    this.countScaleNotes = document.getElementById('count-scale-notes');
    this.countTimingNotes = document.getElementById('count-timing-notes');

    this.freePlayNotes = [];
    this.activeFreePlayReviewIndex = -1;
    this.freePlayReviewFilter = 'all';
    this.isFreePlayReviewOpen = false;

    this.practiceHud = document.getElementById('practice-hud');
    this.practiceMelodyTitle = document.getElementById('practice-melody-title');
    this.practiceComposer = document.getElementById('practice-composer');
    this.practiceDifficultyBadge = document.getElementById('practice-difficulty-badge');
    this.practiceTargetNote = document.getElementById('practice-target-note');
    this.practicePlayedNote = document.getElementById('practice-played-note');
    this.practiceFeedbackText = document.getElementById('practice-feedback-text');
    this.practiceStreakBadge = document.getElementById('practice-streak-badge');
    this.practiceAccuracyDisplay = document.getElementById('practice-accuracy-display');
    this.practiceRhythmDisplay = document.getElementById('practice-rhythm-display');
    this.practiceTimingBadge = document.getElementById('practice-timing-badge');
    this.practiceBpmDisplay = document.getElementById('practice-bpm-display');
    this.btnToggleMetronome = document.getElementById('btn-toggle-metronome');
    this.metronomeStatusText = document.getElementById('metronome-status-text');
    this.btnBpmMinus = document.getElementById('btn-bpm-minus');
    this.btnBpmPlus = document.getElementById('btn-bpm-plus');
    this.visualBeatContainer = document.getElementById('visual-beat-container');
    this.countInBanner = document.getElementById('count-in-banner');
    this.countInNumber = document.getElementById('count-in-number');
    this.silentAnalysisBanner = document.getElementById('silent-analysis-banner');
    this.analysisTimerDisplay = document.getElementById('analysis-timer-display');
    this.analysisProgressBar = document.getElementById('analysis-progress-bar');
    this.btnSkipAnalysis = document.getElementById('btn-skip-analysis');
    this.selectPracticeMode = document.getElementById('select-practice-mode');
    this.practiceRecoveryContainer = document.getElementById('practice-recovery-container');
    this.practiceRecoveryDisplay = document.getElementById('practice-recovery-display');
    this.timingBadgeTimeout = null;
    this.practiceProgressText = document.getElementById('practice-progress-text');
    this.practiceProgressBar = document.getElementById('practice-progress-bar');
    this.modalMelodySelect = document.getElementById('modal-melody-select');
    this.modalScorecard = document.getElementById('modal-scorecard');
    this.scoreFirstReadCert = document.getElementById('score-first-read-cert');
    this.scoreBadgeRecoveries = document.getElementById('score-badge-recoveries');
    this.modalSettings = document.getElementById('modal-settings');
    this.btnOpenSettings = document.getElementById('btn-open-settings');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.btnSettingsDone = document.getElementById('btn-settings-done');
    this.btnScoreReview = document.getElementById('btn-score-review');
    this.btnResetFirstRead = document.getElementById('btn-reset-first-read');
    this.melodyListContainer = document.getElementById('melody-list-container');

    // Channel / Part Selection Modal references
    this.modalChannelSelect = document.getElementById('modal-channel-select');
    this.channelModalTitle = document.getElementById('channel-modal-title');
    this.channelModalSubtitle = document.getElementById('channel-modal-subtitle');
    this.channelListContainer = document.getElementById('channel-list-container');
    this.channelModalFilename = document.getElementById('channel-modal-filename');
    this.channelModalMeta = document.getElementById('channel-modal-meta');
    this.btnCloseChannelModal = document.getElementById('btn-close-channel-modal');
    this.btnCancelChannel = document.getElementById('btn-cancel-channel');
    this.pendingMidiBuffer = null;

    // Export Performance for AI Assessment references
    this.modalExportSession = document.getElementById('modal-export-session');
    this.btnExportPractice = document.getElementById('btn-export-practice');
    this.btnScoreExport = document.getElementById('btn-score-export');
    this.btnCloseExportModal = document.getElementById('btn-close-export-modal');
    this.btnCancelExport = document.getElementById('btn-cancel-export');
    this.exportFmtMidi = document.getElementById('export-fmt-midi');
    this.exportFmtMusicXml = document.getElementById('export-fmt-musicxml');
    this.exportCheckAnnotations = document.getElementById('export-check-annotations');
    this.exportAiPromptBox = document.getElementById('export-ai-prompt-box');
    this.btnCopyAiPrompt = document.getElementById('btn-copy-ai-prompt');
    this.copyAiPromptText = document.getElementById('copy-ai-prompt-text');
    this.btnDownloadExport = document.getElementById('btn-download-export');
    this.btnDownloadLabel = document.getElementById('btn-download-label');
    this.exportMelodyTitle = document.getElementById('export-melody-title');
    this.exportMelodyMeta = document.getElementById('export-melody-meta');
    this.exportAccuracyBadge = document.getElementById('export-accuracy-badge');
    this.exportMistakesBadge = document.getElementById('export-mistakes-badge');
    this.currentExportFormat = 'midi';
    this.currentExportScope = 'dual';
    this.pendingMidiFileName = '';
    this.pendingXmlBuffer = null;
    this.pendingXmlFileName = '';
    this.isPendingXml = false;

    // MIDI File Upload & Drag-and-Drop references
    this.btnLoadMidi = document.getElementById('btn-load-midi');
    this.midiFileInput = document.getElementById('midi-file-input');
    this.midiModalDropzone = document.getElementById('midi-modal-dropzone');
    // Daily Routine DOM references
    this.tabRoutine = document.getElementById('tab-routine');
    this.routineHud = document.getElementById('routine-hud');
    this.routineKeySelect = document.getElementById('routine-key-select');
    this.routineStreakCount = document.getElementById('routine-streak-count');
    this.routineMasterTimer = document.getElementById('routine-master-timer');
    this.routinePhaseTimer = document.getElementById('routine-phase-timer');
    this.btnRoutinePrev = document.getElementById('btn-routine-prev');
    this.btnRoutinePlay = document.getElementById('btn-routine-play');
    this.btnRoutinePlayIcon = document.getElementById('btn-routine-play-icon');
    this.btnRoutinePlayText = document.getElementById('btn-routine-play-text');
    this.btnRoutineSkip = document.getElementById('btn-routine-skip');
    this.btnRoutineReset = document.getElementById('btn-routine-reset');
    this.btnRoutineRestartExercise = document.getElementById('btn-routine-restart-exercise');
    this.btnRoutineFinishExercise = document.getElementById('btn-routine-finish-exercise');
    this.routineMasterProgressBar = document.getElementById('routine-master-progressbar');
    this.routinePhaseBadge = document.getElementById('routine-phase-badge');
    this.routinePhaseTitle = document.getElementById('routine-phase-title');
    this.routinePhaseInstructions = document.getElementById('routine-phase-instructions');
    this.routineGhostFingeringBox = document.getElementById('routine-ghost-fingering-box');
    this.ghostFingeringAlert = document.getElementById('ghost-fingering-alert');
    this.ghostFingeringTimeout = null;
    this.routineRhythmTapBox = document.getElementById('routine-rhythm-tap-box');
    this.btnRoutineTap = document.getElementById('btn-routine-tap');
    this.routineTapFeedback = document.getElementById('routine-tap-feedback');
    this.routineLookaheadBox = document.getElementById('routine-lookahead-box');
    this.routineFlashBox = document.getElementById('routine-flash-box');
    this.routineFlashCountdown = document.getElementById('routine-flash-countdown');
    this.modalRoutineComplete = document.getElementById('modal-routine-complete');
    this.routineSummaryStreak = document.getElementById('routine-summary-streak');
    this.routineSummaryNotes = document.getElementById('routine-summary-notes');
    this.routineSummaryAccuracy = document.getElementById('routine-summary-accuracy');
    this.routineSummaryRecoveries = document.getElementById('routine-summary-recoveries');
    this.routineSummaryRecoveryPts = document.getElementById('routine-summary-recovery-pts');
    this.btnRoutineCompleteDone = document.getElementById('btn-routine-complete-done');
    this.routine = null;

    // Exercise Guide Modal references
    this.modalExerciseGuide = document.getElementById('modal-exercise-guide');
    this.btnCloseGuideModal = document.getElementById('btn-close-guide-modal');
    this.btnRoutineGuide = document.getElementById('btn-routine-guide');
    this.btnPracticeGuide = document.getElementById('btn-practice-guide');
    this.btnGuideStart = document.getElementById('btn-guide-start');
    this.btnGuidePrev = document.getElementById('btn-guide-prev');
    this.btnGuideNext = document.getElementById('btn-guide-next');
    this.guideModalBadge = document.getElementById('guide-modal-badge');
    this.guideModalMeta = document.getElementById('guide-modal-meta');
    this.guideModalTitle = document.getElementById('guide-modal-title');
    this.guideModalObjective = document.getElementById('guide-modal-objective');
    this.guideModalNeuroscience = document.getElementById('guide-modal-neuroscience');
    this.guideModalHowTo = document.getElementById('guide-modal-how-to');
    this.guideModalPitfalls = document.getElementById('guide-modal-pitfalls');
    this.guideModalProTip = document.getElementById('guide-modal-pro-tip');
    this.currentGuideSubphaseIndex = 0;

    // Routine Round Iteration feedback elements
    this.routineRoundBanner = document.getElementById('routine-round-banner');
    this.roundBannerStars = document.getElementById('round-banner-stars');
    this.roundBannerTitle = document.getElementById('round-banner-title');
    this.roundBannerTime = document.getElementById('round-banner-time');
    this.roundBannerCountdown = document.getElementById('round-banner-countdown');
    this.btnRoundAdvanceEarly = document.getElementById('btn-round-advance-early');
    this.routineRoundHistory = document.getElementById('routine-round-history');

    // Sub-Phase Transition Modal elements
    this.modalPhaseComplete = document.getElementById('modal-phase-complete');
    this.phaseCompleteBadge = document.getElementById('phase-complete-badge');
    this.phaseCompleteTimeBadge = document.getElementById('phase-complete-time-badge');
    this.phaseCompleteTitle = document.getElementById('phase-complete-title');
    this.phaseCompleteSubtitle = document.getElementById('phase-complete-subtitle');
    this.phaseCompleteAccuracy = document.getElementById('phase-complete-accuracy');
    this.phaseCompleteStars = document.getElementById('phase-complete-stars');
    this.phaseCompleteRounds = document.getElementById('phase-complete-rounds');
    this.phaseCompleteNotes = document.getElementById('phase-complete-notes');
    this.phaseCompleteMistakes = document.getElementById('phase-complete-mistakes');
    this.phaseCompleteRoundsContainer = document.getElementById('phase-complete-rounds-container');
    this.phaseCompleteRoundsCount = document.getElementById('phase-complete-rounds-count');
    this.phaseCompleteRoundsList = document.getElementById('phase-complete-rounds-list');
    this.phaseCompleteNextCard = document.getElementById('phase-complete-next-card');
    this.phaseCompleteNextTitle = document.getElementById('phase-complete-next-title');
    this.phaseCompleteNextMeta = document.getElementById('phase-complete-next-meta');
    this.phaseCompleteNextDesc = document.getElementById('phase-complete-next-desc');
    this.btnPhaseCompleteContinue = document.getElementById('btn-phase-complete-continue');
    this.btnPhaseCompleteRepeat = document.getElementById('btn-phase-complete-repeat');
    this.btnPhaseCompleteGuide = document.getElementById('btn-phase-complete-guide');

    this.init();
  }

  async init() {
    // Display Build ID in Settings
    const buildEl = document.getElementById('settings-build-id');
    if (buildEl) buildEl.innerText = BUILD_ID;

    // 1. Initialize Notation Canvas
    this.notation = new NotationRenderer(this.canvas, {
      preferFlats: this.preferFlats,
      showNoteNames: true,
      mode: 'live'
    });

    // Initialize Daily Routine Controller
    this.routine = new DailyRoutineController(this.trainer, this.audio, this.notation);

    // Mistake review on sheet canvas callback (VST3 Parity)
    this.notation.onReviewNoteChanged = (index) => {
      this.updateReviewUI(index);
    };

    // Waterfall canvas keyboard interactions
    this.notation.onCanvasKeyNoteOn = (midi) => {
      this.handleNoteOn(midi, 100, 'Virtual Piano');
    };
    this.notation.onCanvasKeyNoteOff = (midi) => {
      this.handleNoteOff(midi, 'Virtual Piano');
    };
    this.notation.onWaterfallRestart = () => {
      this.trainer.restart();
    };

    window.addEventListener('resize', () => {
      this.notation.resize();
    });

    // 2. Build Virtual Piano & Apply Layout Preferences
    this.buildPiano();
    this.showKeyboard = localStorage.getItem('midiscope_show_keyboard') !== 'false';
    this.staffLayout = localStorage.getItem('midiscope_staff_layout') || 'vertical';
    this.showBassClef = localStorage.getItem('midiscope_bass_clef') || 'auto';
    this.showMidiStream = localStorage.getItem('midiscope_show_events') === 'true';
    const urlParams = new URLSearchParams(window.location.search);
    this.theme = urlParams.get('theme') || localStorage.getItem('midiscope_theme') || 'dark';
    if (this.notation) this.notation.setOption('showBassClef', this.showBassClef);
    this.setKeyboardVisible(this.showKeyboard);
    this.setMidiStreamVisible(this.showMidiStream);
    this.setStaffLayout(this.staffLayout);
    this.setTheme(this.theme);

    // 3. Setup Audio, MIDI, and Trainer Hooks
    this.setupMidiEvents();
    this.setupTrainerEvents();
    this.setupRoutineEvents();
    this.setupFreePlayRhythmTrainer();
    this.setupFreePlayReviewEvents();
    this.setupUniversalMetronome();
    this.setupUIEventListeners();
    this.setupMidiFileLoader();
    this.populateMelodyModal();
    this.setWindMode(true);
    const initialMode = urlParams.get('mode') || 'freeplay';
    this.setAppMode(initialMode);
    if (urlParams.get('metronome') === '1' && this.toggleMasterMetronome) {
      setTimeout(() => this.toggleMasterMetronome(), 300);
    }
    if (urlParams.get('export') === '1' && this.openExportModal) {
      setTimeout(() => this.openExportModal(), 400);
    }

    // 4. Connect Web MIDI & Enumerate Audio Interfaces
    await this.midi.requestAccess();
    this.midi.enableComputerKeyboard();
    this.updateOctaveDisplay();
    this.populateAudioOutputDevices();
    this.updateLatencyCalibrationDisplay(this.trainer.latencyCompensationMs);

    // 5. Unlock AudioContext on first gesture anywhere
    const unlockAudio = async () => {
      await this.audio.init();
      this.updateLatencyBadge();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }

  /**
   * Set up callbacks from MIDI Manager
   */
  setupMidiEvents() {
    this.midi.onNoteOn = (midi, velocity, channel, source) => {
      this.handleNoteOn(midi, velocity, source);
    };

    this.midi.onNoteOff = (midi, channel, source) => {
      this.handleNoteOff(midi, source);
    };

    this.midi.onBreath = (breathNorm, source) => {
      this.handleBreathEvent(breathNorm, source);
    };

    this.midi.onSustainPedal = (isDown) => {
      this.handleSustainPedal(isDown);
    };

    this.midi.onDevicesChange = (devices) => {
      this.populateDeviceList(devices);
    };

    this.midi.onStatusChange = (status) => {
      this.updateMidiStatus(status);
    };

    this.midi.onMidiLog = (logEntry) => {
      this.addMidiLogEntry(logEntry);
    };
  }

  handleBreathEvent(breathNorm, source) {
    this.breathPressure = breathNorm;

    // Ghost-fingering reminder in Block 2 Part 2 (Audit mode)
    const currentRoutinePhase = this.routine?.getCurrentPhase();
    if (this.appMode === 'routine' && currentRoutinePhase?.type === 'audit' && breathNorm > 0.12) {
      this.triggerGhostFingeringAlert();
    }

    // Update UI breath meter
    if (this.breathMeterBar) {
      this.breathMeterBar.style.width = `${Math.round(breathNorm * 100)}%`;
    }
    const valText = document.getElementById('breath-value-text');
    if (valText) {
      valText.innerText = Math.round(breathNorm * 127);
    }

    // Wind instrument breath gating:
    // When breath drops at or below cutoff threshold, immediately release all sounding notes!
    if (this.windMode && breathNorm <= this.breathCutoffThreshold && this.activeNotes.size > 0) {
      for (const midi of Array.from(this.activeNotes.keys())) {
        this.handleNoteOff(midi, 'Breath Cutoff');
      }
    }
  }

  setWindMode(enabled) {
    this.windMode = enabled;
    if (this.btnToggleWindMode) {
      this.btnToggleWindMode.classList.toggle('active', enabled);
      this.btnToggleWindMode.innerText = enabled ? '🌬️ Wind Mode ON' : '🌬️ Wind Mode OFF';
      this.btnToggleWindMode.title = enabled 
        ? 'Wind Instrument Mode active (breath gating & monophonic legato)' 
        : 'Click to enable Wind Instrument / EWI mode';
    }
    if (this.breathMeterContainer) {
      this.breathMeterContainer.classList.toggle('hidden', !enabled);
    }
  }

  calibrateBreathZero() {
    this.breathIdleLevel = this.breathPressure;
    // Set threshold to idle noise level + 5%
    this.breathCutoffThreshold = Math.min(0.25, this.breathIdleLevel + 0.05);
    const slider = document.getElementById('breath-cutoff-slider');
    if (slider) slider.value = Math.round(this.breathCutoffThreshold * 127);
    const disp = document.getElementById('breath-cutoff-display');
    if (disp) disp.innerText = `${Math.round(this.breathCutoffThreshold * 127)}`;
  }

  /**
   * Scan and populate available audio output devices (e.g. Scarlett, Focusrite, External Interface)
   */
  async populateAudioOutputDevices(requestPermission = false) {
    if (!this.audioOutputSelect) return;

    let devices = [];
    if (requestPermission) {
      devices = await this.audio.requestDeviceLabels();
    } else {
      devices = await this.audio.getOutputDevices();
    }

    const currentVal = this.audioOutputSelect.value;
    this.audioOutputSelect.innerHTML = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'default';
    defaultOpt.innerText = 'Default System Output';
    this.audioOutputSelect.appendChild(defaultOpt);

    devices.forEach((device) => {
      if (device.deviceId && device.deviceId !== 'default') {
        const opt = document.createElement('option');
        opt.value = device.deviceId;
        const isInterface = /usb|scarlett|focusrite|motu|audio|sound|steinberg|behringer|komplete|volt|evo|rme|asio/i.test(device.label);
        const icon = isInterface ? '🎛️ ' : '🔈 ';
        opt.innerText = icon + (device.label || `Audio Interface (${device.deviceId.slice(0, 6)}...)`);
        this.audioOutputSelect.appendChild(opt);
      }
    });

    if (currentVal && Array.from(this.audioOutputSelect.options).some(o => o.value === currentVal)) {
      this.audioOutputSelect.value = currentVal;
    }
    this.updateLatencyBadge();
  }

  /**
   * Switch between Ultra-Low-Latency direct path and Studio Mode
   */
  setLowLatencyMode(enabled) {
    this.audio.setLowLatencyMode(enabled);
    if (this.btnToggleLowLatency) {
      if (enabled) {
        this.btnToggleLowLatency.className = 'px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-colors';
        this.btnToggleLowLatency.innerHTML = '<span>⚡</span> Low Latency ON';
        this.btnToggleLowLatency.title = 'Low Latency Mode active: direct zero-lookahead dry path for instantaneous on-tempo response';
      } else {
        this.btnToggleLowLatency.className = 'px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors';
        this.btnToggleLowLatency.innerHTML = '<span>🎛️</span> Studio Mode';
        this.btnToggleLowLatency.title = 'Studio Mode: Dynamic compressor and reverb active. Click to switch to Ultra-Low Latency mode';
      }
    }
    if (this.toggleReverb && enabled) {
      this.toggleReverb.checked = false;
    }
    this.updateLatencyBadge();
  }

  /**
   * Update latency status badge and display wireless Bluetooth warning if latency is high
   */
  updateLatencyBadge() {
    if (!this.audioLatencyBadge || !this.audioLatencyValue || !this.audioLatencyDot) return;
    const info = this.audio.getLatencyInfo();

    if (!info.totalLatencyMs && !info.baseLatencyMs && !info.outputLatencyMs) {
      this.audioLatencyValue.innerText = 'Standby';
      this.audioLatencyDot.className = 'w-2 h-2 rounded-full bg-slate-500';
      this.audioLatencyBadge.title = 'Audio engine will display buffer latency upon first sound';
      return;
    }

    const total = info.totalLatencyMs;
    const isLowMode = info.lowLatencyMode;

    if (info.isHighLatency) {
      this.audioLatencyDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      this.audioLatencyBadge.className = 'flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-[11px] font-mono text-amber-300 cursor-help';
      this.audioLatencyValue.innerText = `⚠️ ${total} ms`;
      this.audioLatencyBadge.title = `High audio latency detected (${total}ms)! Bluetooth headphones commonly add 100-200ms wireless delay. For tight on-tempo play, switch to wired headphones or an external USB audio interface.`;
    } else {
      this.audioLatencyDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
      this.audioLatencyBadge.className = 'flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 cursor-help';
      this.audioLatencyValue.innerText = `${isLowMode ? '⚡ ' : ''}${total} ms`;
      this.audioLatencyBadge.title = `Hardware buffer latency: ${total}ms (Base: ${info.baseLatencyMs}ms, Output: ${info.outputLatencyMs}ms @ ${info.sampleRate}Hz). Mode: ${isLowMode ? 'Ultra-low latency' : 'Studio'}`;
    }
  }

  /**
   * Update Latency Calibration display and preset highlights
   */
  updateLatencyCalibrationDisplay(val) {
    const text = `${val >= 0 ? '+' : ''}${val} ms`;
    if (this.latencyCalibValue) {
      this.latencyCalibValue.innerText = text;
      this.latencyCalibValue.className = (val !== 0) 
        ? 'text-amber-300 font-bold px-1 select-none min-w-[46px] text-center' 
        : 'text-sky-300 font-bold px-1 select-none min-w-[46px] text-center';
    }
    if (this.modalLatencyCalibValue) {
      this.modalLatencyCalibValue.innerText = text;
      this.modalLatencyCalibValue.className = (val !== 0)
        ? 'text-amber-300 font-bold px-1.5 min-w-[50px] text-center select-none'
        : 'text-sky-300 font-bold px-1.5 min-w-[50px] text-center select-none';
    }
    // Highlight matching preset buttons
    document.querySelectorAll('.btn-calib-preset').forEach(btn => {
      const pVal = parseInt(btn.dataset.offset, 10);
      if (pVal === val) {
        btn.classList.add('bg-sky-500/30', 'text-sky-300', 'border-sky-500/50');
        btn.classList.remove('bg-slate-900', 'bg-slate-800', 'text-slate-300');
      } else {
        btn.classList.remove('bg-sky-500/30', 'text-sky-300', 'border-sky-500/50');
        btn.classList.add('text-slate-300');
      }
    });
  }

  setLatencyCalibration(val) {
    const newVal = this.trainer.setLatencyCompensation(val);
    this.updateLatencyCalibrationDisplay(newVal);
  }

  /**
   * Set up callbacks from Melody Trainer
   */
  setupTrainerEvents() {
    this.trainer.onStateChange = (state) => {
      this.onTrainerStateChange(state);
    };

    this.trainer.onNoteSuccess = (idx, targetNote, isFirstTry, timing) => {
      if (this.notation && this.notation.triggerWaterfallHit) {
        this.notation.triggerWaterfallHit(idx, targetNote, isFirstTry, timing);
      }
      if (timing) {
        this.practiceFeedbackText.innerText = `✨ Hit ${targetNote.name} • ${timing.text}`;
      } else {
        this.practiceFeedbackText.innerText = isFirstTry ? '✨ Perfect!' : '👍 Good! Moving to next note';
      }
      this.practiceFeedbackText.className = 'text-xs font-semibold text-emerald-400 animate-pulse';
    };

    this.trainer.onNoteMistake = (idx, expectedInfo, playedInfo) => {
      this.notation.triggerMistakeFlash();
      if (this.notation && this.notation.triggerWaterfallMistake) {
        this.notation.triggerWaterfallMistake(idx, expectedInfo, playedInfo);
      }
      this.practiceFeedbackText.innerText = `❌ Played ${playedInfo.fullName} (Expected ${expectedInfo.fullName})`;
      this.practiceFeedbackText.className = 'text-xs font-semibold text-rose-400 animate-pulse';
    };

    this.trainer.onTimingFeedback = (timing) => {
      this.showTimingFeedback(timing);
    };

    this.trainer.onRhythmTapFeedback = (timing) => {
      if (this.routineTapFeedback) {
        this.routineTapFeedback.innerText = timing.text || `${timing.rating.toUpperCase()} (${timing.offsetMs}ms)`;
        this.routineTapFeedback.style.color = timing.rating === 'perfect' ? '#34d399' : (timing.rating === 'early' || timing.rating === 'late' ? '#fbbf24' : '#f87171');
      }
      if (this.routine) {
        this.routine.routineStats.totalTaps++;
        if (timing.rating === 'perfect' || timing.rating === 'early' || timing.rating === 'late') {
          this.routine.routineStats.goodTaps++;
          this.routine.routineStats.rhythmHits++;
        }
      }
    };

    this.trainer.onMetronomeTick = (beatIndex, isDownbeat, countInState) => {
      // 1. Play Audio Metronome Click
      if (this.trainer.metronomeEnabled) {
        this.audio.playMetronomeClick(isDownbeat);
      }

      // Animate Master Beat Dots in Header
      this.animateMasterBeatDot(beatIndex, isDownbeat);

      // 2. Animate Visual Beat Indicator Dots
      if (this.visualBeatContainer) {
        const dots = this.visualBeatContainer.querySelectorAll('.beat-dot');
        dots.forEach((dot, idx) => {
          if (idx === beatIndex) {
            dot.classList.add('active');
            setTimeout(() => dot.classList.remove('active'), 130);
          } else {
            dot.classList.remove('active');
          }
        });
      }
    };

    this.trainer.onCountIn = (count, total) => {
      if (!this.countInBanner) return;
      if (count > 0) {
        this.countInBanner.classList.remove('hidden');
        if (this.countInNumber) {
          this.countInNumber.innerText = `${count}`;
          this.countInNumber.className = 'text-4xl font-black text-white mt-0.5 animate-bounce';
        }
      } else {
        this.countInBanner.classList.add('hidden');
      }
    };

    this.trainer.onPlayheadMove = (beats) => {
      this.notation.setPlayheadBeats(beats);
    };

    this.trainer.onRecovery = (info) => {
      this.notation.triggerRecoveryFlash();
      if (this.practiceRecoveryDisplay) {
        this.practiceRecoveryDisplay.innerText = `⚡ ${info.recoveries}`;
      }
      this.showToast(`⚡ In-Tempo Recovery! (+${info.bonusPoints} bonus points)`, 'success');
    };

    this.trainer.onAnalysisTick = (remaining, total) => {
      if (this.silentAnalysisBanner) {
        this.silentAnalysisBanner.classList.remove('hidden');
      }
      if (this.analysisTimerDisplay) {
        this.analysisTimerDisplay.innerText = `${remaining}s`;
      }
      if (this.analysisProgressBar) {
        const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
        this.analysisProgressBar.style.width = `${pct}%`;
      }
    };

    this.trainer.onAnalysisComplete = () => {
      if (this.silentAnalysisBanner) {
        this.silentAnalysisBanner.classList.add('hidden');
      }
      this.showToast('Analysis complete! 4-beat count-in starting...', 'info');
    };

    this.trainer.onFirstReadLocked = (record) => {
      this.showToast(`🔒 "${record.title || 'Excerpt'}" was already completed in First-Read (${record.sightReadingScore || record.rhythmAccuracy}%). Select another or practice in Strict Time.`, 'warning');
    };

    this.trainer.onComplete = (summary) => {
      if (this.appMode === 'routine' && this.routine) {
        this.routine.onTrainerMelodyComplete(summary);
      } else {
        this.showScorecard(summary);
      }
    };
  }

  /**
   * Setup Free Play Rhythm Trainer HUD, Callbacks, and User Controls
   */
  setupFreePlayRhythmTrainer() {
    const trainer = this.freePlayRhythmTrainer;
    if (!trainer) return;

    // 1. Beat Pulse Tick Callback
    trainer.onBeatTick = (beatIndex, isDownbeat) => {
      this.animateMasterBeatDot(beatIndex, isDownbeat);
      if (this.freeplayBeatDots) {
        const dots = this.freeplayBeatDots.querySelectorAll('.beat-dot');
        dots.forEach((dot, idx) => {
          if (idx === beatIndex) {
            dot.classList.add('active');
            setTimeout(() => dot.classList.remove('active'), 140);
          } else {
            dot.classList.remove('active');
          }
        });
      }

      if (this.freeplayBeatLabel) {
        this.freeplayBeatLabel.innerText = isDownbeat ? 'Downbeat (1)' : `Beat ${beatIndex + 1}`;
        this.freeplayBeatLabel.className = isDownbeat
          ? 'text-xs font-mono font-black text-emerald-400'
          : 'text-xs font-mono font-bold text-sky-400';
      }
    };

    // 2. Smooth Continuous Beat Phase Progress Sweep (60fps)
    trainer.onPhaseUpdate = (phaseRatio) => {
      if (this.freeplayPhaseBar) {
        this.freeplayPhaseBar.style.width = `${Math.round(phaseRatio * 100)}%`;
      }
    };

    // 3. Stroke Evaluated Feedback
    trainer.onStrokeEvaluated = (result, stats) => {
      if (!result) return;

      if (result.rating === 'unscored') {
        if (this.freeplayLiveHitPill) {
          this.freeplayLiveHitPill.innerText = 'Start Metronome to score rhythm';
          this.freeplayLiveHitPill.className = 'text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800 transition-all flex items-center gap-1.5 shadow-sm';
        }
        return;
      }

      // Animate Pocket Needle
      if (this.pocketNeedle) {
        // Clamp offset between -150ms and +150ms
        const clampedOffset = Math.max(-150, Math.min(150, result.offsetMs));
        const needlePercent = 50 + (clampedOffset / 150) * 45; // 5% to 95%
        this.pocketNeedle.style.left = `${needlePercent}%`;
      }

      // Live hit feedback pill with flash animation
      if (this.freeplayLiveHitPill) {
        let pillColorClass = 'bg-slate-900 text-slate-400 border-slate-800';
        if (result.rating === 'perfect') {
          pillColorClass = 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 hit-pulse-flash shadow-emerald-500/20 shadow-md';
        } else if (result.rating === 'early') {
          pillColorClass = 'bg-amber-500/25 text-amber-300 border-amber-500/50 hit-pulse-flash shadow-amber-500/20 shadow-md';
        } else if (result.rating === 'late') {
          pillColorClass = 'bg-sky-500/25 text-sky-300 border-sky-500/50 hit-pulse-flash shadow-sky-500/20 shadow-md';
        } else if (result.rating === 'off_beat') {
          pillColorClass = 'bg-rose-500/25 text-rose-300 border-rose-500/50 hit-pulse-flash shadow-rose-500/20 shadow-md';
        }
        this.freeplayLiveHitPill.className = `text-xs font-black px-3.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${pillColorClass}`;
        this.freeplayLiveHitPill.innerText = result.text;
      }

      // Subdivision Metric label
      if (this.freeplaySubdivisionBadge) {
        this.freeplaySubdivisionBadge.innerText = `🎯 Metric: ${result.metricLabel} (${result.subdivision})`;
      }

      // Forward timing info to notation notes & record in scrolling stream
      if (this.notation) {
        if (Array.isArray(result.notes)) {
          result.notes.forEach(n => {
            this.notation.setNoteTiming(n.midi, result);
          });
        }
        this.notation.recordRhythmStroke(result);
      }

      // Attach timing info to Free Play notes review
      this.recordFreePlayRhythmEvaluation(result);

      // Synchronize with detected chord display
      if (this.chordNameEl && this.activeNotes.size > 0) {
        const chordName = this.chordNameEl.innerText.split(' — ')[0];
        const offsetSign = result.offsetMs >= 0 ? '+' : '';
        this.chordNameEl.innerText = `${chordName} — ${result.rating.toUpperCase()} (${offsetSign}${result.offsetMs}ms)`;
      }
    };

    // 4. Statistics Updated
    trainer.onStatsUpdated = (stats) => {
      if (this.freeplayRhythmAccuracy) {
        this.freeplayRhythmAccuracy.innerText = `${stats.accuracy}%`;
      }
      if (this.freeplayAccuracyDisplay) {
        this.freeplayAccuracyDisplay.innerText = `${stats.accuracy}%`;
        if (stats.accuracy >= 90) {
          this.freeplayAccuracyDisplay.className = 'text-base font-black text-emerald-400';
        } else if (stats.accuracy >= 70) {
          this.freeplayAccuracyDisplay.className = 'text-base font-black text-amber-400';
        } else {
          this.freeplayAccuracyDisplay.className = 'text-base font-black text-rose-400';
        }
      }

      if (this.freeplayStreakCount) this.freeplayStreakCount.innerText = stats.streak;
      if (this.freeplayBestStreak) this.freeplayBestStreak.innerText = stats.bestStreak;

      if (this.freeplayCountPerfect) this.freeplayCountPerfect.innerText = stats.perfectCount;
      if (this.freeplayCountEarly) this.freeplayCountEarly.innerText = stats.earlyCount;
      if (this.freeplayCountLate) this.freeplayCountLate.innerText = stats.lateCount;
      if (this.freeplayCountOff) this.freeplayCountOff.innerText = stats.offBeatCount;

      if (this.freeplayTendencyDisplay) {
        if (stats.tendency === 'rushing') {
          this.freeplayTendencyDisplay.innerHTML = `<span>⚡</span> <span>Rushing (${stats.avgOffsetMs}ms avg)</span>`;
          this.freeplayTendencyDisplay.className = 'text-xs font-bold text-amber-400 flex items-center gap-1 mt-0.5';
        } else if (stats.tendency === 'dragging') {
          this.freeplayTendencyDisplay.innerHTML = `<span>⏳</span> <span>Dragging (+${stats.avgOffsetMs}ms avg)</span>`;
          this.freeplayTendencyDisplay.className = 'text-xs font-bold text-sky-400 flex items-center gap-1 mt-0.5';
        } else {
          this.freeplayTendencyDisplay.innerHTML = `<span>🎯</span> <span>Locked in Pocket (${stats.avgOffsetMs >= 0 ? '+' : ''}${stats.avgOffsetMs}ms)</span>`;
          this.freeplayTendencyDisplay.className = 'text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5';
        }
      }

      // Populate recent hits mini-strip
      if (this.freeplayRecentHits && Array.isArray(stats.recentHits)) {
        this.freeplayRecentHits.innerHTML = stats.recentHits.slice(0, 8).map(h => {
          const color = h.rating === 'perfect' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        h.rating === 'early' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        h.rating === 'late' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
                        'bg-rose-500/20 text-rose-300 border-rose-500/30';
          const sign = h.offsetMs >= 0 ? '+' : '';
          return `<span class="rhythm-recent-pill text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${color}">${sign}${h.offsetMs}ms</span>`;
        }).join('');
      }
    };

    // 5. Metronome state toggle
    trainer.onMetronomeToggle = (isRunning) => {
      if (this.btnFreeplayMetronome) {
        if (isRunning) {
          this.btnFreeplayMetronome.className = 'px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-rose-500/30 active:scale-95 transition-all flex items-center gap-2';
          if (this.freeplayMetronomeIcon) this.freeplayMetronomeIcon.innerText = '⏹️';
          if (this.freeplayMetronomeText) this.freeplayMetronomeText.innerText = 'Stop Metronome';
        } else {
          this.btnFreeplayMetronome.className = 'px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-500/30 active:scale-95 transition-all flex items-center gap-2';
          if (this.freeplayMetronomeIcon) this.freeplayMetronomeIcon.innerText = '▶️';
          if (this.freeplayMetronomeText) this.freeplayMetronomeText.innerText = 'Start Metronome';
          if (this.freeplayBeatLabel) this.freeplayBeatLabel.innerText = 'Stopped';
          if (this.freeplayPhaseBar) this.freeplayPhaseBar.style.width = '0%';
        }
      }
      this.updateMasterMetronomeUi();
    };

    // 6. Note Duration Detected Callback (Whole, Half, Quarter, 8th, 16th)
    trainer.onDurationDetected = (midi, info) => {
      if (this.freeplayChordSyncText) {
        this.freeplayChordSyncText.innerHTML = `<span class="text-sky-400 font-bold">${info.symbol} ${info.name}</span> <span class="text-slate-400 font-mono">(${info.standardBeats} beat${info.standardBeats === 1 ? '' : 's'} • ${info.durationMs}ms)</span>`;
      }
      if (this.notation) {
        this.notation.updateRhythmNoteDuration(midi, info);
      }
    };

    // Ensure NotationRenderer is synchronized with trainer BPM and time signature
    if (this.notation) {
      this.notation.setOption('bpm', trainer.bpm);
      this.notation.setOption('beatsPerMeasure', trainer.beatsPerMeasure || 4);
    }

    // Wire UI Controls
    this.btnToggleFreeplayRhythm?.addEventListener('click', () => {
      const active = !trainer.isActive;
      trainer.isActive = active;
      const modeSelect = document.getElementById('select-view-mode');
      if (active) {
        this.freeplayRhythmPanel?.classList.remove('hidden');
        if (this.freeplayRhythmBadge) {
          this.freeplayRhythmBadge.innerText = 'ON';
          this.freeplayRhythmBadge.className = 'px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/30 text-emerald-200 border border-emerald-500/50';
        }
        if (modeSelect) modeSelect.value = 'rhythm_trainer';
        if (this.notation) {
          this.notation.setOption('rhythmTrainerActive', true);
          this.notation.setOption('beatsPerMeasure', trainer.beatsPerMeasure || 4);
          this.notation.setOption('bpm', trainer.bpm || 108);
        }
        this.showToast('🎯 Free Play Rhythm Trainer Active! Notes will stay, scroll, and show ±ms precision.', 'info');
      } else {
        trainer.stopMetronome();
        this.freeplayRhythmPanel?.classList.add('hidden');
        if (this.freeplayRhythmBadge) {
          this.freeplayRhythmBadge.innerText = 'OFF';
          this.freeplayRhythmBadge.className = 'px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700';
        }
        if (modeSelect && modeSelect.value === 'rhythm_trainer') modeSelect.value = 'live';
        if (this.notation) {
          this.notation.setOption('rhythmTrainerActive', false);
        }
      }
    });

    this.btnFreeplayMetronome?.addEventListener('click', () => {
      trainer.toggleMetronome();
    });

    const updateBpmUi = (val) => {
      if (this.freeplayBpmDisplay) this.freeplayBpmDisplay.innerText = `${val} BPM`;
      if (this.notation) this.notation.setOption('bpm', val);
    };

    this.btnFreeplayBpmMinus?.addEventListener('click', () => updateBpmUi(trainer.setBpm(trainer.bpm - 1)));
    this.btnFreeplayBpmPlus?.addEventListener('click', () => updateBpmUi(trainer.setBpm(trainer.bpm + 1)));
    this.btnFreeplayBpmMinus5?.addEventListener('click', () => updateBpmUi(trainer.setBpm(trainer.bpm - 5)));
    this.btnFreeplayBpmPlus5?.addEventListener('click', () => updateBpmUi(trainer.setBpm(trainer.bpm + 5)));

    this.btnFreeplayTapTempo?.addEventListener('click', () => {
      const newBpm = trainer.registerTap();
      updateBpmUi(newBpm);
    });

    document.querySelectorAll('.freeplay-tempo-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const bpm = parseInt(btn.dataset.bpm, 10);
        if (bpm) updateBpmUi(trainer.setBpm(bpm));
      });
    });

    this.selectFreeplayTimesig?.addEventListener('change', (e) => {
      const beats = parseInt(e.target.value, 10) || 4;
      trainer.setBeatsPerMeasure(beats);
      if (this.notation) this.notation.setOption('beatsPerMeasure', beats);
      if (this.freeplayBeatDots) {
        this.freeplayBeatDots.innerHTML = Array.from({ length: beats }, (_, i) => 
          `<div class="beat-dot ${i === 0 ? 'downbeat' : ''}" data-beat="${i}"></div>`
        ).join('');
      }
    });

    this.selectFreeplayGrid?.addEventListener('change', (e) => {
      trainer.setGridMode(e.target.value);
    });

    this.selectFreeplayTolerance?.addEventListener('change', (e) => {
      trainer.setToleranceMode(e.target.value);
    });

    this.btnFreeplayClickToggle?.addEventListener('click', () => {
      trainer.setSoundEnabled(!trainer.metronomeSoundEnabled);
      if (this.freeplayClickIcon && this.freeplayClickText) {
        if (trainer.metronomeSoundEnabled) {
          this.freeplayClickIcon.innerText = '🔊';
          this.freeplayClickText.innerText = 'Sound ON';
          this.btnFreeplayClickToggle.className = 'px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1 transition-colors';
        } else {
          this.freeplayClickIcon.innerText = '🔇';
          this.freeplayClickText.innerText = 'Muted';
          this.btnFreeplayClickToggle.className = 'px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors';
        }
      }
    });

    this.btnFreeplayResetStats?.addEventListener('click', () => {
      trainer.resetStats();
      if (this.notation) this.notation.clearRhythmStream();
      if (this.pocketNeedle) this.pocketNeedle.style.left = '50%';
      if (this.freeplayLiveHitPill) {
        this.freeplayLiveHitPill.innerText = 'Stats Reset • Ready';
        this.freeplayLiveHitPill.className = 'text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 transition-all flex items-center gap-1.5';
      }
      this.showToast('🔄 Rhythm stats & score reset for a fresh run!', 'info');
    });
  }

  /**
   * Free Play Note History & Mistake Review Engine
   */
  setupFreePlayReviewEvents() {
    this.btnToggleFreeplayReview?.addEventListener('click', () => {
      this.toggleFreePlayReviewPanel();
    });

    this.btnFreeplayCloseReview?.addEventListener('click', () => {
      this.toggleFreePlayReviewPanel(false);
    });

    this.btnFreeplayNextMistake?.addEventListener('click', () => {
      this.nextFreePlayMistake();
    });

    this.btnFreeplayPrevMistake?.addEventListener('click', () => {
      this.prevFreePlayMistake();
    });

    this.btnFreeplayClearNotes?.addEventListener('click', () => {
      this.clearFreePlayNotes();
    });

    this.btnFreeplayCopyNotes?.addEventListener('click', () => {
      this.copyFreePlayNotes();
    });

    if (this.freeplayReviewFilterGroup) {
      const pills = this.freeplayReviewFilterGroup.querySelectorAll('.review-filter-pill');
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          pills.forEach(p => {
            p.classList.remove('active', 'bg-indigo-600', 'text-white');
            p.classList.add('bg-slate-800', 'text-slate-300');
          });
          pill.classList.add('active', 'bg-indigo-600', 'text-white');
          pill.classList.remove('bg-slate-800', 'text-slate-300');
          this.freePlayReviewFilter = pill.dataset.filter || 'all';
          this.renderFreePlayNotesList();
        });
      });
    }
  }

  recordFreePlayNoteOn(midi, velocity) {
    const keySigName = document.getElementById('select-key-signature')?.value || 'C Major';
    const noteInfo = MusicTheory.getNoteInfo(midi, this.preferFlats);
    const keyEval = MusicTheory.isAccidentalDeviation(midi, keySigName);
    const keyDef = MusicTheory.getKeySignature(keySigName);

    // Find closest diatonic notes if out of scale
    const closestDiatonicNotes = [];
    if (keyEval.isDeviation) {
      const candidateOffsets = [-1, 1, -2, 2];
      for (const off of candidateOffsets) {
        const candMidi = midi + off;
        if (candMidi >= 0 && candMidi <= 127) {
          const candPitchClass = ((candMidi % 12) + 12) % 12;
          if (keyDef.diatonicPitchClasses.includes(candPitchClass)) {
            const candInfo = MusicTheory.getNoteInfo(candMidi, this.preferFlats);
            if (!closestDiatonicNotes.includes(candInfo.fullName)) {
              closestDiatonicNotes.push(candInfo.fullName);
              if (closestDiatonicNotes.length >= 2) break;
            }
          }
        }
      }
    }
    keyEval.closestDiatonicNotes = closestDiatonicNotes;

    const noteRecord = {
      id: Date.now() + Math.random(),
      midi,
      velocity,
      startTime: performance.now(),
      timeStr: new Date().toLocaleTimeString(),
      endTime: null,
      durationMs: null,
      durationStr: '--',
      noteInfo,
      keySignature: keySigName,
      keyEvaluation: keyEval,
      timingEvaluation: null,
      isMistake: keyEval.isDeviation,
      mistakeType: keyEval.isDeviation ? 'scale' : null,
      mistakeReason: keyEval.isDeviation
        ? `Out of Key: ${noteInfo.fullName} is not in ${keySigName} (closest: ${closestDiatonicNotes.join(', ')})`
        : null
    };

    this.freePlayNotes.push(noteRecord);
    if (this.freePlayNotes.length > 200) {
      this.freePlayNotes.shift();
    }

    this.updateFreePlayReviewBadge();
    if (this.isFreePlayReviewOpen) {
      this.renderFreePlayNotesList();
    }
  }

  recordFreePlayNoteOff(midi) {
    const now = performance.now();
    for (let i = this.freePlayNotes.length - 1; i >= 0; i--) {
      const n = this.freePlayNotes[i];
      if (n.midi === midi && n.endTime === null) {
        n.endTime = now;
        n.durationMs = Math.round(now - n.startTime);
        n.durationStr = `${n.durationMs}ms`;
        break;
      }
    }
    if (this.isFreePlayReviewOpen) {
      this.renderFreePlayNotesList();
    }
  }

  recordFreePlayRhythmEvaluation(result) {
    if (!result || !Array.isArray(result.notes)) return;
    const now = performance.now();
    const resultMidis = result.notes.map(n => n.midi);

    for (let i = this.freePlayNotes.length - 1; i >= 0; i--) {
      const n = this.freePlayNotes[i];
      if (now - n.startTime > 3000) break;
      if (resultMidis.includes(n.midi) && !n.timingEvaluation) {
        n.timingEvaluation = result;
        const isTimingIssue = result.rating === 'off_beat' || (result.rating !== 'perfect' && Math.abs(result.offsetMs) > 55);
        if (isTimingIssue) {
          n.isMistake = true;
          if (n.mistakeType === 'scale') {
            n.mistakeType = 'both';
            n.mistakeReason += ` & Timing: ${result.text}`;
          } else {
            n.mistakeType = 'timing';
            n.mistakeReason = `Timing Flaw: ${result.text} (${result.rating.toUpperCase()})`;
          }
        }
      }
    }

    this.updateFreePlayReviewBadge();
    if (this.isFreePlayReviewOpen) {
      this.renderFreePlayNotesList();
    }
  }

  reEvaluateFreePlayNotesKeySignature() {
    const keySigName = document.getElementById('select-key-signature')?.value || 'C Major';
    if (this.freeplayReviewKeyBadge) {
      this.freeplayReviewKeyBadge.innerText = `Key: ${keySigName}`;
    }
    const keyDef = MusicTheory.getKeySignature(keySigName);

    for (const n of this.freePlayNotes) {
      n.keySignature = keySigName;
      const keyEval = MusicTheory.isAccidentalDeviation(n.midi, keySigName);
      const closestDiatonicNotes = [];
      if (keyEval.isDeviation) {
        const candidateOffsets = [-1, 1, -2, 2];
        for (const off of candidateOffsets) {
          const candMidi = n.midi + off;
          if (candMidi >= 0 && candMidi <= 127) {
            const candPitchClass = ((candMidi % 12) + 12) % 12;
            if (keyDef.diatonicPitchClasses.includes(candPitchClass)) {
              const candInfo = MusicTheory.getNoteInfo(candMidi, this.preferFlats);
              if (!closestDiatonicNotes.includes(candInfo.fullName)) {
                closestDiatonicNotes.push(candInfo.fullName);
                if (closestDiatonicNotes.length >= 2) break;
              }
            }
          }
        }
      }
      keyEval.closestDiatonicNotes = closestDiatonicNotes;
      n.keyEvaluation = keyEval;

      const isTimingIssue = n.timingEvaluation && (n.timingEvaluation.rating === 'off_beat' || (n.timingEvaluation.rating !== 'perfect' && Math.abs(n.timingEvaluation.offsetMs) > 55));
      if (keyEval.isDeviation && isTimingIssue) {
        n.isMistake = true;
        n.mistakeType = 'both';
        n.mistakeReason = `Out of Key (${n.noteInfo.fullName} not in ${keySigName}) & Timing (${n.timingEvaluation.text})`;
      } else if (keyEval.isDeviation) {
        n.isMistake = true;
        n.mistakeType = 'scale';
        n.mistakeReason = `Out of Key: ${n.noteInfo.fullName} is not in ${keySigName} (closest: ${closestDiatonicNotes.join(', ')})`;
      } else if (isTimingIssue) {
        n.isMistake = true;
        n.mistakeType = 'timing';
        n.mistakeReason = `Timing Flaw: ${n.timingEvaluation.text}`;
      } else {
        n.isMistake = false;
        n.mistakeType = null;
        n.mistakeReason = null;
      }
    }

    this.updateFreePlayReviewBadge();
    if (this.isFreePlayReviewOpen) {
      this.renderFreePlayNotesList();
      if (this.activeFreePlayReviewIndex >= 0 && this.activeFreePlayReviewIndex < this.freePlayNotes.length) {
        this.selectFreePlayReviewNote(this.activeFreePlayReviewIndex, false);
      }
    }
  }

  updateFreePlayReviewBadge() {
    if (!this.freeplayReviewBadge) return;
    const total = this.freePlayNotes.length;
    const mistakes = this.freePlayNotes.filter(n => n.isMistake).length;

    if (total === 0) {
      this.freeplayReviewBadge.innerText = '0 Notes';
      this.freeplayReviewBadge.className = 'px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700';
    } else if (mistakes > 0) {
      this.freeplayReviewBadge.innerText = `${total} Note${total === 1 ? '' : 's'} • ${mistakes} ⚠️`;
      this.freeplayReviewBadge.className = 'px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/25 text-rose-300 border border-rose-500/40 animate-pulse';
    } else {
      this.freeplayReviewBadge.innerText = `${total} Note${total === 1 ? '' : 's'}`;
      this.freeplayReviewBadge.className = 'px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    }
  }

  toggleFreePlayReviewPanel(forceOpen = null) {
    this.isFreePlayReviewOpen = (forceOpen !== null) ? forceOpen : !this.isFreePlayReviewOpen;
    if (this.isFreePlayReviewOpen) {
      this.freeplayReviewPanel?.classList.remove('hidden');
      if (this.btnToggleFreeplayReview) {
        this.btnToggleFreeplayReview.classList.add('bg-indigo-500/30', 'text-indigo-200', 'border-indigo-500/60');
      }
      const keySigName = document.getElementById('select-key-signature')?.value || 'C Major';
      if (this.freeplayReviewKeyBadge) {
        this.freeplayReviewKeyBadge.innerText = `Key: ${keySigName}`;
      }
      this.renderFreePlayNotesList();
      if (this.activeFreePlayReviewIndex === -1 && this.freePlayNotes.length > 0) {
        const firstMistakeIdx = this.freePlayNotes.findIndex(n => n.isMistake);
        if (firstMistakeIdx >= 0) {
          this.selectFreePlayReviewNote(firstMistakeIdx, false);
        } else {
          this.selectFreePlayReviewNote(this.freePlayNotes.length - 1, false);
        }
      }
    } else {
      this.freeplayReviewPanel?.classList.add('hidden');
      if (this.btnToggleFreeplayReview) {
        this.btnToggleFreeplayReview.classList.remove('bg-indigo-500/30', 'text-indigo-200', 'border-indigo-500/60');
      }
      this.clearReviewPianoKeys();
      if (this.notation) {
        this.notation.setFreePlayReviewNote(null);
      }
    }
  }

  renderFreePlayNotesList() {
    if (!this.freeplayNotesContainer) return;

    const filter = this.freePlayReviewFilter || 'all';
    let filteredNotes = this.freePlayNotes.map((note, idx) => ({ note, origIndex: idx }));

    if (filter === 'mistakes') {
      filteredNotes = filteredNotes.filter(item => item.note.isMistake);
    } else if (filter === 'scale') {
      filteredNotes = filteredNotes.filter(item => item.note.keyEvaluation?.isDeviation);
    } else if (filter === 'timing') {
      filteredNotes = filteredNotes.filter(item => item.note.timingEvaluation && item.note.timingEvaluation.rating !== 'perfect');
    }

    const totalNotes = this.freePlayNotes.length;
    const mistakesCount = this.freePlayNotes.filter(n => n.isMistake).length;
    const scaleDevCount = this.freePlayNotes.filter(n => n.keyEvaluation?.isDeviation).length;
    const timingFlawCount = this.freePlayNotes.filter(n => n.timingEvaluation && n.timingEvaluation.rating !== 'perfect').length;

    if (this.countAllNotes) this.countAllNotes.innerText = totalNotes;
    if (this.countMistakeNotes) this.countMistakeNotes.innerText = mistakesCount;
    if (this.countScaleNotes) this.countScaleNotes.innerText = scaleDevCount;
    if (this.countTimingNotes) this.countTimingNotes.innerText = timingFlawCount;

    if (this.freeplayScaleAccuracy) {
      if (totalNotes === 0) {
        this.freeplayScaleAccuracy.innerText = '100%';
        this.freeplayScaleAccuracy.className = 'font-bold text-emerald-400 font-mono';
      } else {
        const inKeyPct = Math.round(((totalNotes - scaleDevCount) / totalNotes) * 100);
        this.freeplayScaleAccuracy.innerText = `${inKeyPct}%`;
        this.freeplayScaleAccuracy.className = inKeyPct >= 90
          ? 'font-bold text-emerald-400 font-mono'
          : inKeyPct >= 70
          ? 'font-bold text-amber-400 font-mono'
          : 'font-bold text-rose-400 font-mono';
      }
    }

    if (this.freeplayMistakeStepperText) {
      if (mistakesCount === 0) {
        this.freeplayMistakeStepperText.innerText = 'No Mistakes';
        this.freeplayMistakeStepperText.className = 'text-[11px] font-mono font-bold text-emerald-400 px-1.5 select-none';
      } else {
        const mistakeIndices = [];
        this.freePlayNotes.forEach((n, idx) => { if (n.isMistake) mistakeIndices.push(idx); });
        const curMistakePos = mistakeIndices.indexOf(this.activeFreePlayReviewIndex);
        if (curMistakePos >= 0) {
          this.freeplayMistakeStepperText.innerText = `Mistake ${curMistakePos + 1} of ${mistakesCount}`;
        } else {
          this.freeplayMistakeStepperText.innerText = `${mistakesCount} Mistake${mistakesCount === 1 ? '' : 's'}`;
        }
        this.freeplayMistakeStepperText.className = 'text-[11px] font-mono font-bold text-amber-300 px-1.5 select-none';
      }
    }

    if (this.freePlayNotes.length === 0) {
      this.freeplayNotesContainer.innerHTML = `
        <div id="freeplay-notes-empty" class="text-xs text-slate-500 italic py-2 px-3">
          No notes played yet. Play notes on your MIDI instrument or keyboard to see them and review mistakes here!
        </div>
      `;
      if (this.freeplayNoteDetailCard) this.freeplayNoteDetailCard.classList.add('hidden');
      return;
    }

    if (filteredNotes.length === 0) {
      this.freeplayNotesContainer.innerHTML = `
        <div class="text-xs text-slate-400 italic py-2 px-3">
          No notes match filter "${filter}". Switch to "All Notes" to view all ${totalNotes} notes.
        </div>
      `;
      return;
    }

    this.freeplayNotesContainer.innerHTML = '';

    filteredNotes.forEach(({ note, origIndex }) => {
      const chip = document.createElement('div');
      const isSelected = origIndex === this.activeFreePlayReviewIndex;

      let chipClass = 'freeplay-note-chip ';
      if (isSelected) chipClass += 'selected ';

      if (note.isMistake) {
        if (note.mistakeType === 'scale' || note.mistakeType === 'both') {
          chipClass += 'mistake-scale ';
        } else {
          chipClass += 'mistake-timing ';
        }
      } else {
        chipClass += 'clean-note ';
      }

      chip.className = chipClass;
      chip.dataset.index = origIndex;

      const clefIcon = note.noteInfo.clef === 'treble' ? '𝄞' : '𝄢';
      let statusIcon = '✅';
      let statusColor = 'text-emerald-400';
      let subBadge = note.durationStr;

      if (note.isMistake) {
        if (note.keyEvaluation?.isDeviation) {
          statusIcon = '⚠️';
          statusColor = 'text-rose-400';
          subBadge = 'Off-Key';
        } else if (note.timingEvaluation && note.timingEvaluation.rating !== 'perfect') {
          statusIcon = '⏱️';
          statusColor = 'text-amber-400';
          subBadge = `${note.timingEvaluation.offsetMs >= 0 ? '+' : ''}${note.timingEvaluation.offsetMs}ms`;
        }
      }

      chip.innerHTML = `
        <div class="flex items-center gap-1">
          <span class="text-[10px] text-slate-400">${clefIcon}</span>
          <span class="text-xs font-black text-white">${note.noteInfo.fullName}</span>
          <span class="text-[10px]">${statusIcon}</span>
        </div>
        <div class="text-[9px] font-mono ${statusColor} font-bold mt-0.5">
          ${subBadge}
        </div>
      `;

      chip.addEventListener('click', () => {
        this.selectFreePlayReviewNote(origIndex, true);
      });

      this.freeplayNotesContainer.appendChild(chip);
    });

    const selectedEl = this.freeplayNotesContainer.querySelector('.freeplay-note-chip.selected');
    if (selectedEl) {
      selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  selectFreePlayReviewNote(index, playSound = false) {
    if (index < 0 || index >= this.freePlayNotes.length) return;
    this.activeFreePlayReviewIndex = index;
    const n = this.freePlayNotes[index];

    if (this.freeplayNoteDetailCard) {
      this.freeplayNoteDetailCard.classList.remove('hidden');
    }

    if (this.detailNoteBadge) {
      this.detailNoteBadge.innerText = n.noteInfo.fullName;
      if (n.isMistake) {
        if (n.keyEvaluation?.isDeviation) {
          this.detailNoteBadge.className = 'w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black text-base shadow-md border bg-rose-950/70 border-rose-500 text-rose-200 shadow-rose-950/50';
        } else {
          this.detailNoteBadge.className = 'w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black text-base shadow-md border bg-amber-950/70 border-amber-500 text-amber-200 shadow-amber-950/50';
        }
      } else {
        this.detailNoteBadge.className = 'w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black text-base shadow-md border bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-emerald-950/50';
      }
    }

    if (this.detailNoteStatus) {
      if (n.isMistake) {
        if (n.keyEvaluation?.isDeviation && n.timingEvaluation && n.timingEvaluation.rating !== 'perfect') {
          this.detailNoteStatus.innerText = 'Off-Key & Timing Flaw';
          this.detailNoteStatus.className = 'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40';
        } else if (n.keyEvaluation?.isDeviation) {
          this.detailNoteStatus.innerText = 'Off-Key Mistake';
          this.detailNoteStatus.className = 'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40';
        } else {
          this.detailNoteStatus.innerText = `Timing: ${n.timingEvaluation?.rating?.toUpperCase() || 'Dev'}`;
          this.detailNoteStatus.className = 'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40';
        }
      } else {
        this.detailNoteStatus.innerText = 'In Key • Clean';
        this.detailNoteStatus.className = 'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      }
    }

    if (this.detailNoteTime) {
      this.detailNoteTime.innerText = n.timeStr || '';
    }

    if (this.detailNoteDuration) {
      this.detailNoteDuration.innerText = n.durationStr || 'Playing';
    }

    if (this.detailNoteExplanation) {
      if (n.keyEvaluation?.isDeviation) {
        const closest = (n.keyEvaluation.closestDiatonicNotes && n.keyEvaluation.closestDiatonicNotes.length > 0)
          ? n.keyEvaluation.closestDiatonicNotes.join(' or ')
          : 'diatonic note';
        this.detailNoteExplanation.innerHTML = `
          <span class="text-rose-300 font-bold">❌ Scale Deviation:</span>
          ${n.noteInfo.fullName} is an accidental not present in the <strong class="text-white">${n.keySignature}</strong> scale. Recommended scale notes: <strong class="text-emerald-300">${closest}</strong>.
        `;
      } else if (n.timingEvaluation && n.timingEvaluation.rating !== 'perfect') {
        const off = n.timingEvaluation.offsetMs;
        this.detailNoteExplanation.innerHTML = `
          <span class="text-amber-300 font-bold">⏱️ Timing Flaw:</span>
          Played <strong class="text-white">${off >= 0 ? '+' : ''}${off}ms ${n.timingEvaluation.rating}</strong> (${n.timingEvaluation.metricLabel || 'relative to beat'}).
        `;
      } else {
        this.detailNoteExplanation.innerHTML = `
          <span class="text-emerald-300 font-bold">✨ Clean:</span>
          ${n.noteInfo.fullName} is diatonic to <strong class="text-white">${n.keySignature}</strong> and aligned with rhythmic flow.
        `;
      }
    }

    if (this.btnDetailPlaySound) {
      this.btnDetailPlaySound.onclick = () => {
        this.playReviewNoteSound(n.midi, n.velocity);
      };
    }

    let targetMidi = null;
    let wrongMidi = null;

    if (n.keyEvaluation?.isDeviation) {
      wrongMidi = n.midi;
      const keyDef = MusicTheory.getKeySignature(n.keySignature);
      for (const off of [-1, 1, -2, 2]) {
        const cand = n.midi + off;
        if (cand >= 0 && cand <= 127) {
          const candPitchClass = ((cand % 12) + 12) % 12;
          if (keyDef.diatonicPitchClasses.includes(candPitchClass)) {
            targetMidi = cand;
            break;
          }
        }
      }
    } else if (n.isMistake) {
      wrongMidi = n.midi;
    } else {
      targetMidi = n.midi;
    }

    this.setReviewPianoKeys(targetMidi, wrongMidi);

    if (this.notation) {
      this.notation.setFreePlayReviewNote(n);
    }

    if (playSound) {
      this.playReviewNoteSound(n.midi, n.velocity);
    }

    this.renderFreePlayNotesList();
  }

  playReviewNoteSound(midi, velocity = 90) {
    if (!this.audio) return;
    this.audio.noteOn(midi, velocity);
    setTimeout(() => {
      this.audio.noteOff(midi);
    }, 380);
  }

  nextFreePlayMistake() {
    const mistakeIndices = [];
    this.freePlayNotes.forEach((n, idx) => { if (n.isMistake) mistakeIndices.push(idx); });
    if (mistakeIndices.length === 0) {
      this.showToast('✨ No mistakes found in played notes!', 'info');
      return;
    }
    const curPos = mistakeIndices.indexOf(this.activeFreePlayReviewIndex);
    const nextIdx = (curPos === -1 || curPos >= mistakeIndices.length - 1)
      ? mistakeIndices[0]
      : mistakeIndices[curPos + 1];
    this.selectFreePlayReviewNote(nextIdx, true);
  }

  prevFreePlayMistake() {
    const mistakeIndices = [];
    this.freePlayNotes.forEach((n, idx) => { if (n.isMistake) mistakeIndices.push(idx); });
    if (mistakeIndices.length === 0) {
      this.showToast('✨ No mistakes found in played notes!', 'info');
      return;
    }
    const curPos = mistakeIndices.indexOf(this.activeFreePlayReviewIndex);
    const prevIdx = (curPos <= 0)
      ? mistakeIndices[mistakeIndices.length - 1]
      : mistakeIndices[curPos - 1];
    this.selectFreePlayReviewNote(prevIdx, true);
  }

  clearFreePlayNotes() {
    this.freePlayNotes = [];
    this.activeFreePlayReviewIndex = -1;
    this.clearReviewPianoKeys();
    if (this.notation) {
      this.notation.setFreePlayReviewNote(null);
    }
    this.updateFreePlayReviewBadge();
    this.renderFreePlayNotesList();
    if (this.freeplayNoteDetailCard) {
      this.freeplayNoteDetailCard.classList.add('hidden');
    }
    this.showToast('🗑️ Free Play notes and mistakes cleared!', 'info');
  }

  copyFreePlayNotes() {
    if (this.freePlayNotes.length === 0) {
      this.showToast('No notes played yet to copy.', 'warning');
      return;
    }
    const keySigName = document.getElementById('select-key-signature')?.value || 'C Major';
    const total = this.freePlayNotes.length;
    const mistakes = this.freePlayNotes.filter(n => n.isMistake);
    const scaleMistakes = this.freePlayNotes.filter(n => n.keyEvaluation?.isDeviation);

    let text = `MidiScope Free Play Review (${new Date().toLocaleString()}):\n`;
    text += `Key Signature: ${keySigName}\n`;
    text += `Total Notes: ${total} | Scale Accuracy: ${Math.round(((total - scaleMistakes.length) / total) * 100)}%\n`;
    text += `Mistakes: ${mistakes.length} (${scaleMistakes.length} Scale Deviations)\n\n`;
    text += `Notes Stream:\n`;
    this.freePlayNotes.forEach((n, i) => {
      const status = n.isMistake ? `❌ ${n.mistakeReason || 'Mistake'}` : '✅ In Key';
      text += `#${i + 1}: ${n.noteInfo.fullName} (${n.durationStr || 'held'}) - ${status}\n`;
    });

    navigator.clipboard?.writeText(text).then(() => {
      this.showToast('📋 Performance review summary copied to clipboard!', 'success');
    }).catch(() => {
      this.showToast('Failed to copy to clipboard', 'error');
    });
  }

  /**
   * Set up Universal Header Metronome & Transport Controls
   */
  setupUniversalMetronome() {
    this.btnMasterMetronome?.addEventListener('click', () => {
      this.toggleMasterMetronome();
    });

    this.btnMasterBpmMinus?.addEventListener('click', () => {
      this.adjustMasterBpm(-1);
    });

    this.btnMasterBpmPlus?.addEventListener('click', () => {
      this.adjustMasterBpm(+1);
    });

    this.btnMasterTapTempo?.addEventListener('click', () => {
      this.registerMasterTapTempo();
    });

    this.btnMasterClickToggle?.addEventListener('click', () => {
      this.toggleMasterClickSound();
    });

    this.updateMasterMetronomeUi();
  }

  toggleMasterMetronome() {
    if (this.appMode === 'freeplay') {
      const isRunning = this.freePlayRhythmTrainer.toggleMetronome();
      this.showToast(isRunning ? '⏱️ Metronome Started' : '⏹️ Metronome Stopped', 'info');
    } else if (this.appMode === 'practice') {
      const isRunning = this.trainer.toggleMetronome();
      if (this.metronomeStatusText) {
        this.metronomeStatusText.innerText = isRunning ? 'Metronome ON' : 'Metronome OFF';
      }
      if (this.btnToggleMetronome) {
        this.btnToggleMetronome.className = isRunning
          ? 'px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1 transition-colors'
          : 'px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors';
      }
      this.showToast(isRunning ? '⏱️ Practice Metronome ON' : '⏹️ Practice Metronome OFF', 'info');
    } else if (this.appMode === 'routine') {
      this.routine?.togglePlay();
      this.showToast(this.routine?.isRunning ? '▶️ Daily Routine Resumed' : '⏸️ Daily Routine Paused', 'info');
    }
    this.updateMasterMetronomeUi();
  }

  adjustMasterBpm(delta) {
    let currentBpm = 108;
    if (this.appMode === 'freeplay') {
      currentBpm = this.freePlayRhythmTrainer?.bpm || 108;
    } else if (this.appMode === 'practice') {
      currentBpm = this.trainer?.bpm || 108;
    } else if (this.appMode === 'routine') {
      currentBpm = this.routine?.getCurrentBpm?.() || 60;
    }
    this.setMasterBpm(currentBpm + delta);
  }

  setMasterBpm(newBpm) {
    const clamped = Math.max(30, Math.min(280, Math.round(newBpm)));
    if (this.appMode === 'freeplay') {
      this.freePlayRhythmTrainer.setBpm(clamped);
    } else if (this.appMode === 'practice') {
      this.trainer.setBpm(clamped);
    } else if (this.appMode === 'routine') {
      this.routine?.setBpm?.(clamped);
    }
    if (this.notation) this.notation.setOption('bpm', clamped);
    this.updateMasterMetronomeUi();
    return clamped;
  }

  registerMasterTapTempo() {
    const newBpm = this.freePlayRhythmTrainer.registerTap();
    this.setMasterBpm(newBpm);
    this.showToast(`🥁 Tap Tempo: ${newBpm} BPM`, 'info');
  }

  toggleMasterClickSound() {
    if (this.appMode === 'freeplay') {
      const next = !this.freePlayRhythmTrainer.metronomeSoundEnabled;
      this.freePlayRhythmTrainer.setSoundEnabled(next);
      if (this.freeplayClickIcon && this.freeplayClickText) {
        this.freeplayClickIcon.innerText = next ? '🔊' : '🔇';
        this.freeplayClickText.innerText = next ? 'Sound ON' : 'Muted';
      }
      this.showToast(next ? '🔊 Metronome Click Audible' : '🔇 Metronome Click Muted', 'info');
    } else {
      this.trainer.metronomeEnabled = !this.trainer.metronomeEnabled;
      this.showToast(this.trainer.metronomeEnabled ? '🔊 Metronome Sound ON' : '🔇 Metronome Sound Muted', 'info');
    }
    this.updateMasterMetronomeUi();
  }

  updateMasterMetronomeUi() {
    let isRunning = false;
    let bpm = 108;
    let soundEnabled = true;

    if (this.appMode === 'freeplay') {
      isRunning = !!this.freePlayRhythmTrainer?.isMetronomeRunning;
      bpm = this.freePlayRhythmTrainer?.bpm || 108;
      soundEnabled = !!this.freePlayRhythmTrainer?.metronomeSoundEnabled;
    } else if (this.appMode === 'practice') {
      isRunning = !!this.trainer?.metronomeEnabled;
      bpm = this.trainer?.bpm || 108;
      soundEnabled = !!this.trainer?.metronomeEnabled;
    } else if (this.appMode === 'routine') {
      isRunning = !!this.routine?.isRunning;
      bpm = this.routine?.getCurrentBpm?.() || 60;
      soundEnabled = true;
    }

    if (this.masterBpmDisplay) {
      this.masterBpmDisplay.innerText = `${bpm} BPM`;
    }
    if (this.freeplayBpmDisplay) {
      this.freeplayBpmDisplay.innerText = `${bpm} BPM`;
    }
    if (this.practiceBpmDisplay) {
      this.practiceBpmDisplay.innerText = `${bpm} BPM`;
    }

    if (this.btnMasterMetronome && this.masterMetronomeStatus) {
      this.masterMetronomeStatus.innerText = isRunning ? 'ON' : 'OFF';
      if (isRunning) {
        this.masterMetronomeStatus.className = 'px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 animate-pulse';
        this.btnMasterMetronome.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20';
        if (this.masterMetronomeIcon) this.masterMetronomeIcon.innerText = '⏹️';
      } else {
        this.masterMetronomeStatus.className = 'px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700';
        this.btnMasterMetronome.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 bg-slate-900/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80';
        if (this.masterMetronomeIcon) this.masterMetronomeIcon.innerText = '⏱️';
      }
    }

    if (this.masterClickIcon) {
      this.masterClickIcon.innerText = soundEnabled ? '🔊' : '🔇';
    }
  }

  animateMasterBeatDot(beatIndex, isDownbeat) {
    if (!this.masterBeatDots) return;
    const dots = this.masterBeatDots.querySelectorAll('.beat-dot');
    dots.forEach((dot, idx) => {
      if (idx === beatIndex) {
        dot.classList.add('active');
        setTimeout(() => dot.classList.remove('active'), 140);
      } else {
        dot.classList.remove('active');
      }
    });
  }


  /**
   * Display floating pill badge for real-time beat timing accuracy
   */
  showTimingFeedback(timing) {
    if (!this.practiceTimingBadge) return;

    if (this.timingBadgeTimeout) {
      clearTimeout(this.timingBadgeTimeout);
    }

    this.practiceTimingBadge.classList.remove('hidden', 'timing-badge-pop');
    void this.practiceTimingBadge.offsetWidth; // Force reflow
    this.practiceTimingBadge.classList.add('timing-badge-pop');

    let badgeClass = 'text-[11px] font-bold px-2 py-0.5 rounded border ';
    switch (timing.rating) {
      case 'perfect':
        badgeClass += 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40';
        break;
      case 'early':
      case 'late':
        badgeClass += 'bg-amber-500/25 text-amber-300 border-amber-500/40';
        break;
      case 'good':
        badgeClass += 'bg-orange-500/25 text-orange-300 border-orange-500/40';
        break;
      case 'off_beat':
      case 'missed':
        badgeClass += 'bg-rose-500/25 text-rose-300 border-rose-500/40';
        break;
      case 'count_in':
      default:
        badgeClass += 'bg-sky-500/25 text-sky-300 border-sky-500/40';
        break;
    }

    this.practiceTimingBadge.className = badgeClass;
    this.practiceTimingBadge.innerText = timing.text;

    this.timingBadgeTimeout = setTimeout(() => {
      if (this.practiceTimingBadge) {
        this.practiceTimingBadge.classList.add('hidden');
      }
    }, 1800);
  }

  /**
   * Unified Note On Handler (MIDI, Virtual Piano, or Computer Keyboard)
   */
  handleNoteOn(midi, velocity = 100, source = 'User') {
    if (midi < 0 || midi > 127) return;

    // Intercept playing in Block 2 Part 2 (Visual Interval Audit & Ghost-Fingering)
    const currentPhase = this.routine?.getCurrentPhase();
    if (this.appMode === 'routine' && currentPhase?.type === 'audit') {
      this.triggerGhostFingeringAlert(midi);
      // Still show key active on virtual piano so user sees what note they touched!
      this.setKeyActive(midi, true, velocity);
      return;
    }

    // If this exact pitch is already marked active, release it first so re-attacks cleanly trigger
    if (this.activeNotes.has(midi)) {
      this.handleNoteOff(midi, 'Re-attack');
    }

    // Wind instrument monophonic legato: release any other sounding notes immediately
    if (this.windMode && this.activeNotes.size > 0) {
      for (const prevMidi of Array.from(this.activeNotes.keys())) {
        this.handleNoteOff(prevMidi, 'Wind Legato');
      }
    }

    // Mark note as actively playing
    this.activeNotes.set(midi, true);

    // Audio sound (muted during silent analysis!)
    if (!this.trainer.isAnalyzing) {
      this.audio.noteOn(midi, velocity);
    }

    // Notation canvas
    this.notation.noteOn(midi, velocity);

    // Visual piano key
    this.setKeyActive(midi, true, velocity);

    if (source === 'Virtual Piano') {
      const noteInfo = MusicTheory.getNoteInfo(midi);
      this.addMidiLogEntry({
        timestamp: new Date().toLocaleTimeString(),
        type: 'Note On',
        source: 'Virtual Piano',
        detail: `${noteInfo.fullName} (Note ${midi}), Vel ${velocity}`,
        raw: `0x90 0x${midi.toString(16).toUpperCase().padStart(2, '0')} 0x${velocity.toString(16).toUpperCase().padStart(2, '0')}`
      });
    }

    if (this.appMode === 'practice' || this.appMode === 'routine') {
      const playedInfo = MusicTheory.getNoteInfo(midi, this.preferFlats);
      if (this.practicePlayedNote) {
        this.practicePlayedNote.innerText = playedInfo.fullName;
        const targetNote = this.trainer.getCurrentTargetNote();
        const isMatch = this.trainer.rhythmTapMode
          ? (midi === (this.trainer.expectedTapMidi || targetNote?.midi) || (targetNote && midi === targetNote.midi))
          : (targetNote && targetNote.midi === midi);
        if (isMatch) {
          this.practicePlayedNote.className = 'text-xl sm:text-2xl font-black text-emerald-400';
        } else {
          this.practicePlayedNote.className = 'text-xl sm:text-2xl font-black text-rose-400';
        }
      }
      // In practice or routine mode, evaluate played note against expected melody note
      this.trainer.onNotePlayed(midi, velocity);
    } else {
      // Free play mode: track stroke & duration in rhythm trainer, then update chord recognition
      if (this.freePlayRhythmTrainer) {
        this.freePlayRhythmTrainer.onNotePlayed(midi, velocity);
      }
      this.recordFreePlayNoteOn(midi, velocity);
      this.updateChordDisplay();
    }
  }

  /**
   * Unified Note Off Handler
   */
  handleNoteOff(midi, source = 'User') {
    if (midi < 0 || midi > 127) return;

    const currentPhase = this.routine?.getCurrentPhase();
    if (this.appMode === 'routine' && currentPhase?.type === 'audit') {
      this.activeNotes.delete(midi);
      this.setKeyActive(midi, false);
      return;
    }

    // Guaranteed complete note release: fixes stuck notes caused by counter mismatches
    this.activeNotes.delete(midi);
    this.notation.noteOff(midi);
    this.audio.noteOff(midi);
    this.setKeyActive(midi, false);

    if (source === 'Virtual Piano') {
      const noteInfo = MusicTheory.getNoteInfo(midi);
      this.addMidiLogEntry({
        timestamp: new Date().toLocaleTimeString(),
        type: 'Note Off',
        source: 'Virtual Piano',
        detail: `${noteInfo.fullName} (Note ${midi})`,
        raw: `0x80 0x${midi.toString(16).toUpperCase().padStart(2, '0')} 0x00`
      });
    }

    if (this.appMode === 'practice' || this.appMode === 'routine') {
      this.trainer.onNoteReleased(midi);
    } else {
      // Free play mode: notify rhythm trainer to compute held duration
      if (this.freePlayRhythmTrainer) {
        this.freePlayRhythmTrainer.onNoteReleased(midi);
      }
      this.recordFreePlayNoteOff(midi);
      this.updateChordDisplay();
    }
  }

  handleSustainPedal(isDown) {
    this.isPedalDown = isDown;
    this.audio.setSustainPedal(isDown);

    if (this.pedalIndicator) {
      if (isDown) {
        this.pedalIndicator.classList.add('active');
        this.pedalIndicator.innerText = 'Pedal DOWN';
      } else {
        this.pedalIndicator.classList.remove('active');
        this.pedalIndicator.innerText = 'Pedal UP';
      }
    }
  }

  /**
   * Switch between Free Play, Melody Trainer, and Daily Routine
   */
  setAppMode(mode) {
    this.appMode = mode;

    if (mode === 'routine') {
      this.tabFreePlay?.classList.remove('active');
      this.tabPractice?.classList.remove('active');
      this.tabRoutine?.classList.add('active');
      this.freeplayHud?.classList.add('hidden');
      this.freeplayRhythmPanel?.classList.add('hidden');
      this.freeplayReviewPanel?.classList.add('hidden');
      this.notation?.setFreePlayReviewNote(null);
      this.practiceHud?.classList.add('hidden');
      this.routineHud?.classList.remove('hidden');

      this.freePlayRhythmTrainer?.stopMetronome();
      this.clearReviewPianoKeys();
      this.routine?.startOrResume();

      if (this.notation && this.trainer.currentMelody) {
        this.notation.setPracticeState({
          melody: this.trainer.currentMelody,
          noteIndex: this.trainer.noteIndex,
          noteResults: this.trainer.noteResults,
          isFinished: this.trainer.isFinished,
          mode: this.trainer.mode,
          isCountingIn: this.trainer.isCountingIn,
          isAnalyzing: this.trainer.isAnalyzing
        });
      }
      this.updateTargetKeyHint();
    } else if (mode === 'practice') {
      this.tabFreePlay?.classList.remove('active');
      this.tabRoutine?.classList.remove('active');
      this.tabPractice?.classList.add('active');
      this.freeplayHud?.classList.add('hidden');
      this.freeplayRhythmPanel?.classList.add('hidden');
      this.freeplayReviewPanel?.classList.add('hidden');
      this.notation?.setFreePlayReviewNote(null);
      this.routineHud?.classList.add('hidden');
      this.practiceHud?.classList.remove('hidden');

      this.freePlayRhythmTrainer?.stopMetronome();
      this.notation.setOption('rhythmTrainerActive', false);
      this.routine?.pause();
      this.clearReviewPianoKeys();
      // Update Notation Renderer to practice mode
      this.trainer.restart();
      this.notation.setPracticeState({
        melody: this.trainer.currentMelody,
        noteIndex: this.trainer.noteIndex,
        noteResults: this.trainer.noteResults,
        isFinished: this.trainer.isFinished,
        mode: this.trainer.mode
      });

      this.updateTargetKeyHint();
    } else {
      this.tabPractice?.classList.remove('active');
      this.tabRoutine?.classList.remove('active');
      this.tabFreePlay?.classList.add('active');
      this.practiceHud?.classList.add('hidden');
      this.routineHud?.classList.add('hidden');
      this.freeplayHud?.classList.remove('hidden');
      if (this.freePlayRhythmTrainer?.isActive) {
        this.freeplayRhythmPanel?.classList.remove('hidden');
        this.notation.setOption('rhythmTrainerActive', true);
        this.notation.setOption('beatsPerMeasure', this.freePlayRhythmTrainer.beatsPerMeasure || 4);
      } else {
        this.freeplayRhythmPanel?.classList.add('hidden');
        this.notation.setOption('rhythmTrainerActive', false);
      }

      if (this.isFreePlayReviewOpen) {
        this.freeplayReviewPanel?.classList.remove('hidden');
        this.renderFreePlayNotesList();
      } else {
        this.freeplayReviewPanel?.classList.add('hidden');
        this.notation?.setFreePlayReviewNote(null);
      }

      this.routine?.pause();
      this.clearReviewPianoKeys();
      this.removeTargetKeyHint();
      this.trainer.stopMetronome();
      if (this.countInBanner) this.countInBanner.classList.add('hidden');
      const currentViewMode = document.getElementById('select-view-mode')?.value || 'live';
      this.notation.setPracticeState(null);
      this.notation.setOption('mode', currentViewMode);
      this.updateChordDisplay();
    }
    this.updateMasterMetronomeUi();
  }

  /**
   * Update Trainer HUD when state changes
   */
  onTrainerStateChange(state) {
    if (!state.melody) return;

    // Sync Key Signature UI and notation
    if (state.melody.key) {
      const selectKey = document.getElementById('select-key-signature');
      if (selectKey && selectKey.value !== state.melody.key) {
        let opt = Array.from(selectKey.options).find(o => o.value === state.melody.key);
        if (!opt) {
          opt = document.createElement('option');
          opt.value = state.melody.key;
          opt.textContent = state.melody.key;
          selectKey.appendChild(opt);
        }
        selectKey.value = state.melody.key;
        this.notation.setOption('keySignature', state.melody.key);
      }
    }

    // Melody info
    this.practiceMelodyTitle.innerText = state.melody.title;
    this.practiceComposer.innerText = state.melody.composer;

    // Difficulty badge
    const diff = state.melody.difficulty || 'Easy';
    this.practiceDifficultyBadge.innerText = diff;
    if (diff === 'Easy') {
      this.practiceDifficultyBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase';
    } else if (diff === 'Medium') {
      this.practiceDifficultyBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase';
    } else {
      this.practiceDifficultyBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase';
    }

    // Target note
    if (this.trainer.rhythmTapMode) {
      const tapMidi = this.trainer.expectedTapMidi || state.targetNote?.midi || 60;
      const tapInfo = MusicTheory.getNoteInfo(tapMidi, this.preferFlats);
      this.practiceTargetNote.innerText = `Tap ${tapInfo.fullName}`;
    } else if (state.targetNote) {
      const targetInfo = MusicTheory.getNoteInfo(state.targetNote.midi, this.preferFlats);
      this.practiceTargetNote.innerText = targetInfo.fullName;
    } else if (state.isFinished) {
      this.practiceTargetNote.innerText = '🎉 Done';
    }

    // Streak & Pitch Accuracy
    this.practiceStreakBadge.innerText = `🔥 ${state.stats.streak} Streak`;
    this.practiceAccuracyDisplay.innerText = `${state.stats.accuracy}%`;
    if (state.stats.accuracy >= 90) {
      this.practiceAccuracyDisplay.className = 'text-lg font-black text-emerald-400';
    } else if (state.stats.accuracy >= 70) {
      this.practiceAccuracyDisplay.className = 'text-lg font-black text-amber-400';
    } else {
      this.practiceAccuracyDisplay.className = 'text-lg font-black text-rose-400';
    }

    // Rhythm Timing Accuracy
    if (this.practiceRhythmDisplay) {
      const rhythmAcc = state.stats.rhythmAccuracy ?? 100;
      this.practiceRhythmDisplay.innerText = `${rhythmAcc}%`;
      if (rhythmAcc >= 90) {
        this.practiceRhythmDisplay.className = 'text-lg font-black text-emerald-400';
      } else if (rhythmAcc >= 70) {
        this.practiceRhythmDisplay.className = 'text-lg font-black text-amber-400';
      } else {
        this.practiceRhythmDisplay.className = 'text-lg font-black text-rose-400';
      }
    }

    // Master Metronome UI sync (single header metronome for all modes)
    this.updateMasterMetronomeUi();

    // Practice Mode Select sync
    if (this.selectPracticeMode && this.selectPracticeMode.value !== state.mode) {
      this.selectPracticeMode.value = state.mode;
    }

    // Visual Beat Indicator dots count sync for Master Header Metronome
    const timeSig = state.melody.timeSignature || [4, 4];
    const beatsCount = timeSig[0] || 4;
    if (this.masterBeatDots && this.masterBeatDots.children.length !== beatsCount) {
      this.masterBeatDots.innerHTML = '';
      for (let b = 0; b < beatsCount; b++) {
        const dot = document.createElement('div');
        dot.className = `beat-dot ${b === 0 ? 'downbeat' : ''}`;
        dot.dataset.beat = b;
        this.masterBeatDots.appendChild(dot);
      }
    }
    if (this.visualBeatContainer && this.visualBeatContainer.children.length !== beatsCount) {
      this.visualBeatContainer.innerHTML = '';
      for (let b = 0; b < beatsCount; b++) {
        const dot = document.createElement('div');
        dot.className = `beat-dot ${b === 0 ? 'downbeat' : ''}`;
        dot.dataset.beat = b;
        this.visualBeatContainer.appendChild(dot);
      }
    }

    // Progress bar
    const progressPercent = Math.min(100, Math.round(((state.noteIndex) / state.totalNotes) * 100));
    this.practiceProgressText.innerText = `Note ${Math.min(state.noteIndex + 1, state.totalNotes)} of ${state.totalNotes}`;
    this.practiceProgressBar.style.width = `${progressPercent}%`;

    // Tempo Recovery Badge
    if (state.mode === 'strict' || state.mode === 'first_read') {
      this.practiceRecoveryContainer?.classList.remove('hidden');
      if (this.practiceRecoveryDisplay) {
        this.practiceRecoveryDisplay.innerText = `⚡ ${state.recoveries || 0}`;
      }
    } else {
      this.practiceRecoveryContainer?.classList.add('hidden');
    }

    // Silent Analysis Banner
    if (state.isAnalyzing) {
      this.silentAnalysisBanner?.classList.remove('hidden');
      if (this.analysisTimerDisplay) {
        this.analysisTimerDisplay.innerText = `${state.analysisSecondsRemaining}s`;
      }
      if (this.analysisProgressBar) {
        const pct = Math.max(0, Math.min(100, (state.analysisSecondsRemaining / state.analysisTotalSeconds) * 100));
        this.analysisProgressBar.style.width = `${pct}%`;
      }
    } else {
      this.silentAnalysisBanner?.classList.add('hidden');
    }

    // Forward to notation renderer
    this.notation.setPracticeState({
      melody: state.melody,
      noteIndex: state.noteIndex,
      noteResults: state.noteResults,
      isFinished: state.isFinished,
      mode: state.mode,
      playheadBeats: state.playheadBeats,
      isCountingIn: state.isCountingIn,
      isAnalyzing: state.isAnalyzing
    });

    // Update target key hint on virtual piano
    this.updateTargetKeyHint();
  }

  updateTargetKeyHint() {
    this.removeTargetKeyHint();
    if (this.appMode === 'practice' || this.appMode === 'routine') {
      if (this.trainer.rhythmTapMode) {
        const tapMidi = this.trainer.expectedTapMidi || this.trainer.getCurrentTargetNote()?.midi;
        if (tapMidi) {
          const keyEl = this.pianoContainer.querySelector(`[data-midi="${tapMidi}"]`);
          if (keyEl) {
            keyEl.classList.add('target-hint');
          }
        }
      } else {
        const targetNote = this.trainer.getCurrentTargetNote();
        if (!targetNote) return;

        const keyEl = this.pianoContainer.querySelector(`[data-midi="${targetNote.midi}"]`);
        if (keyEl) {
          keyEl.classList.add('target-hint');
        }
      }
    }
  }

  removeTargetKeyHint() {
    const prevHints = this.pianoContainer.querySelectorAll('.piano-key.target-hint');
    prevHints.forEach(el => el.classList.remove('target-hint'));
  }

  /**
   * Dual-key visual piano highlighting for mistake inspection (VST3 Parity)
   * Target note highlighted in Emerald Green ("Target" badge)
   * Played wrong note highlighted in Rose Red ("Played" badge)
   */
  setReviewPianoKeys(targetMidi, wrongMidi) {
    this.clearReviewPianoKeys();
    this.removeTargetKeyHint();

    if (targetMidi != null) {
      const targetEl = this.pianoContainer.querySelector(`[data-midi="${targetMidi}"]`);
      if (targetEl) {
        targetEl.classList.add('review-target');
        const badge = document.createElement('div');
        badge.className = 'key-review-badge target';
        badge.innerText = 'Target';
        targetEl.appendChild(badge);
        // Smoothly scroll key into view
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    if (wrongMidi != null && wrongMidi !== targetMidi) {
      const wrongEl = this.pianoContainer.querySelector(`[data-midi="${wrongMidi}"]`);
      if (wrongEl) {
        wrongEl.classList.add('review-wrong');
        const badge = document.createElement('div');
        badge.className = 'key-review-badge wrong';
        badge.innerText = 'Played';
        wrongEl.appendChild(badge);
      }
    }
  }

  clearReviewPianoKeys() {
    this.pianoContainer.querySelectorAll('.review-target, .review-wrong').forEach(el => {
      el.classList.remove('review-target', 'review-wrong');
    });
    this.pianoContainer.querySelectorAll('.key-review-badge').forEach(b => b.remove());
  }

  /**
   * Jump to mistake index on sheet music and sync HUD and Piano
   */
  jumpToReviewMistake(idx) {
    if (this.appMode !== 'practice') this.setAppMode('practice');
    this.notation.jumpToMistake(idx);
    this.updateReviewUI(idx);
  }

  /**
   * Update HUD and piano keys during mistake review
   */
  updateReviewUI(idx) {
    const details = this.trainer.getMistakeReviewDetails(idx, this.preferFlats);
    if (!details) return;

    if (this.practiceTargetNote) {
      this.practiceTargetNote.innerText = details.targetNote ? details.targetNote.fullName : '--';
      this.practiceTargetNote.className = 'text-xl sm:text-2xl font-black text-emerald-400';
    }
    if (this.practicePlayedNote) {
      this.practicePlayedNote.innerText = details.wrongNote ? details.wrongNote.fullName : '--';
      this.practicePlayedNote.className = 'text-xl sm:text-2xl font-black text-rose-400';
    }
    if (this.practiceFeedbackText) {
      const targetName = details.targetNote ? details.targetNote.fullName : '';
      const wrongName = details.wrongNote ? details.wrongNote.fullName : 'Wrong pitch';
      const timeStr = details.timingOffsetMs != null ? ` (${details.timingOffsetMs > 0 ? '+' : ''}${details.timingOffsetMs}ms)` : '';
      this.practiceFeedbackText.innerText = `Review Note #${idx + 1}: Expected ${targetName}, played ${wrongName}${timeStr} • ${details.mistakes} try`;
      this.practiceFeedbackText.className = 'text-xs font-semibold text-amber-300';
    }

    const targetMidi = details.targetNote ? details.targetNote.midi : null;
    const wrongMidi = details.lastWrongMidi;
    this.setReviewPianoKeys(targetMidi, wrongMidi);
  }

  /**
   * Populate Melody Selection Modal with built-in and imported melodies
   */
  populateMelodyModal() {
    this.melodyListContainer.innerHTML = '';

    const melodies = this.trainer.melodies;

    melodies.forEach((melody, idx) => {
      const card = document.createElement('div');
      const isSelected = this.trainer.currentMelody && melody.id === this.trainer.currentMelody.id;
      card.className = `melody-card flex items-center justify-between gap-4 ${isSelected ? 'selected' : ''}`;

      const diffBadgeColor = melody.difficulty === 'Easy'
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : melody.difficulty === 'Medium'
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

      const customBadge = melody.isCustom
        ? `<span class="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase bg-sky-500/20 text-sky-300 border-sky-500/40">CUSTOM</span>`
        : '';

      const deleteButton = melody.isCustom
        ? `<button class="btn-delete-custom text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-1" title="Remove custom melody">🗑️</button>`
        : '';

      const firstReadRecord = this.trainer.getFirstReadRecord(melody.id);
      const firstReadBadge = firstReadRecord
        ? `<span class="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase bg-amber-500/20 text-amber-300 border-amber-500/40" title="Completed First-Read with ${firstReadRecord.sightReadingScore || firstReadRecord.rhythmAccuracy}% on ${firstReadRecord.dateStr}">🔒 FIRST-READ ${firstReadRecord.sightReadingScore || firstReadRecord.rhythmAccuracy}%</span>`
        : `<span class="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase bg-sky-500/15 text-sky-400 border-sky-500/30">⚡ FIRST-READ READY</span>`;

      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 text-sm">
            ${melody.isCustom ? '🎵' : idx + 1}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-white text-sm">${melody.title}</h4>
              ${customBadge}
              ${firstReadBadge}
              <span class="text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${diffBadgeColor}">${melody.difficulty}</span>
            </div>
            <p class="text-xs text-slate-400">${melody.composer} • ${melody.description}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-right">
          <div>
            <span class="text-[11px] font-mono text-slate-400 block">${melody.notes.length} notes • ${melody.key}</span>
            <button class="mt-1 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors">
              Play
            </button>
          </div>
          ${deleteButton}
        </div>
      `;

      // Handle custom melody deletion
      const delBtn = card.querySelector('.btn-delete-custom');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Remove custom melody "${melody.title}"?`)) {
            this.trainer.removeCustomMelody(melody.id);
            this.populateMelodyModal();
            this.showToast(`Removed "${melody.title}"`, 'info');
          }
        });
      }

      card.addEventListener('click', () => {
        if (this.trainer.mode === 'first_read' && this.trainer.isMelodyFirstReadLocked(melody.id)) {
          const rec = this.trainer.getFirstReadRecord(melody.id);
          this.showToast(`🔒 "${melody.title}" was already completed in First-Read (${rec.sightReadingScore || rec.rhythmAccuracy}%). Loading in Strict Time mode instead.`, 'warning');
          this.trainer.setMode('strict');
        }
        this.trainer.loadMelody(melody.id);
        this.closeMelodyModal();
        this.setAppMode('practice');
      });

      this.melodyListContainer.appendChild(card);
    });
  }

  openMelodyModal() {
    this.populateMelodyModal();
    this.modalMelodySelect.classList.add('open');
  }

  closeMelodyModal() {
    this.modalMelodySelect.classList.remove('open');
  }

  /**
   * Set up score file loading (.mid, .midi, .musicxml, .xml, .mxl) and Drag & Drop handlers
   */
  setupMidiFileLoader() {
    // 1. HUD Load button
    this.btnLoadMidi?.addEventListener('click', () => {
      this.midiFileInput?.click();
    });

    // 2. Modal dropzone click
    this.midiModalDropzone?.addEventListener('click', () => {
      this.midiFileInput?.click();
    });

    // 3. File Input change
    this.midiFileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        this.loadScoreFromFile(file);
      }
      this.midiFileInput.value = '';
    });

    // 4. Modal Dropzone drag events
    if (this.midiModalDropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        this.midiModalDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.midiModalDropzone.classList.add('border-sky-400', 'bg-sky-500/20');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.midiModalDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.midiModalDropzone.classList.remove('border-sky-400', 'bg-sky-500/20');
        });
      });

      this.midiModalDropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (file) {
          this.loadScoreFromFile(file);
        }
      });
    }

    // 5. Global Window Drag & Drop
    let dragCounter = 0;
    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (this.dropOverlay) {
        this.dropOverlay.classList.remove('pointer-events-none', 'opacity-0');
        this.dropOverlay.classList.add('opacity-100', 'pointer-events-auto');
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0 && this.dropOverlay) {
        dragCounter = 0;
        this.dropOverlay.classList.remove('opacity-100', 'pointer-events-auto');
        this.dropOverlay.classList.add('pointer-events-none', 'opacity-0');
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      if (this.dropOverlay) {
        this.dropOverlay.classList.remove('opacity-100', 'pointer-events-auto');
        this.dropOverlay.classList.add('pointer-events-none', 'opacity-0');
      }
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        this.loadScoreFromFile(file);
      }
    });
    // 6. Channel / Part Selection Modal controls
    this.btnCloseChannelModal?.addEventListener('click', () => this.closeChannelModal());
    this.btnCancelChannel?.addEventListener('click', () => this.closeChannelModal());
    this.modalChannelSelect?.addEventListener('click', (e) => {
      if (e.target === this.modalChannelSelect) this.closeChannelModal();
    });
  }

  /**
   * Backwards-compatible alias for loading scores
   */
  async loadMidiFromFile(file) {
    return this.loadScoreFromFile(file);
  }

  /**
   * Parse external MIDI or MusicXML file and load into practice trainer.
   * Prompts user with channel / part selector modal if multiple tracks or parts are detected.
   */
  async loadScoreFromFile(file) {
    if (!file) return;
    const nameLower = file.name.toLowerCase();
    const isMidiExt = nameLower.endsWith('.mid') || nameLower.endsWith('.midi');
    const isXmlExt = nameLower.endsWith('.musicxml') || nameLower.endsWith('.xml') || nameLower.endsWith('.mxl');

    if (!isMidiExt && !isXmlExt) {
      this.showToast('Please select a valid MIDI (.mid) or MusicXML (.musicxml, .xml, .mxl) file', 'error');
      return;
    }

    try {
      this.showToast(`Analyzing ${file.name}...`, 'info');
      const arrayBuffer = await file.arrayBuffer();

      // Check format signatures
      const bytes = new Uint8Array(arrayBuffer);
      const isMidiMagic = bytes.length >= 4 && bytes[0] === 0x4D && bytes[1] === 0x54 && bytes[2] === 0x68 && bytes[3] === 0x64; // MThd

      const treatAsMidi = (isMidiExt || isMidiMagic) && !nameLower.endsWith('.musicxml') && !nameLower.endsWith('.mxl') && !nameLower.endsWith('.xml');

      if (treatAsMidi) {
        // Standard MIDI file
        const channelInfo = inspectMidiChannels(arrayBuffer, file.name);

        if (!channelInfo.channels || channelInfo.channels.length === 0) {
          throw new Error('No playable note events found in this MIDI file.');
        }

        if (channelInfo.channels.length === 1) {
          // Single channel present: load directly without interrupting user
          const targetCh = channelInfo.channels[0].channelNumber;
          const melody = parseMidiFile(arrayBuffer, file.name, targetCh);
          this.finishLoadingCustomMelody(melody);
        } else {
          // Multiple channels found: show channel selector modal
          this.showChannelSelectModal(channelInfo, arrayBuffer, file.name);
        }
      } else {
        // MusicXML file (.musicxml, .xml, or compressed .mxl)
        const xmlInfo = await inspectMusicXml(arrayBuffer, file.name);

        if (!xmlInfo.parts || xmlInfo.parts.length === 0) {
          throw new Error('No playable musical parts found in this MusicXML file.');
        }

        if (xmlInfo.parts.length === 1) {
          // Single part present: load directly without interrupting user
          const melody = await parseMusicXml(arrayBuffer, file.name, xmlInfo.parts[0].partId);
          this.finishLoadingCustomMelody(melody);
        } else {
          // Multiple parts found: show part selector modal
          this.showPartSelectModal(xmlInfo, arrayBuffer, file.name);
        }
      }
    } catch (err) {
      console.error('Failed to parse file:', err);
      this.showToast(`⚠️ Could not load score: ${err.message}`, 'error');
    }
  }

  /**
   * Display interactive modal asking user which MIDI channel to load
   */
  showChannelSelectModal(channelInfo, arrayBuffer, fileName) {
    this.pendingMidiBuffer = arrayBuffer;
    this.pendingMidiFileName = fileName;
    this.pendingXmlBuffer = null;
    this.pendingXmlFileName = '';
    this.isPendingXml = false;

    if (this.channelModalTitle) {
      this.channelModalTitle.innerText = 'Select MIDI Channel';
    }

    if (this.channelModalSubtitle) {
      this.channelModalSubtitle.innerText = 'Choose which instrument channel to practice and score';
    }

    if (this.channelModalFilename) {
      this.channelModalFilename.innerText = fileName;
      this.channelModalFilename.title = fileName;
    }

    if (this.channelModalMeta) {
      const timeSigStr = channelInfo.timeSignature ? `${channelInfo.timeSignature[0]}/${channelInfo.timeSignature[1]}` : '4/4';
      this.channelModalMeta.innerHTML = `
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">${channelInfo.tempoBpm} BPM</span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">${timeSigStr}</span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono font-medium">${channelInfo.detectedKey}</span>
      `;
    }

    if (this.channelListContainer) {
      this.channelListContainer.innerHTML = '';

      // 1. "All Channels (Merged)" Option
      const totalNotes = channelInfo.channels.reduce((sum, ch) => sum + ch.noteCount, 0);
      const allCard = document.createElement('div');
      allCard.className = 'channel-card flex items-center justify-between gap-3';
      allCard.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-base shrink-0">
            🎼
          </div>
          <div class="truncate">
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-white text-sm">All Channels (Merged)</h4>
              <span class="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase bg-emerald-500/20 text-emerald-300 border-emerald-500/40">FULL SONG</span>
            </div>
            <p class="text-xs text-slate-400 truncate">Extracts lead melody across all ${channelInfo.channels.length} channels</p>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right">
            <span class="text-xs font-mono font-bold text-emerald-400 block">${totalNotes} notes</span>
            <span class="text-[10px] text-slate-400 font-medium">All tracks</span>
          </div>
          <button class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors">
            Select
          </button>
        </div>
      `;
      allCard.addEventListener('click', () => {
        this.loadPendingChannel(null);
      });
      this.channelListContainer.appendChild(allCard);

      // 2. Individual Channel Cards
      channelInfo.channels.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'channel-card flex items-center justify-between gap-3';
        const displayName = ch.trackName || ch.instrumentName;
        const subtext = ch.trackName ? `${ch.instrumentName} • Range: ${ch.pitchRange}` : `Range: ${ch.pitchRange}`;

        card.innerHTML = `
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-bold text-sky-400 shrink-0">
              <span class="text-[9px] text-slate-400 font-semibold leading-none">CH</span>
              <span class="text-sm font-black leading-tight">${ch.channelNumber}</span>
            </div>
            <div class="truncate">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-white text-sm truncate">${displayName}</h4>
                ${ch.isDrum ? '<span title="Percussion Channel">🥁</span>' : ''}
              </div>
              <p class="text-xs text-slate-400 truncate">${subtext}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-sky-400 block">${ch.noteCount} notes</span>
              <span class="text-[10px] text-slate-400 font-medium">Single Part</span>
            </div>
            <button class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors">
              Select
            </button>
          </div>
        `;

        card.addEventListener('click', () => {
          this.loadPendingChannel(ch.channelNumber);
        });
        this.channelListContainer.appendChild(card);
      });
    }

    this.modalChannelSelect?.classList.add('open');
  }

  /**
   * Display interactive modal asking user which MusicXML part to load
   */
  showPartSelectModal(xmlInfo, arrayBuffer, fileName) {
    this.pendingXmlBuffer = arrayBuffer;
    this.pendingXmlFileName = fileName;
    this.pendingMidiBuffer = null;
    this.pendingMidiFileName = '';
    this.isPendingXml = true;

    if (this.channelModalTitle) {
      this.channelModalTitle.innerText = 'Select Score Part (MusicXML)';
    }

    if (this.channelModalSubtitle) {
      this.channelModalSubtitle.innerText = `Choose which instrument part to practice and score (${xmlInfo.parts.length} parts found)`;
    }

    if (this.channelModalFilename) {
      this.channelModalFilename.innerText = fileName;
      this.channelModalFilename.title = fileName;
    }

    if (this.channelModalMeta) {
      const timeSigStr = xmlInfo.timeSignature ? `${xmlInfo.timeSignature[0]}/${xmlInfo.timeSignature[1]}` : '4/4';
      this.channelModalMeta.innerHTML = `
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">${xmlInfo.tempoBpm} BPM</span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">${timeSigStr}</span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono font-medium">${xmlInfo.detectedKey}</span>
      `;
    }

    if (this.channelListContainer) {
      this.channelListContainer.innerHTML = '';

      // 1. "All Parts (Merged)" Option
      const totalNotes = xmlInfo.parts.reduce((sum, p) => sum + p.noteCount, 0);
      const allCard = document.createElement('div');
      allCard.className = 'channel-card flex items-center justify-between gap-3';
      allCard.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-base shrink-0">
            🎼
          </div>
          <div class="truncate">
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-white text-sm">All Parts (Merged)</h4>
              <span class="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase bg-emerald-500/20 text-emerald-300 border-emerald-500/40">FULL SCORE</span>
            </div>
            <p class="text-xs text-slate-400 truncate">Extracts lead melody across all ${xmlInfo.parts.length} parts</p>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right">
            <span class="text-xs font-mono font-bold text-emerald-400 block">${totalNotes} notes</span>
            <span class="text-[10px] text-slate-400 font-medium">All parts</span>
          </div>
          <button class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors">
            Select
          </button>
        </div>
      `;
      allCard.addEventListener('click', () => {
        this.loadPendingPart(null);
      });
      this.channelListContainer.appendChild(allCard);

      // 2. Individual Part Cards
      xmlInfo.parts.forEach(part => {
        const card = document.createElement('div');
        card.className = 'channel-card flex items-center justify-between gap-3';
        const displayName = part.name || part.instrumentName;
        const subtext = `${part.instrumentName} • Range: ${part.pitchRange}`;

        card.innerHTML = `
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-bold text-sky-400 shrink-0">
              <span class="text-[9px] text-slate-400 font-semibold leading-none">PART</span>
              <span class="text-sm font-black leading-tight">${part.partNumber}</span>
            </div>
            <div class="truncate">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-white text-sm truncate">${displayName}</h4>
              </div>
              <p class="text-xs text-slate-400 truncate">${subtext}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-sky-400 block">${part.noteCount} notes</span>
              <span class="text-[10px] text-slate-400 font-medium">Single Part</span>
            </div>
            <button class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors">
              Select
            </button>
          </div>
        `;

        card.addEventListener('click', () => {
          this.loadPendingPart(part.partId);
        });
        this.channelListContainer.appendChild(card);
      });
    }

    this.modalChannelSelect?.classList.add('open');
  }

  closeChannelModal() {
    this.modalChannelSelect?.classList.remove('open');
    this.pendingMidiBuffer = null;
    this.pendingMidiFileName = '';
    this.pendingXmlBuffer = null;
    this.pendingXmlFileName = '';
    this.isPendingXml = false;
  }

  loadPendingChannel(targetChannel) {
    if (!this.pendingMidiBuffer) return;
    try {
      const melody = parseMidiFile(this.pendingMidiBuffer, this.pendingMidiFileName, targetChannel);
      this.closeChannelModal();
      this.finishLoadingCustomMelody(melody);
    } catch (err) {
      console.error('Failed to parse selected channel:', err);
      this.showToast(`⚠️ Could not load channel: ${err.message}`, 'error');
    }
  }

  async loadPendingPart(targetPartId) {
    if (!this.pendingXmlBuffer) return;
    try {
      const melody = await parseMusicXml(this.pendingXmlBuffer, this.pendingXmlFileName, targetPartId);
      this.closeChannelModal();
      this.finishLoadingCustomMelody(melody);
    } catch (err) {
      console.error('Failed to parse selected MusicXML part:', err);
      this.showToast(`⚠️ Could not load part: ${err.message}`, 'error');
    }
  }

  finishLoadingCustomMelody(melody) {
    if (!melody || !melody.notes || melody.notes.length === 0) {
      throw new Error('No notes found in selected channel.');
    }

    if (melody.key) {
      const selectKey = document.getElementById('select-key-signature');
      if (selectKey) {
        let opt = Array.from(selectKey.options).find(o => o.value === melody.key);
        if (!opt) {
          opt = document.createElement('option');
          opt.value = melody.key;
          opt.textContent = melody.key;
          selectKey.appendChild(opt);
        }
        selectKey.value = melody.key;
      }
      this.notation.setOption('keySignature', melody.key);
    }

    this.trainer.addCustomMelody(melody);
    this.closeMelodyModal();
    this.setAppMode('practice');
    this.populateMelodyModal();

    const timeSigStr = melody.timeSignature ? `${melody.timeSignature[0]}/${melody.timeSignature[1]}` : '4/4';
    this.showToast(`✨ Loaded "${melody.title}" (${melody.notes.length} notes • ${melody.key || ''} • ${melody.bpm} BPM • ${timeSigStr})`, 'success');
  }

  /**
   * Sleek Toast Notification
   */
  showToast(message, type = 'info') {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `midisheet-toast ${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `
      <span class="text-base leading-none">${icon}</span>
      <span class="flex-1 text-xs text-white leading-tight font-medium">${message}</span>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, 4000);
  }

  /**
   * Display Performance Scorecard Modal
   */
  showScorecard(summary) {
    const starsContainer = document.getElementById('score-stars-container');
    const titleEl = document.getElementById('score-title');
    const melodyNameEl = document.getElementById('score-melody-name');
    const accuracyEl = document.getElementById('score-accuracy');
    const rhythmEl = document.getElementById('score-rhythm');
    const correctNotesEl = document.getElementById('score-correct-notes');
    const mistakesEl = document.getElementById('score-mistakes');
    const perfectHitsEl = document.getElementById('score-perfect-hits');
    const missedNotesEl = document.getElementById('score-missed-notes');
    const badgePerfect = document.getElementById('score-badge-perfect');
    const badgeGreat = document.getElementById('score-badge-great');
    const badgeMissed = document.getElementById('score-badge-missed');
    const feedbackMsgEl = document.getElementById('score-feedback-message');

    // Build star icons
    starsContainer.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const star = document.createElement('span');
      star.className = `star-icon ${i <= summary.stars ? '' : 'empty'}`;
      star.innerText = '★';
      starsContainer.appendChild(star);
    }

    titleEl.innerText = summary.stars === 3 ? 'Masterful Performance!' : summary.stars === 2 ? 'Great Rhythm & Flow!' : 'Keep Practicing!';
    melodyNameEl.innerText = `${summary.melody.title} • ${summary.melody.composer} (${summary.bpm} BPM)`;
    
    if (accuracyEl) accuracyEl.innerText = `${summary.accuracy}%`;
    if (rhythmEl) rhythmEl.innerText = `${summary.rhythmAccuracy}%`;
    if (correctNotesEl) correctNotesEl.innerText = `${summary.correctNotes} / ${summary.melody.notes.length}`;
    if (mistakesEl) mistakesEl.innerText = summary.mistakeCount;
    if (perfectHitsEl) perfectHitsEl.innerText = summary.perfectHits;
    if (missedNotesEl) missedNotesEl.innerText = summary.missedNotes;

    if (badgePerfect) badgePerfect.innerText = `🟢 ${summary.perfectHits} Perfect`;
    if (badgeGreat) badgeGreat.innerText = `🟡 ${summary.greatHits} Early/Late`;
    if (badgeMissed) badgeMissed.innerText = `🔴 ${summary.missedNotes} Missed`;

    // First-Read Certificate Banner
    if (this.scoreFirstReadCert) {
      if (summary.isFirstRead) {
        this.scoreFirstReadCert.classList.remove('hidden');
        titleEl.innerText = summary.stars >= 2 ? '🏆 Certified First-Read!' : 'First-Read Completed!';
      } else {
        this.scoreFirstReadCert.classList.add('hidden');
      }
    }

    // Recoveries Breakdown Badge
    if (this.scoreBadgeRecoveries) {
      if (summary.recoveries > 0) {
        this.scoreBadgeRecoveries.classList.remove('hidden');
        this.scoreBadgeRecoveries.innerText = `⚡ ${summary.recoveries} ${summary.recoveries === 1 ? 'Recovery' : 'Recoveries'}`;
      } else {
        this.scoreBadgeRecoveries.classList.add('hidden');
      }
    }

    if (summary.stars === 3) {
      feedbackMsgEl.innerText = '🌟 Outstanding! Flawless pitch accuracy and spot-on rhythm timing with the metronome.';
    } else if (summary.stars === 2) {
      feedbackMsgEl.innerText = '👍 Solid playing! Try locking right onto each metronome click to earn 3 stars.';
    } else {
      feedbackMsgEl.innerText = '💪 Good effort! Follow the metronome pulse and highlighted keys to build rhythm speed.';
    }

    // Review Mistakes / Missed on Sheet button (VST3 Parity)
    const totalReviewIssues = (summary.mistakeCount || 0) + (summary.missedNotes || 0);
    if (this.btnScoreReview) {
      if (totalReviewIssues > 0) {
        this.btnScoreReview.classList.remove('hidden');
        this.btnScoreReview.onclick = () => {
          const firstMistake = this.trainer.getFirstMistakeIndex();
          if (firstMistake != null && firstMistake >= 0) {
            this.closeScorecard();
            this.jumpToReviewMistake(firstMistake);
          }
        };
      } else {
        this.btnScoreReview.classList.add('hidden');
      }
    }

    // Render Mistakes & Missed Review List if there were issues
    const mistakesSection = document.getElementById('score-mistakes-section');
    const mistakesCountBadge = document.getElementById('score-mistakes-count-badge');
    const mistakesList = document.getElementById('score-mistakes-list');

    if (mistakesSection && mistakesList) {
      mistakesList.innerHTML = '';
      if (totalReviewIssues > 0 && Array.isArray(summary.noteResults)) {
        mistakesSection.classList.remove('hidden');
        if (mistakesCountBadge) {
          mistakesCountBadge.innerText = `${totalReviewIssues} ${totalReviewIssues === 1 ? 'Issue' : 'Issues'}`;
        }

        summary.noteResults.forEach((res, idx) => {
          const isMistake = res && res.mistakes > 0;
          const isMissed = res && res.status === 'missed';
          if ((isMistake || isMissed) && summary.melody.notes[idx]) {
            const targetNote = summary.melody.notes[idx];
            const targetInfo = MusicTheory.getNoteInfo(targetNote.midi, this.preferFlats);
            const wrongInfo = (isMistake && res.lastWrongMidi != null) ? MusicTheory.getNoteInfo(res.lastWrongMidi, this.preferFlats) : null;
            const wrongName = wrongInfo ? wrongInfo.fullName : (isMissed ? 'Time Expired (Not Played)' : 'Wrong pitch');

            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-rose-900/30 text-xs cursor-pointer transition-colors group';
            item.innerHTML = `
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full ${isMissed ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'} font-bold flex items-center justify-center text-[10px]">#${idx + 1}</span>
                <div>
                  <div class="font-semibold text-slate-200">Expected <span class="text-emerald-400 font-mono font-bold">${targetInfo.fullName}</span> • ${isMissed ? '<span class="text-amber-400 font-mono font-bold">Missed</span>' : `Played <span class="text-rose-400 font-mono font-bold">${wrongName}</span>`}</div>
                  <div class="text-[10px] text-slate-400">${targetNote.duration >= 4 ? 'Whole note' : targetNote.duration >= 2 ? 'Half note' : targetNote.duration >= 1 ? 'Quarter note' : 'Eighth note'}${isMistake ? ` (${res.mistakes}x wrong attempt${res.mistakes > 1 ? 's' : ''})` : ' (Not struck in tempo)'}</div>
                </div>
              </div>
              <button class="btn-inspect-mistake px-2.5 py-1 rounded bg-rose-500/20 group-hover:bg-rose-500/30 text-rose-300 text-[10px] font-semibold transition-colors pointer-events-none" data-note-idx="${idx}">
                Review 🔍
              </button>
            `;

            item.addEventListener('click', () => {
              this.closeScorecard();
              this.jumpToReviewMistake(idx);
            });

            mistakesList.appendChild(item);
          }
        });
      } else {
        mistakesSection.classList.add('hidden');
      }
    }

    this.modalScorecard.classList.add('open');
  }

  jumpToReviewMistake(idx) {
    if (this.trainer && this.trainer.currentMelody) {
      this.trainer.noteIndex = idx;
      this.trainer.notifyState();
    }
  }

  closeScorecard() {
    this.modalScorecard.classList.remove('open');
  }

  /**
   * Export Practice Performance Modal & Handlers
   */
  openExportModal() {
    if (!this.modalExportSession) return;
    const session = this.trainer.getSessionPerformance();

    if (this.exportMelodyTitle && session.melody) {
      this.exportMelodyTitle.innerText = `${session.melody.title} • ${session.melody.composer || 'Traditional'}`;
    }
    if (this.exportMelodyMeta && session.melody) {
      this.exportMelodyMeta.innerText = `Key: ${session.melody.key || 'C Major'} • ${session.bpm || 108} BPM • ${session.melody.notes?.length || 0} Target Notes`;
    }
    if (this.exportAccuracyBadge) {
      const acc = session.stats?.accuracy ?? 100;
      this.exportAccuracyBadge.innerText = `${acc}% Accuracy`;
      this.exportAccuracyBadge.className = acc >= 90
        ? 'text-sm font-mono font-black text-emerald-400'
        : acc >= 75
          ? 'text-sm font-mono font-black text-amber-400'
          : 'text-sm font-mono font-black text-rose-400';
    }
    if (this.exportMistakesBadge) {
      const mistakes = session.stats?.mistakeCount ?? 0;
      const missed = session.stats?.missedNotes ?? 0;
      this.exportMistakesBadge.innerText = `${mistakes} Mistake${mistakes === 1 ? '' : 's'} • ${missed} Missed`;
    }

    this.updateExportModalView();
    this.modalExportSession.classList.add('open');
  }

  closeExportModal() {
    this.modalExportSession?.classList.remove('open');
  }

  setExportFormat(fmt) {
    this.currentExportFormat = fmt;
    if (this.exportFmtMidi && this.exportFmtMusicXml) {
      if (fmt === 'midi') {
        this.exportFmtMidi.classList.add('active', 'border-sky-500/50', 'bg-sky-500/10');
        this.exportFmtMidi.classList.remove('border-slate-700/80', 'bg-slate-800/40');
        this.exportFmtMusicXml.classList.remove('active', 'border-amber-500/50', 'bg-amber-500/10');
        this.exportFmtMusicXml.classList.add('border-slate-700/80', 'bg-slate-800/40');
      } else {
        this.exportFmtMusicXml.classList.add('active', 'border-amber-500/50', 'bg-amber-500/10');
        this.exportFmtMusicXml.classList.remove('border-slate-700/80', 'bg-slate-800/40');
        this.exportFmtMidi.classList.remove('active', 'border-sky-500/50', 'bg-sky-500/10');
        this.exportFmtMidi.classList.add('border-slate-700/80', 'bg-slate-800/40');
      }
    }
    this.updateExportModalView();
  }

  setExportScope(scope) {
    this.currentExportScope = scope;
    const scopeOptions = document.querySelectorAll('.export-scope-option');
    scopeOptions.forEach(opt => {
      const radio = opt.querySelector('input[name="export-scope"]');
      if (radio && radio.value === scope) {
        radio.checked = true;
        opt.classList.add('border-sky-500/50', 'bg-sky-500/10');
        opt.classList.remove('border-slate-700/80', 'bg-slate-800/40');
      } else {
        opt.classList.remove('border-sky-500/50', 'bg-sky-500/10');
        opt.classList.add('border-slate-700/80', 'bg-slate-800/40');
      }
    });
    this.updateExportModalView();
  }

  updateExportModalView() {
    const session = this.trainer.getSessionPerformance();
    const isMidi = this.currentExportFormat === 'midi';

    if (this.btnDownloadLabel) {
      this.btnDownloadLabel.innerText = isMidi ? 'Download .MID File' : 'Download .MusicXML File';
    }

    if (this.exportAiPromptBox) {
      this.exportAiPromptBox.value = generateAiPrompt(session, this.currentExportFormat);
    }
  }

  downloadExportFile() {
    const session = this.trainer.getSessionPerformance();
    const title = (session.melody?.title || 'practice_melody').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const isMidi = this.currentExportFormat === 'midi';
    const includeAnnotations = this.exportCheckAnnotations ? this.exportCheckAnnotations.checked : true;
    const ext = isMidi ? 'mid' : 'musicxml';
    const filename = `${title}_${this.currentExportScope}_performance.${ext}`;

    try {
      if (isMidi) {
        const midiBytes = exportToMidi(session, {
          scope: this.currentExportScope,
          includeAnnotations
        });
        downloadFile(midiBytes, filename, 'audio/midi');
        this.showToast(`Exported ${filename} (${midiBytes.length} bytes)`, 'success');
      } else {
        const xmlString = exportToMusicXml(session, {
          scope: this.currentExportScope,
          includeAnnotations
        });
        downloadFile(xmlString, filename, 'application/vnd.recordare.musicxml+xml');
        this.showToast(`Exported ${filename} (MusicXML score)`, 'success');
      }
    } catch (err) {
      console.error('Failed to export practice session:', err);
      this.showToast(`Export failed: ${err.message}`, 'error');
    }
  }

  async copyAiPromptToClipboard() {
    if (!this.exportAiPromptBox) return;
    const text = this.exportAiPromptBox.value;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        this.exportAiPromptBox.select();
        document.execCommand('copy');
      }

      if (this.copyAiPromptText) {
        this.copyAiPromptText.innerText = '✓ Copied!';
        setTimeout(() => {
          if (this.copyAiPromptText) this.copyAiPromptText.innerText = 'Copy Prompt';
        }, 2000);
      }
      this.showToast('AI prompt copied! Paste into ChatGPT or Claude with your downloaded file.', 'success');
    } catch (err) {
      this.showToast('Failed to copy prompt to clipboard', 'error');
    }
  }

  /**
   * Updates chord name, quality, and active note pill badges
   */
  updateChordDisplay() {
    const activeMidis = Array.from(this.activeNotes.keys());

    if (activeMidis.length === 0) {
      this.chordNameEl.innerText = 'Play a chord or note';
      this.chordNameEl.className = 'text-2xl md:text-3xl font-bold text-slate-400 dark:text-slate-500 transition-colors';
      if (this.freePlayRhythmTrainer?.lastDetectedDuration) {
        const d = this.freePlayRhythmTrainer.lastDetectedDuration;
        this.chordQualityEl.innerHTML = `Last Note: <span class="text-sky-400 font-bold">${d.symbol} ${d.name}</span> <span class="text-slate-400 font-mono">(${d.standardBeats} beat${d.standardBeats === 1 ? '' : 's'} • ${d.durationMs}ms)</span>`;
      } else {
        this.chordQualityEl.innerText = 'Ready';
      }
      this.activeNotesListEl.innerHTML = '<span class="text-xs text-slate-400 dark:text-slate-500 italic">No notes held</span>';
      return;
    }

    const chord = MusicTheory.identifyChord(activeMidis, this.preferFlats);

    if (chord) {
      this.chordNameEl.innerText = chord.name;
      this.chordNameEl.className = 'text-3xl md:text-4xl font-extrabold text-sky-500 dark:text-sky-400 drop-shadow-sm transition-all';
      let qualityText = chord.quality || chord.type || 'Chord';
      if (this.freePlayRhythmTrainer?.lastDetectedDuration) {
        const d = this.freePlayRhythmTrainer.lastDetectedDuration;
        qualityText += ` • ${d.symbol} ${d.name}`;
      }
      this.chordQualityEl.innerText = qualityText;
    } else if (activeMidis.length === 1) {
      const info = MusicTheory.getNoteInfo(activeMidis[0], this.preferFlats);
      this.chordNameEl.innerText = info.fullName;
      this.chordNameEl.className = 'text-3xl md:text-4xl font-extrabold text-sky-500 dark:text-sky-400 drop-shadow-sm transition-all';
      let qualityText = 'Single Note';
      if (this.freePlayRhythmTrainer?.lastDetectedDuration) {
        const d = this.freePlayRhythmTrainer.lastDetectedDuration;
        qualityText += ` • ${d.symbol} ${d.name}`;
      }
      this.chordQualityEl.innerText = qualityText;
    }

    // Render active note badges
    const sorted = [...activeMidis].sort((a, b) => a - b);
    this.activeNotesListEl.innerHTML = sorted.map(midi => {
      const info = MusicTheory.getNoteInfo(midi, this.preferFlats);
      const isTreble = midi >= 60;
      const colorClass = isTreble
        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
        : 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      return `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${colorClass}">${info.fullName}</span>`;
    }).join(' ');
  }

  /**
   * Build Responsive 61-Key Virtual Piano
   */
  buildPiano() {
    this.pianoContainer.innerHTML = '';

    // QWERTY keyboard map inverted for visual hints
    const qwertyHints = {};
    for (const [code, offset] of Object.entries(this.midi.keyMap)) {
      const midi = (this.midi.keyboardOctave + 1) * 12 + offset;
      const keyChar = code.replace('Key', '').replace('Semicolon', ';').replace('Quote', "'");
      qwertyHints[midi] = keyChar;
    }

    for (let midi = this.startMidi; midi <= this.endMidi; midi++) {
      const info = MusicTheory.getNoteInfo(midi, this.preferFlats);
      const isBlack = info.displayName.includes('#') || info.displayName.includes('b');

      const keyEl = document.createElement('div');
      keyEl.dataset.midi = midi;
      keyEl.className = `piano-key ${isBlack ? 'black-key' : 'white-key'}`;

      // Middle C marker
      if (midi === 60) {
        keyEl.classList.add('middle-c');
      }

      // Key Label (Note name + QWERTY hint)
      const label = document.createElement('div');
      label.className = 'key-label';

      const noteText = document.createElement('span');
      noteText.className = 'key-note-name';
      noteText.innerText = info.displayName;

      const qwertyText = document.createElement('span');
      qwertyText.className = 'key-qwerty-hint';
      qwertyText.innerText = qwertyHints[midi] || '';

      label.appendChild(noteText);
      label.appendChild(qwertyText);
      keyEl.appendChild(label);

      // Mouse and Touch Interaction
      let isPressed = false;

      const startPress = (e) => {
        e.preventDefault();
        isPressed = true;
        this.handleNoteOn(midi, 100, 'Virtual Piano');
      };

      const stopPress = (e) => {
        if (!isPressed) return;
        isPressed = false;
        this.handleNoteOff(midi, 'Virtual Piano');
      };

      keyEl.addEventListener('pointerdown', startPress);
      keyEl.addEventListener('pointerup', stopPress);
      keyEl.addEventListener('pointerleave', stopPress);
      keyEl.addEventListener('pointercancel', stopPress);

      this.pianoContainer.appendChild(keyEl);
    }
  }

  setKeyActive(midi, active, velocity = 100) {
    const keyEl = this.pianoContainer.querySelector(`[data-midi="${midi}"]`);
    if (!keyEl) return;

    if (active) {
      keyEl.classList.add('active');
      const isTreble = midi >= 60;
      keyEl.style.setProperty('--press-glow', isTreble ? 'rgba(56, 189, 248, 0.9)' : 'rgba(168, 85, 247, 0.9)');
    } else {
      keyEl.classList.remove('active');
    }
  }

  updatePianoKeyLabels() {
    const qwertyHints = {};
    for (const [code, offset] of Object.entries(this.midi.keyMap)) {
      const midi = (this.midi.keyboardOctave + 1) * 12 + offset;
      const keyChar = code.replace('Key', '').replace('Semicolon', ';').replace('Quote', "'");
      qwertyHints[midi] = keyChar;
    }

    const keys = this.pianoContainer.querySelectorAll('.piano-key');
    keys.forEach(key => {
      const midi = parseInt(key.dataset.midi, 10);
      const info = MusicTheory.getNoteInfo(midi, this.preferFlats);
      const noteNameEl = key.querySelector('.key-note-name');
      const hintEl = key.querySelector('.key-qwerty-hint');

      if (noteNameEl) noteNameEl.innerText = info.displayName;
      if (hintEl) hintEl.innerText = qwertyHints[midi] || '';

      if (this.showKeyLabels === 'none') {
        key.classList.add('hide-labels');
      } else if (this.showKeyLabels === 'qwerty') {
        key.classList.remove('hide-labels');
        key.classList.add('qwerty-only');
      } else {
        key.classList.remove('hide-labels', 'qwerty-only');
      }
    });
  }

  updateOctaveDisplay() {
    if (this.octaveDisplay) {
      this.octaveDisplay.innerText = `C${this.midi.keyboardOctave}`;
    }
    this.updatePianoKeyLabels();
  }

  setKeyboardVisible(visible) {
    this.showKeyboard = !!visible;
    localStorage.setItem('midiscope_show_keyboard', this.showKeyboard ? 'true' : 'false');
    const pianoSec = document.getElementById('piano-keyboard-section');
    const toggleKb = document.getElementById('toggle-show-keyboard');
    const quickText = document.getElementById('quick-keyboard-text');
    const quickBtn = document.getElementById('btn-quick-toggle-keyboard');
    const staffCard = document.querySelector('.staff-card');

    if (pianoSec) {
      if (this.showKeyboard) {
        pianoSec.classList.remove('hidden');
      } else {
        pianoSec.classList.add('hidden');
      }
    }
    if (toggleKb) {
      toggleKb.checked = this.showKeyboard;
    }
    if (quickText) {
      quickText.innerText = this.showKeyboard ? 'Keys' : 'Show Keys';
    }
    if (quickBtn) {
      if (this.showKeyboard) {
        quickBtn.classList.add('bg-sky-500/20', 'text-sky-300', 'border-sky-500/40');
        quickBtn.classList.remove('bg-slate-800', 'text-slate-200', 'border-slate-700');
      } else {
        quickBtn.classList.remove('bg-sky-500/20', 'text-sky-300', 'border-sky-500/40');
        quickBtn.classList.add('bg-slate-800', 'text-slate-200', 'border-slate-700');
      }
    }
    if (staffCard) {
      staffCard.classList.toggle('keyboard-hidden', !this.showKeyboard);
    }
    if (this.notation) {
      setTimeout(() => this.notation.resize(), 60);
    }
  }

  setMidiStreamVisible(visible) {
    this.showMidiStream = !!visible;
    localStorage.setItem('midiscope_show_events', this.showMidiStream ? 'true' : 'false');
    const inspector = document.getElementById('midi-event-inspector-section');
    const quickEventsBtn = document.getElementById('btn-quick-toggle-events');
    const settingsToggle = document.getElementById('toggle-show-midi-stream');

    if (inspector) {
      if (this.showMidiStream) {
        inspector.classList.remove('hidden');
        inspector.open = true;
      } else {
        inspector.classList.add('hidden');
      }
    }
    if (quickEventsBtn) {
      if (this.showMidiStream) {
        quickEventsBtn.classList.add('bg-sky-500/20', 'text-sky-300', 'border-sky-500/40');
        quickEventsBtn.classList.remove('bg-slate-800', 'text-slate-200', 'border-slate-700');
      } else {
        quickEventsBtn.classList.remove('bg-sky-500/20', 'text-sky-300', 'border-sky-500/40');
        quickEventsBtn.classList.add('bg-slate-800', 'text-slate-200', 'border-slate-700');
      }
    }
    if (settingsToggle) {
      settingsToggle.checked = this.showMidiStream;
    }
  }

  setStaffLayout(layout) {
    if (layout === 'waterfall') {
      this.staffLayout = 'waterfall';
    } else if (layout === 'horizontal') {
      this.staffLayout = 'horizontal';
    } else {
      this.staffLayout = 'vertical';
    }
    localStorage.setItem('midiscope_staff_layout', this.staffLayout);
    const select1 = document.getElementById('select-staff-layout');
    const select2 = document.getElementById('settings-staff-layout');
    const selectView = document.getElementById('select-view-mode');
    if (select1 && select1.value !== this.staffLayout) select1.value = this.staffLayout;
    if (select2 && select2.value !== this.staffLayout) select2.value = this.staffLayout;
    if (this.staffLayout === 'waterfall') {
      if (selectView && selectView.value !== 'waterfall') selectView.value = 'waterfall';
    } else {
      if (selectView && selectView.value === 'waterfall') selectView.value = 'live';
    }

    const staffCard = document.querySelector('.staff-card');
    if (staffCard) {
      staffCard.classList.toggle('vertical-staves', this.staffLayout === 'vertical');
      staffCard.classList.toggle('waterfall-mode', this.staffLayout === 'waterfall');
    }

    if (this.notation) {
      this.notation.setOption('staffLayout', this.staffLayout);
      if (this.staffLayout === 'waterfall') {
        this.notation.setOption('mode', 'waterfall');
      } else {
        if (this.appMode === 'practice' || this.trainer?.currentMelody) {
          this.notation.setOption('mode', 'practice');
        } else {
          this.notation.setOption('mode', selectView?.value || 'live');
        }
      }
      setTimeout(() => this.notation.resize(), 60);
    }
  }

  setTheme(theme) {
    this.theme = theme === 'light' ? 'light' : 'dark';
    localStorage.setItem('midiscope_theme', this.theme);
    const html = document.documentElement;
    const isDark = this.theme === 'dark';
    html.classList.toggle('dark', isDark);
    html.classList.toggle('light', !isDark);
    const btnTheme = document.getElementById('btn-toggle-theme');
    if (btnTheme) {
      btnTheme.innerHTML = isDark ? '🌙' : '☀️';
      btnTheme.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
    if (this.notation) {
      this.notation.setOption('theme', this.theme);
      setTimeout(() => this.notation.resize(), 60);
    }
  }

  populateDeviceList(devices) {
    this.deviceSelect.innerHTML = '';

    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.innerText = `All Connected Inputs (${devices.length})`;
    this.deviceSelect.appendChild(allOpt);

    devices.forEach(dev => {
      const opt = document.createElement('option');
      opt.value = dev.id;
      opt.innerText = `${dev.name} (${dev.manufacturer})`;
      this.deviceSelect.appendChild(opt);
    });

    if (devices.length > 0) {
      this.deviceSelect.value = 'all';
    }
  }

  updateMidiStatus(status) {
    if (!this.midiStatusBadge) return;

    if (!status.supported) {
      this.midiStatusBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block mr-1.5"></span> Virtual Input Only`;
      this.midiStatusBadge.className = 'status-badge bg-amber-500/10 text-amber-400 border border-amber-500/30';
      this.midiStatusBadge.title = status.message;
    } else if (status.connected) {
      this.midiStatusBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse"></span> ${status.deviceCount} MIDI Device(s) Ready`;
      this.midiStatusBadge.className = 'status-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      this.midiStatusBadge.title = status.message;
    } else {
      this.midiStatusBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block mr-1.5"></span> No MIDI Device Connected`;
      this.midiStatusBadge.className = 'status-badge bg-slate-500/10 text-slate-400 border border-slate-500/30';
      this.midiStatusBadge.title = 'Plug in a USB MIDI keyboard or use your computer keys.';
    }
  }

  addMidiLogEntry(entry) {
    if (!this.midiLogContainer) return;

    if (!this.midiLogHistory) {
      this.midiLogHistory = [];
    }
    this.midiLogHistory.push({
      timestamp: entry.timestamp || new Date().toLocaleTimeString(),
      type: entry.type || 'Event',
      source: entry.source || 'MIDI In',
      detail: entry.detail || '',
      raw: entry.raw || ''
    });
    // Keep last 500 events in memory for comprehensive debugging export
    if (this.midiLogHistory.length > 500) {
      this.midiLogHistory.shift();
    }

    // Remove placeholder message if present
    const placeholder = this.midiLogContainer.querySelector('.italic');
    if (placeholder) {
      placeholder.remove();
    }

    const isNoteOn = entry.type === 'Note On';
    const isNoteOff = entry.type === 'Note Off';
    const isControl = entry.type.includes('CC') || entry.type.includes('Pedal') || entry.type.includes('Breath') || entry.type.includes('Pressure') || entry.type.includes('Bend');

    let badgeClass = 'text-sky-400 bg-sky-950/60 border-sky-800/50';
    let detailClass = 'text-slate-200';
    if (isNoteOn) {
      badgeClass = 'text-emerald-300 bg-emerald-950/70 border-emerald-700/60 font-bold';
      detailClass = 'text-emerald-300 font-semibold';
    } else if (isNoteOff) {
      badgeClass = 'text-slate-400 bg-slate-900/60 border-slate-700/40';
      detailClass = 'text-slate-400';
    } else if (isControl) {
      badgeClass = 'text-amber-300 bg-amber-950/60 border-amber-700/50';
      detailClass = 'text-amber-200 font-medium';
    }

    const row = document.createElement('div');
    row.className = 'log-entry flex items-center justify-between text-xs py-1 border-b border-slate-800/60 font-mono hover:bg-slate-900/50 px-1.5 rounded transition-colors';
    row.innerHTML = `
      <div class="flex items-center gap-2 flex-1 min-w-0 pr-2">
        <span class="text-slate-500 text-[11px] w-18 shrink-0">${entry.timestamp || ''}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded border text-center shrink-0 ${badgeClass}">${entry.type}</span>
        <span class="text-slate-400 text-[11px] w-24 truncate shrink-0 hidden sm:inline" title="${entry.source || ''}">${entry.source || ''}</span>
        <span class="truncate flex-1 ${detailClass}">${entry.detail}</span>
      </div>
      <span class="text-slate-500 text-[10px] shrink-0 font-mono pl-2">${entry.raw || ''}</span>
    `;

    this.midiLogContainer.prepend(row);

    // Limit visible DOM rows to prevent DOM performance overhead
    while (this.midiLogContainer.children.length > 60) {
      this.midiLogContainer.removeChild(this.midiLogContainer.lastChild);
    }
  }

  setupRoutineEvents() {
    if (!this.routine) return;

    this.routine.onTick = (progress) => {
      // Update master clock & phase timer
      if (this.routineMasterTimer) {
        const mElapsed = String(Math.floor(progress.totalElapsed / 60)).padStart(2, '0');
        const sElapsed = String(progress.totalElapsed % 60).padStart(2, '0');
        this.routineMasterTimer.innerText = `${mElapsed}:${sElapsed} / 20:00`;
      }
      if (this.routinePhaseTimer) {
        const mPhase = String(Math.floor(progress.phaseRemaining / 60)).padStart(2, '0');
        const sPhase = String(progress.phaseRemaining % 60).padStart(2, '0');
        this.routinePhaseTimer.innerText = `${mPhase}:${sPhase}`;
      }
      if (this.routineMasterProgressBar) {
        this.routineMasterProgressBar.style.width = `${progress.percentTotal}%`;
      }
      if (this.routineStreakCount) {
        this.routineStreakCount.innerText = progress.streak.toString();
      }

      // Update Play/Pause button UI
      if (this.btnRoutinePlayIcon && this.btnRoutinePlayText && this.btnRoutinePlay) {
        if (progress.isRunning) {
          this.btnRoutinePlayIcon.innerText = '⏸️';
          this.btnRoutinePlayText.innerText = 'Pause';
          this.btnRoutinePlay.className = 'px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/30 flex items-center gap-1.5';
        } else {
          this.btnRoutinePlayIcon.innerText = '▶️';
          this.btnRoutinePlayText.innerText = 'Start';
          this.btnRoutinePlay.className = 'px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/30 flex items-center gap-1.5';
        }
      }
    };

    this.routine.onPhaseChange = (phase, progress) => {
      // Update Phase Badge & Title
      if (this.routinePhaseBadge) {
        let partStr = 'Part 1';
        if (phase.blockIndex === 1) {
          partStr = phase.id.includes('thirds') ? 'Part 2' : 'Part 1';
        } else if (phase.blockIndex === 2) {
          partStr = phase.type === 'audit' ? 'Part 2' : 'Part 1';
        } else if (phase.blockIndex === 3) {
          partStr = phase.type === 'take1' ? 'Part 1 (Cold Take)' : (phase.type === 'targeted_fix' ? 'Part 2 (Loop Fix)' : 'Part 3 (Buffered)');
        } else if (phase.blockIndex === 4) {
          partStr = `Flash ${phase.lineIndex !== undefined ? (phase.lineIndex + 1) + '/3' : 'Reading'}`;
        }
        this.routinePhaseBadge.innerText = `Block ${phase.blockIndex} • ${partStr}`;
      }
      if (this.routinePhaseTitle) {
        this.routinePhaseTitle.innerText = phase.title;
      }
      if (this.routinePhaseInstructions) {
        this.routinePhaseInstructions.innerText = phase.methodology;
      }

      // Reset Per-Iteration Round Feedback and History on phase change
      if (this.routineRoundBanner) {
        this.routineRoundBanner.classList.add('hidden');
      }
      if (this.routineRoundHistory) {
        this.routineRoundHistory.innerHTML = '';
      }
      this.notation?.resetScoreToBeginning();
      this.scrollToStaff();

      // Update 4-Block Pills
      for (let b = 1; b <= 4; b++) {
        const pill = document.getElementById(`block-tab-${b}`);
        if (!pill) continue;
        pill.classList.remove('active', 'completed');
        if (b === phase.blockIndex) {
          pill.classList.add('active');
        } else if (b < phase.blockIndex) {
          pill.classList.add('completed');
        }
      }

      // Toggle Context Panels
      if (this.routineGhostFingeringBox) {
        if (phase.type === 'audit') {
          this.routineGhostFingeringBox.classList.remove('hidden');
          this.resetGhostFingeringBoxState();
        } else {
          this.routineGhostFingeringBox.classList.add('hidden');
        }
      }
      if (this.ghostFingeringAlert && phase.type !== 'audit') {
        this.ghostFingeringAlert.classList.add('hidden');
        if (this.ghostFingeringTimeout) {
          clearTimeout(this.ghostFingeringTimeout);
          this.ghostFingeringTimeout = null;
        }
      }

      if (this.routineRhythmTapBox) {
        if (phase.type === 'rhythm_tap') {
          this.routineRhythmTapBox.classList.remove('hidden');
          const tapMidi = (phase.exercise?.notes?.[0]?.midi) || 60;
          const noteInfo = MusicTheory.getNoteInfo(tapMidi, this.preferFlats);
          if (this.routineTapFeedback) {
            this.routineTapFeedback.innerText = `Tap ${noteInfo.fullName} (or any key) on beat!`;
            this.routineTapFeedback.style.color = '#38bdf8';
          }
          const tapLabel = document.getElementById('routine-tap-btn-label');
          if (tapLabel) {
            tapLabel.innerText = `Tap Rhythm (${noteInfo.fullName} / Space)`;
          }
        } else {
          this.routineRhythmTapBox.classList.add('hidden');
        }
      }

      if (this.routineLookaheadBox) {
        if (phase.lookahead) {
          this.routineLookaheadBox.classList.remove('hidden');
        } else {
          this.routineLookaheadBox.classList.add('hidden');
        }
      }

      if (this.routineFlashBox) {
        if (phase.type === 'flash') {
          this.routineFlashBox.classList.remove('hidden');
        } else {
          this.routineFlashBox.classList.add('hidden');
        }
      }

      // Sync key signature selector in toolbar
      const keySigSelect = document.getElementById('select-key-signature');
      if (keySigSelect && phase.exercise && phase.exercise.key) {
        keySigSelect.value = phase.exercise.key;
        if (typeof this.notation.setKeySignature === 'function') {
          this.notation.setKeySignature(phase.exercise.key);
        } else {
          this.notation.setOption('keySignature', phase.exercise.key);
        }
      }

      // Update practice target hint
      this.updateTargetKeyHint();

      // Update notation renderer state
      if (this.notation && this.trainer.currentMelody) {
        this.notation.setPracticeState({
          melody: this.trainer.currentMelody,
          noteIndex: this.trainer.noteIndex,
          noteResults: this.trainer.noteResults,
          isFinished: this.trainer.isFinished,
          mode: this.trainer.mode
        });
      }
    };

    this.routine.onTapFeedback = (feedback) => {
      if (this.routineTapFeedback) {
        this.routineTapFeedback.innerText = feedback.label;
        this.routineTapFeedback.style.color = feedback.color;
      }
    };

    this.routine.onFlashCountdown = (seconds, phase) => {
      if (this.routineFlashCountdown) {
        this.routineFlashCountdown.innerText = seconds.toString();
      }
    };

    // Subphase Round Iteration Completion & Scoring Callbacks
    this.routine.onRoundComplete = (roundSummary, allRounds, countdown) => {
      // 1. Show Round Completion Banner
      if (this.routineRoundBanner) {
        this.routineRoundBanner.classList.remove('hidden');
      }
      if (this.roundBannerStars) {
        this.roundBannerStars.innerText = '⭐'.repeat(roundSummary.stars);
      }
      if (this.roundBannerTitle) {
        this.roundBannerTitle.innerText = `Round ${roundSummary.round}: ${roundSummary.accuracy}% Accuracy`;
      }
      if (this.roundBannerTime) {
        this.roundBannerTime.innerText = `(${roundSummary.durationSeconds}s)`;
      }
      if (this.roundBannerCountdown) {
        const mins = Math.floor(roundSummary.remainingSeconds / 60);
        const secs = roundSummary.remainingSeconds % 60;
        this.roundBannerCountdown.innerText = `Restarting Round ${roundSummary.round + 1} in ${countdown}s... (${mins}:${secs.toString().padStart(2, '0')} left)`;
      }

      // 2. Add round history pill badge
      if (this.routineRoundHistory) {
        const pill = document.createElement('div');
        pill.className = 'px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 shadow-sm';
        pill.innerHTML = `
          <span class="text-white font-mono">Round ${roundSummary.round}:</span>
          <span class="font-extrabold text-emerald-300">${roundSummary.accuracy}%</span>
          <span class="text-amber-400 text-[9px]">${'⭐'.repeat(roundSummary.stars)}</span>
          <span class="text-slate-400 font-mono text-[9px]">(${roundSummary.durationSeconds}s)</span>
        `;
        this.routineRoundHistory.appendChild(pill);
      }

      // 3. Show celebration toast
      this.showToast(`✨ Round ${roundSummary.round} Complete: ${roundSummary.accuracy}% Accuracy! (${roundSummary.durationSeconds}s)`, 'success');
    };

    this.routine.onRoundTick = (roundSummary, countdown, remainingSec) => {
      if (countdown > 0) {
        if (this.roundBannerCountdown) {
          const mins = Math.floor(remainingSec / 60);
          const secs = remainingSec % 60;
          this.roundBannerCountdown.innerText = `Restarting Round ${roundSummary.round + 1} in ${countdown}s... (${mins}:${secs.toString().padStart(2, '0')} left)`;
        }
      } else {
        if (this.routineRoundBanner) {
          this.routineRoundBanner.classList.add('hidden');
        }
      }
    };

    this.routine.onSubPhaseTimeout = (stats, nextPhase, currentPhase) => {
      this.openSubPhaseCompleteModal(stats, nextPhase, currentPhase);
    };

    this.routine.onComplete = (summary) => {
      this.openRoutineCompleteModal(summary);
    };
  }

  triggerGhostFingeringAlert(midi = null) {
    // 1. Show floating on-screen alert banner over staff
    if (this.ghostFingeringAlert) {
      this.ghostFingeringAlert.classList.remove('hidden');
      if (this.ghostFingeringTimeout) {
        clearTimeout(this.ghostFingeringTimeout);
      }
      this.ghostFingeringTimeout = setTimeout(() => {
        this.ghostFingeringAlert?.classList.add('hidden');
        this.resetGhostFingeringBoxState();
      }, 3500);
    }

    // 2. Pulse the action container badge
    if (this.routineGhostFingeringBox) {
      this.routineGhostFingeringBox.classList.remove('bg-amber-500/15', 'border-amber-500/40');
      this.routineGhostFingeringBox.classList.add('bg-rose-500/25', 'border-rose-500/60');
      const statusEl = document.getElementById('routine-ghost-fingering-status');
      if (statusEl) {
        const noteName = midi !== null ? ` (${MusicTheory.getNoteInfo(midi, this.preferFlats).fullName})` : '';
        statusEl.innerHTML = `<span class="text-rose-300 font-extrabold">⚠️ MIDI Detected${noteName}! Don't play — silent only!</span>`;
      }
    }

    // 3. Update practice feedback text if available
    if (this.practiceFeedbackText) {
      this.practiceFeedbackText.innerHTML = '<span class="text-rose-400 font-bold">🤫 Ghost-Fingering: Do NOT play notes! (Silent touch only)</span>';
    }
  }

  scrollToStaff() {
    const target = document.getElementById('routine-action-container') || document.querySelector('.staff-card') || document.getElementById('staff-canvas');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  resetGhostFingeringBoxState() {
    if (this.routineGhostFingeringBox) {
      this.routineGhostFingeringBox.classList.remove('bg-rose-500/25', 'border-rose-500/60');
      this.routineGhostFingeringBox.classList.add('bg-amber-500/15', 'border-amber-500/40');
      const statusEl = document.getElementById('routine-ghost-fingering-status');
      if (statusEl) {
        statusEl.innerHTML = '<span class="text-amber-300 font-semibold">Silent Practice (Do Not Play)</span>';
      }
    }
    if (this.practiceFeedbackText && this.routine?.getCurrentPhase()?.type === 'audit') {
      this.practiceFeedbackText.innerText = 'Silently pre-touch keys on your instrument to feel intervals';
    }
  }

  openRoutineCompleteModal(summary) {
    if (!this.modalRoutineComplete) return;
    if (this.routineSummaryStreak) {
      this.routineSummaryStreak.innerText = `${summary.streak} Day${summary.streak === 1 ? '' : 's'}`;
    }
    if (this.routineSummaryNotes) {
      this.routineSummaryNotes.innerText = summary.notesPlayed.toString();
    }
    if (this.routineSummaryAccuracy) {
      this.routineSummaryAccuracy.innerText = `${summary.accuracy}%`;
    }
    if (this.routineSummaryRecoveries) {
      this.routineSummaryRecoveries.innerText = summary.recoveries.toString();
    }
    if (this.routineSummaryRecoveryPts) {
      this.routineSummaryRecoveryPts.innerText = `+${summary.recoveryPoints}`;
    }
    this.modalRoutineComplete.classList.add('open');
  }

  /**
   * Sub-Phase Complete Transition Modal Controller
   */
  openSubPhaseCompleteModal(stats, nextPhase, currentPhase) {
    if (!this.modalPhaseComplete) return;

    // Ensure any open guide modal is dismissed
    this.closeExerciseGuide();

    // 1. Header context
    if (this.phaseCompleteBadge) {
      const blockNum = stats.blockIndex || (currentPhase?.blockIndex || 1);
      let partStr = '';
      if (stats.phaseTitle?.includes('Part 1') || stats.phaseType === 'awkward' || stats.phaseType === 'take1') {
        partStr = 'Part 1';
      } else if (stats.phaseTitle?.includes('Part 2') || stats.phaseType === 'thirds' || stats.phaseType === 'targeted_fix') {
        partStr = 'Part 2';
      } else if (stats.phaseTitle?.includes('Part 3') || stats.phaseType === 'take2') {
        partStr = 'Part 3';
      } else if (stats.phaseType === 'flash') {
        partStr = `Flash ${stats.phaseIndex !== undefined ? (stats.phaseIndex - 6) + '/3' : ''}`;
      }
      this.phaseCompleteBadge.innerText = partStr ? `Block ${blockNum} • ${partStr} Complete` : `Block ${blockNum} Complete`;
    }
    if (this.phaseCompleteTimeBadge) {
      const m = Math.floor((stats.elapsedSeconds || 0) / 60);
      const s = String((stats.elapsedSeconds || 0) % 60).padStart(2, '0');
      this.phaseCompleteTimeBadge.innerText = `${m}:${s} Elapsed`;
    }
    if (this.phaseCompleteTitle) {
      this.phaseCompleteTitle.innerText = stats.phaseTitle || currentPhase?.title || 'Exercise Complete';
    }

    // 2. Scorecard stats
    if (this.phaseCompleteAccuracy) {
      this.phaseCompleteAccuracy.innerText = `${stats.accuracy}%`;
      this.phaseCompleteAccuracy.className = `text-3xl font-black font-mono ${stats.accuracy >= 90 ? 'text-emerald-400' : (stats.accuracy >= 75 ? 'text-amber-400' : 'text-rose-400')}`;
    }
    if (this.phaseCompleteStars) {
      this.phaseCompleteStars.innerText = '⭐'.repeat(stats.stars || 1);
    }
    if (this.phaseCompleteRounds) {
      const count = stats.roundsCount || (stats.rounds ? stats.rounds.length : 1);
      this.phaseCompleteRounds.innerText = `${count} Loop${count === 1 ? '' : 's'}`;
    }
    if (this.phaseCompleteNotes) {
      this.phaseCompleteNotes.innerText = `${stats.totalNotes || 0} Notes`;
    }
    if (this.phaseCompleteMistakes) {
      if (stats.mistakes === 0) {
        this.phaseCompleteMistakes.innerText = '0 Errors 🎯';
        this.phaseCompleteMistakes.className = 'text-base font-bold text-emerald-300 font-mono mt-0.5';
      } else {
        this.phaseCompleteMistakes.innerText = `${stats.mistakes} Error${stats.mistakes === 1 ? '' : 's'}`;
        this.phaseCompleteMistakes.className = 'text-base font-bold text-amber-300 font-mono mt-0.5';
      }
    }

    // 3. Round Progression Pills
    if (this.phaseCompleteRoundsList) {
      this.phaseCompleteRoundsList.innerHTML = '';
      const rounds = stats.rounds || [];
      if (rounds.length > 0) {
        if (this.phaseCompleteRoundsContainer) {
          this.phaseCompleteRoundsContainer.classList.remove('hidden');
        }
        if (this.phaseCompleteRoundsCount) {
          this.phaseCompleteRoundsCount.innerText = `${rounds.length} completed`;
        }
        rounds.forEach((r) => {
          const pill = document.createElement('div');
          pill.className = 'px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 shadow-sm';
          pill.innerHTML = `
            <span class="text-white font-mono">Round ${r.round}:</span>
            <span class="font-extrabold ${r.accuracy >= 90 ? 'text-emerald-300' : 'text-amber-300'}">${r.accuracy}%</span>
            <span class="text-amber-400 text-[9px]">${'⭐'.repeat(r.stars || 1)}</span>
            <span class="text-slate-400 font-mono text-[9px]">(${r.durationSeconds}s)</span>
          `;
          this.phaseCompleteRoundsList.appendChild(pill);
        });
      } else {
        if (this.phaseCompleteRoundsContainer) {
          this.phaseCompleteRoundsContainer.classList.add('hidden');
        }
      }
    }

    // 4. Up Next Exercise Preview Card
    if (nextPhase) {
      if (this.phaseCompleteNextCard) this.phaseCompleteNextCard.classList.remove('hidden');
      if (this.phaseCompleteNextTitle) {
        this.phaseCompleteNextTitle.innerText = `Block ${nextPhase.blockIndex} • ${nextPhase.title}`;
      }
      if (this.phaseCompleteNextMeta) {
        const keyName = nextPhase.exercise?.key || this.routine?.targetKey || 'C Major';
        const mins = Math.round((nextPhase.durationSeconds || 120) / 60);
        this.phaseCompleteNextMeta.innerText = `${keyName} • ${nextPhase.bpm || 60} BPM • ${mins} min`;
      }
      if (this.phaseCompleteNextDesc) {
        this.phaseCompleteNextDesc.innerText = nextPhase.objective || nextPhase.methodology || 'Continue to the next sight-reading exercise.';
      }
      if (this.btnPhaseCompleteContinue) {
        this.btnPhaseCompleteContinue.innerHTML = `
          <span>Continue to Next Exercise</span>
          <span class="text-base">⏭️</span>
          <span class="text-[10px] font-normal px-1.5 py-0.5 rounded bg-black/20 text-slate-900 border border-black/10">Space ↵</span>
        `;
      }
    } else {
      // All blocks completed
      if (this.phaseCompleteNextCard) this.phaseCompleteNextCard.classList.remove('hidden');
      if (this.phaseCompleteNextTitle) {
        this.phaseCompleteNextTitle.innerText = '🏆 Curriculum Complete!';
      }
      if (this.phaseCompleteNextMeta) {
        this.phaseCompleteNextMeta.innerText = '20-Minute Master Routine Finished';
      }
      if (this.phaseCompleteNextDesc) {
        this.phaseCompleteNextDesc.innerText = 'You have mastered all four blocks of daily deliberate sight-reading training.';
      }
      if (this.btnPhaseCompleteContinue) {
        this.btnPhaseCompleteContinue.innerHTML = `
          <span>View Full Routine Summary</span>
          <span class="text-base">🏆</span>
          <span class="text-[10px] font-normal px-1.5 py-0.5 rounded bg-black/20 text-slate-900 border border-black/10">Space ↵</span>
        `;
      }
    }

    // 5. Open modal
    this.modalPhaseComplete.classList.add('open');
  }

  closeSubPhaseCompleteModal() {
    this.modalPhaseComplete?.classList.remove('open');
  }

  /**
   * Exercise & Melody Guide Modal Controller
   */
  openExerciseGuide(index = null) {
    if (!this.modalExerciseGuide) return;
    if (index !== null && index >= 0) {
      this.currentGuideSubphaseIndex = index;
    } else if (this.appMode === 'routine' && this.routine) {
      this.currentGuideSubphaseIndex = this.routine.currentSubPhaseIndex || 0;
    } else {
      this.currentGuideSubphaseIndex = 0;
    }
    this.renderExerciseGuideContent(this.currentGuideSubphaseIndex);
    this.modalExerciseGuide.classList.add('open');
  }

  closeExerciseGuide() {
    this.modalExerciseGuide?.classList.remove('open');
  }

  renderExerciseGuideContent(index) {
    const total = this.routine?.subPhases?.length || 10;
    const safeIndex = Math.max(0, Math.min(total - 1, index));
    this.currentGuideSubphaseIndex = safeIndex;

    const phase = this.routine?.subPhases?.[safeIndex];
    if (phase) {
      if (this.guideModalBadge) {
        this.guideModalBadge.innerText = `BLOCK ${phase.blockIndex} • ${phase.blockName ? phase.blockName.toUpperCase() : 'ROUTINE'}`;
      }
      if (this.guideModalMeta) {
        const keyName = phase.exercise?.key || this.routine?.targetKey || 'C Major';
        const mins = Math.round((phase.durationSeconds || 120) / 60);
        this.guideModalMeta.innerText = `${keyName} • ${phase.bpm || 60} BPM • ${mins} min (${phase.type.toUpperCase()})`;
      }
      if (this.guideModalTitle) {
        this.guideModalTitle.innerText = phase.title;
      }
      if (this.guideModalObjective) {
        this.guideModalObjective.innerText = phase.objective || phase.methodology || 'Targeting sight-reading agility and accurate pitch matching.';
      }
      if (this.guideModalNeuroscience) {
        this.guideModalNeuroscience.innerText = phase.neuroscience || 'Deliberate practice with immediate feedback trains neural pathways for fluent decoding.';
      }
      if (this.guideModalHowTo) {
        if (Array.isArray(phase.howTo)) {
          this.guideModalHowTo.innerHTML = phase.howTo.map((step, idx) => `
            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">${idx + 1}</span>
              <span class="text-slate-200 text-xs sm:text-sm leading-relaxed">${step}</span>
            </div>
          `).join('');
        } else {
          this.guideModalHowTo.innerHTML = `<div class="text-slate-200 text-xs sm:text-sm leading-relaxed">${phase.methodology || ''}</div>`;
        }
      }
      if (this.guideModalPitfalls) {
        this.guideModalPitfalls.innerText = phase.pitfalls || 'Rushing ahead or playing with excess muscle tension.';
      }
      if (this.guideModalProTip) {
        this.guideModalProTip.innerText = phase.proTip || 'Breathe calmly, keep eyes moving ahead of your hands.';
      }
    } else {
      const melody = this.trainer?.currentMelody;
      if (this.guideModalBadge) this.guideModalBadge.innerText = `PRACTICE • ${melody?.difficulty || 'GENERAL'}`;
      if (this.guideModalMeta) this.guideModalMeta.innerText = `${melody?.key || 'C Major'} • ${this.trainer?.bpm || 96} BPM`;
      if (this.guideModalTitle) this.guideModalTitle.innerText = melody?.title || 'Sight-Reading Exercise';
      if (this.guideModalObjective) this.guideModalObjective.innerText = melody?.description || 'Read accurately in rhythm.';
      if (this.guideModalNeuroscience) this.guideModalNeuroscience.innerText = 'Sight-reading fluency develops when rhythmic pulse takes precedence over stopping to fix mistakes.';
      if (this.guideModalHowTo) {
        this.guideModalHowTo.innerHTML = `
          <div class="flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
            <span class="text-slate-200 text-xs sm:text-sm leading-relaxed">Check the clef and key signature before playing note 1.</span>
          </div>
          <div class="flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
            <span class="text-slate-200 text-xs sm:text-sm leading-relaxed">Keep moving forward with the metronome pulse—never restart!</span>
          </div>
        `;
      }
      if (this.guideModalPitfalls) this.guideModalPitfalls.innerText = 'Looking down at your fingers or pausing when a mistake occurs.';
      if (this.guideModalProTip) this.guideModalProTip.innerText = 'Keep your eyes anchored 1 to 2 beats ahead of where your hands are playing.';
    }
  }

  setupUIEventListeners() {
    // Mode Switcher Tabs
    this.tabFreePlay?.addEventListener('click', () => {
      this.setAppMode('freeplay');
    });
    this.tabPractice?.addEventListener('click', () => {
      this.setAppMode('practice');
    });
    this.tabRoutine?.addEventListener('click', () => {
      this.setAppMode('routine');
    });

    // Routine Key Selector
    this.routineKeySelect?.addEventListener('change', (e) => {
      this.routine?.setTargetKey(e.target.value);
    });

    // Routine Player Buttons
    this.btnRoutinePlay?.addEventListener('click', () => {
      this.routine?.togglePlay();
    });
    this.btnRoutinePrev?.addEventListener('click', () => {
      this.routine?.prevSubPhase();
    });
    this.btnRoutineSkip?.addEventListener('click', () => {
      this.routine?.skipSubPhase();
    });
    this.btnRoutineReset?.addEventListener('click', () => {
      this.routine?.reset();
    });
    this.btnRoutineRestartExercise?.addEventListener('click', () => {
      this.notation?.resetScoreToBeginning();
      this.routine?.restartCurrentSubPhase();
      this.scrollToStaff();
    });
    this.btnRoutineFinishExercise?.addEventListener('click', () => {
      this.routine?.finishCurrentSubPhaseEarly();
    });

    // Routine Rhythm Tap Button
    this.btnRoutineTap?.addEventListener('click', () => {
      const phase = this.routine?.getCurrentPhase();
      if (phase && phase.type === 'rhythm_tap') {
        const tapMidi = this.trainer?.expectedTapMidi || this.trainer?.getCurrentTargetNote()?.midi || 60;
        this.handleNoteOn(tapMidi, 100);
        setTimeout(() => this.handleNoteOff(tapMidi), 60);
      } else {
        this.routine?.registerRhythmTap();
      }
    });

    // Completion modal Done button
    this.btnRoutineCompleteDone?.addEventListener('click', () => {
      this.modalRoutineComplete?.classList.remove('open');
    });
    this.modalRoutineComplete?.addEventListener('click', (e) => {
      if (e.target === this.modalRoutineComplete) this.modalRoutineComplete.classList.remove('open');
    });

    // Sub-Phase Transition Modal Listeners
    this.btnPhaseCompleteContinue?.addEventListener('click', () => {
      this.closeSubPhaseCompleteModal();
      this.notation?.resetScoreToBeginning();
      this.routine?.continueToNextSubPhase();
      this.scrollToStaff();
    });

    this.btnPhaseCompleteRepeat?.addEventListener('click', () => {
      this.closeSubPhaseCompleteModal();
      this.notation?.resetScoreToBeginning();
      this.routine?.repeatCurrentSubPhase();
      this.scrollToStaff();
    });

    this.btnPhaseCompleteGuide?.addEventListener('click', () => {
      this.closeSubPhaseCompleteModal();
      this.openExerciseGuide(this.routine?.currentSubPhaseIndex || 0);
    });

    this.modalPhaseComplete?.addEventListener('click', (e) => {
      if (e.target === this.modalPhaseComplete) {
        this.closeSubPhaseCompleteModal();
      }
    });

    // Spacebar listener for Rhythm Tap / Pause in Routine Mode
    window.addEventListener('keydown', (e) => {
      const tag = e.target.tagName;
      const isInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

      // Sub-Phase Complete Modal Shortcut: Space / Enter advances to next exercise
      if (this.modalPhaseComplete?.classList.contains('open')) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          this.btnPhaseCompleteContinue?.click();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeSubPhaseCompleteModal();
          return;
        }
      }

      // Guide Modal Shortcut: ? or H toggles the Exercise Guide
      if (!isInput && (e.key === '?' || e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        if (this.modalExerciseGuide?.classList.contains('open')) {
          this.closeExerciseGuide();
        } else {
          this.openExerciseGuide();
        }
        return;
      }

      // Escape key closes Guide Modal
      if (e.key === 'Escape') {
        if (this.modalExerciseGuide?.classList.contains('open')) {
          this.closeExerciseGuide();
          return;
        }
      }

      if (this.appMode === 'routine' && e.code === 'Space') {
        if (!isInput) {
          e.preventDefault();
          const phase = this.routine?.getCurrentPhase();
          if (phase && phase.type === 'rhythm_tap') {
            const tapMidi = this.trainer?.expectedTapMidi || this.trainer?.getCurrentTargetNote()?.midi || 60;
            this.handleNoteOn(tapMidi, 100);
            setTimeout(() => this.handleNoteOff(tapMidi), 60);
          } else {
            this.routine.togglePlay();
          }
        }
      }

      // Universal keyboard shortcuts (K: Toggle Keyboard, M: Metronome, T: Tap Tempo)
      if (!isInput) {
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          this.setKeyboardVisible(!this.showKeyboard);
          this.showToast(this.showKeyboard ? 'Piano keyboard visible.' : 'Piano keyboard hidden.', 'info');
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          this.toggleMasterMetronome();
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          this.registerMasterTapTempo();
        } else if (this.appMode === 'freeplay') {
          if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            this.toggleFreePlayReviewPanel();
          } else if (e.key === '[' || (this.isFreePlayReviewOpen && e.key === 'ArrowLeft')) {
            e.preventDefault();
            this.prevFreePlayMistake();
          } else if (e.key === ']' || (this.isFreePlayReviewOpen && e.key === 'ArrowRight')) {
            e.preventDefault();
            this.nextFreePlayMistake();
          }
        }
      }
    });

    // Exercise Guide Modal Triggers
    this.btnRoutineGuide?.addEventListener('click', () => this.openExerciseGuide());
    this.btnPracticeGuide?.addEventListener('click', () => this.openExerciseGuide());
    this.routinePhaseTitle?.addEventListener('click', () => this.openExerciseGuide());
    this.routinePhaseInstructions?.addEventListener('click', () => this.openExerciseGuide());
    this.btnCloseGuideModal?.addEventListener('click', () => this.closeExerciseGuide());
    this.btnGuideStart?.addEventListener('click', () => {
      this.closeExerciseGuide();
      if (this.appMode === 'routine' && !this.routine?.isRunning) {
        this.routine?.startOrResume();
      }
    });
    this.btnGuidePrev?.addEventListener('click', () => {
      const total = this.routine?.subPhases?.length || 10;
      this.currentGuideSubphaseIndex = (this.currentGuideSubphaseIndex - 1 + total) % total;
      this.renderExerciseGuideContent(this.currentGuideSubphaseIndex);
    });
    this.btnGuideNext?.addEventListener('click', () => {
      const total = this.routine?.subPhases?.length || 10;
      this.currentGuideSubphaseIndex = (this.currentGuideSubphaseIndex + 1) % total;
      this.renderExerciseGuideContent(this.currentGuideSubphaseIndex);
    });
    this.modalExerciseGuide?.addEventListener('click', (e) => {
      if (e.target === this.modalExerciseGuide) this.closeExerciseGuide();
    });

    // Early advance button on round completion banner -> opens transition popup modal
    this.btnRoundAdvanceEarly?.addEventListener('click', () => {
      if (this.routineRoundBanner) {
        this.routineRoundBanner.classList.add('hidden');
      }
      this.routine?.pauseForSubPhaseTransition();
    });

    // 4-Block Curriculum Progress Tabs Direct Navigation
    document.getElementById('block-tab-1')?.addEventListener('click', () => {
      if (this.appMode !== 'routine') this.setAppMode('routine');
      this.routine?.loadSubPhase(0);
    });
    document.getElementById('block-tab-2')?.addEventListener('click', () => {
      if (this.appMode !== 'routine') this.setAppMode('routine');
      this.routine?.loadSubPhase(2);
    });
    document.getElementById('block-tab-3')?.addEventListener('click', () => {
      if (this.appMode !== 'routine') this.setAppMode('routine');
      this.routine?.loadSubPhase(4);
    });
    document.getElementById('block-tab-4')?.addEventListener('click', () => {
      if (this.appMode !== 'routine') this.setAppMode('routine');
      this.routine?.loadSubPhase(7);
    });

    // Melody Trainer controls
    document.getElementById('btn-open-melody-modal')?.addEventListener('click', () => {
      this.openMelodyModal();
    });
    document.getElementById('btn-close-melody-modal')?.addEventListener('click', () => {
      this.closeMelodyModal();
    });

    // Close modal on outside click
    this.modalMelodySelect?.addEventListener('click', (e) => {
      if (e.target === this.modalMelodySelect) this.closeMelodyModal();
    });
    this.modalScorecard?.addEventListener('click', (e) => {
      if (e.target === this.modalScorecard) this.closeScorecard();
    });

    // Export Performance Modal Controls
    this.btnExportPractice?.addEventListener('click', () => {
      this.openExportModal();
    });
    this.btnScoreExport?.addEventListener('click', () => {
      this.openExportModal();
    });
    this.btnCloseExportModal?.addEventListener('click', () => {
      this.closeExportModal();
    });
    this.btnCancelExport?.addEventListener('click', () => {
      this.closeExportModal();
    });
    this.modalExportSession?.addEventListener('click', (e) => {
      if (e.target === this.modalExportSession) this.closeExportModal();
    });
    this.exportFmtMidi?.addEventListener('click', () => {
      this.setExportFormat('midi');
    });
    this.exportFmtMusicXml?.addEventListener('click', () => {
      this.setExportFormat('musicxml');
    });
    document.querySelectorAll('input[name="export-scope"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) this.setExportScope(e.target.value);
      });
    });
    this.btnDownloadExport?.addEventListener('click', () => {
      this.downloadExportFile();
    });
    this.btnCopyAiPrompt?.addEventListener('click', () => {
      this.copyAiPromptToClipboard();
    });

    // Settings Modal
    this.btnOpenSettings?.addEventListener('click', () => {
      this.modalSettings?.classList.add('open');
    });
    this.btnCloseSettings?.addEventListener('click', () => {
      this.modalSettings?.classList.remove('open');
    });
    this.btnSettingsDone?.addEventListener('click', () => {
      this.modalSettings?.classList.remove('open');
    });
    this.modalSettings?.addEventListener('click', (e) => {
      if (e.target === this.modalSettings) this.modalSettings.classList.remove('open');
    });
    this.midiStatusBadge?.addEventListener('click', () => {
      this.modalSettings?.classList.add('open');
    });

    // Piano Octave Pan buttons (Mobile / Touch Friendly)
    const pianoWrapper = document.querySelector('.piano-scroll-wrapper');
    document.getElementById('btn-piano-pan-left')?.addEventListener('click', () => {
      pianoWrapper?.scrollBy({ left: -220, behavior: 'smooth' });
    });
    document.getElementById('btn-piano-pan-right')?.addEventListener('click', () => {
      pianoWrapper?.scrollBy({ left: 220, behavior: 'smooth' });
    });

    // Restart practice
    document.getElementById('btn-restart-practice')?.addEventListener('click', () => {
      this.clearReviewPianoKeys();
      const wasMetronomeRunning = !!(this.trainer?.metronomeEnabled || this.trainer?.metronomeTimer);
      this.trainer.restart();
      if (wasMetronomeRunning && !this.trainer.metronomeTimer) {
        this.trainer.startMetronome();
      }
      this.updateMasterMetronomeUi();
    });

    // Metronome toggle button
    this.btnToggleMetronome?.addEventListener('click', () => {
      this.trainer.toggleMetronome();
    });

    // BPM Stepper buttons
    this.btnBpmMinus?.addEventListener('click', () => {
      this.trainer.setBpm(this.trainer.bpm - 5);
    });
    this.btnBpmPlus?.addEventListener('click', () => {
      this.trainer.setBpm(this.trainer.bpm + 5);
    });

    // Practice mode selection
    document.getElementById('select-practice-mode')?.addEventListener('change', (e) => {
      const newMode = e.target.value;
      if (newMode === 'first_read' && this.trainer.isMelodyFirstReadLocked(this.trainer.currentMelody?.id)) {
        const rec = this.trainer.getFirstReadRecord(this.trainer.currentMelody.id);
        this.showToast(`🔒 "${this.trainer.currentMelody.title}" has already been completed in First-Read (${rec.sightReadingScore || rec.rhythmAccuracy}% on ${rec.dateStr}). Select another melody to challenge First-Read.`, 'warning');
      }
      this.trainer.setMode(newMode);
    });

    // Skip silent analysis early button
    this.btnSkipAnalysis?.addEventListener('click', () => {
      this.trainer.skipSilentAnalysis();
    });

    // Reset First-Read lockouts button in Settings
    this.btnResetFirstRead?.addEventListener('click', () => {
      if (confirm('Reset all First-Read records? You will be able to play all excerpts again as first-read challenges.')) {
        this.trainer.resetFirstReadRecords();
        this.populateMelodyModal();
        this.showToast('First-Read challenge records reset.', 'info');
      }
    });

    // Scorecard modal buttons
    document.getElementById('btn-score-retry')?.addEventListener('click', () => {
      this.closeScorecard();
      this.clearReviewPianoKeys();
      this.trainer.restart();
    });

    document.getElementById('btn-score-next')?.addEventListener('click', () => {
      this.closeScorecard();
      this.clearReviewPianoKeys();
      // Pick next melody in list
      const melodies = this.trainer.melodies;
      const currentIdx = melodies.findIndex(m => m.id === this.trainer.currentMelody.id);
      const nextIdx = (currentIdx + 1) % melodies.length;
      this.trainer.loadMelody(melodies[nextIdx].id);
    });

    // Wind Instrument Mode Toggle
    this.btnToggleWindMode?.addEventListener('click', () => {
      this.setWindMode(!this.windMode);
    });

    // Breath calibration zero button
    document.getElementById('btn-calibrate-breath')?.addEventListener('click', () => {
      this.calibrateBreathZero();
    });

    // Breath cutoff threshold slider
    const cutoffSlider = document.getElementById('breath-cutoff-slider');
    const cutoffDisplay = document.getElementById('breath-cutoff-display');
    if (cutoffSlider) {
      cutoffSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.breathCutoffThreshold = val / 127;
        if (cutoffDisplay) cutoffDisplay.innerText = `${val}`;
      });
    }

    // Device Selection
    this.deviceSelect?.addEventListener('change', (e) => {
      this.midi.selectDevice(e.target.value);
    });

    // Refresh MIDI connection button
    document.getElementById('btn-refresh-midi')?.addEventListener('click', async () => {
      await this.midi.requestAccess();
    });

    // Mode Toggle (Live vs Scrolling vs Rhythm Trainer vs Waterfall)
    const modeSelect = document.getElementById('select-view-mode');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'waterfall') {
          this.setStaffLayout('waterfall');
          if (this.appMode !== 'practice') {
            this.setAppMode('practice');
          }
          this.showToast('🌊 Waterfall Style Active! Play notes as they hit the keyboard.', 'info');
        } else {
          if (this.staffLayout === 'waterfall') {
            this.setStaffLayout('vertical');
          }
          if (this.appMode === 'freeplay') {
            this.notation.setOption('mode', val);
            if (val === 'rhythm_trainer') {
              this.notation.setOption('rhythmTrainerActive', true);
              if (!this.freePlayRhythmTrainer?.isActive) {
                this.btnToggleFreeplayRhythm?.click();
              }
            }
          } else {
            this.notation.setOption('mode', 'practice');
          }
        }
      });
    }

    // Instrument Preset (defaulting to 'none': No Sound for EWI / hardware audio)
    const presetSelect = document.getElementById('select-instrument');
    const presetSelectModal = document.getElementById('select-instrument-modal');

    // Restore saved instrument preset or default to 'none'
    const savedPreset = localStorage.getItem('midisheet_instrument_preset') || 'none';
    this.audio.setPreset(savedPreset);
    if (presetSelect) presetSelect.value = savedPreset;
    if (presetSelectModal) presetSelectModal.value = savedPreset;

    const handlePresetChange = (val) => {
      this.audio.setPreset(val);
      try {
        localStorage.setItem('midisheet_instrument_preset', val);
      } catch (_) {}
      if (presetSelect && presetSelect.value !== val) presetSelect.value = val;
      if (presetSelectModal && presetSelectModal.value !== val) presetSelectModal.value = val;
      if (val === 'none') {
        this.showToast('🔇 App synth muted (using hardware / EWI audio)', 'info');
      } else {
        const option = presetSelect?.querySelector(`option[value="${val}"]`);
        const name = option ? option.innerText.replace(/^[^\w]+/, '') : val;
        this.showToast(`🎹 Sound: ${name}`, 'info');
      }
    };

    presetSelect?.addEventListener('change', (e) => handlePresetChange(e.target.value));
    presetSelectModal?.addEventListener('change', (e) => handlePresetChange(e.target.value));

    // Low Latency Mode Toggle
    this.btnToggleLowLatency?.addEventListener('click', () => {
      this.setLowLatencyMode(!this.audio.lowLatencyMode);
    });

    // Latency Calibration Offset Steppers & Presets
    this.btnCalibMinus?.addEventListener('click', () => {
      this.setLatencyCalibration(this.trainer.latencyCompensationMs - 10);
    });
    this.btnCalibPlus?.addEventListener('click', () => {
      this.setLatencyCalibration(this.trainer.latencyCompensationMs + 10);
    });
    if (this.btnModalCalibMinus && this.btnModalCalibMinus !== this.btnCalibMinus) {
      this.btnModalCalibMinus.addEventListener('click', () => {
        this.setLatencyCalibration(this.trainer.latencyCompensationMs - 10);
      });
    }
    if (this.btnModalCalibPlus && this.btnModalCalibPlus !== this.btnCalibPlus) {
      this.btnModalCalibPlus.addEventListener('click', () => {
        this.setLatencyCalibration(this.trainer.latencyCompensationMs + 10);
      });
    }

    document.querySelectorAll('.btn-calib-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const offset = parseInt(btn.dataset.offset, 10);
        if (!isNaN(offset)) {
          this.setLatencyCalibration(offset);
          this.showToast(`🎯 Latency Offset set to ${offset}ms`, 'info');
        }
      });
    });

    this.btnAutoCalib?.addEventListener('click', () => {
      if (this.trainer.lastRawOffsetMs !== null) {
        const offset = Math.round(this.trainer.lastRawOffsetMs);
        this.setLatencyCalibration(offset);
        this.showToast(`🎯 Auto-Calibrated: Offset locked to ${offset >= 0 ? '+' : ''}${offset}ms`, 'success');
      } else {
        this.showToast('Play a note first to measure your hardware latency!', 'warning');
      }
    });

    // Audio Output Device (Sound Card / Interface)
    if (this.audioOutputSelect) {
      this.audioOutputSelect.addEventListener('change', async (e) => {
        await this.audio.setOutputDevice(e.target.value);
        this.updateLatencyBadge();
      });
    }

    const btnRefreshAudio = document.getElementById('btn-refresh-audio');
    if (btnRefreshAudio) {
      btnRefreshAudio.addEventListener('click', async () => {
        await this.populateAudioOutputDevices(true);
      });
    }

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        this.populateAudioOutputDevices(false);
      });
    }

    // Accidental Preference Toggle (# vs b)
    const toggleAccidental = document.getElementById('toggle-accidentals');
    if (toggleAccidental) {
      toggleAccidental.addEventListener('click', () => {
        this.preferFlats = !this.preferFlats;
        toggleAccidental.innerText = this.preferFlats ? '♭ Flats' : '♯ Sharps';
        this.notation.setOption('preferFlats', this.preferFlats);
        this.updatePianoKeyLabels();
        if (this.appMode === 'freeplay') {
          this.updateChordDisplay();
        }
      });
    }

    // Show Note Names Toggle
    const toggleNoteNames = document.getElementById('toggle-note-names');
    if (toggleNoteNames) {
      toggleNoteNames.addEventListener('change', (e) => {
        this.notation.setOption('showNoteNames', e.target.checked);
      });
    }

    // Key Signature Selector (Free Play & Reference)
    const selectKeySig = document.getElementById('select-key-signature');
    if (selectKeySig) {
      selectKeySig.addEventListener('change', (e) => {
        const key = e.target.value;
        this.notation.setOption('keySignature', key);
        // If the key has flats (e.g. F, Bb, Eb, Ab), auto-prefer flats
        if (key.includes('♭') || key === 'F Major' || key === 'Bb Major' || key === 'Eb Major' || key === 'Ab Major' || key === 'D Minor') {
          this.preferFlats = true;
          this.notation.setOption('preferFlats', true);
          const toggleAcc = document.getElementById('toggle-accidentals');
          if (toggleAcc) toggleAcc.innerText = '♭ Flats';
          this.updatePianoKeyLabels();
        }
        this.reEvaluateFreePlayNotesKeySignature();
        this.showToast(`Key set to ${key}. Scale muscle memory active; deviations trigger Accidental Alert.`, 'info');
      });
    }

    // Interval Contour Ribbon Toggle
    const toggleIntervalContour = document.getElementById('toggle-interval-contour');
    if (toggleIntervalContour) {
      toggleIntervalContour.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        this.notation.setOption('showIntervalContour', enabled);
        this.showToast(enabled ? 'Interval Contours ON: Green (Steps), Orange (Skips/3rds), Purple (Leaps)' : 'Interval Contours OFF', 'info');
      });
    }

    // Accidental Alert Flash Toggle
    const toggleAccidentalAlert = document.getElementById('toggle-accidental-alert');
    if (toggleAccidentalAlert) {
      toggleAccidentalAlert.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        this.notation.setOption('accidentalAlert', enabled);
        this.showToast(enabled ? 'Accidental Alert ON: Luminous warning flash on printed accidentals deviating from key' : 'Accidental Alert OFF', 'info');
      });
    }

    // Decoupled Eye Pacer (+1 Bar) Toggle
    const toggleEyeCursor = document.getElementById('toggle-eye-cursor');
    if (toggleEyeCursor) {
      const savedEye = localStorage.getItem('midisheet_eye_cursor') === 'true';
      toggleEyeCursor.checked = savedEye;
      this.notation.setOption('decoupledEyeCursor', savedEye);

      toggleEyeCursor.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        this.notation.setOption('decoupledEyeCursor', enabled);
        localStorage.setItem('midisheet_eye_cursor', enabled ? 'true' : 'false');
        this.showToast(enabled ? '👁 Eye Pacer (+1 Bar) ON: Visual pacing guide fixed 1 measure ahead of audio' : 'Eye Pacer OFF', 'info');
      });
    }

    // Visual Disrupter / Buffer Training Mode
    const selectDisrupterMode = document.getElementById('select-disrupter-mode');
    if (selectDisrupterMode) {
      const savedDisrupter = localStorage.getItem('midisheet_disrupter_mode') || 'none';
      selectDisrupterMode.value = savedDisrupter;
      this.notation.setOption('disrupterMode', savedDisrupter);

      selectDisrupterMode.addEventListener('change', (e) => {
        const mode = e.target.value;
        this.notation.setOption('disrupterMode', mode);
        localStorage.setItem('midisheet_disrupter_mode', mode);
        if (mode === 'vanishing_bar') {
          this.showToast('🧠 Vanishing Bar ON: Active bar is masked into short-term buffer; look at next bar!', 'info');
        } else if (mode === 'advance_curtain') {
          this.showToast('⛔ Advance Curtain ON: Trailing curtain blocks visual lingering on played notes!', 'info');
        } else {
          this.showToast('Visual Disrupter OFF: Standard notation view.', 'info');
        }
      });
    }

    // Piano Labels Mode
    const selectKeyLabels = document.getElementById('select-key-labels');
    if (selectKeyLabels) {
      selectKeyLabels.addEventListener('change', (e) => {
        this.showKeyLabels = e.target.value;
        this.updatePianoKeyLabels();
      });
    }

    // Piano Keyboard Hide / Show Controls
    document.getElementById('btn-hide-keyboard')?.addEventListener('click', () => {
      this.setKeyboardVisible(false);
      this.showToast('Piano keyboard hidden.', 'info');
    });
    document.getElementById('btn-quick-toggle-keyboard')?.addEventListener('click', () => {
      this.setKeyboardVisible(!this.showKeyboard);
      this.showToast(this.showKeyboard ? 'Piano keyboard shown.' : 'Piano keyboard hidden.', 'info');
    });
    document.getElementById('toggle-show-keyboard')?.addEventListener('change', (e) => {
      this.setKeyboardVisible(e.target.checked);
    });

    // Live MIDI Event Stream Inspector Controls
    document.getElementById('btn-quick-toggle-events')?.addEventListener('click', () => {
      this.setMidiStreamVisible(!this.showMidiStream);
      this.showToast(this.showMidiStream ? 'Live MIDI Event Stream inspector shown.' : 'Live MIDI Event Stream inspector hidden.', 'info');
      if (this.showMidiStream) {
        document.getElementById('midi-event-inspector-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    document.getElementById('btn-close-midi-events')?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.setMidiStreamVisible(false);
      this.showToast('Live MIDI Event Stream inspector hidden.', 'info');
    });
    document.getElementById('toggle-show-midi-stream')?.addEventListener('change', (e) => {
      this.setMidiStreamVisible(e.target.checked);
    });

    // Staff Layout Selector (Vertical 2-Staves vs Horizontal vs Waterfall)
    document.getElementById('select-staff-layout')?.addEventListener('change', (e) => {
      this.setStaffLayout(e.target.value);
      const name = this.staffLayout === 'waterfall' ? '🌊 Waterfall (Falling Notes)' : (this.staffLayout === 'vertical' ? 'Vertical (2 Staves)' : 'Horizontal (Single Staff)');
      this.showToast(`Display layout: ${name}`, 'info');
    });
    document.getElementById('settings-staff-layout')?.addEventListener('change', (e) => {
      this.setStaffLayout(e.target.value);
    });

    // Bass Clef Visibility in Settings
    const bassClefSelect = document.getElementById('settings-bass-clef');
    if (bassClefSelect) {
      bassClefSelect.value = this.showBassClef || 'auto';
      bassClefSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.showBassClef = val;
        localStorage.setItem('midiscope_bass_clef', val);
        if (this.notation) {
          this.notation.setOption('showBassClef', val);
          this.notation.resize();
        }
        this.showToast(`Bass clef: ${val === 'auto' ? 'Auto (hides when unused)' : val === 'never' ? 'Never show' : 'Always show'}`, 'info');
      });
    }

    // Octave Up / Down
    document.getElementById('btn-octave-down')?.addEventListener('click', () => {
      this.midi.setKeyboardOctave(this.midi.keyboardOctave - 1);
      this.updateOctaveDisplay();
      this.updateTargetKeyHint();
    });
    document.getElementById('btn-octave-up')?.addEventListener('click', () => {
      this.midi.setKeyboardOctave(this.midi.keyboardOctave + 1);
      this.updateOctaveDisplay();
      this.updateTargetKeyHint();
    });

    // Volume Slider & Mute
    const volSlider = document.getElementById('volume-slider');
    const volText = document.getElementById('volume-percent-text');
    if (volSlider) {
      // Initialize with current audio master volume
      const currentVol = (this.audio && typeof this.audio.masterGain?.gain?.value === 'number') 
        ? this.audio.masterGain.gain.value 
        : 0.8;
      volSlider.value = currentVol;
      if (volText) volText.innerText = `${Math.round(currentVol * 100)}%`;

      volSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.audio.setVolume(val);
        if (volText) volText.innerText = `${Math.round(val * 100)}%`;
      });
    }

    const btnMute = document.getElementById('btn-mute');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        const isMuted = !this.audio.isMuted;
        this.audio.setMute(isMuted);
        btnMute.innerHTML = isMuted ? '🔇' : '🔊';
        btnMute.classList.toggle('text-rose-400', isMuted);
      });
    }

    // Reverb Toggle
    if (this.toggleReverb) {
      this.toggleReverb.addEventListener('change', (e) => {
        const wantReverb = e.target.checked;
        if (wantReverb && this.audio.lowLatencyMode) {
          // Switch to Studio mode so reverb is active
          this.setLowLatencyMode(false);
        } else if (!wantReverb && !this.audio.lowLatencyMode) {
          this.audio.setReverb(false);
        } else {
          this.audio.setReverb(wantReverb);
        }
      });
    }

    // Copy MIDI Log to Clipboard
    const btnCopyLog = document.getElementById('btn-copy-log');
    if (btnCopyLog) {
      btnCopyLog.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        let logLines = [];
        if (this.midiLogHistory && this.midiLogHistory.length > 0) {
          logLines = this.midiLogHistory.map(item =>
            `[${item.timestamp}] ${item.type.padEnd(14)} | ${String(item.source).padEnd(20)} | ${item.detail.padEnd(30)} | ${item.raw}`
          );
        } else if (this.midiLogContainer) {
          const rows = Array.from(this.midiLogContainer.querySelectorAll('.log-entry'));
          logLines = rows.map(r => r.innerText.replace(/\s+/g, ' ').trim()).reverse();
        }

        const logText = logLines.length > 0
          ? `--- MidiSheet Live MIDI Event Log (${new Date().toLocaleString()}) ---\n` + logLines.join('\n')
          : 'No MIDI events recorded yet.';

        const originalContent = btnCopyLog.innerHTML;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(logText);
          } else {
            const ta = document.createElement('textarea');
            ta.value = logText;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          btnCopyLog.innerHTML = '<span>✓</span> Copied!';
          btnCopyLog.classList.remove('text-sky-400');
          btnCopyLog.classList.add('text-emerald-400');
        } catch (err) {
          console.warn('Clipboard copy failed:', err);
          btnCopyLog.innerHTML = '<span>✕</span> Failed';
        }

        setTimeout(() => {
          btnCopyLog.innerHTML = originalContent;
          btnCopyLog.classList.remove('text-emerald-400');
          btnCopyLog.classList.add('text-sky-400');
        }, 2000);
      });
    }

    // Clear MIDI Log
    document.getElementById('btn-clear-log')?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.midiLogHistory = [];
      if (this.midiLogContainer) {
        this.midiLogContainer.innerHTML = '<div class="text-xs text-slate-600 font-mono py-2 italic">Awaiting MIDI events (connect a MIDI keyboard or press keys above)...</div>';
      }
    });

    // Theme Toggle (Dark / Light)
    const btnTheme = document.getElementById('btn-toggle-theme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(nextTheme);
        this.showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode.`, 'info');
      });
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
