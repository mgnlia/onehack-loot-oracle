import { NextRequest, NextResponse } from 'next/server'

const LOOT_DB = [
  {name:"Inferno Blade",type:"Weapon",rarity:"Legendary",element:"Fire",classes:["Warrior","Paladin"],styles:["aggressive"],stats:{ATK:320,CRIT:45,"Fire DMG":80},base_value:8500},
  {name:"Shadow Dagger",type:"Weapon",rarity:"Epic",element:"Dark",classes:["Rogue"],styles:["aggressive","explorer"],stats:{ATK:210,SPD:60,Poison:35},base_value:4200},
  {name:"Arcane Staff",type:"Weapon",rarity:"Legendary",element:"Lightning",classes:["Mage"],styles:["aggressive","support"],stats:{MATK:380,MP:200,"Chain Lightning":90},base_value:9000},
  {name:"Glacial Shield",type:"Armor",rarity:"Epic",element:"Ice",classes:["Warrior","Paladin"],styles:["defensive"],stats:{DEF:280,HP:500,"Ice Barrier":60},base_value:5500},
  {name:"Ranger Longbow",type:"Weapon",rarity:"Rare",element:"Light",classes:["Ranger"],styles:["aggressive","explorer"],stats:{ATK:190,RNG:80,Pierce:40},base_value:3200},
  {name:"Holy Relic",type:"Accessory",rarity:"Legendary",element:"Light",classes:["Paladin","Mage"],styles:["support","defensive"],stats:{HP:800,"Heal Boost":120,"Divine Shield":50},base_value:7800},
  {name:"Storm Cloak",type:"Armor",rarity:"Epic",element:"Lightning",classes:["Mage","Ranger"],styles:["aggressive","explorer"],stats:{MATK:80,DEF:150,Dodge:45},base_value:4800},
  {name:"Berserker Gauntlets",type:"Armor",rarity:"Rare",element:"Fire",classes:["Warrior"],styles:["aggressive"],stats:{ATK:120,DEF:80,Rage:55},base_value:2900},
  {name:"Phantom Boots",type:"Armor",rarity:"Epic",element:"Dark",classes:["Rogue","Ranger"],styles:["explorer","aggressive"],stats:{SPD:90,Stealth:70,DEF:100},base_value:4100},
  {name:"Crystal Orb",type:"Accessory",rarity:"Legendary",element:"Ice",classes:["Mage"],styles:["support","defensive"],stats:{MATK:200,MP:300,"Freeze Chance":65},base_value:8200},
  {name:"Iron Bastion",type:"Armor",rarity:"Rare",element:"Light",classes:["Warrior","Paladin"],styles:["defensive"],stats:{DEF:350,HP:600,Block:75},base_value:3600},
  {name:"Void Ring",type:"Accessory",rarity:"Legendary",element:"Dark",classes:["Rogue","Mage"],styles:["aggressive","explorer"],stats:{ATK:150,MATK:150,"Void Burst":100},base_value:9500},
  {name:"Ember Amulet",type:"Accessory",rarity:"Rare",element:"Fire",classes:["Warrior","Mage","Paladin"],styles:["aggressive","support"],stats:{"Fire DMG":55,HP:200,"Burn Resist":80},base_value:2600},
  {name:"Frostweave Robe",type:"Armor",rarity:"Epic",element:"Ice",classes:["Mage"],styles:["defensive","support"],stats:{DEF:180,MATK:120,"Ice Resist":90},base_value:4700},
  {name:"Nature Quiver",type:"Accessory",rarity:"Epic",element:"Light",classes:["Ranger"],styles:["support","explorer"],stats:{ATK:90,"Arrow Regen":50,"Poison Arrow":60},base_value:4400},
]

const RARITY_LEVEL: Record<string,number> = {Common:1,Rare:10,Epic:30,Legendary:60}
const RARITY_MULT: Record<string,number> = {Common:0.5,Rare:1.0,Epic:1.5,Legendary:2.0}

function scoreItem(item: typeof LOOT_DB[0], profile: {level:number,player_class:string,play_style:string,preferred_element?:string|null,gold?:number}) {
  let s = 0
  if (item.classes.includes(profile.player_class)) s += 40
  if (item.styles.includes(profile.play_style)) s += 30
  if (profile.preferred_element && item.element === profile.preferred_element) s += 20
  if (profile.level >= (RARITY_LEVEL[item.rarity] ?? 1)) s += 10 * (RARITY_MULT[item.rarity] ?? 1)
  if (profile.gold && profile.gold >= item.base_value) s += 5
  s += Math.random() * 2
  return Math.round(s * 100) / 100
}

function strategyTip(profile: {play_style:string,level:number}) {
  const tips: Record<string,string> = {
    aggressive:"Stack ATK and CRIT — burst enemies down before they react.",
    defensive:"Max DEF and HP. Outlast opponents in prolonged fights.",
    support:"Healing and buff accessories keep your team alive.",
    explorer:"Balance SPD and Dodge to navigate dungeons efficiently.",
  }
  let tip = tips[profile.play_style] ?? "Balance your stats for versatile gameplay."
  if (profile.level < 20) tip += " Focus on Rare items before chasing Legendaries."
  else if (profile.level >= 60) tip += " You can now equip Legendary gear — prioritize those drops."
  return tip
}

export async function POST(req: NextRequest) {
  try {
    const profile = await req.json()
    const scored = LOOT_DB
      .map(item => ({ item, score: scoreItem(item, profile) }))
      .sort((a,b) => b.score - a.score)
      .slice(0,5)

    const recommendations = scored.map(({item,score}) => ({
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      stats: item.stats,
      description: `A ${item.rarity.toLowerCase()} ${item.type.toLowerCase()} imbued with ${item.element} power.`,
      estimated_value: item.base_value,
      match_score: score,
    }))

    const summary = `Level ${profile.level} ${profile.player_class} (${profile.play_style})` +
      (profile.preferred_element ? ` — ${profile.preferred_element} affinity` : '')

    return NextResponse.json({
      player_summary: summary,
      recommendations,
      strategy_tip: strategyTip(profile),
      powered_by: "Scoring Engine (Next.js Serverless)",
    })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ service: "Loot Oracle API", version: "1.0.0", hackathon: "OneHack 3.0" })
}
