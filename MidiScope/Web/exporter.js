/**
 * Zero-dependency Standard MIDI (.mid) and MusicXML (.musicxml) Exporter for MidiScope
 * Enables exporting practice performances (both target reference and played notes)
 * for external AI analysis, score evaluation, and digital audio workstations (DAWs).
 */

import { MusicTheory } from './chords.js';

// MusicXML Key Signature mappings (Human-readable key name -> fifths + mode)
const KEY_NAME_TO_FIFTHS = {
  'C Major': { fifths: 0, mode: 'major' },
  'G Major': { fifths: 1, mode: 'major' },
  'D Major': { fifths: 2, mode: 'major' },
  'A Major': { fifths: 3, mode: 'major' },
  'E Major': { fifths: 4, mode: 'major' },
  'B Major': { fifths: 5, mode: 'major' },
  'F# Major': { fifths: 6, mode: 'major' },
  'C# Major': { fifths: 7, mode: 'major' },
  'F Major': { fifths: -1, mode: 'major' },
  'Bb Major': { fifths: -2, mode: 'major' },
  'Eb Major': { fifths: -3, mode: 'major' },
  'Ab Major': { fifths: -4, mode: 'major' },
  'Db Major': { fifths: -5, mode: 'major' },
  'Gb Major': { fifths: -6, mode: 'major' },
  'Cb Major': { fifths: -7, mode: 'major' },
  'A Minor': { fifths: 0, mode: 'minor' },
  'E Minor': { fifths: 1, mode: 'minor' },
  'B Minor': { fifths: 2, mode: 'minor' },
  'F# Minor': { fifths: 3, mode: 'minor' },
  'C# Minor': { fifths: 4, mode: 'minor' },
  'G# Minor': { fifths: 5, mode: 'minor' },
  'D# Minor': { fifths: 6, mode: 'minor' },
  'A# Minor': { fifths: 7, mode: 'minor' },
  'D Minor': { fifths: -1, mode: 'minor' },
  'G Minor': { fifths: -2, mode: 'minor' },
  'C Minor': { fifths: -3, mode: 'minor' },
  'F Minor': { fifths: -4, mode: 'minor' },
  'Bb Minor': { fifths: -5, mode: 'minor' },
  'Eb Minor': { fifths: -6, mode: 'minor' },
  'Ab Minor': { fifths: -7, mode: 'minor' }
};

/**
 * Variable-Length Quantity (VLQ) encoder for Standard MIDI Files
 */
function toVarLength(value) {
  let val = Math.max(0, Math.round(value));
  const bytes = [val & 0x7f];
  val >>= 7;
  while (val > 0) {
    bytes.unshift((val & 0x7f) | 0x80);
    val >>= 7;
  }
  return bytes;
}

/**
 * Convert string to ASCII bytes array
 */
function stringToBytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes.push(code < 128 ? code : 0x3F); // fallback '?' for non-ascii
  }
  return bytes;
}

/**
 * Builds a Standard MIDI Track (MTrk) chunk from a list of timed events
 * Events: [{ tick, priority, bytes }]
 */
function buildMidiTrackChunk(trackName, events = []) {
  // Add track name meta event at tick 0 if provided
  const allEvents = [];
  if (trackName) {
    const nameBytes = stringToBytes(trackName);
    allEvents.push({
      tick: 0,
      priority: -1,
      bytes: [0xFF, 0x03, ...toVarLength(nameBytes.length), ...nameBytes]
    });
  }

  allEvents.push(...events);

  // Sort events chronologically. On same tick: lower priority executes first
  allEvents.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    return (a.priority || 0) - (b.priority || 0);
  });

  const trackData = [];
  let currentTick = 0;

  for (const ev of allEvents) {
    const delta = Math.max(0, ev.tick - currentTick);
    trackData.push(...toVarLength(delta));
    trackData.push(...ev.bytes);
    currentTick = ev.tick;
  }

  // End of Track Meta Event (0xFF 0x2F 0x00) with delta 0
  trackData.push(...toVarLength(0));
  trackData.push(0xFF, 0x2F, 0x00);

  // Pack into MTrk chunk: 4 bytes 'MTrk' + 4 bytes length + data
  const chunk = [
    0x4D, 0x54, 0x72, 0x6B, // 'MTrk'
    (trackData.length >> 24) & 0xFF,
    (trackData.length >> 16) & 0xFF,
    (trackData.length >> 8) & 0xFF,
    trackData.length & 0xFF,
    ...trackData
  ];

  return chunk;
}

