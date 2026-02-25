import os
import random
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Loot Oracle API", description="AI-powered GameFi loot recommendation engine", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class PlayerProfile(BaseModel):
    level: int = Field(..., ge=1, le=100)
    player_class: str
    play_style: str
    preferred_element: Optional[str] = None
    gold: Optional[int] = 0

class LootItem(BaseModel):
    name: str
    type: str
    rarity: str
    stats: dict
    description: str
    estimated_value: int
    match_score: float

class RecommendResponse(BaseModel):
    player_summary: str
    recommendations: list[LootItem]
    strategy_tip: str
    powered_by: str

LOOT_DB = [
    {"name":"Inferno Blade","type":"Weapon","rarity":"Legendary","element":"Fire","classes":["Warrior","Paladin"],"styles":["aggressive"],"stats":{"ATK":320,"CRIT":45,"Fire DMG":80},"base_value":8500},
    {"name":"Shadow Dagger","type":"Weapon","rarity":"Epic","element":"Dark","classes":["Rogue"],"styles":["aggressive","explorer"],"stats":{"ATK":210,"SPD":60,"Poison":35},"base_value":4200},
    {"name":"Arcane Staff","type":"Weapon","rarity":"Legendary","element":"Lightning","classes":["Mage"],"styles":["aggressive","support"],"stats":{"MATK":380,"MP":200,"Chain Lightning":90},"base_value":9000},
    {"name":"Glacial Shield","type":"Armor","rarity":"Epic","element":"Ice","classes":["Warrior","Paladin"],"styles":["defensive"],"stats":{"DEF":280,"HP":500,"Ice Barrier":60},"base_value":5500},
    {"name":"Ranger Longbow","type":"Weapon","rarity":"Rare","element":"Light","classes":["Ranger"],"styles":["aggressive","explorer"],"stats":{"ATK":190,"RNG":80,"Pierce":40},"base_value":3200},
    {"name":"Holy Relic","type":"Accessory","rarity":"Legendary","element":"Light","classes":["Paladin","Mage"],"styles":["support","defensive"],"stats":{"HP":800,"Heal Boost":120,"Divine Shield":50},"base_value":7800},
    {"name":"Storm Cloak","type":"Armor","rarity":"Epic","element":"Lightning","classes":["Mage","Ranger"],"styles":["aggressive","explorer"],"stats":{"MATK":80,"DEF":150,"Dodge":45},"base_value":4800},
    {"name":"Berserker Gauntlets","type":"Armor","rarity":"Rare","element":"Fire","classes":["Warrior"],"styles":["aggressive"],"stats":{"ATK":120,"DEF":80,"Rage":55},"base_value":2900},
    {"name":"Phantom Boots","type":"Armor","rarity":"Epic","element":"Dark","classes":["Rogue","Ranger"],"styles":["explorer","aggressive"],"stats":{"SPD":90,"Stealth":70,"DEF":100},"base_value":4100},
    {"name":"Crystal Orb","type":"Accessory","rarity":"Legendary","element":"Ice","classes":["Mage"],"styles":["support","defensive"],"stats":{"MATK":200,"MP":300,"Freeze Chance":65},"base_value":8200},
    {"name":"Iron Bastion","type":"Armor","rarity":"Rare","element":"Light","classes":["Warrior","Paladin"],"styles":["defensive"],"stats":{"DEF":350,"HP":600,"Block":75},"base_value":3600},
    {"name":"Void Ring","type":"Accessory","rarity":"Legendary","element":"Dark","classes":["Rogue","Mage"],"styles":["aggressive","explorer"],"stats":{"ATK":150,"MATK":150,"Void Burst":100},"base_value":9500},
    {"name":"Ember Amulet","type":"Accessory","rarity":"Rare","element":"Fire","classes":["Warrior","Mage","Paladin"],"styles":["aggressive","support"],"stats":{"Fire DMG":55,"HP":200,"Burn Resist":80},"base_value":2600},
    {"name":"Frostweave Robe","type":"Armor","rarity":"Epic","element":"Ice","classes":["Mage"],"styles":["defensive","support"],"stats":{"DEF":180,"MATK":120,"Ice Resist":90},"base_value":4700},
    {"name":"Nature Quiver","type":"Accessory","rarity":"Epic","element":"Light","classes":["Ranger"],"styles":["support","explorer"],"stats":{"ATK":90,"Arrow Regen":50,"Poison Arrow":60},"base_value":4400},
]

