#pragma once

#include <juce_core/juce_core.h>
#include <juce_graphics/juce_graphics.h>
#include "../core/MelodyScorer.h" // for TimingRating
#include <deque>
#include <vector>
#include <map>
#include <functional>

namespace MidiSheet
{

//==============================================================================
// Enumerations
//==============================================================================

enum class RhythmGridMode
{
    Smart,      // Adaptive: picks subdivision with smallest absolute timing error
    Quarter,    // Strict main beats (1, 2, 3, 4)
    Eighth,     // 8th note grid
    Sixteenth,  // 16th note grid
    Triplet     // Triplet grid
};

enum class RhythmToleranceMode
{
    Normal,     // ±45ms Perfect, ±120ms Good
    Strict,     // ±30ms Perfect, ±80ms  Good
    Relaxed     // ±70ms Perfect, ±180ms Good
};

//==============================================================================
// Data Structures
//==============================================================================

/// Result of snapping a hit to the metric grid.
struct GridSnapResult
{
    double offsetMs     = 0.0;          ///< Signed offset from nearest grid point (ms)
    juce::String subdivision;           ///< "quarter", "eighth", "sixteenth", "triplet"
    juce::String metricLabel;           ///< e.g. "Downbeat (1)", "Beat 2 &", "Beat 3 e"
    double gridBeatPosition = 0.0;      ///< Nearest beat position (fractional quarter beats)
};

/// Per-stroke evaluation (one or more notes within 25ms chord-debounce window).
struct RhythmStrokeEvaluation
{
    juce::uint32 id         = 0;
    int64_t      timestampMs = 0;       ///< performance timestamp (juce::Time::currentTimeMillis())
    double       offsetMs    = 0.0;     ///< Signed offset in ms from nearest grid point
    TimingRating rating      = TimingRating::None;  ///< Perfect / Early / Late / Missed
    juce::String subdivision;           ///< "quarter", "eighth", "sixteenth", "triplet"
    juce::String metricLabel;           ///< Human-readable beat position label
    juce::String text;                  ///< Display string, e.g. "🟢 PERFECT (+3ms)"
    int          points      = 0;       ///< Score contribution (0–100)
    std::vector<int> midiNotes;         ///< All MIDI pitches in this stroke

    // Duration fields (locked on note-off)
    float        durationBeats = 1.0f;  ///< Quantized note length (0.25 to 4.0 beats)
    bool         durationLocked = false;
    bool         pending        = true; ///< Not yet evaluated (awaiting chord debounce)
};

/// Rolling statistics for the current Free Play session.
struct FreePlayRhythmStats
{
    int totalStrokes  = 0;
    int totalNotes    = 0;
    int perfectHits   = 0;
    int earlyHits     = 0;
    int lateHits      = 0;
    int offBeatHits   = 0;
    int streak        = 0;
    int bestStreak    = 0;
    int rhythmScore   = 100;   ///< Running average score (0–100, weighted by points/stroke)
    int accuracy      = 100;   ///< On-beat % (perfect+early+late / total)
    double avgOffsetMs = 0.0;  ///< Rolling average of last 20 offsets
    juce::String tendency = "pocket"; ///< "pocket", "rushing", "dragging"
    std::deque<RhythmStrokeEvaluation> recentHits; ///< Tape of last 12 evaluated strokes
};

//==============================================================================
// FreePlayRhythmScorer
//
//  Thread-safety: All public methods MUST be called from the JUCE message thread.
//  The class uses juce::Time::getMillisecondCounterHiRes() for its internal
//  high-resolution clock and the same metronome source as MelodyScorer.
//==============================================================================
class FreePlayRhythmScorer
{
public:
    FreePlayRhythmScorer();
    ~FreePlayRhythmScorer();

    //--------------------------------------------------------------------------
    // Configuration
    //--------------------------------------------------------------------------
    void setBpm(double bpm);
    double getBpm()         const noexcept { return currentBpm; }
    void setBeatsPerMeasure(int beats);
    int  getBeatsPerMeasure() const noexcept { return beatsPerMeasure; }

    void setGridMode(RhythmGridMode mode)           noexcept { gridMode = mode; }
    RhythmGridMode getGridMode()              const noexcept { return gridMode; }
    void setToleranceMode(RhythmToleranceMode mode) noexcept { toleranceMode = mode; }
    RhythmToleranceMode getToleranceMode()    const noexcept { return toleranceMode; }

    void setSoundEnabled(bool enabled)              noexcept { metronomeSoundEnabled = enabled; }
    bool isSoundEnabled()                     const noexcept { return metronomeSoundEnabled; }

    /// Latency compensation in ms.  Positive = player is late (shift hit earlier).
    void   setLatencyCompensationMs(int ms)         noexcept { latencyCompensationMs = juce::jlimit(-500, 500, ms); }
    int    getLatencyCompensationMs()         const noexcept { return latencyCompensationMs; }

    //--------------------------------------------------------------------------
    // Transport
    //--------------------------------------------------------------------------
    void startMetronome();
    void stopMetronome();
    void toggleMetronome();
    bool isMetronomeRunning()   const noexcept { return metronomeRunning; }
    bool isActive()             const noexcept { return trainerActive; }
    void setActive(bool active)       noexcept { trainerActive = active; }

