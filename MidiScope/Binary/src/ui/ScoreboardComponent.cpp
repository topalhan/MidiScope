#include "ScoreboardComponent.h"

namespace MidiSheet
{

ScoreboardComponent::ScoreboardComponent()
{
    // Melody Selector Button
    selectMelodyButton.setButtonText("Melodies");
    selectMelodyButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(14, 165, 233)); // Sky 500
    selectMelodyButton.setColour(juce::TextButton::textColourOffId, juce::Colours::white);
    selectMelodyButton.onClick = [this]() {
        if (onSelectMelodyClicked) onSelectMelodyClicked();
    };
    addAndMakeVisible(selectMelodyButton);

    // Restart Button
    restartButton.setButtonText("Restart");
    restartButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(30, 41, 59));
    restartButton.setColour(juce::TextButton::textColourOffId, juce::Colour::fromRGB(226, 232, 240));
    restartButton.onClick = [this]() {
        if (onRestartClicked) onRestartClicked();
    };
    addAndMakeVisible(restartButton);

    // Mode Selector
    modeSelector.addItem("Wait for Note", 1);
    modeSelector.addItem("In-Tempo (Metronome)", 2);
    modeSelector.addItem("Strict Time (No-Pause)", 3);
    modeSelector.addItem("First-Read (30s Lockout)", 4);
    modeSelector.setSelectedId(1, juce::dontSendNotification);
    modeSelector.setColour(juce::ComboBox::backgroundColourId, juce::Colour::fromRGB(30, 41, 59));
    modeSelector.setColour(juce::ComboBox::textColourId, juce::Colour::fromRGB(226, 232, 240));
    modeSelector.onChange = [this]() {
        PracticeMode mode = PracticeMode::Wait;
        switch (modeSelector.getSelectedId())
        {
            case 1: mode = PracticeMode::Wait; break;
            case 2: mode = PracticeMode::Tempo; break;
            case 3: mode = PracticeMode::StrictTime; break;
            case 4: mode = PracticeMode::FirstRead; break;
            default: break;
        }
        if (onModeChanged) onModeChanged(mode);
    };
    addAndMakeVisible(modeSelector);

    // Visual Disrupter Mode Selector
    disrupterSelector.addItem("Disrupter: Off", 1);
    disrupterSelector.addItem("Vanishing Bar", 2);
    disrupterSelector.addItem("Advance Curtain", 3);
    disrupterSelector.setSelectedId(1, juce::dontSendNotification);
    disrupterSelector.setColour(juce::ComboBox::backgroundColourId, juce::Colour::fromRGB(30, 41, 59));
    disrupterSelector.setColour(juce::ComboBox::textColourId, juce::Colour::fromRGB(226, 232, 240));
    disrupterSelector.onChange = [this]() {
        VisualDisrupterMode mode = VisualDisrupterMode::None;
        switch (disrupterSelector.getSelectedId())
        {
            case 1: mode = VisualDisrupterMode::None; break;
            case 2: mode = VisualDisrupterMode::VanishingBar; break;
            case 3: mode = VisualDisrupterMode::AdvanceCurtain; break;
            default: break;
        }
        if (onDisrupterModeChanged) onDisrupterModeChanged(mode);
    };
    addAndMakeVisible(disrupterSelector);

    // Eye Cursor (+1 Bar) Pacer Button
    eyeCursorButton.setButtonText(juce::String::fromUTF8("👁 Eye Pacer"));
    eyeCursorButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(30, 41, 59));
    eyeCursorButton.setColour(juce::TextButton::textColourOffId, juce::Colour::fromRGB(148, 163, 184));
    eyeCursorButton.onClick = [this]() {
        eyeCursorActive = !eyeCursorActive;
        setEyeCursorEnabled(eyeCursorActive);
        if (onEyeCursorToggled) onEyeCursorToggled(eyeCursorActive);
    };
    addAndMakeVisible(eyeCursorButton);

    // Metronome Click Toggle Button
    metronomeButton.setButtonText(juce::String::fromUTF8("🔔 Click"));
    setMetronomeEnabled(true);
    metronomeButton.onClick = [this]() {
        metronomeActive = !metronomeActive;
        setMetronomeEnabled(metronomeActive);
        if (onMetronomeToggled) onMetronomeToggled(metronomeActive);
    };
    addAndMakeVisible(metronomeButton);

    // Routine Mode Button
    routineButton.setButtonText(juce::CharPointer_UTF8("\xe2\x8f\xb1\xef\xb8\x8f Routine (20m)"));
    routineButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(16, 185, 129).withAlpha(0.35f));
    routineButton.setColour(juce::TextButton::textColourOffId, juce::Colour::fromRGB(52, 211, 153));
    routineButton.onClick = [this]() {
        if (onRoutineClicked) onRoutineClicked();
    };
    addAndMakeVisible(routineButton);

    // Free Play Rhythm Trainer Toggle Button
    freePlayButton.setButtonText(juce::String::fromUTF8("🥁 Free Play"));
    freePlayButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(30, 41, 59));
    freePlayButton.setColour(juce::TextButton::textColourOffId, juce::Colour::fromRGB(148, 163, 184));
    freePlayButton.onClick = [this]() {
        freePlayActive = !freePlayActive;
        setFreePlayActive(freePlayActive);
        if (onFreePlayToggled) onFreePlayToggled(freePlayActive);
    };
    addAndMakeVisible(freePlayButton);
}

