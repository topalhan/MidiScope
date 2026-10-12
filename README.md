# Audio & MIDI Learning Projects 🎵

This workspace contains three core music technology and digital signal processing projects:

---

## 📁 Projects Overview

### 1. `physical_modeling/` 🎻
- **Physical Modeling Synthesizer**: C++ audio synthesis engine simulating acoustic instrument physics, waveguides, and resonator dynamics.
- **Targets**: Standalone and VST3.

### 2. `MidiGlide/` 🎛️
- **Expressive Real-Time MIDI Portamento, Microtuning & Breath Remapper**:
  - 14-Bit analogue pitch bend portamento and stepped glissando with legato phrase detection.
  - Turkish Makam microtuning engine with authentic comma-accurate intonation.
  - Breath-to-modulation remapper with wind shaping curves, deadzones, and live meters.
  - Dual real-time packet monitors (MIDI In / Out) and master panic.
- **Formats**: Standalone and VST3.
- **Repository**: [topalhan/midiGlide](https://github.com/topalhan/midiGlide)

### 3. `MidiScope/` 🎼
- **Interactive Grand Staff Sight-Reading & Melody Trainer**:
  - Real-time Web MIDI Grand Staff engraving, chord detection, and scrolling timeline.
  - In-Tempo & Wait-for-Note practice modes with rhythm assessment.
  - 20-minute daily sight-reading routine and blind in-tempo metronome training.
- **Sub-projects**:
  - `Web/`: Pure zero-dependency modern HTML5 Canvas & Web Audio / Web MIDI application (`index.html`, `app.js`, `notation.js`).
  - `Binary/`: C++20 / JUCE 8 VST3 and Standalone plugin implementation (`src/`, `CMakeLists.txt`).
