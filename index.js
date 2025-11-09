const makeWASocket = require('@whiskeysockets/baileys').default;
const {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  generateWAMessageFromContent,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const config = require("./config")

// Commands loader (single shared commands map)
const commands = new Map();
const aliases = new Map();

function loadCommands(dirPath = path.join(__dirname, 'commands')) {
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 📂 recursively load subfolders like commands/group/demote.js
      loadCommands(fullPath);
    } else if (file.endsWith('.js')) {
      delete require.cache[require.resolve(fullPath)];

      try {
        const cmd = require(fullPath);
        if (!cmd?.name) continue;

        // Save main command name
        commands.set(cmd.name.toLowerCase(), cmd);

        // Save aliases if present
        if (cmd.aliases && Array.isArray(cmd.aliases)) {
          for (const alias of cmd.aliases) {
            aliases.set(alias.toLowerCase(), cmd.name.toLowerCase());
          }
        }

      } catch (err) {
        console.error(`❌ Failed to load command ${file}:`, err);
      }
    }
  }
}

loadCommands();

// BOT name mapping
const BOT_NAMES = {
  bot1: 'Shadow',
  bot2: 'Ryuu',
};

async function startBot(sessionName = 'bot1') {
  const botName = BOT_NAMES[sessionName] || sessionName;
  console.log(`Starting ${botName} (session: ${sessionName})`);

  // Auth state directory
  const authDir = path.join(__dirname, 'sessions', sessionName);
  fs.mkdirSync(authDir, { recursive: true });

  // Auth state
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  // Fetch latest baileys version to avoid mismatch errors
  let version = undefined;
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;
    console.log(`Using Baileys version: ${version.join('.')}`);
  } catch (e) {
    console.warn('Could not fetch latest baileys version, continuing without explicit version.', e?.message || e);
  }

  const sock = makeWASocket({
    version,
    // printQRInTerminal deprecated -> we do manual QR handling
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['MacOs', 'Safari', '4.0'],
  });

  // persist creds on update
  sock.ev.on('creds.update', saveCreds);

  // add to global map on open
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(`📱 Scan QR for ${botName}`);
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log(`✅ ${botName} connected successfully!`);
      global.BOT_SOCKS ??= {};
      global.BOT_SOCKS[sessionName] = sock;
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log(`❌ ${botName} disconnected (code: ${code || 'unknown'})`);

      if (code === DisconnectReason.loggedOut) {
        console.log(`🗑️ ${botName} session invalidated — removing auth files for ${sessionName}`);
        try {
          await fsExtra.remove(authDir);
        } catch (err) {
          console.error('Failed to remove session dir:', err);
        }
      }

      // small delay to avoid tight crash loop
      await new Promise((r) => setTimeout(r, 5000));
      // restart
      startBot(sessionName).catch(err => console.error('Failed to restart bot:', err));
    }
  });

  // helper method: sendPollSnapShot (keeps same API as your friend used)
  sock.sendPollSnapShot = async (jid, results, quoted = {}) => {
    try {
      const content = {
        pollResultSnapshotMessage: {
          name: results.caption || 'Poll Results',
          pollVotes: results.results || [],
        },
      };
      const message = generateWAMessageFromContent(jid, content, {
        quoted: quoted.quoted || undefined,
      });
      return await sock.relayMessage(jid, message.message, {});
    } catch (err) {
      console.error('sendPollSnapShot error:', err);
      throw err;
    }
  };

  // message handler (basic prefix-based command dispatcher)
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const m = messages[0];
      if (!m) return;
      if (!m.message) return;
      if (m.key && m.key.fromMe) return; // ignore own messages

      // try to extract text from known places
      const messageText =
        (m.message.conversation) ||
        (m.message?.extendedTextMessage?.text) ||
        (m.message?.imageMessage?.caption) ||
        '';

      if (!messageText) return;

if (m) {
  const senderName = m.pushName || 'Unknown';
  let content =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    m.message?.buttonsResponseMessage?.selectedDisplayText ||
    m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    '[non-text message]';

  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] 💬 ${senderName}: ${content}`);
}

      // commands handler 
loadCommands(); 

if (!messageText.startsWith(config.prefix)) return;

const args = messageText.slice(config.prefix.length).trim().split(/ +/);
const cmdName = args.shift().toLowerCase();

// first try direct name
let command = commands.get(cmdName);

// if not found, try alias
if (!command && aliases.has(cmdName)) {
  const mainName = aliases.get(cmdName);
  command = commands.get(mainName);
}

if (!command) return;

try {
  await command.execute(sock, m, args, { sessionName, config, commands });
} catch (cmdErr) {
  console.error('Command execution error:', cmdErr);
  await sock.sendMessage(m.key.remoteJid, { text: '❌ Error executing command.' });
}
    } catch (err) {
      console.error('messages.upsert handler error:', err);
    }
  });

  console.log(`✅ ${botName} ready — session dir: ${authDir}`);
  return sock;
}

// start one or more sessions:
startBot('bot1').catch(console.error);