    //--------------------------------------------------------------------------
    // Tap Tempo
    //--------------------------------------------------------------------------
    /// Call once per tap; returns newly computed BPM (or current if only 1 tap so far).
    double registerTap();

    //--------------------------------------------------------------------------
    // Note Events  (call from message thread, typically from PluginEditor)
    //--------------------------------------------------------------------------
    /// Call when any MIDI note-on arrives.  Returns nullptr if metronome is off.
    const RhythmStrokeEvaluation* noteOn(int midiNote, int velocity, double nowSec);

    /// Call when a MIDI note-off arrives to lock note duration.
    void noteOff(int midiNote, double nowSec);

    //--------------------------------------------------------------------------
    // Timer tick  (call from a juce::Timer at ~50 Hz to drive the chord debounce
    //              flush and beat-phase tracking)
    //--------------------------------------------------------------------------
    void tick(double nowSec);

    //--------------------------------------------------------------------------
    // Phase / Pulse (for beat-dot animation, 0..1 within current beat)
    //--------------------------------------------------------------------------
    /// Returns how far we are through the current beat, in [0, 1].
    float getCurrentBeatPhase() const noexcept;

    /// Current beat index within the measure (0-indexed).
    int getCurrentBeatIndex() const noexcept { return currentBeatIndex; }

    //--------------------------------------------------------------------------
    // Statistics
    //--------------------------------------------------------------------------
    void resetStats();
    void resetSession() { resetStats(); clearScoreStream(); }
    const FreePlayRhythmStats& getStats() const noexcept { return stats; }

    //--------------------------------------------------------------------------
    // Duration helpers (JUCE-side analogue of notation.js computeNoteDuration)
    //--------------------------------------------------------------------------
    static float quantizeDurationBeats(float rawBeats) noexcept;
    static juce::String durationBeatName(float beats);
    static juce::String durationBeatSymbol(float beats);

    //--------------------------------------------------------------------------
    // Callbacks (set before starting; called on the message thread)
    //--------------------------------------------------------------------------
    std::function<void(int beatIndex, bool isDownbeat)> onBeatTick;
    std::function<void(float phase, int beatIndex)>     onPhaseUpdate;
    std::function<void(const RhythmStrokeEvaluation&, const FreePlayRhythmStats&)> onStrokeEvaluated;
    std::function<void(const FreePlayRhythmStats&)>     onStatsUpdated;
    std::function<void(bool isRunning)>                 onMetronomeToggle;

    //--------------------------------------------------------------------------
    // Scrolling Score Stream (kept inside scorer for easy GrandStaff access)
    //--------------------------------------------------------------------------
    const std::deque<RhythmStrokeEvaluation>& getScoreStream() const noexcept { return scoreStream; }
    void clearScoreStream();

private:
    //--- internal evaluation helpers ------------------------------------------
    GridSnapResult snapToGrid(double fractionalBeat, double beatDurSec) const;
    void flushPendingStroke();
    void advanceBeatPhase(double nowSec);

    //--- metronome tick scheduler----------------------------------------------
    // We drive the metronome from tick(), not a separate thread, to stay
    // strictly on the JUCE message thread.  Resolution is adequate at 50 Hz.
    double nextBeatTimeSec   = 0.0;
    int    currentBeatIndex  = 0;

    //--- configuration --------------------------------------------------------
    double currentBpm        = 108.0;
    int    beatsPerMeasure   = 4;
    RhythmGridMode       gridMode       = RhythmGridMode::Smart;
    RhythmToleranceMode  toleranceMode  = RhythmToleranceMode::Normal;
    bool   metronomeSoundEnabled        = true;
    int    latencyCompensationMs        = 0;

    //--- state ----------------------------------------------------------------
    bool   metronomeRunning  = false;
    bool   trainerActive     = false;
    double metronomeStartSec = 0.0;

    //--- chord debounce -------------------------------------------------------
    static constexpr double kChordDebounceMs = 25.0;
    struct PendingNoteInfo { int midi; int velocity; };
    std::vector<PendingNoteInfo> pendingStrokeNotes;
    double pendingStrokeOnsetSec = 0.0;
    bool   hasPendingStroke      = false;

    //--- note-on onset times for duration detection ---------------------------
    std::map<int, double> activeNoteOnsets; // midi -> onset sec

    //--- tap tempo ------------------------------------------------------------
    std::vector<double> tapTimes;   // performance timestamps (sec)
    double lastTapSec = 0.0;

    //--- statistics -----------------------------------------------------------
    FreePlayRhythmStats stats;
    double rollingOffsets[20] {};
    int    rollingOffsetCount = 0;
    int    rollingOffsetHead  = 0;
    double sumPoints          = 0.0;

    //--- scrolling score stream -----------------------------------------------
    static constexpr int kMaxStreamSize = 500;
    std::deque<RhythmStrokeEvaluation> scoreStream;
    juce::uint32 nextStrokeId = 1;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(FreePlayRhythmScorer)
};

} // namespace MidiSheet
