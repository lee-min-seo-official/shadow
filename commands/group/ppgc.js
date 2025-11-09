const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const isSenderAdmin = require('../../utils/isAdmin');
const config = require('../../config');

module.exports = {
  name: 'setppgroup',
  description: 'Set the group profile picture (admins only).',

  async execute(sock, msg, args, { groupMetadata }) {
    const jid = msg.key.remoteJid;
    const sender = msg.participant || msg.key.participant || msg.key.remoteJid;

    // ⚠️ Must be a group
    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, { 
        text: '⚠️ This command only works in *groups!*' 
      }, { quoted: msg });
    }

    // 🧠 Admin check
    const { isSenderAdmin: senderAdmin, isBotAdmin } = await isSenderAdmin(sock, msg, groupMetadata);

    if (!senderAdmin) {
      return sock.sendMessage(jid, { 
        text: '❌ Only *group admins* can use this command!' 
      }, { quoted: msg });
    }

    // 🎯 Quoted or direct image check
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMessage = 
      quoted?.imageMessage 
        ? { message: quoted }
        : msg.message?.imageMessage 
          ? msg 
          : null;

    if (!imageMessage) {
      return sock.sendMessage(jid, { 
        text: `🖼️ Reply to an *image* with \`${config.prefix}setppgroup\` to set it as the new group profile picture.` 
      }, { quoted: msg });
    }

    try {
      // 🖼️ Download image from quoted or direct message
      const buffer = await downloadMediaMessage(
        imageMessage,
        'buffer',
        {},
        { logger: sock.logger }
      );

      // ✅ Update group profile picture
      await sock.updateProfilePicture(jid, buffer);

      // 🌟 Success message
      await sock.sendMessage(jid, { 
        text: '✅ *Group profile picture updated successfully!*' 
      }, { quoted: msg });

    } catch (err) {
      console.error('setppgroup error:', err);
      await sock.sendMessage(jid, { 
        text: '❌ Failed to set the group picture. Please make sure the image is valid.' 
      }, { quoted: msg });
    }
  },
};
