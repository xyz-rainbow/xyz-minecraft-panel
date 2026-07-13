const fs = require('fs');
const path = require('path');

const serverJs = fs.readFileSync(path.join(__dirname, 'panel', 'server.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, 'panel', 'index.html'), 'utf8');

function indent(text, spaces) {
    const prefix = ' '.repeat(spaces);
    return text.split('\n').map(line => line ? prefix + line : '').join('\n');
}

const configMapYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: minecraft-panel-config
  namespace: gaming
data:
  server.js: |
${indent(serverJs, 4)}
  index.html: |
${indent(indexHtml, 4)}
`;

fs.writeFileSync(path.join(__dirname, 'kubernetes', 'configmap.yaml'), configMapYaml, 'utf8');
console.log('Successfully generated kubernetes/configmap.yaml');
