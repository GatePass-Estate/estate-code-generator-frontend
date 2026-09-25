const fs = require('fs');
const files = [
  'app/(protected)/(shared-screens)/ai-store/anomaly-detection/index.tsx',
  'app/(protected)/(shared-screens)/ai-store/anomaly-detection/summary.tsx',
  'app/(protected)/(shared-screens)/ai-store/anomaly-detection/user/[id].tsx',
];
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  // First clean up in case we've run this before
  content = content.replace(/allowFontScaling=\{false\} /g, '');
  // Add to Text
  content = content.replace(/<Text /g, '<Text allowFontScaling={false} ');
  // Add to TextInput if any
  content = content.replace(/<TextInput /g, '<TextInput allowFontScaling={false} ');
  fs.writeFileSync(file, content);
});
console.log('Updated font scaling');
