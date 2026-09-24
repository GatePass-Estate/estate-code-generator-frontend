const fs = require('fs');
const path = require('path');

const files = [
  'FilterModal.tsx',
  'OrderModal.tsx',
  'GaugeDetailModal.tsx',
  'DatePickerModal.tsx',
  'TimeframeModal.tsx',
  'RatingModal.tsx',
  'AISummaryModal.tsx'
];

const dir = 'src/components/anomaly/modals';

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove imports
  content = content.replace(/import Animated.*?from 'react-native-reanimated';\n/g, '');
  content = content.replace(/import \{ GestureDetector \} from 'react-native-gesture-handler';\n/g, '');
  content = content.replace(/import \{ useSwipeDown \} from '\.\/useSwipeDown';\n/g, '');

  // Remove hook usages
  content = content.replace(/const \{ panGesture.*?\} = useSwipeDown\(.*?\);\n/g, '');
  content = content.replace(/React\.useEffect\(\(\) => \{\n?\s*if \(visible\).*?\n?\s*\}, \[visible\]\);\n/g, '');
  content = content.replace(/React\.useEffect\(\(\) => \{ if \(visible\) translateY\.value = 0; \}, \[visible\]\);\n/g, '');

  // Replace Animated.View
  content = content.replace(/<Animated\.View/g, '<View');
  content = content.replace(/<\/Animated\.View>/g, '</View>');

  // Fix animatedStyle
  content = content.replace(/style=\{\[\s*animatedStyle,\s*\{/g, 'style={[{');

  // Remove GestureDetector
  content = content.replace(/<GestureDetector gesture=\{panGesture\}>\n/g, '');
  content = content.replace(/<\/GestureDetector>\n/g, '');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${file}`);
});
