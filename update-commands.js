const fs = require('fs');
const path = require('path');

const commandsDir = './src/commands';
const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.ts') && f !== 'start.ts' && f !== 'status.ts');

files.forEach(file => {
  const filePath = path.join(commandsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update interface
  content = content.replace(/port:\s*number;/g, 'profile: string;');
  
  // Add import
  if (!content.includes("getPortFromProfile")) {
    content = content.replace(
      /(import.*chalk.*\n)/,
      "$1import { getPortFromProfile } from '../utils.js';\n"
    );
  }
  
  // Replace options.port with getPortFromProfile(options.profile)
  content = content.replace(/options\.port/g, 'getPortFromProfile(options.profile)');
  
  // Fix cases where port is used as variable
  content = content.replace(/const port = getPortFromProfile\(options\.profile\);/g, '');
  content = content.replace(/const port = options\.port;/g, '');
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});

