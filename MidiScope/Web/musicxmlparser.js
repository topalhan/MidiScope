/**
 * Zero-dependency MusicXML (.musicxml, .xml, .mxl) Parser for MidiScope
 * Converts standard digital sheet music files into structured Melody objects
 * for real-time Grand Staff notation and practice accuracy scoring.
 * Supports multi-part inspection, part selection, chord note handling,
 * measure timeline alignment, and compressed .mxl (ZIP) archives.
 */

import { MusicTheory } from './chords.js';

// MusicXML Key Signature mappings (fifths + mode -> Human-readable key name)
const KEY_SIGNATURES = {
  '0:major': 'C Major', '1:major': 'G Major', '2:major': 'D Major', '3:major': 'A Major',
  '4:major': 'E Major', '5:major': 'B Major', '6:major': 'F# Major', '7:major': 'C# Major',
  '-1:major': 'F Major', '-2:major': 'Bb Major', '-3:major': 'Eb Major', '-4:major': 'Ab Major',
  '-5:major': 'Db Major', '-6:major': 'Gb Major', '-7:major': 'Cb Major',
  '0:minor': 'A Minor', '1:minor': 'E Minor', '2:minor': 'B Minor', '3:minor': 'F# Minor',
  '4:minor': 'C# Minor', '5:minor': 'G# Minor', '6:minor': 'D# Minor', '7:minor': 'A# Minor',
  '-1:minor': 'D Minor', '-2:minor': 'G Minor', '-3:minor': 'C Minor', '-4:minor': 'F Minor',
  '-5:minor': 'Bb Minor', '-6:minor': 'Eb Minor', '-7:minor': 'Ab Minor'
};

const STEP_SEMITONES = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
};

/**
 * Quantize beat duration to standard musical note values
 */
export function quantizeDuration(beats) {
  const standardValues = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0, 8.0];
  if (beats <= 0.3) return 0.25;

  let closest = standardValues[0];
  let minDiff = Math.abs(beats - closest);

  for (let i = 1; i < standardValues.length; i++) {
    const diff = Math.abs(beats - standardValues[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = standardValues[i];
    }
  }

  if (minDiff < 0.2) return closest;
  return Math.max(0.25, Math.round(beats * 4) / 4);
}

/**
 * Estimate practice difficulty rating from notes
 */
export function estimateDifficulty(notes, bpm) {
  if (notes.length < 18 && bpm <= 110) return 'Easy';

  let accidentals = 0;
  let wideLeaps = 0;
  for (let i = 0; i < notes.length; i++) {
    const semitone = notes[i].midi % 12;
    if ([1, 3, 6, 8, 10].includes(semitone)) accidentals++;
    if (i > 0 && Math.abs(notes[i].midi - notes[i - 1].midi) >= 7) wideLeaps++;
  }

  if (accidentals >= 5 || wideLeaps >= 4 || notes.length > 55 || bpm >= 135) {
    return 'Advanced';
  }
  if (accidentals >= 2 || notes.length > 25 || bpm >= 115) {
    return 'Medium';
  }
  return 'Easy';
}

/**
 * Minimal Deflate fallback decompression (RFC 1951) for compressed .mxl archives
 * when browser DecompressionStream is not available.
 */
function inflateRawFallback(data) {
  // Simple uncompressed or fallback handling
  // Most modern browsers will use DecompressionStream natively.
  throw new Error('DecompressionStream is required to decompress .mxl archives.');
}

/**
 * Decompress raw deflate stream (RFC 1951) using DecompressionStream
 */
async function decompressDeflateRaw(bytes) {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const response = new Response(ds.readable);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (err) {
      // Some engines expect zlib header; try standard deflate
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const response = new Response(ds.readable);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
  }
  return inflateRawFallback(bytes);
}

/**
 * Unpack a ZIP archive (.mxl) in pure JavaScript and extract MusicXML text
 * @param {ArrayBuffer} buffer - Raw ZIP bytes
 * @returns {Promise<string>} Extracted MusicXML UTF-8 string
 */
