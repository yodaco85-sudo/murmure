# Murmure Enhanced — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fork Murmure, set up Windows dev environment, and enhance it with VAD, improved visual feedback, and Claude API post-processing.

**Architecture:** Build on existing Tauri pipeline. VAD inserts as a pre-transcription audio filter in the recording stream. Visual feedback upgrades the existing AudioVisualizer component. LLM Connect is configured for Claude Sonnet remote API.

**Tech Stack:** Rust (Tauri backend), React/TypeScript (frontend), Tailwind CSS, cpal (audio), ONNX Runtime (Parakeet), Silero VAD or RMS-based VAD

---

## Phase 1: Installation & Dev Environment

### Task 1: Install Windows prerequisites

**Files:** None (system setup)

**Step 1: Install Rust toolchain**

Download and run `rustup-init.exe` from https://rustup.rs/
Select default installation (MSVC toolchain).

Run in PowerShell:
```powershell
rustup --version
cargo --version
rustc --version
```
Expected: version numbers displayed.

**Step 2: Install Visual Studio C++ Build Tools**

Download "Build Tools for Visual Studio 2022" from Microsoft.
Select "Desktop development with C++" workload.

**Step 3: Install Node.js + pnpm**

```powershell
# Check if already installed (may exist via WSL shared tooling)
node --version
pnpm --version

# If not, install Node.js LTS from nodejs.org, then:
npm install -g pnpm
```

**Step 4: Install Tauri CLI**

```powershell
cargo install tauri-cli --version "^2"
```

**Step 5: Verify MSVC Redistributable**

Already installed with Build Tools. If not:
Download from https://aka.ms/vc14/vc_redist.x64.exe

---

### Task 2: Fork and clone Murmure

**Files:** None (git operations)

**Step 1: Fork on GitHub**

Go to https://github.com/Kieirra/murmure and click "Fork".

**Step 2: Clone on Windows (NOT WSL)**

```powershell
cd C:\Dev  # or your preferred Windows path
git clone https://github.com/YOUR_USERNAME/murmure.git
cd murmure
```

**Step 3: Install dependencies and build**

```powershell
pnpm install
pnpm tauri dev
```
Expected: App compiles and launches. First run downloads Parakeet model (~600MB).

**Step 4: Commit baseline**

```bash
git checkout -b enhanced
git commit --allow-empty -m "chore: start enhanced branch"
```

---

## Phase 2: LLM Connect with Claude API (Quick Win)

### Task 3: Configure Claude Sonnet for post-processing

**Files:**
- No code changes needed — this is runtime configuration

**Step 1: Get Claude API key**

Go to https://console.anthropic.com/ and create an API key.

**Step 2: Configure in Murmure UI**

1. Open Murmure
2. Go to LLM Connect page (sidebar)
3. Click "Advanced Settings"
4. In "Remote Server" section:
   - URL: `https://api.anthropic.com/v1`
   - API Key: paste your key
   - Model: `claude-sonnet-4-20250514`
5. Create an LLM mode with a prompt like:

```
You are a speech-to-text post-processor for a developer.
Fix grammar, punctuation, and formatting.
Preserve all technical terms, function names, variable names, and code exactly as spoken.
If the input is in French, keep it in French. If mixed French/English, keep the mix.
Return ONLY the corrected text, nothing else.
```

**Step 3: Test**

Record a phrase like "je veux creer une fonction qui s'appelle get user by id" and verify LLM corrects it properly.

**Step 4: Commit config notes**

No code commit needed — settings are stored locally in Tauri store.

---

## Phase 3: VAD (Voice Activity Detection)

### Task 4: Add RMS-based VAD to recording pipeline

**Why RMS-based instead of Silero:** Silero VAD requires ONNX inference on every audio chunk — extra CPU load and a second ONNX model. Murmure already calculates RMS in the stream callback (`recorder.rs:238-247`). We extend this existing logic to filter silence frames from the WAV file, avoiding unnecessary model loading.

**Files:**
- Modify: `src-tauri/src/audio/recorder.rs` (stream callback, lines 204-300)
- Modify: `src-tauri/src/settings/types.rs` (add VAD settings)
- Modify: `src-tauri/src/settings/settings.rs` (load VAD settings)
- Modify: `src-tauri/src/commands/settings.rs` (expose VAD commands)

**Step 1: Add VAD settings to AppSettings**

In `src-tauri/src/settings/types.rs`, add to `AppSettings`:
```rust
pub vad_enabled: bool,          // default: true
pub vad_threshold: f32,         // default: 0.02 (noise gate level)
pub vad_padding_ms: u32,        // default: 300 (keep 300ms around speech)
```

**Step 2: Implement VAD filtering in stream callback**

In `src-tauri/src/audio/recorder.rs`, modify `build_stream_impl`:
- Track frames where RMS > vad_threshold as "speech"
- Keep `vad_padding_ms` of audio before and after each speech region
- Only write speech regions (with padding) to WAV
- Continue emitting `mic-level` for all frames (visualizer needs it)

```rust
// Pseudocode for VAD in callback:
let is_speech = rms_level >= vad_threshold;
if is_speech {
    // Flush any buffered padding frames
    // Write current frame to WAV
    // Reset silence counter
} else {
    // Buffer frame (up to padding_ms worth)
    // If silence exceeds padding, stop writing
}
```

**Step 3: Add frontend VAD toggle**

Add a toggle in Settings > System for "Voice Activity Detection" with threshold slider.

**Step 4: Test VAD**

1. Record with background noise — verify silence is trimmed
2. Record normal speech — verify no words are cut off
3. Record with pauses — verify padding preserves natural flow

