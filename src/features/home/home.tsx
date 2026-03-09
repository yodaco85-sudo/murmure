import {
    useShortcut,
    SHORTCUT_CONFIGS,
} from '../settings/shortcuts/hooks/use-shortcut';
import { AudioVisualizer } from './audio-visualizer/audio-visualizer';
import { History } from './history/history';
import { Page } from '@/components/page';
import { Typography } from '@/components/typography';
import { Statistics } from './statistics/statistics';
import { useTranslation } from '@/i18n';
import { Onboarding } from '../onboarding/onboarding';
import { RecordLabel } from '@/components/record-label';
import { MicDisconnectedBanner } from './mic-disconnected-banner/mic-disconnected-banner';
import { useLevelState } from './audio-visualizer/hooks/use-level-state';
import { useRecordingState } from './audio-visualizer/hooks/use-recording-state';
import { motion, AnimatePresence } from 'framer-motion';

export const Home = () => {
    const { shortcut: recordShortcut } = useShortcut(SHORTCUT_CONFIGS.record);
    const { level } = useLevelState();
    const { isRecording } = useRecordingState();

    const showBreathing = isRecording && level < 0.01;

    const { t } = useTranslation();
    return (
        <main className="space-y-4 relative">
            <Page.Header>
                <Typography.MainTitle className="pb-4" data-testid="home-title">
                    {t('Welcome aboard!')}
                </Typography.MainTitle>
                <Statistics className="absolute -top-4 -right-4" />
                <Onboarding recordShortcut={recordShortcut} />
            </Page.Header>
            <MicDisconnectedBanner />

            <div className="space-y-4">
                <div className="space-y-2 flex flex-col items-center">
                    <Typography.Title>{t('Live input')}</Typography.Title>
                    <div className="rounded-md border border-border p-2 space-y-4 relative">
                        <div className="relative">
                            <AudioVisualizer bars={34} rows={21} />
                            <AnimatePresence>
                                {showBreathing && (
                                    <motion.div
                                        key="breathing"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.3, 1],
                                                opacity: [0.4, 0.9, 0.4],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                            className="w-4 h-4 rounded-full bg-sky-400"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <RecordLabel />
                    </div>
                </div>

                <div className="flex justify-center">
                    <History />
                </div>
            </div>
        </main>
    );
};