async function extractMxlXml(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const textDecoder = new TextDecoder('utf-8');

  // Verify PK signature
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4B || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    throw new Error('Not a valid compressed .mxl ZIP archive.');
  }

  // Find End of Central Directory (EOCD)
  let eocdOffset = -1;
  const maxScan = Math.min(buffer.byteLength, 65557 + 22);
  for (let i = buffer.byteLength - 22; i >= buffer.byteLength - maxScan; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  const zipEntries = [];

  if (eocdOffset !== -1) {
    const entryCount = view.getUint16(eocdOffset + 10, true);
    let cdOffset = view.getUint32(eocdOffset + 16, true);

    for (let e = 0; e < entryCount; e++) {
      if (cdOffset + 46 > buffer.byteLength) break;
      const sig = view.getUint32(cdOffset, true);
      if (sig !== 0x02014b50) break;

      const compressionMethod = view.getUint16(cdOffset + 10, true);
      const compressedSize = view.getUint32(cdOffset + 20, true);
      const uncompressedSize = view.getUint32(cdOffset + 24, true);
      const fileNameLength = view.getUint16(cdOffset + 28, true);
      const extraLength = view.getUint16(cdOffset + 30, true);
      const commentLength = view.getUint16(cdOffset + 32, true);
      const localHeaderOffset = view.getUint32(cdOffset + 42, true);

      const nameBytes = bytes.subarray(cdOffset + 46, cdOffset + 46 + fileNameLength);
      const fileName = textDecoder.decode(nameBytes);

      zipEntries.push({
        fileName,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset
      });

      cdOffset += 46 + fileNameLength + extraLength + commentLength;
    }
  } else {
    // Fallback: Scan sequential local headers (PK\x03\x04)
    let offset = 0;
    while (offset + 30 < buffer.byteLength) {
      const sig = view.getUint32(offset, true);
      if (sig !== 0x04034b50) break;

      const compressionMethod = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const uncompressedSize = view.getUint32(offset + 22, true);
      const fileNameLength = view.getUint16(offset + 26, true);
      const extraLength = view.getUint16(offset + 28, true);

      const nameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLength);
      const fileName = textDecoder.decode(nameBytes);

      zipEntries.push({
        fileName,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset: offset
      });

      offset += 30 + fileNameLength + extraLength + compressedSize;
    }
  }

  if (zipEntries.length === 0) {
    throw new Error('No files found inside .mxl archive.');
  }

  // Helper to extract content of a given zip entry
  async function extractEntry(entry) {
    const locOffset = entry.localHeaderOffset;
    const locNameLen = view.getUint16(locOffset + 26, true);
    const locExtraLen = view.getUint16(locOffset + 28, true);
    const dataStart = locOffset + 30 + locNameLen + locExtraLen;
    const compressedData = bytes.subarray(dataStart, dataStart + entry.compressedSize);

    if (entry.compressionMethod === 0) {
      // Stored (no compression)
      return textDecoder.decode(compressedData);
    } else if (entry.compressionMethod === 8) {
      // Deflate
      const decompressedBytes = await decompressDeflateRaw(compressedData);
      return textDecoder.decode(decompressedBytes);
    } else {
      throw new Error(`Unsupported compression method (${entry.compressionMethod}) in .mxl file.`);
    }
  }

  // 1. Check for META-INF/container.xml
  let targetEntry = null;
  const containerEntry = zipEntries.find(e => e.fileName === 'META-INF/container.xml');
  if (containerEntry) {
    try {
      const containerText = await extractEntry(containerEntry);
      const dom = new DOMParser().parseFromString(containerText, 'application/xml');
      const rootfile = dom.querySelector('rootfile');
      if (rootfile) {
        const fullPath = rootfile.getAttribute('full-path');
        if (fullPath) {
          targetEntry = zipEntries.find(e => e.fileName === fullPath);
        }
      }
    } catch (e) {
      console.warn('Could not parse container.xml in .mxl:', e);
    }
  }

  // 2. Fallback: find first XML file that is not container or macOS resource fork
  if (!targetEntry) {
    targetEntry = zipEntries.find(e => 
      (e.fileName.endsWith('.xml') || e.fileName.endsWith('.musicxml')) &&
      !e.fileName.startsWith('META-INF/') &&
      !e.fileName.startsWith('__MACOSX/')
    );
  }

  if (!targetEntry) {
    throw new Error('No valid MusicXML file found inside .mxl archive.');
  }

  return await extractEntry(targetEntry);
}

