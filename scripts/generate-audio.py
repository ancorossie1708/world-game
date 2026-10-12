"""Generate gentle, original musical sketches for the offline prototype.

No samples or existing song melodies are used. The sketches evoke broad musical
textures and are explicitly labelled as original inspiration, not authentic
traditional recordings. Output: mono PCM WAV, 22050 Hz, 16 bit; CC0-1.0.
Run with Python 3 (standard library only). Paths resolve from this source file.
"""

from array import array
from math import exp, pi, sin
from pathlib import Path
import sys
import wave

RATE = 22050
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "content" / "audio"

# Original motifs in MIDI note numbers. Each tuple is (pitch, beats).
SKETCHES = {
    "japan": {
        "bpm": 68, "voice": "plucked", "root": 50,
        "notes": [(62, 1), (65, 1), (69, 2), (67, 1), (65, 1), (62, 2),
                  (60, 1), (62, 1), (65, 2), (69, 1), (67, 1), (62, 2),
                  (65, 1), (67, 1), (69, 2), (65, 1), (62, 3)],
    },
    "france": {
        "bpm": 78, "voice": "reed", "root": 48,
        "notes": [(64, 1), (67, 1), (72, 1), (71, 1), (67, 1), (65, 1),
                  (64, 2), (62, 1), (65, 1), (69, 1), (67, 1),
                  (64, 1), (67, 1), (69, 1), (65, 1), (62, 1), (60, 3)],
    },
    "italy": {
        "bpm": 76, "voice": "plucked", "root": 43,
        "notes": [(67, 1), (71, 1), (74, 2), (72, 1), (71, 1), (69, 2),
                  (67, 1), (69, 1), (71, 2), (74, 1), (72, 1), (71, 2),
                  (69, 1), (67, 1), (66, 1), (67, 3)],
    },
    "germany": {
        "bpm": 80, "voice": "flute", "root": 46,
        "notes": [(62, 1), (65, 1), (70, 1), (69, 1), (65, 1), (62, 1),
                  (63, 2), (65, 1), (67, 1), (65, 1), (63, 1),
                  (62, 1), (65, 1), (69, 1), (65, 1), (62, 1), (58, 3)],
    },
    "ukraine": {
        "bpm": 70, "voice": "plucked", "root": 45,
        "notes": [(64, 1), (69, 1), (72, 2), (71, 1), (69, 1), (67, 2),
                  (65, 1), (64, 1), (62, 2), (64, 1), (67, 1), (69, 2),
                  (72, 1), (71, 1), (67, 1), (69, 3)],
    },
    "israel": {
        "bpm": 72, "voice": "flute", "root": 50,
        "notes": [(62, 1), (65, 1), (67, 2), (69, 1), (67, 1), (65, 2),
                  (64, 1), (62, 1), (60, 2), (62, 1), (65, 1), (69, 2),
                  (67, 1), (65, 1), (64, 1), (62, 3)],
    },
}


def frequency(midi: int) -> float:
    return 440 * 2 ** ((midi - 69) / 12)


def add_note(samples: list[float], pitch: int, start: float, duration: float,
             gain: float, voice: str) -> None:
    onset = int(start * RATE)
    size = min(int(duration * RATE), len(samples) - onset)
    f = frequency(pitch)
    for index in range(size):
        t = index / RATE
        # Smooth attack/release, controlled harmonics, no percussion or noise.
        attack = min(1.0, t / 0.045)
        release = min(1.0, max(0.0, (duration - t) / 0.14))
        phase = 2 * pi * f * t
        if voice == "plucked":
            envelope = attack * release * exp(-2.2 * t)
            tone = sin(phase) + 0.22 * sin(2 * phase) + 0.06 * sin(3 * phase)
        elif voice == "reed":
            envelope = attack * release * exp(-0.5 * t)
            tone = sin(phase) + 0.14 * sin(2.002 * phase) + 0.035 * sin(3 * phase)
        else:
            envelope = attack * release * exp(-0.6 * t)
            tone = sin(phase + 0.012 * sin(2 * pi * 4 * t)) + 0.07 * sin(2 * phase)
        samples[onset + index] += gain * envelope * tone


def generate(country_id: str, sketch: dict) -> None:
    beat = 60 / sketch["bpm"]
    total_beats = sum(length for _, length in sketch["notes"])
    duration = total_beats * beat + 1.25
    samples = [0.0] * int(duration * RATE)
    position = 0.35
    for pitch, beats in sketch["notes"]:
        add_note(samples, pitch, position, beats * beat * 0.92, 0.16, sketch["voice"])
        position += beats * beat
    # A quiet, consonant fifth supports the melody without a startling beat.
    for time in range(0, total_beats, 4):
        add_note(samples, sketch["root"], 0.35 + time * beat, beat * 3.6, 0.035, "flute")
        add_note(samples, sketch["root"] + 7, 0.35 + time * beat, beat * 3.6, 0.025, "plucked")
    # Quiet peak level and fades make both playback start and looping gentle.
    peak = max(abs(value) for value in samples) or 1.0
    gain = min(1.0, 0.29 / peak)
    pcm = array("h")
    for index, value in enumerate(samples):
        fade = min(1.0, index / (RATE * 0.6), (len(samples) - index) / (RATE * 0.75))
        pcm.append(int(max(-1.0, min(1.0, value * gain * fade)) * 32767))
    if sys.byteorder != "little":
        pcm.byteswap()
    with wave.open(str(OUTPUT / f"{country_id}.wav"), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(RATE)
        audio.writeframes(pcm.tobytes())
    print(f"{country_id}: {duration:.1f}s, peak <= 0.29, {len(pcm) * 2} bytes")


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for identifier, settings in SKETCHES.items():
        generate(identifier, settings)
