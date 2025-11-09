<div align="center">
  <img src="data/menu.jpg" alt="Shadow Bot" width="160" />
  <h1>Shadow — WhatsApp Bot</h1>
  <p>A modular WhatsApp bot powered by <strong>Mira</strong> — fast, pluggable, and production-ready.</p>

  <p>
    <a href="https://github.com/lee-min-seo-official/shadow/releases">
      <img src="https://img.shields.io/github/v/release/lee-min-seo-official/shadow?label=release&style=flat-square" alt="Release" />
    </a>
    <img src="https://img.shields.io/github/languages/top/lee-min-seo-official/shadow?style=flat-square" alt="Top language" />
    <img src="https://img.shields.io/github/last-commit/lee-min-seo-official/shadow?style=flat-square" alt="Last commit" />
    <img src="https://img.shields.io/github/issues/lee-min-seo-official/shadow?style=flat-square" alt="Open issues" />
    <img src="https://img.shields.io/github/license/lee-min-seo-official/shadow?style=flat-square" alt="License" />
  </p>
</div>

---

## Table of contents
- [Features](#features)  
- [Quick Start](#quick-start)  
- [Configuration](#configuration)  
- [Command structure](#command-structure)  
- [Contributing](#contributing)  
- [License](#license)

---

## Features
- Modular command loader (`commands/*`) with categories.  
- Admin-check utilities and group management suite (promote/demote/kick/tagall/hidetag).  
- Interactive help menu with image.  
- Multi-session support (multi-file auth state).  
- Ready for production with PM2 or Docker.

---

## Quick Start

```bash
# clone
git clone https://github.com/lee-min-seo-official/shadow.git
cd shadow

# install
npm ci

# copy example config
cp .env.example .env
# edit .env to set PREFIX, OWNER_JID, etc.

# run
node index.js
```
---

## Configuration
- Yes, it is not very difficult to understand!
- Easy to change prefix, OWNER details trough one file (config.js).
- Only one file and all things updates.  
- Mods supported.
- Economy supported (pending).

---

## Command Structure
```csharp
commands/
  utility/
    help.js
    ping.js
  group/
    kick.js
    promote.js
    demote.js
    tagall.js
```

- Note: you can add more folders as categories and js files in them.
- Below is the example of command structure:
```bash
module.exports = {
  name: 'ping',
  aliases: ['p'],
  description: 'Check latency',
  execute: async (sock, m, args, context) => { ... }
};
```

## Contributing

Fork the repository, and try to make some tests for improvements.

---

## License

MIT © 2025 Lee Min Seo

---
