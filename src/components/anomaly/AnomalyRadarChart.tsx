import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import TextTicker from 'react-native-text-ticker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface RadarSeries {
  data: number[];
  strokeColor: string;
  fillColor: string;
  dotColor: string;
}

interface AnomalyRadarChartProps {
  series?: RadarSeries[];
  labels?: string[];
  size?: number;
  gridColor?: string;
  levels?: number;
}

const AnomalyRadarChart = ({
  series = [
    {
      data: [90, 80, 60, 60, 60, 90], // Expected (Orange)
      strokeColor: '#F25B2A',
      fillColor: 'rgba(242, 91, 42, 0.28)',
      dotColor: '#F25B2A',
    },
    {
      data: [90, 60, 80, 90, 80, 90], // Actual (Teal)
      strokeColor: '#1B998B',
      fillColor: 'rgba(27, 153, 139, 0.28)',
      dotColor: '#1B998B',
    },
  ],
  labels = ['Data 1', 'Data 2', 'Data 3', 'Data 4', 'Data 5', 'Data 6'],
  size = SCREEN_WIDTH,
  gridColor = '#E5E7EB',
  levels = 4,
}: AnomalyRadarChartProps) => {
  const center = size / 2;
  const radius = Math.max(50, size / 2 - 110); // Leave plenty of space for labels so they don't clip
  const dataLength = labels.length;

  const maxDataValue = Math.max(...(series?.flatMap((s) => s.data) || []));
  const isDecimal = maxDataValue <= 1 && maxDataValue > 0;
  const scaleMax = isDecimal ? Math.max(0.2, maxDataValue) : Math.max(20, maxDataValue);

  // Calculate coordinates for a polygon given its values
  const getCoordinates = (values: number[], scale = scaleMax) => {
    return values
      .map((val, i) => {
        const angle = (Math.PI * 2 * i) / dataLength - Math.PI / 2;
        const distance = (val / scale) * radius;
        const x = center + distance * Math.cos(angle);
        const y = center + distance * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const getLabelCoordinates = (i: number, total: number, labelRadiusOffset = 12) => {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    const distance = radius + labelRadiusOffset;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Draw background grid (concentric polygons) */}
        {[...Array(levels)].map((_, i) => {
          const levelRatio = (i + 1) / levels;
          const bgData = Array(dataLength).fill(levelRatio * scaleMax);
          return (
            <Polygon
              key={`grid-${i}`}
              points={getCoordinates(bgData, scaleMax)}
              fill="none"
              stroke={gridColor}
              strokeWidth="1.5"
            />
          );
        })}

        {/* Draw axes (lines from center to corners) */}
        {labels.map((_, i) => {
          const angle = (Math.PI * 2 * i) / dataLength - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={gridColor}
              strokeWidth="1.5"
            />
          );
        })}

        {/* Draw the data series polygons and points */}
        {series.map((s, index) => (
          <React.Fragment key={`series-${index}`}>
            <Polygon
              points={getCoordinates(s.data, scaleMax)}
              fill={s.fillColor}
              stroke={s.strokeColor}
              strokeWidth="2"
            />
            {s.data.map((val, i) => {
              const angle = (Math.PI * 2 * i) / dataLength - Math.PI / 2;
              const distance = (val / scaleMax) * radius;
              const x = center + distance * Math.cos(angle);
              const y = center + distance * Math.sin(angle);
              return <Circle key={`point-${index}-${i}`} cx={x} cy={y} r="4" fill={s.dotColor} />;
            })}
          </React.Fragment>
        ))}
      </Svg>

      {/* Draw Labels as absolute positioned components outside SVG */}
      {labels.map((label, i) => {
        const { x, y } = getLabelCoordinates(i, dataLength, 24); // increase offset slightly to fit pills

        const PALETTE = [
          { text: '#F25B2A', bg: '#FFF0F0' },
          { text: '#113E55', bg: '#E3EDF2' },
          { text: '#D97706', bg: '#FEF3C7' },
          { text: '#1B998B', bg: '#E5F5F3' },
          { text: '#7C3AED', bg: '#F3E8FF' },
          { text: '#78350F', bg: '#F0E6E1' },
        ];
        const colorSet = PALETTE[i % PALETTE.length];

        let positionStyle: any = { top: y - 12, justifyContent: 'center' };

        if (x > center + 10) {
          positionStyle.left = x;
          positionStyle.alignItems = 'flex-start';
        } else if (x < center - 10) {
          positionStyle.right = size - x;
          positionStyle.alignItems = 'flex-end';
        } else {
          positionStyle.left = 0;
          positionStyle.right = 0;
          positionStyle.alignItems = 'center';
        }

        return (
          <View key={`label-${i}`} style={[{ position: 'absolute' }, positionStyle]}>
            <View
              style={{
                backgroundColor: colorSet.bg,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
                maxWidth: 100,
              }}
            >
              <TextTicker
                duration={3000}
                loop
                bounce
                repeatSpacer={20}
                marqueeDelay={1000}
                style={{
                  color: colorSet.text,
                  fontSize: 10.5,
                  fontFamily: 'Inter_18pt-Medium',
                }}
              >
                {label}
              </TextTicker>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default React.memo(AnomalyRadarChart, (prevProps, nextProps) => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
});
