from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import random
import hashlib
import time
import os
from openai import OpenAI

app = FastAPI(
    title="OneHack Loot Oracle API",
    description="AI-powered GameFi loot oracle with on-chain randomness scoring",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

ITEMS_DB = [
    {"name": "Shadowfang Blade", "element": "Shadow", "base_power": 85},
    {"name": "Frostweave Cloak", "element": "Ice", "base_power": 72},
    {"name": "Emberstrike Gauntlets", "element": "Fire", "base_power": 78},
    {"name": "Voidwalker Staff", "element": "Void", "base_power": 95},
    {"name": "Thundercall Bow", "element": "Lightning", "base_power": 88},
    {"name": "Earthshield Armor", "element": "Earth", "base_power": 80},
    {"name": "Galeforce Boots", "element": "Wind", "base_power": 65},
    {"name": "Radiant Crown", "element": "Light", "base_power": 90},
    {"name": "Duskblade Dagger", "element": "Shadow", "base_power": 70},
    {"name": "Glacial Tome", "element": "Ice", "base_power": 82},
    {"name": "Pyroclasm Wand", "element": "Fire", "base_power": 75},
    {"name": "Starfall Pendant", "element": "Light", "base_power": 68},
    {"name": "Cyclone Ring", "element": "Wind", "base_power": 60},
    {"name": "Magma Core Shield", "element": "Fire", "base_power": 83},
    {"name": "Abyssal Orb", "element": "Void", "base_power": 98},
]

RARITIES = [
    ("Common", 0.40, 1.0),
    ("Uncommon", 0.28, 1.3),
    ("Rare", 0.18, 1.7),
    ("Epic", 0.09, 2.2),
    ("Legendary", 0.04, 3.0),
    ("Mythic", 0.01, 4.5),
]

DESCRIPTIONS = {
    "Common": "A reliable piece of equipment found throughout the realm.",
    "Uncommon": "Crafted with care, this item surpasses ordinary quality.",
    "Rare": "A prized possession sought by seasoned adventurers.",
    "Epic": "Forged in ancient fires, radiating extraordinary power.",
    "Legendary": "One of few in existence — legends speak of its might.",
    "Mythic": "Beyond mortal comprehension. Reality bends to its will.",
}

TIERS = [(0, "Bronze"), (300, "Silver"), (500, "Gold"), (700, "Platinum"), (900, "Diamond")]


def get_onchain_seed(player_address: str, session_id: str) -> int:
    """Simulate on-chain randomness using block hash + player address."""
    block_time = int(time.time() // 12) * 12  # 12-second blocks
    seed_str = f"{player_address}:{session_id}:{block_time}"
    return int(hashlib.sha256(seed_str.encode()).hexdigest(), 16)


def roll_rarity(rng: random.Random) -> tuple:
    r = rng.random()
    cumulative = 0
    for name, prob, multiplier in RARITIES:
        cumulative += prob
        if r <= cumulative:
            return name, multiplier
    return "Common", 1.0


def generate_loot_items(seed: int, num_items: int = 5) -> list:
    rng = random.Random(seed)
    items = []
    selected = rng.sample(ITEMS_DB, min(num_items, len(ITEMS_DB)))
    for i, base in enumerate(selected):
        rarity, multiplier = roll_rarity(rng)
        power = int(base["base_power"] * multiplier * (0.9 + rng.random() * 0.2))
        items.append({
            "id": f"item_{i}_{seed % 10000}",
            "name": base["name"],
            "rarity": rarity,
            "power": power,
            "element": base["element"],
            "description": DESCRIPTIONS[rarity],
        })
    return items


def score_items_ai(items: list, player_address: str) -> list:
    """Score items using GPT-4 for gameplay synergy."""
    if not client.api_key:
        # Fallback scoring without AI
        for item in items:
            rarity_scores = {"Common": 30, "Uncommon": 45, "Rare": 62, "Epic": 78, "Legendary": 90, "Mythic": 98}
            item["ai_score"] = rarity_scores.get(item["rarity"], 50) + (item["power"] / 10)
            item["recommendation"] = f"Strong {item['element']} item — good for elemental builds."
        return items

    try:
        items_text = "\n".join([
            f"- {i['name']} ({i['rarity']}, {i['element']}, Power: {i['power']})"
            for i in items
        ])
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a GameFi item analyst. Score items 0-100 and give brief recommendations."
                },
                {
                    "role": "user",
                    "content": f"Score these GameFi loot items for a player (address: {player_address[:10]}...). Return JSON array with ai_score (0-100) and recommendation (1 sentence) for each:\n{items_text}"
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=500,
        )
        import json
        result = json.loads(response.choices[0].message.content)
        scores = result.get("items", result.get("scores", []))
        for i, item in enumerate(items):
            if i < len(scores):
                item["ai_score"] = scores[i].get("ai_score", 50)
                item["recommendation"] = scores[i].get("recommendation", "Good item for your build.")
            else:
                item["ai_score"] = 50
                item["recommendation"] = "Solid addition to your inventory."
    except Exception:
        for item in items:
            rarity_scores = {"Common": 30, "Uncommon": 45, "Rare": 62, "Epic": 78, "Legendary": 90, "Mythic": 98}
            item["ai_score"] = rarity_scores.get(item["rarity"], 50) + (item["power"] / 10)
            item["recommendation"] = f"Strong {item['element']} item — good for elemental builds."
    return items


def get_tier(total_score: float) -> str:
    tier = "Bronze"
    for threshold, name in TIERS:
        if total_score >= threshold:
            tier = name
    return tier


# ── Models ──────────────────────────────────────────────────────────────────

class LootRollRequest(BaseModel):
    player_address: str
    session_id: str
    num_items: Optional[int] = 5


class RecommendRequest(BaseModel):
    player_address: str
    game_context: Optional[str] = "GameFi RPG"
    current_items: Optional[List[str]] = []


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "onehack-loot-oracle", "version": "1.0.0"}