void ScoreboardComponent::resized()
{
    const auto bounds = getLocalBounds();
    const int rightEdge = bounds.getRight() - 12;
    const int topEdge = bounds.getY() + 10;

    selectMelodyButton.setBounds(rightEdge - 95, topEdge, 95, 28);
    restartButton.setBounds(rightEdge - 175, topEdge, 75, 28);
    metronomeButton.setBounds(rightEdge - 255, topEdge, 75, 28);
    modeSelector.setBounds(rightEdge - 410, topEdge, 150, 28);
    disrupterSelector.setBounds(rightEdge - 550, topEdge, 135, 28);
    eyeCursorButton.setBounds(rightEdge - 660, topEdge, 105, 28);
    routineButton.setBounds(rightEdge - 785, topEdge, 120, 28);
    freePlayButton.setBounds(rightEdge - 905, topEdge, 115, 28);
}

void ScoreboardComponent::setMetronomeEnabled(bool enabled)
{
    metronomeActive = enabled;
    if (metronomeActive)
    {
        metronomeButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(16, 185, 129).withAlpha(0.35f));
        metronomeButton.setColour(juce::TextButton::textColourOffId, juce::Colour::fromRGB(52, 211, 153));
        metronomeButton.setButtonText(juce::String::fromUTF8("🔔 Click"));
    }
    else
    {
        metronomeButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(30, 41, 59));
        metronomeButton.setColour(juce::TextButton::textColourOffId, juce::Colour::fromRGB(148, 163, 184));
        metronomeButton.setButtonText(juce::String::fromUTF8("🔕 Click"));
    }
    repaint();
}

void ScoreboardComponent::setEyeCursorEnabled(bool enabled)
{
    eyeCursorActive = enabled;
    if (eyeCursorActive)
    {
        eyeCursorButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(14, 165, 233).withAlpha(0.35f));
        eyeCursorButton.setColour(juce::TextButton::textColourOffId, juce::Colour::fromRGB(56, 189, 248));
    }
    else
    {
        eyeCursorButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(30, 41, 59));
        eyeCursorButton.setColour(juce::TextButton::textColourOffId, juce::Colour::fromRGB(148, 163, 184));
    }
    repaint();
}

void ScoreboardComponent::setDisrupterMode(VisualDisrupterMode mode)
{
    int id = 1;
    switch (mode)
    {
        case VisualDisrupterMode::None: id = 1; break;
        case VisualDisrupterMode::VanishingBar: id = 2; break;
        case VisualDisrupterMode::AdvanceCurtain: id = 3; break;
    }
    disrupterSelector.setSelectedId(id, juce::dontSendNotification);
}

void ScoreboardComponent::setFreePlayActive(bool active)
{
    freePlayActive = active;
    if (freePlayActive)
    {
        freePlayButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(14, 165, 233).withAlpha(0.35f));
        freePlayButton.setColour(juce::TextButton::textColourOffId, juce::Colour::fromRGB(56, 189, 248));
        selectMelodyButton.setEnabled(false);
        modeSelector.setEnabled(false);
        disrupterSelector.setEnabled(false);
        eyeCursorButton.setEnabled(false);
    }
    else
    {
        freePlayButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(30, 41, 59));
        freePlayButton.setColour(juce::TextButton::textColourOffId, juce::Colour::fromRGB(148, 163, 184));
        selectMelodyButton.setEnabled(true);
        modeSelector.setEnabled(true);
        disrupterSelector.setEnabled(true);
        eyeCursorButton.setEnabled(true);
    }
    repaint();
}

