const isSenderAdmin = require('../../utils/isAdmin');
const config = require('../../config');

module.exports = {
  name: 'close',
  alias: ['lock'],
  description: 'Close the group for messages (admins only).',

  execute: async (sock, m, args, { groupMetadata }) => {
    const from = m.key.remoteJid;

    // ✅ Must be a group
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: '⚠️ This command only works in *groups!*' }, { quoted: m });
      return;
    }

    // 🛡️ Permission checks
    const { isSenderAdmin: senderAdmin, isBotAdmin } = await isSenderAdmin(sock, m, groupMetadata);

    if (!senderAdmin) {
      await sock.sendMessage(from, { text: '❌ Only *admins* can close the group chat.' }, { quoted: m });
      return;
    }

    // 🕒 Check for minutes argument
    const minutes = parseInt(args[0]);
    const closeMsg = minutes
      ? `🔒 Group has been *closed* for *${minutes} minute(s)*. Only admins can send messages now.`
      : '🔒 Group is now *closed*. Only admins can send messages.';

    try {
      // 🔒 Close group (admin-only)
      await sock.groupSettingUpdate(from, 'announcement');
      await sock.sendMessage(from, { text: closeMsg }, { quoted: m });

      // ⏱️ Auto-open after time (if minutes provided)
      if (minutes && minutes > 0) {
        setTimeout(async () => {
          try {
            await sock.groupSettingUpdate(from, 'not_announcement');
            await sock.sendMessage(from, { text: '✅ Group has been *reopened* automatically after the set duration.' });
          } catch (e) {
            console.error('Auto-open failed:', e);
          }
        }, minutes * 60 * 1000);
      }
    } catch (err) {
      console.error('Close command error:', err);
      await sock.sendMessage(from, { text: '❌ Failed to close the group.' }, { quoted: m });
    }
  },
};