**Step 5: Commit**

```bash
git add src-tauri/src/audio/recorder.rs src-tauri/src/settings/types.rs
git commit -m "feat(audio): add RMS-based VAD filtering to recording pipeline"
```

---

## Phase 4: Visual Feedback Enhancement

### Task 5: Redesign audio visualizer with smooth waveform

**Files:**
- Modify: `src/features/home/audio-visualizer/audio-visualizer.tsx`
- Modify: `src/features/home/audio-visualizer/audio-pixel/audio-pixel.tsx`
- Modify: `src/features/home/audio-visualizer/audio-pixel/audio-pixel.helpers.ts`
- Modify: `src/overlay/overlay.tsx`

**Step 1: Study current visualizer**

Current implementation (`audio-visualizer.tsx`):
- 16 bars x 20 rows of square pixels
- V-shaped amplitude profile (center highest)
- Gaussian wave animation during LLM processing
- Pixel-art style (12x6 px blocks)

**Step 2: Enhance the waveform feel**

Options (pick one based on aesthetic preference):

**Option A — Smooth sine wave overlay:**
- Keep pixel grid but add a continuous sine-wave line on top
- Wave amplitude modulated by mic level
- Uses `framer-motion` (already a dependency) for smooth transitions

**Option B — Organic ripple effect:**
- Replace pixel grid with a canvas-based circular ripple
- Concentric rings pulse outward from center proportional to level
- More "alive" and modern feeling

**Option C — Enhanced pixel bars with glow:**
- Keep current pixel aesthetic but add:
  - Gradient colors (cool blue → warm purple based on level)
  - CSS glow/blur effect on active pixels
  - Smoother transitions between levels (interpolation)
  - More bars (24 instead of 16) for finer resolution

Recommendation: **Option C** — minimal code change, big visual impact, stays consistent with Murmure's existing design language.

**Step 3: Implement glow effect on AudioPixel**

In `audio-pixel.tsx`, add CSS shadow/glow when pixel is lit:
```tsx
// Add glow effect based on intensity
style={{
  boxShadow: isLit ? `0 0 ${intensity * 8}px rgba(56, 189, 248, 0.6)` : 'none',
  transition: 'all 0.1s ease-out',
}}
```

**Step 4: Add gradient colors**

Map pixel height position to a color gradient:
- Bottom pixels: `sky-400` (current blue)
- Mid pixels: `violet-400`
- Top pixels: `rose-400`

**Step 5: Update overlay visualizer**

Mirror changes in `overlay.tsx` (lines 140-155) — same glow + gradient applied to the 14-bar overlay visualizer.

**Step 6: Test visually**

1. Record and verify smooth, glowing waveform
2. Check overlay matches main window aesthetic
3. Verify LLM processing animation still works

**Step 7: Commit**

```bash
git add src/features/home/audio-visualizer/ src/overlay/overlay.tsx
git commit -m "feat(ui): enhance audio visualizer with glow effect and color gradient"
```

---

### Task 6: Add pulsing indicator when idle/listening

**Files:**
- Modify: `src/features/home/home.tsx`
- Modify: `src/overlay/overlay.tsx`

**Step 1: Add subtle breathing animation when recording but silent**

When recording is active but mic level is near 0 (waiting for speech):
- Show a gentle pulsing circle or breathing dot
- Indicates "I'm listening, speak when ready"

```tsx
// In home.tsx, when recording && level < 0.01:
<motion.div
  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
  transition={{ duration: 2, repeat: Infinity }}
  className="w-4 h-4 rounded-full bg-sky-400"
/>
```

**Step 2: Same in overlay**

Add matching animation in overlay.tsx when `hasAudio` is false but overlay is shown.

**Step 3: Commit**

```bash
git add src/features/home/home.tsx src/overlay/overlay.tsx
git commit -m "feat(ui): add breathing animation when waiting for speech"
```

---

## Phase 5: CLI Remote Control (Low Priority)

### Task 7: Add CLI flags for remote control

**Files:**
- Modify: `src-tauri/src/main.rs` (parse CLI args)
- Modify: `src-tauri/src/lib.rs` (handle flags)

**Step 1: Parse CLI flags**

Use Tauri's single-instance plugin to forward args to running instance:
```
murmure --toggle-transcription
murmure --cancel
murmure --start-hidden
```

**Step 2: Handle in running instance**

When single-instance receives args from second launch:
- `--toggle-transcription` → simulate record shortcut
- `--cancel` → call cancel_recording
- `--start-hidden` → already exists (--autostart flag)

**Step 3: Test from WSL**

```bash
# From WSL terminal:
/mnt/c/Dev/murmure/target/release/murmure.exe --toggle-transcription
```

**Step 4: Commit**

```bash
git commit -m "feat(cli): add --toggle-transcription and --cancel flags"
```

---

## Summary & Priority Order

| Phase | Task | Priority | Effort |
|-------|------|----------|--------|
| 1 | Install prerequisites | Required | 30 min |
| 1 | Fork & clone | Required | 10 min |
| 2 | Configure Claude API | High | 15 min |
| 3 | VAD filtering | High | 2-3 hours |
| 4 | Visualizer glow + gradient | High | 1-2 hours |
| 4 | Breathing animation | Medium | 30 min |
| 5 | CLI flags | Low | 1-2 hours |

**Total estimated dev time:** ~5-7 hours (excluding install/download time)

**Execution order:** Tasks 1-2 (setup) → Task 3 (instant win) → Task 4 (VAD) → Tasks 5-6 (visual) → Task 7 (CLI, optional)