/**
 * Export practice session to Standard MIDI File (SMF Format 1)
 * @param {Object} session - Session data from MelodyTrainer
 * @param {Object} options - { scope: 'dual'|'played'|'reference', includeAnnotations: boolean }
 * @returns {Uint8Array} Binary MIDI file bytes
 */
export function exportToMidi(session, options = {}) {
  const scope = options.scope || 'dual';
  const includeAnnotations = options.includeAnnotations !== false;
  const melody = session?.melody || { title: 'Practice Melody', bpm: 108, timeSignature: [4, 4], key: 'C Major', notes: [] };
  const bpm = session?.bpm || melody.bpm || 108;
  const timeSig = melody.timeSignature || [4, 4];
  const keyName = melody.key || 'C Major';
  const keyInfo = KEY_NAME_TO_FIFTHS[keyName] || { fifths: 0, mode: 'major' };
  const division = 480; // Standard 480 PPQ (ticks per quarter note)

  const tracks = [];

  // ==========================================
  // Track 0: Conductor / Master Meta Track
  // ==========================================
  const conductorEvents = [];

  // Set Tempo Meta Event (0xFF 0x51 0x03)
  const usPerQuarter = Math.round(60000000 / bpm);
  conductorEvents.push({
    tick: 0,
    priority: -2,
    bytes: [
      0xFF, 0x51, 0x03,
      (usPerQuarter >> 16) & 0xFF,
      (usPerQuarter >> 8) & 0xFF,
      usPerQuarter & 0xFF
    ]
  });

  // Time Signature Meta Event (0xFF 0x58 0x04)
  const num = timeSig[0] || 4;
  const denPow = timeSig[1] === 8 ? 3 : (timeSig[1] === 2 ? 1 : 2);
  conductorEvents.push({
    tick: 0,
    priority: -2,
    bytes: [0xFF, 0x58, 0x04, num, denPow, 0x18, 0x08]
  });

  // Key Signature Meta Event (0xFF 0x59 0x02)
  const sf = keyInfo.fifths < 0 ? (256 + keyInfo.fifths) : keyInfo.fifths;
  const mi = keyInfo.mode === 'minor' ? 1 : 0;
  conductorEvents.push({
    tick: 0,
    priority: -2,
    bytes: [0xFF, 0x59, 0x02, sf & 0xFF, mi]
  });

  // Text Marker: Session Info
  const headerInfo = `MidiScope Session: ${melody.title} (${keyName}, ${bpm} BPM, Accuracy: ${session.stats?.accuracy ?? 100}%)`;
  const infoBytes = stringToBytes(headerInfo);
  conductorEvents.push({
    tick: 0,
    priority: -1,
    bytes: [0xFF, 0x01, ...toVarLength(infoBytes.length), ...infoBytes]
  });

  tracks.push(buildMidiTrackChunk(`${melody.title} - Master Track`, conductorEvents));

  // ==========================================
  // Track 1: Target Melody (Reference Ground Truth)
  // ==========================================
  if (scope === 'dual' || scope === 'reference') {
    const targetEvents = [];
    const ch = 0; // MIDI Channel 1 (0-indexed)

    // Program Change: Acoustic Grand Piano (0x00)
    targetEvents.push({
      tick: 0,
      priority: 0,
      bytes: [0xC0 | ch, 0x00]
    });

    let currentBeat = 0;
    const targetNotes = melody.notes || [];

    for (let i = 0; i < targetNotes.length; i++) {
      const n = targetNotes[i];
      const startTick = Math.round(currentBeat * division);
      const durTicks = Math.max(60, Math.round((n.duration || 1) * division));
      const endTick = startTick + durTicks;

      // Note On
      targetEvents.push({
        tick: startTick,
        priority: 2,
        bytes: [0x90 | ch, Math.max(0, Math.min(127, n.midi)), 95]
      });

      // Note Off
      targetEvents.push({
        tick: endTick,
        priority: 1,
        bytes: [0x80 | ch, Math.max(0, Math.min(127, n.midi)), 64]
      });

      currentBeat += (n.duration || 1);
    }

    tracks.push(buildMidiTrackChunk(`Target Reference: ${melody.title}`, targetEvents));
  }

  // ==========================================
  // Track 2: User Performance (What Was Played)
  // ==========================================
  if (scope === 'dual' || scope === 'played') {
    const playedEvents = [];
    const ch = 1; // MIDI Channel 2 (0-indexed)

    // Program Change: Bright Acoustic Piano (0x01) or Electric Piano (0x04)
    playedEvents.push({
      tick: 0,
      priority: 0,
      bytes: [0xC0 | ch, 0x01]
    });

    const isWaitMode = (session.mode === 'wait');
    const noteResults = session.noteResults || [];
    const targetNotes = melody.notes || [];
    const rawEvents = session.playedEvents || [];

    if (isWaitMode || rawEvents.length === 0) {
      // In Wait for Note mode: align notes along the target score timeline so tracks play in sync
      let currentBeat = 0;
      for (let i = 0; i < targetNotes.length; i++) {
        const target = targetNotes[i];
        const res = noteResults[i] || {};
        const dur = target.duration || 1;
        const startTick = Math.round(currentBeat * division);
        const durTicks = Math.max(60, Math.round(dur * division));
        const endTick = startTick + durTicks;

        const eventsForNote = rawEvents.filter(e => e.targetIndex === i);
        const correctEvent = eventsForNote.find(e => e.isMatch);

        let midiToPlay = null;
        const isUncorrected = (res.status === 'mistake');
        const isCorrected = (res.mistakes > 0 && (res.status === 'correct' || correctEvent));

        if (res.status === 'missed') {
          midiToPlay = null;
        } else if (isUncorrected) {
          midiToPlay = res.lastWrongMidi || (eventsForNote.length > 0 ? eventsForNote[eventsForNote.length - 1].midi : target.midi);
        } else {
          midiToPlay = res.playedMidi || correctEvent?.midi || target.midi;
        }

        if (midiToPlay !== null) {
          if (includeAnnotations && isUncorrected) {
            const playedInfo = MusicTheory.getNoteInfo(midiToPlay);
            const markerText = `Mistake: Played ${playedInfo.fullName} (Expected ${target.name})`;
            const mBytes = stringToBytes(markerText);
            playedEvents.push({
              tick: startTick,
              priority: 1,
              bytes: [0xFF, 0x01, ...toVarLength(mBytes.length), ...mBytes]
            });
          } else if (includeAnnotations && isCorrected) {
            const wrongList = (res.wrongNotes && res.wrongNotes.length > 0) ? res.wrongNotes : (res.lastWrongMidi ? [res.lastWrongMidi] : []);
            const wrongNames = wrongList.map(m => MusicTheory.getNoteInfo(m).fullName).join(', ');
            const markerText = `Corrected Note ${i + 1}: Slipped on ${wrongNames}, then hit ${target.name}`;
            const mBytes = stringToBytes(markerText);
            playedEvents.push({
              tick: startTick,
              priority: 1,
              bytes: [0xFF, 0x01, ...toVarLength(mBytes.length), ...mBytes]
            });
          }

          // Note On
          playedEvents.push({
            tick: startTick,
            priority: 3,
            bytes: [0x90 | ch, Math.max(0, Math.min(127, midiToPlay)), 95]
          });

          // Note Off
          playedEvents.push({
            tick: endTick,
            priority: 2,
            bytes: [0x80 | ch, Math.max(0, Math.min(127, midiToPlay)), 64]
          });
        }

        currentBeat += dur;
      }
    } else {
      // In In-Tempo / Strict modes: use recorded millisecond timing offsets
      for (const ev of rawEvents) {
        if (!ev.midi || ev.status === 'missed') continue;

        let startTick;
        if (typeof ev.startOffsetMs === 'number' && ev.startOffsetMs >= 0) {
          const beatPos = ev.startOffsetMs / beatMs;
          startTick = Math.round(beatPos * division);
        } else if (ev.targetIndex !== undefined && targetNotes[ev.targetIndex]) {
          let targetBeat = 0;
          for (let i = 0; i < ev.targetIndex; i++) {
            targetBeat += (targetNotes[i].duration || 1);
          }
          startTick = Math.round(targetBeat * division);
        } else {
          startTick = 0;
        }

        const durMs = ev.durationMs || (beatMs * 0.8);
        const durTicks = Math.max(60, Math.round((durMs / beatMs) * division));
        const endTick = startTick + durTicks;

        if (includeAnnotations && ev.status === 'mistake') {
          const expectedNote = ev.targetNote?.name || (ev.targetIndex !== undefined && targetNotes[ev.targetIndex]?.name) || 'Expected Note';
          const playedInfo = MusicTheory.getNoteInfo(ev.midi);
          const markerText = `Mistake: Played ${playedInfo.fullName} (Expected ${expectedNote})`;
          const mBytes = stringToBytes(markerText);
          playedEvents.push({
            tick: startTick,
            priority: 1,
            bytes: [0xFF, 0x01, ...toVarLength(mBytes.length), ...mBytes]
          });
        }

        // Note On
        playedEvents.push({
          tick: startTick,
          priority: 3,
          bytes: [0x90 | ch, Math.max(0, Math.min(127, ev.midi)), Math.max(1, Math.min(127, ev.velocity || 100))]
        });

        // Note Off
        playedEvents.push({
          tick: endTick,
          priority: 2,
          bytes: [0x80 | ch, Math.max(0, Math.min(127, ev.midi)), 64]
        });
      }
    }

    tracks.push(buildMidiTrackChunk(`User Performance: What You Played`, playedEvents));
  }

  // ==========================================
  // Header Chunk (MThd)
  // ==========================================
  const format = 1; // Format 1: Multiple simultaneous tracks
  const trackCount = tracks.length;

  const header = [
    0x4D, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // length = 6
    (format >> 8) & 0xFF, format & 0xFF,
    (trackCount >> 8) & 0xFF, trackCount & 0xFF,
    (division >> 8) & 0xFF, division & 0xFF
  ];

  // Concatenate header and all track chunks
  let totalLength = header.length;
  for (const trk of tracks) {
    totalLength += trk.length;
  }

  const out = new Uint8Array(totalLength);
  out.set(header, 0);

  let offset = header.length;
  for (const trk of tracks) {
    out.set(trk, offset);
    offset += trk.length;
  }

  return out;
}

