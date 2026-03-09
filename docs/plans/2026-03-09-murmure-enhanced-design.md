# Murmure Enhanced — Design Document

## Context

Fork de Murmure pour combiner les meilleures features de Murmure et Handy (deux apps STT open-source Tauri/Rust/React), optimise pour un usage coding (dictee vers Cursor, VS Code, prompts IA).

## Target Setup

- OS: Windows (Minisforum UM773 Lite, AMD Ryzen 7 7735HS, Radeon 680M, 16 Go RAM)
- STT Engine: Parakeet TDT 0.6B v3 (CPU only, pas de GPU NVIDIA)
- LLM Post-processing: Claude Sonnet API (cloud)
- Usage: Dictee pour coder, prompts IA

## Installation

1. Installer sur Windows natif (pas WSL):
   - Rust toolchain via rustup-init.exe
   - Node.js + pnpm
   - Visual Studio C++ Build Tools
   - Microsoft Visual C++ Redistributable
2. Fork Kieirra/murmure sur GitHub
3. Clone sur Windows, `pnpm install`, `pnpm tauri dev`
4. Configurer LLM Connect avec cle API Claude

## Ameliorations prevues

### 1. VAD (Voice Activity Detection) — Priorite haute

- Integrer Silero VAD pour filtrer silences et bruit ambiant
- Ameliore la precision meme avec micro moyen
- S'insere dans le pipeline entre enregistrement audio et Parakeet
- Ref Handy: utilise Silero VAD avec succes

### 2. Feedback visuel ameliore — Priorite haute

- Ameliorer le visualizer actuel (src/features/home/audio-visualizer/)
- Ondulation fluide et elegante pendant la dictee
- Visible en overlay aussi
- Objectif: feedback visuel immediat que l'app ecoute

### 3. Push-to-talk — Priorite moyenne

- Mode alternatif au toggle existant
- Maintenir raccourci = enregistrer, relacher = transcrire
- Plus naturel pour dictees courtes (prompts, noms de variables)
- Murmure a deja un systeme de shortcuts configurable

### 4. Post-processing LLM renforce — Priorite haute

- Configurer LLM Connect avec Claude Sonnet API
- Prompts optimises pour le code: preserver termes techniques, formater correctement
- Le module LLM Connect existe deja dans Murmure

### 5. CLI remote control — Priorite basse

- Flags --toggle-transcription, --cancel pour piloter depuis terminal WSL
- Inspiration Handy: --toggle-transcription, --toggle-post-process, --cancel, --start-hidden
- Signaux Linux (SIGUSR1/SIGUSR2) non pertinents ici (Windows)

## Ce qu'on ne touche pas

- Moteur Parakeet (pas de multi-modele)
- Features existantes (dictionnaire, formatting rules, filler cleaner, wake word)
- Philosophie privacy-first
- Architecture Tauri existante

## Comparaison Murmure vs Handy

| Feature | Murmure | Handy | Decision |
|---|---|---|---|
| Modele STT | Parakeet v3 | Whisper + Parakeet | Garder Parakeet seul |
| VAD | Non | Silero | Ajouter |
| Push-to-talk | Non | Oui | Ajouter |
| LLM post-process | LLM Connect | Basique | Garder + renforcer |
| Formatting rules | Oui | Non | Garder |
| Filler cleaning | Oui | Non | Garder |
| CLI control | Non | Oui | Ajouter (priorite basse) |
| Feedback visuel | Basique | Basique | Ameliorer |
| Wake word | Oui | Non | Garder |
