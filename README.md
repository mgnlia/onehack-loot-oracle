# ⚔️ Loot Oracle — AI GameFi Loot Recommendation Engine

> **OneHack 3.0 Hackathon Entry · AI Track · $16.1K USDT Prize Pool**

An AI-powered loot recommendation engine for GameFi players. Input your player profile (level, class, play style, element preference) and receive personalized gear recommendations scored by an ML engine, optionally enhanced by Claude 3 Haiku.

## 🚀 Live Demo

- **Frontend**: https://onehack-loot-oracle.vercel.app
- **Backend API**: https://onehack-loot-oracle-production.up.railway.app
- **API Docs**: https://onehack-loot-oracle-production.up.railway.app/docs

## 🏗️ Architecture

```
Frontend (Next.js 14 + Tailwind CSS)  →  Backend (FastAPI + Python 3.11)
           Vercel                                   Railway (Docker)
```

## 🎮 Features

- **5 player classes**: Warrior, Mage, Rogue, Ranger, Paladin
- **4 play styles**: aggressive, defensive, support, explorer
- **5 elemental affinities**: Fire, Ice, Lightning, Dark, Light
- **15 unique loot items** across 4 rarity tiers (Rare → Legendary)
- **AI scoring engine**: class match + style + element affinity + level gating
- **Claude 3 Haiku** narrative layer (set `ANTHROPIC_API_KEY` env var)
- Rarity-coded item cards with match score bars

## 🛠️ Local Development

### Backend
```bash
cd backend
pip install uv
uv pip install --system fastapi "uvicorn[standard]" pydantic anthropic
uvicorn main:app --reload
# API at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
# UI at http://localhost:3000
```

## 📡 API Example

```bash
curl -X POST https://onehack-loot-oracle-production.up.railway.app/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "level": 65,
    "player_class": "Mage",
    "play_style": "aggressive",
    "preferred_element": "Lightning",
    "gold": 10000
  }'
```

## 🏆 Hackathon

Built for **OneHack 3.0** (March 2026) · AI & GameFi Track
