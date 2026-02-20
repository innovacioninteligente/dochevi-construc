'use client';

/**
 * Lightweight SVG sparkline for preview analytics cards.
 * Renders a smooth bezier line with an optional gradient fill.
 */

interface SparklineChartProps {
    /** Array of numeric values to plot */
    values: number[];
    /** Width in px */
    width?: number;
    /** Height in px */
    height?: number;
    /** Stroke colour (CSS) */
    strokeColor?: string;
    /** Fill gradient start colour */
    gradientFrom?: string;
    /** Fill gradient end colour */
    gradientTo?: string;
    /** Unique id prefix for SVG gradient (avoids collision when multiple sparklines) */
    id?: string;
}

export function SparklineChart({
    values,
    width = 200,
    height = 48,
    strokeColor = '#6366f1',
    gradientFrom = 'rgba(99,102,241,0.35)',
    gradientTo = 'rgba(99,102,241,0)',
    id = 'spark',
}: SparklineChartProps) {
    if (values.length < 2) return null;

    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const padX = 2;
    const padY = 4;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const points = values.map((v, i) => ({
        x: padX + (i / (values.length - 1)) * innerW,
        y: padY + innerH - ((v - min) / range) * innerH,
    }));

    // Build smooth bezier path
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        path += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    // Closed area path for gradient fill
    const areaPath = `${path} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    const gradientId = `${id}-grad`;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible"
            style={{ display: 'block' }}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradientFrom} />
                    <stop offset="100%" stopColor={gradientTo} />
                </linearGradient>
            </defs>
            {/* Area fill */}
            <path
                d={areaPath}
                fill={`url(#${gradientId})`}
                className="transition-all duration-700"
            />
            {/* Line */}
            <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-700"
            />
            {/* End dot */}
            <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r={2.5}
                fill={strokeColor}
                className="animate-pulse"
            />
        </svg>
    );
}
