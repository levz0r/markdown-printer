#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const TurndownService = require('turndown');

// Native messaging uses stdin/stdout for communication
// Messages are length-prefixed (4 bytes, native byte order) followed by JSON

// Log errors to file for debugging
const logFile = path.join(os.homedir(), 'markdown-printer-debug.log');
function logError(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

function readMessage() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;
    let headerReceived = false;
    let messageLength = 0;

    const onReadable = () => {
      let chunk;

      while ((chunk = process.stdin.read()) !== null) {
        chunks.push(chunk);
        totalLength += chunk.length;

        if (!headerReceived && totalLength >= 4) {
          const header = Buffer.concat(chunks);
          messageLength = header.readUInt32LE(0);
          headerReceived = true;
        }

        if (headerReceived && totalLength >= messageLength + 4) {
          process.stdin.removeListener('readable', onReadable);
          process.stdin.removeListener('end', onEnd);
          const fullMessage = Buffer.concat(chunks);
          const messageBytes = fullMessage.slice(4, 4 + messageLength);
          const message = JSON.parse(messageBytes.toString('utf8'));
          resolve(message);
          return;
        }
      }
    };

    const onEnd = () => {
      process.stdin.removeListener('readable', onReadable);
      process.stdin.removeListener('end', onEnd);
      reject(new Error('stdin closed'));
    };

    process.stdin.on('readable', onReadable);
    process.stdin.on('end', onEnd);
  });
}

function sendMessage(message) {
  const buffer = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);

  process.stdout.write(header);
  process.stdout.write(buffer);
}

function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200);
}

async function saveMarkdown(html, title, url, saveDir) {
  try {
    // Convert HTML to Markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-'
    });

    const markdown = turndownService.turndown(html);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedTitle = sanitizeFilename(title || 'untitled');
    const filename = `${sanitizedTitle}-${timestamp}.md`;

    // Determine save location
    const outputDir = saveDir || path.join(os.homedir(), 'MarkdownPrints');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, filename);

    // Add metadata header
    const content = `# ${title}\n\n**Source:** ${url}\n**Saved:** ${new Date().toISOString()}\n\n---\n\n${markdown}`;

    // Write file
    fs.writeFileSync(filepath, content, 'utf8');

    return { success: true, filepath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    logError('Native host started');
    const message = await readMessage();
    logError(`Message received: command=${message.command}, htmlLength=${message.html?.length}`);

    if (message.command === 'save') {
      const result = await saveMarkdown(
        message.html,
        message.title,
        message.url,
        message.saveDir
      );
      logError(`Save result: ${JSON.stringify(result)}`);
      sendMessage(result);
    } else {
      sendMessage({ success: false, error: 'Unknown command' });
    }

    process.exit(0);
  } catch (error) {
    logError(`Error in main: ${error.message}\n${error.stack}`);
    sendMessage({ success: false, error: error.message });
    process.exit(1);
  }
}

main();