/**
 * Convert duration in beats to standard MusicXML note type and dots
 */
function beatsToNoteType(beats) {
  if (beats >= 4) return { type: 'whole', dot: beats >= 6 };
  if (beats >= 3) return { type: 'half', dot: true };
  if (beats >= 2) return { type: 'half', dot: false };
  if (beats >= 1.5) return { type: 'quarter', dot: true };
  if (beats >= 1) return { type: 'quarter', dot: false };
  if (beats >= 0.75) return { type: 'eighth', dot: true };
  if (beats >= 0.5) return { type: 'eighth', dot: false };
  return { type: '16th', dot: false };
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export practice session to MusicXML 3.1 Partwise score
 * @param {Object} session - Session data from MelodyTrainer
 * @param {Object} options - { scope: 'dual'|'played'|'reference', includeAnnotations: boolean }
 * @returns {string} Formatted MusicXML string
 */
export function exportToMusicXml(session, options = {}) {
  const scope = options.scope || 'dual';
  const includeAnnotations = options.includeAnnotations !== false;
  const melody = session?.melody || { title: 'Practice Melody', composer: 'Traditional', bpm: 108, timeSignature: [4, 4], key: 'C Major', notes: [] };
  const bpm = session?.bpm || melody.bpm || 108;
  const timeSig = melody.timeSignature || [4, 4];
  const keyName = melody.key || 'C Major';
  const keyInfo = KEY_NAME_TO_FIFTHS[keyName] || { fifths: 0, mode: 'major' };

  const beatsPerMeasure = timeSig[0] || 4;
  const beatType = timeSig[1] || 4;
  const measureBeatCapacity = beatsPerMeasure * (4 / beatType);
  const divisions = 4; // 1 beat = 4 divisions (quarter note = 4, 16th note = 1)

  const targetNotes = melody.notes || [];
  const noteResults = session.noteResults || [];
  const playedEvents = session.playedEvents || [];

  // Group notes into measures for Reference Part
  const referenceMeasures = [];
  let curRefMeasure = [];
  let curRefBeats = 0;

  for (let i = 0; i < targetNotes.length; i++) {
    const n = targetNotes[i];
    const dur = n.duration || 1;

    // Check if adding this note exceeds current measure capacity
    if (curRefBeats + dur > measureBeatCapacity + 0.05 && curRefMeasure.length > 0) {
      referenceMeasures.push(curRefMeasure);
      curRefMeasure = [];
      curRefBeats = 0;
    }

    curRefMeasure.push({
      index: i,
      midi: n.midi,
      duration: dur,
      name: n.name
    });
    curRefBeats += dur;
  }
  if (curRefMeasure.length > 0) {
    referenceMeasures.push(curRefMeasure);
  }

  // Build Played Note slots aligned measure-by-measure
  const playedMeasures = [];
  let curPlayMeasure = [];
  let curPlayBeats = 0;

  for (let i = 0; i < targetNotes.length; i++) {
    const target = targetNotes[i];
    const dur = target.duration || 1;
    const res = noteResults[i] || {};

    const eventsForNote = playedEvents.filter(e => e.targetIndex === i);
    const correctEvent = eventsForNote.find(e => e.isMatch);

    let playedMidi = null;
    const isMissed = (res.status === 'missed');
    const isUncorrectedMistake = (res.status === 'mistake');
    const isCorrectedMistake = (res.mistakes > 0 && (res.status === 'correct' || !!correctEvent));
    let annotation = null;

    if (isMissed) {
      playedMidi = null;
      annotation = '🔴 Missed (Not played)';
    } else if (isUncorrectedMistake) {
      // In strict / tempo mode where playback advanced without waiting for fix
      playedMidi = res.lastWrongMidi || (eventsForNote.length > 0 ? eventsForNote[eventsForNote.length - 1].midi : target.midi);
      const wrongInfo = MusicTheory.getNoteInfo(playedMidi);
      annotation = `❌ Played ${wrongInfo.fullName} (Expected ${target.name})`;
    } else if (isCorrectedMistake) {
      // In wait mode or corrected hit: user completed the note correctly!
      playedMidi = res.playedMidi || correctEvent?.midi || target.midi;
      const wrongList = (res.wrongNotes && res.wrongNotes.length > 0)
        ? res.wrongNotes
        : (res.lastWrongMidi ? [res.lastWrongMidi] : []);
      const wrongNames = wrongList.length > 0
        ? wrongList.map(m => MusicTheory.getNoteInfo(m).fullName).join(', ')
        : 'wrong note';
      annotation = `⚠️ Corrected (1st tried: ${wrongNames})`;
    } else {
      // Struck correctly on first try
      playedMidi = res.playedMidi || correctEvent?.midi || target.midi;
      const timingText = res.timing?.text || correctEvent?.timing?.text;
      annotation = timingText || '✓ Correct';
    }

    if (curPlayBeats + dur > measureBeatCapacity + 0.05 && curPlayMeasure.length > 0) {
      playedMeasures.push(curPlayMeasure);
      curPlayMeasure = [];
      curPlayBeats = 0;
    }

    curPlayMeasure.push({
      index: i,
      midi: playedMidi,
      isMissed,
      isMistake: isUncorrectedMistake,
      isCorrected: isCorrectedMistake,
      duration: dur,
      annotation
    });
    curPlayBeats += dur;
  }
  if (curPlayMeasure.length > 0) {
    playedMeasures.push(curPlayMeasure);
  }

  // Ensure measure counts align across both parts
  const totalMeasures = Math.max(referenceMeasures.length, playedMeasures.length, 1);

  // XML Builder
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${escapeXml(melody.title)} (Practice Assessment)</work-title>
  </work>
  <identification>
    <creator type="composer">${escapeXml(melody.composer || 'Traditional')}</creator>
    <rights>Exported by MidiScope for AI Assessment</rights>
    <encoding>
      <software>MidiScope Accuracy Assessment Engine</software>
      <encoding-date>${new Date().toISOString().split('T')[0]}</encoding-date>
    </encoding>
  </identification>
  <part-list>
`;

  if (scope === 'dual' || scope === 'reference') {
    xml += `    <score-part id="P1">
      <part-name>Target Melody (Reference)</part-name>
      <score-instrument id="P1-I1">
        <instrument-name>Acoustic Grand Piano</instrument-name>
      </score-instrument>
    </score-part>
`;
  }

  if (scope === 'dual' || scope === 'played') {
    const partId = (scope === 'played') ? 'P1' : 'P2';
    xml += `    <score-part id="${partId}">
      <part-name>User Performance (Played)</part-name>
      <score-instrument id="${partId}-I1">
        <instrument-name>MIDI Performance</instrument-name>
      </score-instrument>
    </score-part>
`;
  }

  xml += `  </part-list>
`;

  // Render Part 1: Target Reference
  if (scope === 'dual' || scope === 'reference') {
    xml += `  <part id="P1">\n`;
    for (let m = 0; m < totalMeasures; m++) {
      const measureNotes = referenceMeasures[m] || [];
      xml += `    <measure number="${m + 1}">\n`;

      if (m === 0) {
        xml += `      <attributes>
        <divisions>${divisions}</divisions>
        <key>
          <fifths>${keyInfo.fifths}</fifths>
          <mode>${keyInfo.mode}</mode>
        </key>
        <time>
          <beats>${timeSig[0]}</beats>
          <beat-type>${timeSig[1]}</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction>
        <sound tempo="${bpm}"/>
      </direction>
`;
      }

      if (measureNotes.length === 0) {
        // Empty measure rest
        xml += `      <note>
        <rest/>
        <duration>${measureBeatCapacity * divisions}</duration>
        <type>whole</type>
      </note>\n`;
      } else {
        for (const n of measureNotes) {
          const info = MusicTheory.getNoteInfo(n.midi);
          const typeInfo = beatsToNoteType(n.duration);
          const durDivs = Math.round(n.duration * divisions);

          xml += `      <note>\n`;
          xml += `        <pitch>\n`;
          xml += `          <step>${info.letter}</step>\n`;
          if (info.accidental === '#') xml += `          <alter>1</alter>\n`;
          if (info.accidental === 'b') xml += `          <alter>-1</alter>\n`;
          xml += `          <octave>${info.octave}</octave>\n`;
          xml += `        </pitch>\n`;
          xml += `        <duration>${durDivs}</duration>\n`;
          xml += `        <type>${typeInfo.type}</type>\n`;
          if (typeInfo.dot) xml += `        <dot/>\n`;
          xml += `      </note>\n`;
        }
      }

      xml += `    </measure>\n`;
    }
    xml += `  </part>\n`;
  }

  // Render Part 2: User Performance
  if (scope === 'dual' || scope === 'played') {
    const partId = (scope === 'played') ? 'P1' : 'P2';
    xml += `  <part id="${partId}">\n`;

    for (let m = 0; m < totalMeasures; m++) {
      const measureNotes = playedMeasures[m] || [];
      xml += `    <measure number="${m + 1}">\n`;

      if (m === 0) {
        xml += `      <attributes>
        <divisions>${divisions}</divisions>
        <key>
          <fifths>${keyInfo.fifths}</fifths>
          <mode>${keyInfo.mode}</mode>
        </key>
        <time>
          <beats>${timeSig[0]}</beats>
          <beat-type>${timeSig[1]}</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
`;
      }

      if (measureNotes.length === 0) {
        xml += `      <note>
        <rest/>
        <duration>${measureBeatCapacity * divisions}</duration>
        <type>whole</type>
      </note>\n`;
      } else {
        for (const pn of measureNotes) {
          const typeInfo = beatsToNoteType(pn.duration);
          const durDivs = Math.round(pn.duration * divisions);

          if (pn.isMissed || pn.midi === null) {
            // Note missed: write musical rest with annotation
            xml += `      <note>\n`;
            xml += `        <rest/>\n`;
            xml += `        <duration>${durDivs}</duration>\n`;
            xml += `        <type>${typeInfo.type}</type>\n`;
            if (typeInfo.dot) xml += `        <dot/>\n`;
            if (includeAnnotations && pn.annotation) {
              xml += `        <lyric number="1">\n`;
              xml += `          <syllabic>single</syllabic>\n`;
              xml += `          <text>${escapeXml(pn.annotation)}</text>\n`;
              xml += `        </lyric>\n`;
            }
            xml += `      </note>\n`;
          } else {
            // Played note
            const info = MusicTheory.getNoteInfo(pn.midi);
            xml += `      <note>\n`;
            xml += `        <pitch>\n`;
            xml += `          <step>${info.letter}</step>\n`;
            if (info.accidental === '#') xml += `          <alter>1</alter>\n`;
            if (info.accidental === 'b') xml += `          <alter>-1</alter>\n`;
            xml += `          <octave>${info.octave}</octave>\n`;
            xml += `        </pitch>\n`;
            xml += `        <duration>${durDivs}</duration>\n`;
            xml += `        <type>${typeInfo.type}</type>\n`;
            if (typeInfo.dot) xml += `        <dot/>\n`;

            if (includeAnnotations && pn.annotation) {
              xml += `        <lyric number="1">\n`;
              xml += `          <syllabic>single</syllabic>\n`;
              xml += `          <text>${escapeXml(pn.annotation)}</text>\n`;
              xml += `        </lyric>\n`;
            }
            xml += `      </note>\n`;
          }
        }
      }

      xml += `    </measure>\n`;
    }
    xml += `  </part>\n`;
  }

  xml += `</score-partwise>\n`;
  return xml;
}

/**
 * Triggers a browser file download from a Blob or raw content
 */
export function downloadFile(content, fileName, mimeType = 'application/octet-stream') {
  let blob;
  if (content instanceof Blob) {
    blob = content;
  } else if (content instanceof Uint8Array || content instanceof ArrayBuffer) {
    blob = new Blob([content], { type: mimeType });
  } else {
    blob = new Blob([content], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 250);
}

/**
 * Generate a comprehensive AI evaluation prompt that users can copy
 * and paste into ChatGPT, Claude, Gemini, etc. alongside the exported file.
 */
export function generateAiPrompt(session, format = 'midi') {
  const melody = session?.melody || { title: 'Practice Excerpt', composer: 'Traditional', bpm: 108, key: 'C Major' };
  const bpm = session?.bpm || melody.bpm || 108;
  const key = melody.key || 'C Major';
  const modeName = session?.mode === 'wait' ? 'Wait for Note (Practice)' : session?.mode === 'strict' ? 'Strict Time (No-Pause)' : (session?.mode || 'Wait for Note');
  const stats = session?.stats || {};
  const accuracy = stats.accuracy !== undefined ? `${stats.accuracy}%` : 'N/A';
  const rhythmAccuracy = stats.rhythmAccuracy !== undefined ? `${stats.rhythmAccuracy}%` : 'N/A';
  const mistakeCount = stats.mistakeCount ?? 0;
  const missedNotes = stats.missedNotes ?? 0;
  const fileExt = format === 'musicxml' ? '.musicxml' : '.mid';
  const formatName = format === 'musicxml' ? 'MusicXML digital sheet music' : 'Standard MIDI (SMF Format 1)';

  return `I have attached my practice performance export (${fileExt}) from MidiScope for "${melody.title}" by ${melody.composer || 'Traditional'}.

Format: ${formatName}
Practice Session Details:
- Key Signature: ${key}
- Target Tempo: ${bpm} BPM
- Practice Mode: ${modeName}
- Pitch Accuracy Score: ${accuracy}
- Rhythm Timing Score: ${rhythmAccuracy}
- Pitch Mistakes / Slipped Notes: ${mistakeCount}
- Missed / Expired Notes: ${missedNotes}

Score / Track Layout:
- Part 1 (Reference): The target sheet music as written.
- Part 2 (Performance): What I actually struck on my MIDI instrument.

Annotation Legend in Part 2:
- First-try correct notes have timing tags (e.g., 🟢 Perfect, 🟡 Early, 🟡 Late).
- Slipped attempts that were corrected are annotated: ⚠️ Corrected (1st tried: [wrong pitch]).
- Uncorrected mistakes are annotated: ❌ Played [wrong pitch] (Expected [target pitch]).
- Expired/unplayed notes are annotated: 🔴 Missed.

Please evaluate my performance:
1. Pitch Precision: Focus on the specific measures where I slipped or hesitated (check ⚠️ Corrected and ❌ Mistake annotations). What likely caused them (e.g. key signature confusion, accidental shifts, wide interval leaps)?
2. Rhythm & Flow: How was my timing consistency at ${bpm} BPM?
3. Actionable Advice: 3 specific practice drills to eliminate these errors on my next playthrough.`;
}
