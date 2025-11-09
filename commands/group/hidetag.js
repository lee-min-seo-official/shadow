const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const isSenderAdmin = require('../../utils/isAdmin');

module.exports = {
  name: 'hidetag',
  description: 'Tag all members without showing mentions.',

  execute: async (sock, m, args, { groupMetadata }) => {
    const from = m.key.remoteJid;

    // ✅ Group-only check
    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, { text: '⚠️ This command only works in *groups!*' }, { quoted: m });
    }

    // ✅ Admin checks
    const { isSenderAdmin: senderAdmin, isBotAdmin, participants } = await isSenderAdmin(sock, m, groupMetadata);

    if (!senderAdmin) {
      return sock.sendMessage(from, { text: '❌ You must be an *admin* to use this command!' }, { quoted: m });
    }


    const mentions = participants.map(p => p.id);
    const textArg = args.join(' ').trim();
    const quoted = m.message?.extendedTextMessage?.contextInfo || null;

    // 🧩 Case 1: Replying to a message (text or media)
    if (quoted?.quotedMessage) {
      const quotedMsg = { message: quoted.quotedMessage };
      const quotedType = Object.keys(quoted.quotedMessage)[0];

      try {
        // 🖼️ Image
        if (quotedType.includes('imageMessage')) {
          const buffer = await downloadMediaMessage(quotedMsg, 'buffer', {}, { logger: console });
          return await sock.sendMessage(from, {
            image: buffer,
            caption: textArg || quoted.quotedMessage[quotedType]?.caption || '',
            mentions,
          });
        }

        // 🎥 Video
        if (quotedType.includes('videoMessage')) {
          const buffer = await downloadMediaMessage(quotedMsg, 'buffer', {}, { logger: console });
          return await sock.sendMessage(from, {
            video: buffer,
            caption: textArg || quoted.quotedMessage[quotedType]?.caption || '',
            mentions,
          });
        }

        // 🧩 Sticker
        if (quotedType.includes('stickerMessage')) {
          const buffer = await downloadMediaMessage(quotedMsg, 'buffer', {}, { logger: console });
          return await sock.sendMessage(from, {
            sticker: buffer,
            mentions,
          });
        }

        // 📝 Text reply
        if (quotedType.includes('conversation') || quotedType.includes('extendedTextMessage')) {
          const textMsg =
            textArg ||
            quoted.quotedMessage.conversation ||
            quoted.quotedMessage.extendedTextMessage?.text ||
            '';
          return await sock.sendMessage(from, { text: textMsg, mentions });
        }
      } catch (err) {
        console.error('⚠️ hidetag media error:', err);
        return sock.sendMessage(from, { text: '❌ Failed to process quoted message.' }, { quoted: m });
      }
    }

    // 🧾 Case 2: No quoted message — text only
    if (textArg) {
      return sock.sendMessage(from, { text: textArg, mentions });
    }

    // 🚫 Case 3: Nothing provided
    return sock.sendMessage(
      from,
      { text: '⚠️ Provide a message after `.hidetag` or reply to a message with it.' },
      { quoted: m }
    );
  },
};