void ScoreboardComponent::updateFreePlayState(const FreePlayRhythmStats& stats, double bpm, int beatsPerMeasure, bool isMetronomeRunning, const std::vector<int>& activeNotes, bool preferFlats)
{
    freePlayStats = stats;
    currentBpm = bpm;
    freePlayBeatsPerMeasure = beatsPerMeasure;
    freePlayMetronomeRunning = isMetronomeRunning;

    if (activeNotes.empty())
    {
        hasPlayedNote = false;
        playedMatchesTarget = false;
        playedNoteStr = "--";
    }
    else
    {
        hasPlayedNote = true;
        juce::StringArray names;
        for (int midi : activeNotes)
            names.add(MusicTheory::getNoteInfo(midi, preferFlats).fullName);
        playedNoteStr = names.joinIntoString(", ");
    }

    if (!stats.recentHits.empty())
    {
        const auto& latest = stats.recentHits.front();
        timingFeedbackStr = latest.text;
        currentRating = latest.rating;
    }
    else
    {
        timingFeedbackStr = isMetronomeRunning ? "Play with the metronome pulse" : "Start Metronome to score rhythm";
        currentRating = TimingRating::None;
    }

    accuracyPercent = stats.accuracy;
    rhythmPercent = stats.rhythmScore;
    currentStreak = stats.streak;

    repaint();
}

