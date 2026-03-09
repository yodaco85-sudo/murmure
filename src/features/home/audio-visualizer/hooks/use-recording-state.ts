import { listen } from '@tauri-apps/api/event';
import { useState, useEffect, useRef } from 'react';

/**
 * Tracks whether audio recording is currently active.
 *
 * Recording starts when `overlay-mode` is emitted (fired at recording start).
 * Recording stops when `mic-level 0.0` is received and no further level
 * activity occurs within 200 ms (the backend emits an explicit 0.0 at stop).
 */
export const useRecordingState = () => {
    const [isRecording, setIsRecording] = useState(false);
    const stopTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const modePromise = listen<string>('overlay-mode', () => {
            if (stopTimerRef.current !== null) {
                clearTimeout(stopTimerRef.current);
                stopTimerRef.current = null;
            }
            setIsRecording(true);
        });

        const levelPromise = listen<number>('mic-level', (e) => {
            const level = Number(e.payload ?? 0);
            if (level <= 0.001) {
                if (stopTimerRef.current === null) {
                    stopTimerRef.current = window.setTimeout(() => {
                        setIsRecording(false);
                        stopTimerRef.current = null;
                    }, 200);
                }
            } else {
                if (stopTimerRef.current !== null) {
                    clearTimeout(stopTimerRef.current);
                    stopTimerRef.current = null;
                }
            }
        });

        return () => {
            if (stopTimerRef.current !== null) {
                clearTimeout(stopTimerRef.current);
            }
            modePromise.then((un) => un());
            levelPromise.then((un) => un());
        };
    }, []);

    return { isRecording };
};
