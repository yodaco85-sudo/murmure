import clsx from 'clsx';
import { getGlowRadius, getPixelColor } from './audio-pixel.helpers';

interface AudioPixelProps {
    isLit: boolean;
    rowIndex: number;
    totalRows: number;
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const AudioPixel = ({
    isLit,
    rowIndex,
    totalRows,
    width = 12,
    height = 6,
    className,
    ...props
}: AudioPixelProps) => {
    const color = getPixelColor(rowIndex, totalRows);
    const glowRadius = getGlowRadius(rowIndex, totalRows);

    return (
        <div
            className={clsx('border-none', className)}
            style={{
                height: `${height}px`,
                width: `${width}px`,
                backgroundColor: isLit ? color : 'transparent',
                boxShadow: isLit
                    ? `0 0 ${glowRadius}px ${getPixelColor(rowIndex, totalRows, 0.75)}`
                    : 'none',
                transition:
                    'box-shadow 0.1s ease-out, background-color 0.1s ease-out',
            }}
            {...props}
        />
    );
};