void ScoreboardComponent::updateState(const MelodyScorer& scorer, const DetectedChord& chord, double bpm, bool hostPlaying, const std::vector<int>& activeNotes, bool preferFlats, int reviewMistakeIndex)
{
    const auto& melody = scorer.getCurrentMelody();
    melodyTitle = melody.title;
    composer = melody.composer;
    difficulty = melody.difficulty;
    currentBpm = bpm;
    isHostPlaying = hostPlaying;

    const auto* target = scorer.getCurrentTargetNote();
    targetNoteStr = (target != nullptr) ? target->name : (scorer.isFinished() ? "Done" : "");

    // Live played note tracking
    if (activeNotes.empty())
    {
        hasPlayedNote = false;
        playedMatchesTarget = false;
        playedNoteStr = "--";
    }
    else
    {
        hasPlayedNote = true;
        juce::StringArray names;
        bool matches = false;
        const int currIdx = scorer.getCurrentNoteIndex();

        for (int midi : activeNotes)
        {
            const auto noteInfo = MusicTheory::getNoteInfo(midi, preferFlats);
            names.add(noteInfo.fullName);

            if (target != nullptr && midi == target->midi)
            {
                matches = true;
            }
            else if (currIdx > 0 && currIdx - 1 < static_cast<int>(melody.notes.size())
                     && midi == melody.notes[static_cast<size_t>(currIdx - 1)].midi)
            {
                matches = true;
            }
        }

        playedNoteStr = names.joinIntoString(", ");
        playedMatchesTarget = matches;
    }

    chordNameStr = chord.name;
    chordQualityStr = chord.quality;

    const auto& scorecard = scorer.getScorecard();
    accuracyPercent = scorecard.pitchAccuracy;
    rhythmPercent = scorecard.rhythmAccuracy;
    sightReadingScore = scorecard.sightReadingScore;
    recoveries = scorecard.recoveries;
    practiceMode = scorer.getPracticeMode();

    int expectedId = 1;
    switch (practiceMode)
    {
        case PracticeMode::Wait: expectedId = 1; break;
        case PracticeMode::Tempo: expectedId = 2; break;
        case PracticeMode::StrictTime: expectedId = 3; break;
        case PracticeMode::FirstRead: expectedId = 4; break;
    }
    if (modeSelector.getSelectedId() != expectedId)
        modeSelector.setSelectedId(expectedId, juce::dontSendNotification);

    currentStreak = scorer.getCurrentStreak();
    noteIndex = scorer.getCurrentNoteIndex();
    totalNotes = static_cast<int>(melody.notes.size());

    if (scorer.isFinished())
    {
        const int total = scorecard.totalNotes;
        const int correct = scorecard.correctNotes;
        const int mistakes = scorecard.mistakeCount;
        const int missed = scorecard.missedNotes;
        const bool isFlawless = (total > 0 && correct == total && mistakes == 0 && missed == 0);
        const bool zeroPlayed = (total > 0 && correct == 0);

        if (isFlawless)
        {
            timingFeedbackStr = "Flawless Performance!";
            currentRating = TimingRating::Perfect;
        }
        else if (zeroPlayed)
        {
            timingFeedbackStr = "Incomplete: 0 of " + juce::String(total) + " notes played";
            currentRating = TimingRating::Missed;

            int targetMistakeIdx = reviewMistakeIndex;
            if (targetMistakeIdx < 0 || targetMistakeIdx >= static_cast<int>(melody.notes.size()))
            {
                targetMistakeIdx = scorer.getFirstMistakeIndex();
            }

            if (targetMistakeIdx >= 0 && targetMistakeIdx < static_cast<int>(melody.notes.size()))
            {
                const auto& noteObj = melody.notes[static_cast<size_t>(targetMistakeIdx)];
                targetNoteStr = noteObj.name;
                playedNoteStr = "-";
                hasPlayedNote = true;
                playedMatchesTarget = false;
            }
        }
        else
        {
            currentRating = TimingRating::Missed;
            const auto& evals = scorer.getNoteEvaluations();
            const auto& notes = melody.notes;

            int targetMistakeIdx = reviewMistakeIndex;
            if (targetMistakeIdx < 0 || targetMistakeIdx >= static_cast<int>(notes.size()) ||
                (targetMistakeIdx < static_cast<int>(evals.size()) &&
                 evals[static_cast<size_t>(targetMistakeIdx)].mistakeAttempts == 0 &&
                 evals[static_cast<size_t>(targetMistakeIdx)].timing != TimingRating::Missed))
            {
                targetMistakeIdx = scorer.getFirstMistakeIndex();
            }

            if (targetMistakeIdx >= 0 && targetMistakeIdx < static_cast<int>(notes.size()))
            {
                const auto& noteObj = notes[static_cast<size_t>(targetMistakeIdx)];
                targetNoteStr = noteObj.name;

                const bool wasMissed = (targetMistakeIdx < static_cast<int>(evals.size()) &&
                                        evals[static_cast<size_t>(targetMistakeIdx)].timing == TimingRating::Missed);

                juce::String wrongStr = wasMissed ? "Missed" : "?";
                if (!wasMissed && targetMistakeIdx < static_cast<int>(evals.size()) &&
                    evals[static_cast<size_t>(targetMistakeIdx)].lastWrongMidi >= 0)
                {
                    wrongStr = MusicTheory::getNoteInfo(evals[static_cast<size_t>(targetMistakeIdx)].lastWrongMidi, preferFlats).fullName;
                }

                playedNoteStr = wasMissed ? "-" : wrongStr;
                hasPlayedNote = true;
                playedMatchesTarget = false;

                const int totalIssues = mistakes + missed;
                if (wasMissed)
                {
                    timingFeedbackStr = "Missed Note #" + juce::String(targetMistakeIdx + 1) + ": Not played (Expected " + noteObj.name + ")";
                }
                else if (totalIssues == 1)
                {
                    timingFeedbackStr = "Mistake Note #" + juce::String(targetMistakeIdx + 1) + ": Played " + wrongStr + " (Expected " + noteObj.name + ")";
                }
                else
                {
                    timingFeedbackStr = "Reviewing Note #" + juce::String(targetMistakeIdx + 1) + ": Played " + wrongStr + " vs " + noteObj.name + " (" + juce::String(totalIssues) + " mistakes/misses)";
                }

                if (!wasMissed && targetMistakeIdx < static_cast<int>(evals.size()) && evals[static_cast<size_t>(targetMistakeIdx)].completed)
                {
                    const int ro = static_cast<int>(std::round(evals[static_cast<size_t>(targetMistakeIdx)].offsetMs));
                    timingFeedbackStr += " [" + (ro >= 0 ? juce::String("+") : juce::String()) + juce::String(ro) + "ms]";
                }
            }
            else
            {
                const int totalIssues = mistakes + missed;
                timingFeedbackStr = juce::String(totalIssues) + " issue(s) to review";
            }
        }
    }
    else
    {
        const auto& feedback = scorer.getLastTimingFeedback();
        timingFeedbackStr = feedback.text;
        currentRating = feedback.rating;
    }

    repaint();
}