/**
 * Resolve any input (ArrayBuffer, Uint8Array, or string) to a parsed XML Document
 */
export async function getMusicXmlDocument(source) {
  let xmlString = '';

  // Handle Blob/File objects
  if (source && typeof source.arrayBuffer === 'function') {
    source = await source.arrayBuffer();
  }

  if (typeof source === 'string') {
    xmlString = source;
  } else if (source && (source instanceof ArrayBuffer || ArrayBuffer.isView(source) || Object.prototype.toString.call(source) === '[object ArrayBuffer]' || source.byteLength !== undefined)) {
    const buffer = source.buffer ? source.buffer : source;
    const bytes = new Uint8Array(buffer);

    // Check for ZIP magic signature (PK\x03\x04)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      xmlString = await extractMxlXml(buffer);
    } else {
      xmlString = new TextDecoder('utf-8').decode(bytes);
    }
  } else {
    throw new Error('Unsupported MusicXML source type.');
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

  // Check for DOMParser errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`XML Parse Error: ${parseError.textContent.trim().slice(0, 120)}`);
  }

  // Verify this is a MusicXML document
  const isPartwise = xmlDoc.querySelector('score-partwise') !== null;
  const isTimewise = xmlDoc.querySelector('score-timewise') !== null;
  if (!isPartwise && !isTimewise) {
    throw new Error('Invalid format: XML does not contain a <score-partwise> or <score-timewise> root.');
  }

  return xmlDoc;
}

/**
 * Convert MusicXML pitch step, alter, and octave into a MIDI note number (0-127)
 */
function pitchToMidi(step, alter, octave) {
  if (!step || typeof octave !== 'number') return null;
  const base = STEP_SEMITONES[step.toUpperCase()];
  if (base === undefined) return null;
  const midi = (octave + 1) * 12 + base + Math.round(alter || 0);
  return Math.max(0, Math.min(127, midi));
}

/**
 * Inspect available parts and musical metadata in a MusicXML file
 * @param {ArrayBuffer|string} source - Raw bytes or XML text
 * @param {string} fileName - File name
 * @returns {Promise<object>} { fileName, tempoBpm, timeSignature, detectedKey, parts: [...] }
 */
