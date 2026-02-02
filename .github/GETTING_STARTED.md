---
name: 🚀 Welcome to Your New MANTRA dApp!
about: Quick setup instructions for your new project
---

# 🎉 Your MANTRA dApp is Ready!

Thanks for using the MANTRA EVM dApp Template! Let's get you started.

## Quick Setup (5 minutes)

### 1️⃣ Run the Setup Script

The easiest way to configure your project:

```bash
./setup.sh
```

This will automatically:
- ✅ Rename packages to match your project
- ✅ Update the page title
- ✅ Clean up template documentation
- ✅ Update the README with your info

### 2️⃣ Configure Environment

```bash
# Smart contracts configuration
cp packages/contracts/.env.example packages/contracts/.env
# Edit packages/contracts/.env and add your PRIVATE_KEY

# Web app configuration  
cp packages/webapp/.env.example packages/webapp/.env
# You'll add contract addresses here after deployment
```

### 3️⃣ Install & Run

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

Visit http://localhost:5173 to see your dApp! 🎉

## 📚 Next Steps

- **Deploy Contracts**: `yarn contracts:deploy:dukong` (to testnet)
- **Customize UI**: Edit components in `packages/webapp/src/components/`
- **Read the Docs**: Check out [TEMPLATE_SETUP.md](./TEMPLATE_SETUP.md) for detailed instructions
- **Review Examples**: See how Counter and SendToken components work

## 🆘 Need Help?

- **Full Documentation**: [README.md](./README.md)
- **Setup Guide**: [TEMPLATE_SETUP.md](./TEMPLATE_SETUP.md)
- **MANTRA Docs**: https://docs.mantrachain.io
- **Discord**: Join the MANTRA developer community

## 🔐 Security Reminder

⚠️ **NEVER commit your `.env` files!** They contain your private keys.

The template includes `.gitignore` entries to protect you, but always double-check:
- `packages/contracts/.env`
- `packages/webapp/.env`

---

**Happy Building on MANTRA! 🕉️**