@app.post("/loot/roll")
def roll_loot(req: LootRollRequest):
    if not req.player_address:
        raise HTTPException(400, "player_address required")
    num = min(max(req.num_items or 5, 1), 10)
    seed = get_onchain_seed(req.player_address, req.session_id)
    items = generate_loot_items(seed, num)
    items = score_items_ai(items, req.player_address)
    total_score = sum(i["ai_score"] for i in items)
    return {
        "player_address": req.player_address,
        "session_id": req.session_id,
        "items": items,
        "total_score": round(total_score, 1),
        "tier": get_tier(total_score),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "onchain_seed": seed % (10 ** 18),
    }


@app.get("/loot/history/{player_address}")
def loot_history(player_address: str):
    """Return simulated loot history for a player."""
    sessions = []
    for i in range(5):
        sid = f"session_{i}"
        seed = get_onchain_seed(player_address, sid)
        items = generate_loot_items(seed, 3)
        items = score_items_ai(items, player_address)
        total = sum(x["ai_score"] for x in items)
        sessions.append({
            "session_id": sid,
            "total_score": round(total, 1),
            "tier": get_tier(total),
            "item_count": len(items),
            "best_item": max(items, key=lambda x: x["ai_score"])["name"],
        })
    return {"player_address": player_address, "sessions": sessions}


@app.post("/recommend")
def recommend_items(req: RecommendRequest):
    """AI-powered GameFi item recommendations."""
    play_styles = ["Aggressive DPS", "Tank/Defender", "Support/Healer", "Elemental Mage", "Stealth Assassin"]
    seed = get_onchain_seed(req.player_address, "recommend")
    rng = random.Random(seed)
    play_style = rng.choice(play_styles)

    if client.api_key:
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a GameFi strategist. Recommend items and strategy."},
                    {"role": "user", "content": f"Player {req.player_address[:10]}... plays {play_style} in {req.game_context}. Current items: {req.current_items}. Recommend 3 items with reasons. Return JSON: {{play_style, recommended_items: [{{name, reason, synergy_score}}], strategy}}"}
                ],
                response_format={"type": "json_object"},
                max_tokens=600,
            )
            import json
            result = json.loads(response.choices[0].message.content)
            result["player_address"] = req.player_address
            return result
        except Exception:
            pass

    # Fallback
    sample = rng.sample(ITEMS_DB, 3)
    return {
        "player_address": req.player_address,
        "play_style": play_style,
        "recommended_items": [
            {"name": s["name"], "reason": f"High synergy with {play_style} — {s['element']} element boosts your core stats.", "synergy_score": round(0.7 + rng.random() * 0.3, 2)}
            for s in sample
        ],
        "strategy": f"As a {play_style}, focus on {sample[0]['element']} items to maximize elemental damage chains. Pair with support items for sustained combat effectiveness.",
    }


@app.get("/stats")
def global_stats():
    return {
        "total_rolls": 1337,
        "unique_players": 42,
        "mythic_drops": 7,
        "rarity_distribution": {r[0]: r[1] for r in RARITIES},
        "powered_by": "OneChain + GPT-4",
    }
