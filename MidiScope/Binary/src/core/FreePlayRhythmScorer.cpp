#include "FreePlayRhythmScorer.h"
#include <algorithm>
#include <numeric>
#include <cmath>

namespace MidiSheet
{

//==============================================================================
FreePlayRhythmScorer::FreePlayRhythmScorer()
{
    std::fill(std::begin(rollingOffsets), std::end(rollingOffsets), 0.0);
}

FreePlayRhythmScorer::~FreePlayRhythmScorer()
{
}

//==============================================================================
// Configuration
//==============================================================================
void FreePlayRhythmScorer::setBpm(double bpm)
{
    currentBpm = juce::jlimit(40.0, 240.0, bpm);
    // If metronome is running, re-anchor next beat without skipping
    if (metronomeRunning)
    {
        const double now = juce::Time::getMillisecondCounterHiRes() / 1000.0;
        const double beatDur = 60.0 / currentBpm;
        if (nextBeatTimeSec < now)
            nextBeatTimeSec = now + 0.01;  // tiny pre-roll
        // Keep phase coherent — do NOT reset nextBeatTimeSec to a round number
        (void)beatDur;
    }
}

void FreePlayRhythmScorer::setBeatsPerMeasure(int beats)
{
    beatsPerMeasure = juce::jlimit(2, 12, beats);
    if (currentBeatIndex >= beatsPerMeasure)
        currentBeatIndex = 0;
}

//==============================================================================
// Transport
//==============================================================================
void FreePlayRhythmScorer::startMetronome()
{
    if (metronomeRunning)
        return;

    metronomeRunning = true;
    const double now = juce::Time::getMillisecondCounterHiRes() / 1000.0;
    metronomeStartSec = now;
    nextBeatTimeSec   = now + 0.05; // tiny pre-roll so beat 1 fires immediately
    currentBeatIndex  = 0;

    if (onMetronomeToggle)
        onMetronomeToggle(true);
}

void FreePlayRhythmScorer::stopMetronome()
{
    if (!metronomeRunning)
        return;

    metronomeRunning = false;

    if (onMetronomeToggle)
        onMetronomeToggle(false);
}

void FreePlayRhythmScorer::toggleMetronome()
{
    if (metronomeRunning)
        stopMetronome();
    else
        startMetronome();
}

//==============================================================================
// Tap Tempo
//==============================================================================
double FreePlayRhythmScorer::registerTap()
{
    const double now = juce::Time::getMillisecondCounterHiRes() / 1000.0;

    // Reset tap stream if more than 2.5s since last tap
    if (!tapTimes.empty() && (now - lastTapSec) > 2.5)
        tapTimes.clear();

    lastTapSec = now;
    tapTimes.push_back(now);

    // Keep only last 5 taps
    if ((int)tapTimes.size() > 5)
        tapTimes.erase(tapTimes.begin());

    if ((int)tapTimes.size() >= 2)
    {
        double totalInterval = 0.0;
        for (int i = 1; i < (int)tapTimes.size(); ++i)
            totalInterval += (tapTimes[i] - tapTimes[i - 1]);
        const double avgIntervalSec = totalInterval / (tapTimes.size() - 1);
        const double computedBpm = 60.0 / avgIntervalSec;
        setBpm(std::round(computedBpm));
    }

    return currentBpm;
}

//==============================================================================
// Note Events
//==============================================================================
const RhythmStrokeEvaluation* FreePlayRhythmScorer::noteOn(int midiNote, int velocity, double nowSec)
{
    // Track onset for duration measurement
    activeNoteOnsets[midiNote] = nowSec;

    if (!trainerActive)
        return nullptr;

    ++stats.totalNotes;

    // Add to pending chord-debounce group
    if (!hasPendingStroke)
    {
        pendingStrokeOnsetSec = nowSec;
        hasPendingStroke      = true;
    }
    pendingStrokeNotes.push_back({ midiNote, velocity });

    // Also add to score stream immediately so notes appear on staff without latency
    // If a pending stroke entry already exists within 35ms, merge into it
    if (!scoreStream.empty() &&
        scoreStream.back().pending &&
        (nowSec - (scoreStream.back().timestampMs / 1000.0)) < 0.035)
    {
        // Merge into existing pending stroke
        if (std::find(scoreStream.back().midiNotes.begin(),
                      scoreStream.back().midiNotes.end(), midiNote)
            == scoreStream.back().midiNotes.end())
        {
            scoreStream.back().midiNotes.push_back(midiNote);
        }
    }
    else
    {
        // Create new pending stream entry
        RhythmStrokeEvaluation pending;
        pending.id          = nextStrokeId++;
        pending.timestampMs = static_cast<int64_t>(nowSec * 1000.0);
        pending.pending     = true;
        pending.midiNotes.push_back(midiNote);
        scoreStream.push_back(pending);
        if ((int)scoreStream.size() > kMaxStreamSize)
            scoreStream.pop_front();
    }

    return nullptr; // Evaluation deferred until chord debounce completes
}

void FreePlayRhythmScorer::noteOff(int midiNote, double nowSec)
{
    const auto it = activeNoteOnsets.find(midiNote);
    if (it == activeNoteOnsets.end())
        return;

    const double onsetSec   = it->second;
    activeNoteOnsets.erase(it);

    const double durationMs   = std::max(0.0, (nowSec - onsetSec) * 1000.0);
    const double beatDurMs    = (60.0 / currentBpm) * 1000.0;
    const float  rawBeats     = static_cast<float>(durationMs / beatDurMs);
    const float  quantized    = quantizeDurationBeats(rawBeats);

    // Find the most recent stream stroke containing this note and lock its duration
    for (int i = static_cast<int>(scoreStream.size()) - 1; i >= 0; --i)
    {
        auto& stroke = scoreStream[static_cast<size_t>(i)];
        auto noteIt = std::find(stroke.midiNotes.begin(), stroke.midiNotes.end(), midiNote);
        if (noteIt != stroke.midiNotes.end())
        {
            if (!stroke.durationLocked)
            {
                stroke.durationBeats  = quantized;
                stroke.durationLocked = true;
            }
            break;
        }
    }
}

//==============================================================================
// Tick  (called at ~50 Hz from message thread)
//==============================================================================
void FreePlayRhythmScorer::tick(double nowSec)
{
    // --- 1. Advance metronome and fire beat callbacks ---
    if (metronomeRunning)
    {
        const double beatDur = 60.0 / currentBpm;
        while (nextBeatTimeSec <= nowSec)
        {
            const bool isDownbeat = (currentBeatIndex == 0);

            if (onBeatTick)
                onBeatTick(currentBeatIndex, isDownbeat);

            currentBeatIndex = (currentBeatIndex + 1) % beatsPerMeasure;
            nextBeatTimeSec += beatDur;
        }
    }

    // --- 2. Fire phase update callback ---
    if (metronomeRunning && onPhaseUpdate)
    {
        const float phase = getCurrentBeatPhase();
        const int displayBeatIdx = ((currentBeatIndex - 1) + beatsPerMeasure) % beatsPerMeasure;
        onPhaseUpdate(phase, displayBeatIdx);
    }

    // --- 3. Flush chord debounce if window has elapsed ---
    if (hasPendingStroke && trainerActive)
    {
        const double elapsedMs = (nowSec - pendingStrokeOnsetSec) * 1000.0;
        if (elapsedMs >= kChordDebounceMs)
            flushPendingStroke();
    }
}

//==============================================================================
// Beat Phase
//==============================================================================
float FreePlayRhythmScorer::getCurrentBeatPhase() const noexcept
{
    if (!metronomeRunning)
        return 0.0f;

    const double beatDur  = 60.0 / currentBpm;
    const double now      = juce::Time::getMillisecondCounterHiRes() / 1000.0;
    const double prevBeat = nextBeatTimeSec - beatDur;
    const double phase    = (now - prevBeat) / beatDur;
    return static_cast<float>(juce::jlimit(0.0, 1.0, phase));
}

//==============================================================================
// Private: Flush pending stroke into an evaluated result
//==============================================================================
void FreePlayRhythmScorer::flushPendingStroke()
{
    if (!hasPendingStroke || pendingStrokeNotes.empty())
    {
        hasPendingStroke = false;
        pendingStrokeNotes.clear();
        return;
    }

    const double strokeOnsetSec = pendingStrokeOnsetSec;
    hasPendingStroke = false;
    auto notes = pendingStrokeNotes;
    pendingStrokeNotes.clear();

    if (!metronomeRunning || metronomeStartSec <= 0.0)
    {
        // Metronome off — mark as unscored
        if (!scoreStream.empty() && scoreStream.back().pending)
        {
            auto& s = scoreStream.back();
            s.pending    = false;
            s.rating     = TimingRating::None;
            s.text       = "Metronome Off";
        }
        return;
    }

    //--- Tolerance thresholds by mode ---
    double perfectTolMs = 45.0;
    double goodTolMs    = 120.0;
    if (toleranceMode == RhythmToleranceMode::Strict)
    {
        perfectTolMs = 30.0;
        goodTolMs    = 80.0;
    }
    else if (toleranceMode == RhythmToleranceMode::Relaxed)
    {
        perfectTolMs = 70.0;
        goodTolMs    = 180.0;
    }

    //--- Apply hardware latency compensation ---
    const double effectiveSec  = strokeOnsetSec - (latencyCompensationMs / 1000.0);
    const double beatDur       = 60.0 / currentBpm;
    const double elapsedSec    = effectiveSec - metronomeStartSec;
    const double fractionalBeat = elapsedSec / beatDur;

    //--- Snap to metric grid ---
    const GridSnapResult grid = snapToGrid(fractionalBeat, beatDur);
    const double absOffset    = std::abs(grid.offsetMs);

    TimingRating rating = TimingRating::Missed;
    int          points = 20;
    juce::String text;

    if (absOffset <= perfectTolMs)
    {
        rating = TimingRating::Perfect;
        points = 100;
        text   = juce::String::fromUTF8("\xF0\x9F\x9F\xA2 PERFECT (")
                 + (grid.offsetMs >= 0 ? "+" : "")
                 + juce::String(static_cast<int>(std::round(grid.offsetMs))) + "ms)";
        ++stats.perfectHits;
        ++stats.streak;
    }
    else if (absOffset <= goodTolMs)
    {
        points = 75;
        ++stats.streak;
        if (grid.offsetMs < 0.0)
        {
            rating = TimingRating::Early;
            text   = juce::String::fromUTF8("\xF0\x9F\x9F\xA1 EARLY (")
                     + juce::String(static_cast<int>(std::round(grid.offsetMs))) + "ms)";
            ++stats.earlyHits;
        }
        else
        {
            rating = TimingRating::Late;
            text   = juce::String::fromUTF8("\xF0\x9F\x9F\xA1 LATE (+")
                     + juce::String(static_cast<int>(std::round(grid.offsetMs))) + "ms)";
            ++stats.lateHits;
        }
    }
    else
    {
        rating     = TimingRating::Missed;
        points     = 20;
        text       = juce::String::fromUTF8("\xF0\x9F\x94\xB4 OFF-BEAT (")
                     + (grid.offsetMs >= 0 ? "+" : "")
                     + juce::String(static_cast<int>(std::round(grid.offsetMs))) + "ms)";
        ++stats.offBeatHits;
        stats.streak = 0;
    }

    stats.bestStreak = std::max(stats.bestStreak, stats.streak);
    ++stats.totalStrokes;
    sumPoints += points;

    // Rolling rhythm score (average points per stroke)
    stats.rhythmScore = static_cast<int>(std::round(sumPoints / stats.totalStrokes));

    // On-beat accuracy %
    const int onBeat = stats.perfectHits + stats.earlyHits + stats.lateHits;
    stats.accuracy   = static_cast<int>(std::round(static_cast<double>(onBeat) / stats.totalStrokes * 100.0));

    // Rolling tendency (circular buffer of last 20 offsets)
    rollingOffsets[rollingOffsetHead % 20] = grid.offsetMs;
    ++rollingOffsetHead;
    rollingOffsetCount = std::min(rollingOffsetCount + 1, 20);

    double sumOff = 0.0;
    for (int i = 0; i < rollingOffsetCount; ++i)
        sumOff += rollingOffsets[i];
    stats.avgOffsetMs = sumOff / rollingOffsetCount;

    if (stats.avgOffsetMs < -18.0)
        stats.tendency = "rushing";
    else if (stats.avgOffsetMs > 18.0)
        stats.tendency = "dragging";
    else
        stats.tendency = "pocket";

    //--- Build evaluation object ---
    RhythmStrokeEvaluation eval;
    eval.id          = nextStrokeId++;
    eval.timestampMs = static_cast<int64_t>(strokeOnsetSec * 1000.0);
    eval.offsetMs    = grid.offsetMs;
    eval.rating      = rating;
    eval.subdivision = grid.subdivision;
    eval.metricLabel = grid.metricLabel;
    eval.text        = text;
    eval.points      = points;
    eval.pending     = false;
    for (const auto& n : notes)
        eval.midiNotes.push_back(n.midi);

    // Update most recent pending stream entry
    bool updated = false;
    for (int i = static_cast<int>(scoreStream.size()) - 1; i >= 0; --i)
    {
        auto& s = scoreStream[static_cast<size_t>(i)];
        if (s.pending || ((strokeOnsetSec * 1000.0 - s.timestampMs) < 120.0))
        {
            s.pending    = false;
            s.offsetMs   = eval.offsetMs;
            s.rating     = eval.rating;
            s.subdivision = eval.subdivision;
            s.metricLabel = eval.metricLabel;
            s.text        = eval.text;
            s.points      = eval.points;
            updated = true;
            break;
        }
    }

    if (!updated)
    {
        scoreStream.push_back(eval);
        if ((int)scoreStream.size() > kMaxStreamSize)
            scoreStream.pop_front();
    }

    // Update recent-hits tape (last 12)
    stats.recentHits.push_front(eval);
    if ((int)stats.recentHits.size() > 12)
        stats.recentHits.pop_back();

    if (onStrokeEvaluated)
        onStrokeEvaluated(eval, stats);
    if (onStatsUpdated)
        onStatsUpdated(stats);
}

//==============================================================================
// Private: Grid Snap
//==============================================================================
GridSnapResult FreePlayRhythmScorer::snapToGrid(double fractionalBeat, double beatDurSec) const
{
    const double beatMs = beatDurSec * 1000.0;

    // Quarter note candidates
    const double nearestQ  = std::round(fractionalBeat);
    const double deltaQ    = (fractionalBeat - nearestQ) * beatMs;

    // Eighth note
    const double nearest8  = std::round(fractionalBeat * 2.0) / 2.0;
    const double delta8    = (fractionalBeat - nearest8) * beatMs;

    // Sixteenth note
    const double nearest16 = std::round(fractionalBeat * 4.0) / 4.0;
    const double delta16   = (fractionalBeat - nearest16) * beatMs;

    // Triplet
    const double nearestT  = std::round(fractionalBeat * 3.0) / 3.0;
    const double deltaT    = (fractionalBeat - nearestT) * beatMs;

    double chosenDelta = deltaQ;
    double chosenPos   = nearestQ;
    juce::String subdivType = "quarter";

    switch (gridMode)
    {
        case RhythmGridMode::Quarter:
            chosenDelta = deltaQ;  chosenPos = nearestQ;  subdivType = "quarter";
            break;

        case RhythmGridMode::Eighth:
            chosenDelta = delta8;  chosenPos = nearest8;
            subdivType  = (std::fmod(std::abs(chosenPos), 1.0) < 0.01) ? "quarter" : "eighth";
            break;

        case RhythmGridMode::Sixteenth:
        {
            chosenDelta = delta16; chosenPos = nearest16;
            const double frac = std::fmod(std::abs(chosenPos), 1.0);
            if (frac < 0.01)                    subdivType = "quarter";
            else if (std::abs(frac - 0.5) < 0.01) subdivType = "eighth";
            else                                subdivType = "sixteenth";
            break;
        }

        case RhythmGridMode::Triplet:
            chosenDelta = deltaT;  chosenPos = nearestT;
            subdivType  = (std::fmod(std::abs(chosenPos), 1.0) < 0.01) ? "quarter" : "triplet";
            break;

        case RhythmGridMode::Smart:
        default:
        {
            // Adaptive: pick subdivision with smallest absolute error
            struct Candidate { double delta, pos; const char* type; };
            Candidate candidates[] = {
                { deltaQ,  nearestQ,  "quarter"   },
                { delta8,  nearest8,  "eighth"    },
                { delta16, nearest16, "sixteenth" },
                { deltaT,  nearestT,  "triplet"   }
            };
            int best = 0;
            for (int i = 1; i < 4; ++i)
                if (std::abs(candidates[i].delta) < std::abs(candidates[best].delta))
                    best = i;

            chosenDelta = candidates[best].delta;
            chosenPos   = candidates[best].pos;
            subdivType  = candidates[best].type;
            break;
        }
    }

    //--- Human-readable metric label ---
    const int bpm_i = beatsPerMeasure;
    const int intBeat = ((static_cast<int>(std::floor(chosenPos)) % bpm_i) + bpm_i) % bpm_i;
    const double frac = std::fmod(std::fmod(chosenPos, 1.0) + 1.0, 1.0);

    juce::String label = "Beat " + juce::String(intBeat + 1);
    if (intBeat == 0 && frac < 0.05)
        label = "Downbeat (1)";
    else if (std::abs(frac - 0.5) < 0.05)
        label = "Beat " + juce::String(intBeat + 1) + " &";
    else if (std::abs(frac - 0.25) < 0.05)
        label = "Beat " + juce::String(intBeat + 1) + " e";
    else if (std::abs(frac - 0.75) < 0.05)
        label = "Beat " + juce::String(intBeat + 1) + " a";
    else if (std::abs(frac - 0.333) < 0.05 || std::abs(frac - 0.667) < 0.05)
        label = "Beat " + juce::String(intBeat + 1) + " Triplet";

    GridSnapResult result;
    result.offsetMs         = chosenDelta;
    result.subdivision      = subdivType;
    result.metricLabel      = label;
    result.gridBeatPosition = chosenPos;
    return result;
}

//==============================================================================
// Statistics Reset
//==============================================================================
void FreePlayRhythmScorer::resetStats()
{
    stats = FreePlayRhythmStats{};
    sumPoints         = 0.0;
    rollingOffsetCount = 0;
    rollingOffsetHead  = 0;
    std::fill(std::begin(rollingOffsets), std::end(rollingOffsets), 0.0);

    if (onStatsUpdated)
        onStatsUpdated(stats);
}

//==============================================================================
// Score Stream
//==============================================================================
void FreePlayRhythmScorer::clearScoreStream()
{
    scoreStream.clear();
}

//==============================================================================
// Duration Quantization Helpers
//==============================================================================
float FreePlayRhythmScorer::quantizeDurationBeats(float rawBeats) noexcept
{
    if (rawBeats >= 3.25f) return 4.0f;   // Whole note
    if (rawBeats >= 2.4f)  return 3.0f;   // Dotted half
    if (rawBeats >= 1.45f) return 2.0f;   // Half note
    if (rawBeats >= 1.2f)  return 1.5f;   // Dotted quarter
    if (rawBeats >= 0.65f) return 1.0f;   // Quarter
    if (rawBeats >= 0.35f) return 0.5f;   // Eighth
    return 0.25f;                          // Sixteenth
}

juce::String FreePlayRhythmScorer::durationBeatName(float beats)
{
    if (beats >= 3.5f)  return "Whole Note";
    if (beats >= 2.4f)  return "Dotted Half Note";
    if (beats >= 1.45f) return "Half Note";
    if (beats >= 1.2f)  return "Dotted Quarter Note";
    if (beats >= 0.65f) return "Quarter Note";
    if (beats >= 0.35f) return "Eighth Note";
    return "Sixteenth Note";
}

juce::String FreePlayRhythmScorer::durationBeatSymbol(float beats)
{
    // Unicode musical note glyphs
    if (beats >= 3.5f)  return juce::String::fromUTF8("\xF0\x9D\x85\x9D"); // 𝅝 whole
    if (beats >= 2.4f)  return juce::String::fromUTF8("\xF0\x9D\x85\x97\xF0\x9D\x85\xA5."); // dotted half
    if (beats >= 1.45f) return juce::String::fromUTF8("\xF0\x9D\x85\x97\xF0\x9D\x85\xA5"); // 𝅗𝅥 half
    if (beats >= 1.2f)  return "\xE2\x99\xA9.";  // ♩. dotted quarter
    if (beats >= 0.65f) return "\xE2\x99\xA9";   // ♩ quarter
    if (beats >= 0.35f) return "\xE2\x99\xAA";   // ♪ eighth
    return "\xE2\x99\xAC";                         // ♬ sixteenth
}

} // namespace MidiSheet
