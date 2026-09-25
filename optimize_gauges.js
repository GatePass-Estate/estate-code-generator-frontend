const fs = require('fs');
const filePath = 'app/(protected)/(shared-screens)/ai-store/anomaly-detection/user/[id].tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove states from AnomalyDetectionUserDetailsScreen
content = content.replace(/  const \[selectedGaugeIndex, setSelectedGaugeIndex\] = useState<number \| null>\(null\);\n  const \[gaugeLimit, setGaugeLimit\] = useState\(4\);\n/, '');

// 2. Add GaugeCardsSection above export default
const gaugeCardsSection = `
const GaugeCardsSection = React.memo(({ gaugeList }: { gaugeList: any[] }) => {
  const [gaugeLimit, setGaugeLimit] = useState(4);
  const [selectedGaugeIndex, setSelectedGaugeIndex] = useState<number | null>(null);

  return (
    <>
      <View style={{ gap: 16 }}>
        {gaugeList.length > 0 ? (
          <>
            {gaugeList.slice(0, gaugeLimit).map((gauge: any, index: number) => (
              <Pressable key={\`gauge-\${index}\`} onPress={() => setSelectedGaugeIndex(index)} style={{ width: '100%', minHeight: 136, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, justifyContent: 'space-between', flexDirection: 'column', alignSelf: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#EFF1F3' }}>
                <View className="flex-row items-center gap-2" style={{ marginLeft: 16 }}>
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: gauge.color }} />
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 14, lineHeight: 14, color: '#0A1F29' }}>{gauge.title}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 34.18, lineHeight: 34.18, letterSpacing: 0, color: '#0A1F29', marginBottom: -4, marginLeft: 16 }}>{gauge.percentage}%</Text>
                  <View style={{ position: 'relative', top: 4 }}>
                    <SemiCircleGauge percentage={gauge.percentage} color={gauge.arcColor || gauge.color} size={130} animate={true} />
                  </View>
                </View>
              </Pressable>
            ))}
            {gaugeList.length > gaugeLimit ? (
              <Pressable onPress={() => setGaugeLimit(l => l + 4)} style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-SemiBold', fontSize: 14, color: '#113E55' }}>Load More</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
            No gauges found.
          </Text>
        )}
      </View>

      <GaugeDetailModal
        visible={selectedGaugeIndex !== null}
        onClose={() => setSelectedGaugeIndex(null)}
        gaugeData={selectedGaugeIndex !== null ? gaugeList[selectedGaugeIndex] : null}
        onNext={() =>
          selectedGaugeIndex !== null &&
          setSelectedGaugeIndex((selectedGaugeIndex + 1) % gaugeList.length)
        }
        onPrev={() =>
          selectedGaugeIndex !== null &&
          setSelectedGaugeIndex((selectedGaugeIndex - 1 + gaugeList.length) % gaugeList.length)
        }
      />
    </>
  );
});

`;
content = content.replace('export default function AnomalyDetectionUserDetailsScreen() {', gaugeCardsSection + 'export default function AnomalyDetectionUserDetailsScreen() {');

// 3. Replace the existing Gauge Cards view and Modal with GaugeCardsSection
content = content.replace(/<View style=\{\{ gap: 16 \}\}>[\s\S]*?No gauges found.\s*<\/Text>\s*\)\}\s*<\/View>/, '<GaugeCardsSection gaugeList={gaugeList} />');

// 4. Remove GaugeDetailModal from the bottom of the file
content = content.replace(/<GaugeDetailModal[\s\S]*?\/>\s*<\/SafeAreaView>/, '</SafeAreaView>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Optimized gauges!');
