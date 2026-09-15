import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';

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

export default function AnomalyRadarChart({
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
    }
  ],
  labels = ['Data 1', 'Data 2', 'Data 3', 'Data 4', 'Data 5', 'Data 6'],
  size = 280,
  gridColor = '#E5E7EB',
  levels = 4,
}: AnomalyRadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 55; // Leave plenty of space for labels so they don't clip
  const dataLength = labels.length;

  // Calculate coordinates for a polygon given its values
  const getCoordinates = (values: number[]) => {
    return values
      .map((val, i) => {
        const angle = (Math.PI * 2 * i) / dataLength - Math.PI / 2;
        const distance = (val / 100) * radius;
        const x = center + distance * Math.cos(angle);
        const y = center + distance * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const getLabelCoordinates = (i: number, total: number, labelRadiusOffset = 18) => {
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
          const bgData = Array(dataLength).fill(levelRatio * 100);
          return (
            <Polygon
              key={`grid-${i}`}
              points={getCoordinates(bgData)}
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
              points={getCoordinates(s.data)}
              fill={s.fillColor}
              stroke={s.strokeColor}
              strokeWidth="2"
            />
            {s.data.map((val, i) => {
              const angle = (Math.PI * 2 * i) / dataLength - Math.PI / 2;
              const distance = (val / 100) * radius;
              const x = center + distance * Math.cos(angle);
              const y = center + distance * Math.sin(angle);
              return (
                <Circle
                  key={`point-${index}-${i}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={s.dotColor}
                />
              );
            })}
          </React.Fragment>
        ))}

        {/* Draw Labels */}
        {labels.map((label, i) => {
          const { x, y } = getLabelCoordinates(i, dataLength, 18);

          let textAnchor = 'middle';
          if (x > center + 10) textAnchor = 'start';
          if (x < center - 10) textAnchor = 'end';

          return (
            <SvgText
              key={`label-${i}`}
              x={x}
              y={y + 4}
              fill="#113E55"
              fontSize="13"
              fontFamily="Inter_18pt-Medium"
              textAnchor={textAnchor as any}
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
