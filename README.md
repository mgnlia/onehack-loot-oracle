# 🎰 OneHack Loot Oracle

**AI-Powered GameFi Item Intelligence on OneChain**

Built for [OneHack 3.0](https://dorahacks.io/hackathon/onehackathon) — $16,100 USDT prize pool.

## 🏆 What It Does

The **OneHack Loot Oracle** combines on-chain verifiable randomness with AI behavior scoring to create a fair, intelligent loot system for GameFi applications on OneChain.

### Core Features
- 🎲 **On-Chain Randomness** — Loot seeds derived from OneChain block hashes (tamper-proof)
- 🤖 **AI Behavior Scoring** — GPT-4 analyzes player history and scores item synergy
- ⚖️ **Rarity Engine** — Weighted probability curves (Common → Mythic)
- 🎯 **GameFi Recommender** — Personalized item recommendations based on play style
- 📊 **Loot Analytics** — Track session history, tier progression, item performance

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  React Frontend │───▶│  FastAPI Backend  │───▶│  OneChain RPC   │
│  (Vercel)       │    │  (Railway)        │    │  (Move VM)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  GPT-4 API   │
                        │  (AI Scoring)│
                        └──────────────┘
```

## 📁 Project Structure

```
onehack-loot-oracle/
├── contracts/           # Move smart contracts
│   ├── sources/
│   │   └── loot_oracle.move    # Main loot oracle contract
│   └── Move.toml
├── backend/             # FastAPI AI scoring service
│   ├── main.py          # API endpoints
│   ├── loot_engine.py   # Loot generation logic
│   ├── ai_scorer.py     # GPT-4 scoring
│   ├── recommender.py   # GameFi recommender
│   └── requirements.txt
└── frontend/            # React + Vite UI
    ├── src/
    │   ├── App.tsx
    │   └── App.css
    └── package.json
```

## 🚀 Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
export OPENAI_API_KEY=your_key
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔗 Move Contract

The `LootOracle` Move contract on OneChain provides:
- `roll_loot(player, session_id, seed)` — Generate loot with on-chain randomness
- `get_player_stats(player)` — Query player loot history
- `verify_drop(session_id)` — Verify a loot drop is legitimate

OneChain is Sui-compatible — deploy using Sui CLI targeting OneChain testnet RPC.

## 🌐 Live Demo

- **Frontend**: https://onehack-loot-oracle.vercel.app
- **API**: https://onehack-loot-oracle-api.up.railway.app
- **API Docs**: https://onehack-loot-oracle-api.up.railway.app/docs

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | OneChain (Sui-compatible Move VM) |
| Smart Contracts | Move language |
| Backend | Python, FastAPI, GPT-4 |
| Frontend | React, TypeScript, Vite |
| Backend Deploy | Railway |
| Frontend Deploy | Vercel |

## 🎮 Why This Wins

1. **Novel**: First AI-scored loot oracle on OneChain
2. **Fair**: On-chain randomness = no server manipulation
3. **Smart**: GPT-4 understands item synergies and play styles
4. **Complete**: Full stack — contracts, API, UI, deployment
5. **Extensible**: Any GameFi project can integrate via API

## 📄 License

MIT
