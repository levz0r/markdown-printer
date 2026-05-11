#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const TurndownService = require('turndown');

// Native messaging uses stdin/stdout for communication
// Messages are length-prefixed (4 bytes, native byte order) followed by JSON

// Log to dated files under ~/.markdown-printer/logs/, retaining the last 7.
const LOG_DIR = path.join(os.homedir(), '.markdown-printer', 'logs');
const LOG_RETENTION_DAYS = 7;

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (_e) {
    /* swallow — logging must never break the host */
  }
}

function pruneOldLogs() {
  try {
    if (!fs.existsSync(LOG_DIR)) return;
    const entries = fs
      .readdirSync(LOG_DIR)
      .filter(f => /^host-\d{4}-\d{2}-\d{2}\.log$/.test(f))
      .sort();
    while (entries.length > LOG_RETENTION_DAYS) {
      const oldest = entries.shift();
      try {
        fs.unlinkSync(path.join(LOG_DIR, oldest));
      } catch (_e) {
        /* ignore */
      }
    }
  } catch (_e) {
    /* ignore */
  }
}

function currentLogPath() {
  const day = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `host-${day}.log`);
}

let prunedThisRun = false;
function logError(message) {
  try {
    ensureLogDir();
    if (!prunedThisRun) {
      pruneOldLogs();
      prunedThisRun = true;
    }
    const timestamp = new Date().toISOString();
    fs.appendFileSync(currentLogPath(), `[${timestamp}] ${message}\n`);
  } catch (_e) {
    /* swallow */
  }
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

async function browseFolder() {
  return new Promise(resolve => {
    const { exec } = require('child_process');

    if (process.platform === 'darwin') {
      // macOS - use osascript to show folder picker
      const script =
        'osascript -e "POSIX path of (choose folder with prompt \\"Select folder for markdown files:\\")"';
      exec(script, (error, stdout, stderr) => {
        if (error) {
          if (error.code === 1) {
            // User cancelled
            resolve({ success: false, cancelled: true });
          } else {
            resolve({ success: false, error: stderr || error.message });
          }
        } else {
          const path = stdout.trim();
          resolve({ success: true, path });
        }
      });
    } else if (process.platform === 'linux') {
      // Linux - use zenity
      exec(
        'zenity --file-selection --directory --title="Select folder for markdown files"',
        (error, stdout, stderr) => {
          if (error) {
            if (error.code === 1) {
              resolve({ success: false, cancelled: true });
            } else {
              resolve({ success: false, error: 'Please install zenity for folder selection' });
            }
          } else {
            const path = stdout.trim();
            resolve({ success: true, path });
          }
        }
      );
    } else {
      resolve({ success: false, error: 'Folder selection not supported on this platform' });
    }
  });
}

async function saveMarkdown(html, title, url, saveDir, openAfterSave) {
  try {
    // Convert HTML to Markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    const markdown = turndownService.turndown(html);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedTitle = sanitizeFilename(title || 'untitled');
    const filename = `${sanitizedTitle}-${timestamp}.md`;

    // Determine save location (expand ~ if present)
    let outputDir = saveDir || path.join(os.homedir(), 'MarkdownPrints');
    if (outputDir.startsWith('~')) {
      outputDir = path.join(os.homedir(), outputDir.slice(1));
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, filename);

    // Add metadata header
    const content = `# ${title}\n\n**Source:** ${url}\n**Saved:** ${new Date().toISOString()}\n\n---\n\n${markdown}`;

    // Write file
    fs.writeFileSync(filepath, content, 'utf8');

    // Open file if requested
    if (openAfterSave) {
      const { exec } = require('child_process');
      const openCommand =
        process.platform === 'darwin'
          ? 'open'
          : process.platform === 'win32'
            ? 'start'
            : 'xdg-open';
      exec(`${openCommand} "${filepath}"`);
    }

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
        message.saveDir,
        message.openAfterSave
      );
      logError(`Save result: ${JSON.stringify(result)}`);
      sendMessage(result);
    } else if (message.command === 'browsefolder') {
      const result = await browseFolder();
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
