const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/allowFontScaling=\{false\} /g, '');
      content = content.replace(/<Text /g, '<Text allowFontScaling={false} ');
      content = content.replace(/<TextInput /g, '<TextInput allowFontScaling={false} ');
      fs.writeFileSync(fullPath, content);
    }
  }
}
processDir('src/components/anomaly');
console.log('Updated all components');