export async function inspectMusicXml(source, fileName = 'score.musicxml') {
  const xmlDoc = await getMusicXmlDocument(source);

  // 1. Detect Piece Title
  let title = '';
  const workTitle = xmlDoc.querySelector('work > work-title')?.textContent?.trim();
  const movementTitle = xmlDoc.querySelector('movement-title')?.textContent?.trim();
  if (workTitle) title = workTitle;
  else if (movementTitle) title = movementTitle;
  else {
    title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // 2. Detect Composer
  let composer = 'Custom Import';
  const compElem = xmlDoc.querySelector('creator[type="composer"]') || xmlDoc.querySelector('creator');
  if (compElem?.textContent?.trim()) {
    composer = compElem.textContent.trim();
  }

  // 3. Detect Tempo (BPM)
  let tempoBpm = 120;
  const soundTempo = xmlDoc.querySelector('sound[tempo]');
  if (soundTempo) {
    const parsed = parseFloat(soundTempo.getAttribute('tempo'));
    if (parsed > 0) tempoBpm = Math.round(parsed);
  } else {
    const metronomePerMin = xmlDoc.querySelector('metronome > per-minute')?.textContent?.trim();
    if (metronomePerMin) {
      const parsed = parseFloat(metronomePerMin);
      if (parsed > 0) tempoBpm = Math.round(parsed);
    }
  }

  // 4. Detect Time Signature
  let timeSignature = [4, 4];
  const timeElem = xmlDoc.querySelector('time');
  if (timeElem) {
    const beats = parseInt(timeElem.querySelector('beats')?.textContent?.trim(), 10);
    const beatType = parseInt(timeElem.querySelector('beat-type')?.textContent?.trim(), 10);
    if (beats > 0 && beatType > 0) {
      timeSignature = [beats, beatType];
    } else if (timeElem.getAttribute('symbol') === 'cut') {
      timeSignature = [2, 2];
    }
  }

  // 5. Detect Key Signature
  let detectedKey = 'C Major';
  const keyElem = xmlDoc.querySelector('key');
  if (keyElem) {
    const fifths = keyElem.querySelector('fifths')?.textContent?.trim() || '0';
    const mode = (keyElem.querySelector('mode')?.textContent?.trim() || 'major').toLowerCase();
    const keyLookup = `${fifths}:${mode}`;
    if (KEY_SIGNATURES[keyLookup]) {
      detectedKey = KEY_SIGNATURES[keyLookup];
    } else if (KEY_SIGNATURES[`${fifths}:major`]) {
      detectedKey = KEY_SIGNATURES[`${fifths}:major`];
    }
  }

  // 6. Inspect Parts
  const scoreParts = xmlDoc.querySelectorAll('part-list > score-part');
  const partList = [];

  scoreParts.forEach((sp, idx) => {
    const partId = sp.getAttribute('id');
    const partName = sp.querySelector('part-name')?.textContent?.trim() || `Part ${idx + 1}`;
    const instrumentName = sp.querySelector('instrument-name')?.textContent?.trim() || partName;

    // Count playable notes in this part
    const partNode = xmlDoc.querySelector(`part[id="${partId}"]`);
    let noteCount = 0;
    let minMidi = 127;
    let maxMidi = 0;

    if (partNode) {
      const notes = partNode.querySelectorAll('note');
      notes.forEach(n => {
        // Exclude rests and unpitched
        if (n.querySelector('rest') || n.querySelector('unpitched')) return;
        const step = n.querySelector('pitch > step')?.textContent?.trim();
        const octave = parseInt(n.querySelector('pitch > octave')?.textContent?.trim(), 10);
        const alter = parseFloat(n.querySelector('pitch > alter')?.textContent?.trim() || 0);

        if (step && !isNaN(octave)) {
          const midi = pitchToMidi(step, alter, octave);
          if (midi !== null) {
            noteCount++;
            if (midi < minMidi) minMidi = midi;
            if (midi > maxMidi) maxMidi = midi;
          }
        }
      });
    }

    if (noteCount > 0) {
      const minNoteInfo = MusicTheory.getNoteInfo(minMidi, false);
      const maxNoteInfo = MusicTheory.getNoteInfo(maxMidi, false);
      const pitchRange = (minNoteInfo && maxNoteInfo)
        ? `${minNoteInfo.name} – ${maxNoteInfo.name}`
        : `${minMidi} – ${maxMidi}`;

      partList.push({
        partId,
        partNumber: idx + 1,
        name: partName,
        instrumentName,
        noteCount,
        pitchRange,
        minMidi,
        maxMidi
      });
    }
  });

  return {
    fileName,
    title,
    composer,
    fileType: 'musicxml',
    tempoBpm,
    timeSignature,
    detectedKey,
    parts: partList
  };
}

/**
 * Parse an entire MusicXML file (or selected part) into a structured Melody object for MelodyTrainer
 * @param {ArrayBuffer|string} source - Raw bytes or XML text
 * @param {string} fileName - File name
 * @param {string|null} targetPartId - Optional part ID ('P1', 'P2') to extract, or null for all/lead
 * @returns {Promise<object>} Structured melody object
 */
export async function parseMusicXml(source, fileName = 'score.musicxml', targetPartId = null) {
  const xmlDoc = await getMusicXmlDocument(source);

  // 1. Detect Metadata
  let title = '';
  const workTitle = xmlDoc.querySelector('work > work-title')?.textContent?.trim();
  const movementTitle = xmlDoc.querySelector('movement-title')?.textContent?.trim();
  if (workTitle) title = workTitle;
  else if (movementTitle) title = movementTitle;
  else {
    title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  let composer = 'Custom Import';
  const compElem = xmlDoc.querySelector('creator[type="composer"]') || xmlDoc.querySelector('creator');
  if (compElem?.textContent?.trim()) {
    composer = compElem.textContent.trim();
  }

  let tempoBpm = 120;
  const soundTempo = xmlDoc.querySelector('sound[tempo]');
  if (soundTempo) {
    const parsed = parseFloat(soundTempo.getAttribute('tempo'));
    if (parsed > 0) tempoBpm = Math.round(parsed);
  } else {
    const metronomePerMin = xmlDoc.querySelector('metronome > per-minute')?.textContent?.trim();
    if (metronomePerMin) {
      const parsed = parseFloat(metronomePerMin);
      if (parsed > 0) tempoBpm = Math.round(parsed);
    }
  }

  let timeSignature = [4, 4];
  const timeElem = xmlDoc.querySelector('time');
  if (timeElem) {
    const beats = parseInt(timeElem.querySelector('beats')?.textContent?.trim(), 10);
    const beatType = parseInt(timeElem.querySelector('beat-type')?.textContent?.trim(), 10);
    if (beats > 0 && beatType > 0) {
      timeSignature = [beats, beatType];
    } else if (timeElem.getAttribute('symbol') === 'cut') {
      timeSignature = [2, 2];
    }
  }

  let detectedKey = 'C Major';
  let fifthsNum = 0;
  const keyElem = xmlDoc.querySelector('key');
  if (keyElem) {
    const fifthsStr = keyElem.querySelector('fifths')?.textContent?.trim() || '0';
    fifthsNum = parseInt(fifthsStr, 10) || 0;
    const modeElem = keyElem.querySelector('mode');
    const mode = modeElem ? modeElem.textContent.trim().toLowerCase() : null;
    if (mode && KEY_SIGNATURES[`${fifthsStr}:${mode}`]) {
      detectedKey = KEY_SIGNATURES[`${fifthsStr}:${mode}`];
    } else if (KEY_SIGNATURES[`${fifthsStr}:major`]) {
      detectedKey = KEY_SIGNATURES[`${fifthsStr}:major`];
    }
  }

  // 2. Select Target Parts
  let partNodes = [];
  let partSuffix = '';
  const totalScoreParts = xmlDoc.querySelectorAll('part-list > score-part').length;

  if (targetPartId) {
    const singlePart = xmlDoc.querySelector(`part[id="${targetPartId}"]`);
    if (singlePart) {
      partNodes.push(singlePart);
      if (totalScoreParts > 1) {
        const sp = xmlDoc.querySelector(`part-list > score-part[id="${targetPartId}"]`);
        const partName = sp?.querySelector('part-name')?.textContent?.trim();
        if (partName) partSuffix = ` (${partName})`;
      }
    }
  }

  if (partNodes.length === 0) {
    partNodes = Array.from(xmlDoc.querySelectorAll('part'));
  }

  if (partNodes.length === 0) {
    throw new Error('No musical parts found in this MusicXML file.');
  }

  // 3. Extract Note Spans with accurate timeline alignment
  const allNoteSpans = [];

  for (const part of partNodes) {
    let currentDivisions = 4; // Default divisions per quarter note
    let cumulativeBeats = 0.0;

    const measures = part.querySelectorAll('measure');
    for (const measure of measures) {
      // Check for divisions update in attributes
      const divElem = measure.querySelector('attributes > divisions');
      if (divElem) {
        const parsedDiv = parseFloat(divElem.textContent.trim());
        if (parsedDiv > 0) currentDivisions = parsedDiv;
      }

      // Check for mid-piece tempo change
      const measureSound = measure.querySelector('sound[tempo]');
      if (measureSound && allNoteSpans.length === 0) {
        const parsed = parseFloat(measureSound.getAttribute('tempo'));
        if (parsed > 0) tempoBpm = Math.round(parsed);
      }

      // Inside measure timeline tracking
      let localDivisions = 0.0;
      let prevNoteStartDivisions = 0.0;
      let maxLocalDivisions = 0.0;

      const children = Array.from(measure.children);
      for (const child of children) {
        const tagName = child.tagName.toLowerCase();

        if (tagName === 'backup') {
          const dur = parseFloat(child.querySelector('duration')?.textContent?.trim() || 0);
          localDivisions = Math.max(0, localDivisions - dur);
        } else if (tagName === 'forward') {
          const dur = parseFloat(child.querySelector('duration')?.textContent?.trim() || 0);
          localDivisions += dur;
          maxLocalDivisions = Math.max(maxLocalDivisions, localDivisions);
        } else if (tagName === 'note') {
          const isChord = child.querySelector('chord') !== null;
          const isRest = child.querySelector('rest') !== null;
          const isUnpitched = child.querySelector('unpitched') !== null;
          const durDivisions = parseFloat(child.querySelector('duration')?.textContent?.trim() || 0);

          let noteStartDivisions = localDivisions;
          if (isChord) {
            noteStartDivisions = prevNoteStartDivisions;
          } else {
            prevNoteStartDivisions = localDivisions;
            localDivisions += durDivisions;
            maxLocalDivisions = Math.max(maxLocalDivisions, localDivisions);
          }

          if (isRest || isUnpitched || durDivisions <= 0) {
            continue;
          }

          const step = child.querySelector('pitch > step')?.textContent?.trim();
          const octave = parseInt(child.querySelector('pitch > octave')?.textContent?.trim(), 10);
          const alter = parseFloat(child.querySelector('pitch > alter')?.textContent?.trim() || 0);

          if (!step || isNaN(octave)) continue;
          const midi = pitchToMidi(step, alter, octave);
          if (midi === null) continue;

          const accidentalElem = child.querySelector('accidental');
          const explicitAccidental = accidentalElem ? accidentalElem.textContent.trim().toLowerCase() : null;

          const notationsElem = child.querySelector('notations');
          let slurStart = false;
          let slurStop = false;
          let isStaccato = false;
          if (notationsElem) {
            if (notationsElem.querySelector('slur[type="start"]')) slurStart = true;
            if (notationsElem.querySelector('slur[type="stop"]')) slurStop = true;
            if (notationsElem.querySelector('staccato')) isStaccato = true;
          }

          const startBeat = cumulativeBeats + (noteStartDivisions / currentDivisions);
          const durationBeats = durDivisions / currentDivisions;

          // Check for tie continuation (tie stop)
          const tieStop = child.querySelector('tie[type="stop"], tied[type="stop"]');
          const isTieStart = child.querySelector('tie[type="start"], tied[type="start"]') !== null;

          if (tieStop && allNoteSpans.length > 0) {
            // Find preceding note with same pitch to extend duration
            const prevMatching = allNoteSpans.slice().reverse().find(n => n.midi === midi && Math.abs((n.startBeat + n.durationBeats) - startBeat) < 0.1);
            if (prevMatching) {
              prevMatching.durationBeats += durationBeats;
              continue;
            }
          }

          allNoteSpans.push({
            midi,
            startBeat,
            durationBeats,
            isTieStart,
            explicitAccidental,
            step,
            alter,
            slurStart,
            slurStop,
            staccato: isStaccato
          });
        }
      }

      // Advance measure cumulative beats
      const measureBeats = maxLocalDivisions > 0 
        ? maxLocalDivisions / currentDivisions 
        : (timeSignature[0] * (4 / timeSignature[1]));

      cumulativeBeats += measureBeats;
    }
  }

  if (allNoteSpans.length === 0) {
    throw new Error(targetPartId 
      ? `No playable notes found in part ${targetPartId}.` 
      : 'No playable notes could be extracted from this MusicXML file.');
  }

  // 4. Sort notes chronologically
  allNoteSpans.sort((a, b) => a.startBeat - b.startBeat || b.midi - a.midi);

  // 5. Extract top note (soprano / melody line) when chords or simultaneous notes overlap
  const melodyNotes = [];
  const startToleranceBeats = 0.08; // Within ~1/32nd note

  for (let i = 0; i < allNoteSpans.length; i++) {
    const current = allNoteSpans[i];

    if (melodyNotes.length > 0) {
      const prev = melodyNotes[melodyNotes.length - 1];
      if (Math.abs(current.startBeat - prev.startBeat) <= startToleranceBeats) {
        if (current.midi > prev.midi) {
          melodyNotes[melodyNotes.length - 1] = current;
        }
        continue;
      }
    }

    melodyNotes.push(current);
  }

  // 6. Convert note spans into structured practice notes with quantized beat durations
  const cleanNotes = melodyNotes.map(n => {
    const duration = quantizeDuration(n.durationBeats);
    const noteInfo = MusicTheory.getNoteInfo(n.midi, false);

    return {
      midi: n.midi,
      duration,
      name: noteInfo ? noteInfo.name : `Note ${n.midi}`,
      explicitAccidental: n.explicitAccidental || null,
      step: n.step || null,
      alter: n.alter !== undefined ? n.alter : null,
      slurStart: !!n.slurStart,
      slurStop: !!n.slurStop,
      staccato: !!n.staccato
    };
  });

  // Refine key signature mode if <mode> was omitted in MusicXML attributes
  const modeSpecified = keyElem?.querySelector('mode');
  if (keyElem && !modeSpecified && cleanNotes.length > 0) {
    const lastNote = cleanNotes[cleanNotes.length - 1];
    const lastPc = ((lastNote.midi % 12) + 12) % 12;
    if (fifthsNum === -2) {
      // Bb Major vs G Minor (G tonic = 7, leading tone F# = 6)
      const hasFSharp = cleanNotes.some(n => ((n.midi % 12) + 12) % 12 === 6);
      if (lastPc === 7 || hasFSharp) {
        detectedKey = 'G Minor';
      }
    } else if (fifthsNum === 0 && lastPc === 9) {
      detectedKey = 'A Minor';
    } else if (fifthsNum === 1 && (lastPc === 4 || cleanNotes.some(n => ((n.midi % 12) + 12) % 12 === 3))) {
      detectedKey = 'E Minor';
    } else if (fifthsNum === -1 && (lastPc === 2 || cleanNotes.some(n => ((n.midi % 12) + 12) % 12 === 1))) {
      detectedKey = 'D Minor';
    }
  }

  // Use all extracted notes without artificial length capping
  const finalNotes = cleanNotes;

  const fullTitle = title + partSuffix;
  const difficulty = estimateDifficulty(finalNotes, tempoBpm);

  return {
    id: 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    title: fullTitle,
    composer,
    difficulty,
    bpm: tempoBpm,
    timeSignature,
    key: detectedKey,
    fifths: fifthsNum,
    description: `Loaded from ${fileName}${partSuffix} (${finalNotes.length} notes)`,
    notes: finalNotes,
    isCustom: true
  };
}
