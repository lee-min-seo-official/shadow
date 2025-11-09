module.exports = {
  name: 'ping',
  aliases: ['test'], 
  description: 'Check bot latency',
  execute: async (sock, m) => {
    const jid = m.key.remoteJid;
    const start = Date.now();

    // Send a temporary message first
    const sent = await sock.sendMessage(jid, { text: 'Testing...' }, { quoted: m });

    const end = Date.now();
    const latency = end - start;

    // Edit or send a new message showing latency
    await sock.sendMessage(jid, {
      text: `> ${latency}ms`,
      edit: sent.key, // will edit the previous message if supported
    });

    console.log(`Ping executed in ${latency}ms`);
  },
};