void ScoreboardComponent::paint(juce::Graphics& g)
{
    const auto bounds = getLocalBounds().toFloat();

    // Dark sleek container background
    g.setColour(juce::Colour::fromRGB(15, 23, 42)); // Slate 900
    g.fillRoundedRectangle(bounds, 12.0f);

    g.setColour(juce::Colour::fromRGB(30, 41, 59)); // Border
    g.drawRoundedRectangle(bounds.reduced(0.5f), 12.0f, 1.2f);

    // Left Column: Melody Info & Target Note
    const float leftX = bounds.getX() + 14.0f;
    float y = bounds.getY() + 12.0f;

    if (freePlayActive)
    {
        // 1. Badge "RHYTHM"
        g.setColour(juce::Colour::fromRGB(14, 165, 233).withAlpha(0.2f));
        g.fillRoundedRectangle(leftX, y, 64.0f, 18.0f, 4.0f);
        g.setColour(juce::Colour::fromRGB(56, 189, 248));
        g.drawRoundedRectangle(leftX, y, 64.0f, 18.0f, 4.0f, 1.0f);
        g.setFont(juce::FontOptions(10.0f, juce::Font::bold));
        g.drawText("RHYTHM", leftX, y, 64.0f, 18.0f, juce::Justification::centred);

        // 2. Title "Free Play Rhythm Trainer"
        g.setColour(juce::Colours::white);
        g.setFont(juce::FontOptions(17.0f, juce::Font::bold));
        g.drawText("Free Play Rhythm Trainer", leftX + 72.0f, y - 2.0f, 230.0f, 22.0f, juce::Justification::centredLeft);

        // 3. Grid & Metronome Pill
        const float gridPillX = leftX + 310.0f;
        const float gridPillW = 120.0f;
        g.setColour(juce::Colour::fromRGB(99, 102, 241).withAlpha(0.2f));
        g.fillRoundedRectangle(gridPillX, y - 2.0f, gridPillW, 22.0f, 6.0f);
        g.setColour(juce::Colour::fromRGB(165, 180, 252));
        g.drawRoundedRectangle(gridPillX, y - 2.0f, gridPillW, 22.0f, 6.0f, 1.0f);
        g.setFont(juce::FontOptions(10.5f, juce::Font::bold));
        g.drawText(juce::String(static_cast<int>(std::round(currentBpm))) + " BPM \xE2\x80\xA2 " + juce::String(freePlayBeatsPerMeasure) + "/4 Grid",
                   gridPillX, y - 2.0f, gridPillW, 22.0f, juce::Justification::centred);

        // 4. Played Notes Pill
        const float playedPillX = gridPillX + gridPillW + 8.0f;
        const float playedPillW = 105.0f;
        g.setColour(juce::Colour::fromRGB(30, 41, 59));
        g.fillRoundedRectangle(playedPillX, y - 2.0f, playedPillW, 22.0f, 6.0f);
        g.setColour(juce::Colour::fromRGB(71, 85, 105));
        g.drawRoundedRectangle(playedPillX, y - 2.0f, playedPillW, 22.0f, 6.0f, 1.0f);
        g.setColour(juce::Colour::fromRGB(148, 163, 184));
        g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
        g.drawText("Played: " + playedNoteStr, playedPillX, y - 2.0f, playedPillW, 22.0f, juce::Justification::centred);

        // Row 2: Timing feedback, Pocket needle, Streak, Accuracy, Counters
        y += 28.0f;

        // Feedback Pill
        juce::Colour feedbackBg = juce::Colour::fromRGB(30, 41, 59);
        juce::Colour feedbackText = juce::Colour::fromRGB(148, 163, 184);
        if (currentRating == TimingRating::Perfect)
        {
            feedbackBg = juce::Colour::fromRGB(16, 185, 129).withAlpha(0.2f);
            feedbackText = juce::Colour::fromRGB(52, 211, 153);
        }
        else if (currentRating == TimingRating::Early || currentRating == TimingRating::Late)
        {
            feedbackBg = juce::Colour::fromRGB(245, 158, 11).withAlpha(0.2f);
            feedbackText = juce::Colour::fromRGB(251, 191, 36);
        }
        else if (currentRating == TimingRating::Missed)
        {
            feedbackBg = juce::Colour::fromRGB(244, 63, 94).withAlpha(0.2f);
            feedbackText = juce::Colour::fromRGB(251, 113, 133);
        }

        g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
        const float textW = static_cast<float>(g.getCurrentFont().getStringWidth(timingFeedbackStr));
        const float pillWidth = std::clamp(textW + 36.0f, 170.0f, 260.0f);
        const float pillHeight = 22.0f;
        g.setColour(feedbackBg);
        g.fillRoundedRectangle(leftX, y, pillWidth, pillHeight, 6.0f);
        g.setColour(feedbackText.withAlpha(0.35f));
        g.drawRoundedRectangle(leftX, y, pillWidth, pillHeight, 6.0f, 1.0f);

        // Status indicator dot
        g.setColour(feedbackText);
        g.fillEllipse(leftX + 8.0f, y + (pillHeight - 8.0f) * 0.5f, 8.0f, 8.0f);
        g.drawText(timingFeedbackStr, leftX + 22.0f, y, pillWidth - 26.0f, pillHeight, juce::Justification::centredLeft);

        // Pocket Needle Meter
        const float meterX = leftX + pillWidth + 12.0f;
        const float meterW = 120.0f;
        const float meterH = 12.0f;
        const float meterY = y + (pillHeight - meterH) * 0.5f;

        // Meter background track
        g.setColour(juce::Colour::fromRGB(30, 41, 59));
        g.fillRoundedRectangle(meterX, meterY, meterW, meterH, 3.0f);

        // Pocket zone (center ±18ms corresponds to ±18/150 * halfWidth)
        const float halfW = meterW * 0.5f;
        const float pocketFrac = 18.0f / 150.0f;
        const float pocketPx = halfW * pocketFrac;
        g.setColour(juce::Colour::fromRGB(16, 185, 129).withAlpha(0.35f));
        g.fillRect(meterX + halfW - pocketPx, meterY, pocketPx * 2.0f, meterH);

        // Center tick (0ms)
        g.setColour(juce::Colour::fromRGB(148, 163, 184).withAlpha(0.7f));
        g.drawLine(meterX + halfW, meterY, meterX + halfW, meterY + meterH, 1.0f);

        // Needle indicator
        const float clampedOffset = static_cast<float>(std::clamp(freePlayStats.avgOffsetMs, -150.0, 150.0));
        const float needleX = meterX + halfW + (clampedOffset / 150.0f) * halfW;
        juce::Colour needleCol = (std::abs(clampedOffset) <= 18.0f) ? juce::Colour::fromRGB(52, 211, 153)
                               : (std::abs(clampedOffset) <= 45.0f) ? juce::Colour::fromRGB(251, 191, 36)
                               : juce::Colour::fromRGB(244, 63, 94);
        g.setColour(needleCol);
        g.drawLine(needleX, meterY - 2.0f, needleX, meterY + meterH + 2.0f, 2.0f);

        // Tendency label
        juce::String tendStr;
        if (freePlayStats.tendency == "rushing")
            tendStr = juce::String::fromUTF8("\xe2\x9a\xa1 ") + juce::String(static_cast<int>(std::round(freePlayStats.avgOffsetMs))) + "ms";
        else if (freePlayStats.tendency == "dragging")
            tendStr = juce::String::fromUTF8("\xe2\x8f\xb3 +") + juce::String(static_cast<int>(std::round(freePlayStats.avgOffsetMs))) + "ms";
        else
            tendStr = juce::String::fromUTF8("\xf0\x9f\x8e\xaf Pocket");

        g.setFont(juce::FontOptions(10.0f, juce::Font::bold));
        g.setColour(needleCol);
        g.drawText(tendStr, meterX + meterW + 6.0f, y, 70.0f, pillHeight, juce::Justification::centredLeft);

        // Streak badge
        const float streakX = meterX + meterW + 80.0f;
        g.setColour(juce::Colour::fromRGB(245, 158, 11));
        g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
        g.drawText(juce::String::fromUTF8("\xf0\x9f\x94\xa5 ") + juce::String(freePlayStats.streak) + " (" + juce::String(freePlayStats.bestStreak) + ")",
                   streakX, y, 80.0f, pillHeight, juce::Justification::centredLeft);

        // Accuracy %
        const float accX = streakX + 84.0f;
        g.setColour(juce::Colour::fromRGB(16, 185, 129));
        g.drawText(juce::String(freePlayStats.accuracy) + "%", accX, y, 46.0f, pillHeight, juce::Justification::centredLeft);

        // Hit breakdown
        const float countX = accX + 48.0f;
        g.setFont(juce::FontOptions(10.0f, juce::Font::plain));
        g.setColour(juce::Colour::fromRGB(148, 163, 184));
        juce::String breakdown = juce::String::fromUTF8("\xf0\x9f\x9f\xa2 ") + juce::String(freePlayStats.perfectHits)
                               + juce::String::fromUTF8("  \xf0\x9f\x9f\xa1 ") + juce::String(freePlayStats.earlyHits)
                               + juce::String::fromUTF8("  \xf0\x9f\x94\xb5 ") + juce::String(freePlayStats.lateHits)
                               + juce::String::fromUTF8("  \xf0\x9f\x94\xb4 ") + juce::String(freePlayStats.offBeatHits);
        g.drawText(breakdown, countX, y, 160.0f, pillHeight, juce::Justification::centredLeft);
        return;
    }

    // Difficulty badge
    juce::Colour diffColor = (difficulty == "Easy") ? juce::Colour::fromRGB(16, 185, 129) // Emerald 500
                          : (difficulty == "Medium") ? juce::Colour::fromRGB(245, 158, 11) // Amber 500
                          : juce::Colour::fromRGB(244, 63, 94); // Rose 500

    g.setColour(diffColor.withAlpha(0.2f));
    g.fillRoundedRectangle(leftX, y, 54.0f, 18.0f, 4.0f);
    g.setColour(diffColor);
    g.drawRoundedRectangle(leftX, y, 54.0f, 18.0f, 4.0f, 1.0f);
    g.setFont(juce::FontOptions(10.0f, juce::Font::bold));
    g.drawText(difficulty.toUpperCase(), leftX, y, 54.0f, 18.0f, juce::Justification::centred);

    // Melody Title
    g.setColour(juce::Colours::white);
    g.setFont(juce::FontOptions(17.0f, juce::Font::bold));
    g.drawText(melodyTitle, leftX + 62.0f, y - 2.0f, 240.0f, 22.0f, juce::Justification::centredLeft);

    // Target Note Pill
    const float targetPillX = leftX + 310.0f;
    const float targetPillW = 95.0f;
    g.setColour(juce::Colour::fromRGB(245, 158, 11).withAlpha(0.2f));
    g.fillRoundedRectangle(targetPillX, y - 2.0f, targetPillW, 22.0f, 6.0f);
    g.setColour(juce::Colour::fromRGB(251, 191, 36));
    g.drawRoundedRectangle(targetPillX, y - 2.0f, targetPillW, 22.0f, 6.0f, 1.2f);
    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    g.drawText("Target: " + targetNoteStr, targetPillX, y - 2.0f, targetPillW, 22.0f, juce::Justification::centred);

    // Live Played Note Pill
    const float playedPillX = targetPillX + targetPillW + 8.0f;
    const float playedPillW = 105.0f;
    juce::Colour playedBg = juce::Colour::fromRGB(30, 41, 59);
    juce::Colour playedBorder = juce::Colour::fromRGB(71, 85, 105);
    juce::Colour playedTextColor = juce::Colour::fromRGB(148, 163, 184);

    if (hasPlayedNote)
    {
        if (!targetNoteStr.isEmpty() || noteIndex > 0)
        {
            if (playedMatchesTarget)
            {
                playedBg = juce::Colour::fromRGB(16, 185, 129).withAlpha(0.2f); // Emerald 500
                playedBorder = juce::Colour::fromRGB(52, 211, 153);
                playedTextColor = juce::Colour::fromRGB(52, 211, 153);
            }
            else
            {
                playedBg = juce::Colour::fromRGB(244, 63, 94).withAlpha(0.2f); // Rose 500
                playedBorder = juce::Colour::fromRGB(251, 113, 133);
                playedTextColor = juce::Colour::fromRGB(251, 113, 133);
            }
        }
        else
        {
            playedBg = juce::Colour::fromRGB(14, 165, 233).withAlpha(0.2f); // Sky 500
            playedBorder = juce::Colour::fromRGB(56, 189, 248);
            playedTextColor = juce::Colour::fromRGB(56, 189, 248);
        }
    }

    g.setColour(playedBg);
    g.fillRoundedRectangle(playedPillX, y - 2.0f, playedPillW, 22.0f, 6.0f);
    g.setColour(playedBorder);
    g.drawRoundedRectangle(playedPillX, y - 2.0f, playedPillW, 22.0f, 6.0f, 1.2f);
    g.setColour(playedTextColor);
    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    g.drawText("Played: " + playedNoteStr, juce::Rectangle<float>(playedPillX, y - 2.0f, playedPillW, 22.0f).toNearestInt(), juce::Justification::centred);

    // Second Row: Timing Feedback & Chord & Stats
    y += 28.0f;

    // Timing Feedback pill
    juce::Colour feedbackBg = juce::Colour::fromRGB(30, 41, 59);
    juce::Colour feedbackText = juce::Colour::fromRGB(148, 163, 184);

    if (currentRating == TimingRating::Perfect)
    {
        feedbackBg = juce::Colour::fromRGB(16, 185, 129).withAlpha(0.2f);
        feedbackText = juce::Colour::fromRGB(52, 211, 153);
    }
    else if (currentRating == TimingRating::Early || currentRating == TimingRating::Late)
    {
        feedbackBg = juce::Colour::fromRGB(245, 158, 11).withAlpha(0.2f);
        feedbackText = juce::Colour::fromRGB(251, 191, 36);
    }
    else if (currentRating == TimingRating::Missed)
    {
        feedbackBg = juce::Colour::fromRGB(244, 63, 94).withAlpha(0.2f);
        feedbackText = juce::Colour::fromRGB(251, 113, 133);
    }

    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    const float textW = static_cast<float>(g.getCurrentFont().getStringWidth(timingFeedbackStr));
    const float pillWidth = std::clamp(textW + 36.0f, 190.0f, 350.0f);
    const float pillHeight = 22.0f;
    g.setColour(feedbackBg);
    g.fillRoundedRectangle(leftX, y, pillWidth, pillHeight, 6.0f);
    g.setColour(feedbackText.withAlpha(0.35f));
    g.drawRoundedRectangle(leftX, y, pillWidth, pillHeight, 6.0f, 1.0f);

    // Dynamic colored status indicator dot
    g.setColour(feedbackText);
    g.fillEllipse(leftX + 8.0f, y + (pillHeight - 8.0f) * 0.5f, 8.0f, 8.0f);

    // Clean feedback text beside status dot
    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    g.drawText(timingFeedbackStr, juce::Rectangle<float>(leftX + 22.0f, y, pillWidth - 26.0f, pillHeight).toNearestInt(), juce::Justification::centredLeft);

    // Streak badge
    const float streakX = leftX + pillWidth + 10.0f;
    g.setColour(juce::Colour::fromRGB(245, 158, 11));
    g.setFont(juce::FontOptions(12.0f, juce::Font::bold));
    g.drawText("Streak: " + juce::String(currentStreak), juce::Rectangle<float>(streakX, y, 78.0f, 22.0f).toNearestInt(), juce::Justification::centredLeft);

    // Accuracy Stats
    const float pitchX = streakX + 82.0f;
    g.setColour(juce::Colour::fromRGB(148, 163, 184));
    g.setFont(juce::FontOptions(11.0f, juce::Font::plain));
    g.drawText("Pitch: " + juce::String(accuracyPercent) + "%", juce::Rectangle<float>(pitchX, y, 70.0f, 22.0f).toNearestInt(), juce::Justification::centredLeft);
    const float rhythmX = pitchX + 72.0f;
    g.drawText("Rhythm: " + juce::String(rhythmPercent) + "%", juce::Rectangle<float>(rhythmX, y, 78.0f, 22.0f).toNearestInt(), juce::Justification::centredLeft);

    const float srX = rhythmX + 80.0f;
    g.setColour(juce::Colour::fromRGB(56, 189, 248)); // Sky 400
    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    g.drawText("Sight-Read: " + juce::String(sightReadingScore) + "%", juce::Rectangle<float>(srX, y, 105.0f, 22.0f).toNearestInt(), juce::Justification::centredLeft);

    if (recoveries > 0)
    {
        const float recX = srX + 108.0f;
        g.setColour(juce::Colour::fromRGB(16, 185, 129));
        g.drawText(juce::String::fromUTF8("\xE2\x9A\xA1 ") + juce::String(recoveries), juce::Rectangle<float>(recX, y, 45.0f, 22.0f).toNearestInt(), juce::Justification::centredLeft);
    }

    // Detected Chord Display
    const float chordX = bounds.getRight() - 250.0f;
    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    g.setColour(juce::Colour::fromRGB(56, 189, 248)); // Sky 400
    g.drawText("Chord: " + chordNameStr, juce::Rectangle<float>(chordX, y, 235.0f, 22.0f).toNearestInt(), juce::Justification::centredRight);
}

} // namespace MidiSheet
