const isSenderAdmin = require('../../utils/isAdmin');
const config = require('../../config');

module.exports = {
  name: 'open',
  alias: ['unlock'],
  description: 'Open the group for messages (admins only).',

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
      await sock.sendMessage(from, { text: '❌ Only *admins* can open the group chat.' }, { quoted: m });
      return;
    }

    // 🕒 Check for minutes argument
    const minutes = parseInt(args[0]);
    const openMsg = minutes
      ? `✅ Group is now *open* for everyone for *${minutes} minute(s)*!`
      : '✅ Group is now *open* for everyone to send messages!';

    try {
      // 🔓 Open group (allow all to send)
      await sock.groupSettingUpdate(from, 'not_announcement');
      await sock.sendMessage(from, { text: openMsg }, { quoted: m });

      // ⏱️ Auto-close after time (if minutes provided)
      if (minutes && minutes > 0) {
        setTimeout(async () => {
          try {
            await sock.groupSettingUpdate(from, 'announcement');
            await sock.sendMessage(from, { text: '🔒 Group has been *closed* automatically after the set duration.' });
          } catch (e) {
            console.error('Auto-close failed:', e);
          }
        }, minutes * 60 * 1000);
      }
    } catch (err) {
      console.error('Open command error:', err);
      await sock.sendMessage(from, { text: '❌ Failed to open the group.' }, { quoted: m });
    }
  },
};