RARITY_LEVEL = {"Common":1,"Rare":10,"Epic":30,"Legendary":60}
RARITY_MULT = {"Common":0.5,"Rare":1.0,"Epic":1.5,"Legendary":2.0}

def score_item(item, profile):
    s = 0.0
    if profile.player_class in item["classes"]: s += 40
    if profile.play_style in item["styles"]: s += 30
    if profile.preferred_element and item.get("element") == profile.preferred_element: s += 20
    if profile.level >= RARITY_LEVEL.get(item["rarity"],1): s += 10 * RARITY_MULT.get(item["rarity"],1)
    if profile.gold and profile.gold >= item["base_value"]: s += 5
    s += random.uniform(0,2)
    return round(s,2)

def strategy_tip(profile):
    tips = {
        "aggressive":"Stack ATK and CRIT — burst enemies down before they react.",
        "defensive":"Max DEF and HP. Outlast opponents in prolonged fights.",
        "support":"Healing and buff accessories keep your team alive.",
        "explorer":"Balance SPD and Dodge to navigate dungeons efficiently.",
    }
    tip = tips.get(profile.play_style,"Balance your stats for versatile gameplay.")
    if profile.level < 20: tip += " Focus on Rare items before chasing Legendaries."
    elif profile.level >= 60: tip += " You can now equip Legendary gear — prioritize those drops."
    return tip

async def ai_summary(profile, top3_names):
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        return None
    try:
        import anthropic
        c = anthropic.Anthropic(api_key=key)
        msg = c.messages.create(
            model="claude-3-haiku-20240307", max_tokens=180,
            messages=[{"role":"user","content":
                f"GameFi loot advisor. Player: Level {profile.level} {profile.player_class}, {profile.play_style} style, element={profile.preferred_element}. "
                f"Top recommended items: {', '.join(top3_names)}. "
                f"In 2 sentences explain why these suit this player and give one power-tip. Be concise and exciting."}])
        return msg.content[0].text
    except Exception:
        return None

@app.get("/")
def root():
    return {"service":"Loot Oracle API","version":"1.0.0","hackathon":"OneHack 3.0","endpoints":["/recommend","/loot","/health"]}

@app.get("/health")
def health():
    return {"status":"ok","ai_enabled":bool(os.environ.get("ANTHROPIC_API_KEY"))}

@app.get("/loot")
def list_loot():
    return {"items":LOOT_DB,"total":len(LOOT_DB)}

@app.post("/recommend", response_model=RecommendResponse)
async def recommend(profile: PlayerProfile):
    scored = sorted([(item, score_item(item, profile)) for item in LOOT_DB], key=lambda x: x[1], reverse=True)
    top5 = scored[:5]
    ai_tip = await ai_summary(profile, [i["name"] for i,_ in top5[:3]])
    tip = ai_tip if ai_tip else strategy_tip(profile)
    recs = [LootItem(
        name=i["name"], type=i["type"], rarity=i["rarity"], stats=i["stats"],
        description=f"A {i['rarity'].lower()} {i['type'].lower()} imbued with {i['element']} power.",
        estimated_value=i["base_value"], match_score=s
    ) for i,s in top5]
    summary = f"Level {profile.level} {profile.player_class} ({profile.play_style})" + (f" — {profile.preferred_element} affinity" if profile.preferred_element else "")
    return RecommendResponse(player_summary=summary, recommendations=recs, strategy_tip=tip, powered_by="Claude 3 Haiku + Scoring Engine" if ai_tip else "Scoring Engine")
