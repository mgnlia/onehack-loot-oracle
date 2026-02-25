'use client'
import { useState } from 'react'

// Use local Next.js API route (serverless) — no separate backend needed
// Set NEXT_PUBLIC_API_URL to override with an external backend (e.g. Railway)
const API = (process.env.NEXT_PUBLIC_API_URL ?? '') + '/api/recommend'

const CLASSES = ['Warrior','Mage','Rogue','Ranger','Paladin']
const STYLES = ['aggressive','defensive','support','explorer']
const ELEMENTS = ['Fire','Ice','Lightning','Dark','Light']

const RARITY_COLORS: Record<string,string> = {
  Common:'text-gray-400 border-gray-500',
  Rare:'text-blue-400 border-blue-500',
  Epic:'text-purple-400 border-purple-500',
  Legendary:'text-yellow-400 border-yellow-500',
}
const RARITY_BG: Record<string,string> = {
  Common:'bg-gray-900/60',
  Rare:'bg-blue-950/60',
  Epic:'bg-purple-950/60',
  Legendary:'bg-yellow-950/60',
}

interface LootItem {
  name: string
  type: string
  rarity: string
  stats: Record<string,number>
  description: string
  estimated_value: number
  match_score: number
}

interface RecommendResponse {
  player_summary: string
  recommendations: LootItem[]
  strategy_tip: string
  powered_by: string
}

export default function Home() {
  const [level, setLevel] = useState(30)
  const [playerClass, setPlayerClass] = useState('Warrior')
  const [playStyle, setPlayStyle] = useState('aggressive')
  const [element, setElement] = useState('')
  const [gold, setGold] = useState(5000)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RecommendResponse | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, player_class: playerClass, play_style: playStyle, preferred_element: element || null, gold }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      setResult(await res.json())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations')
    } finally {
      setLoading(false)
    }
  }

  const rankIcon = (i: number) => ['👑','⚔️','🛡️','💍','🎯'][i] ?? '🎁'

  return (
    <main className="min-h-screen" style={{background:'linear-gradient(135deg,#0a0a0f 0%,#1a0a2e 50%,#0a0a0f 100%)'}}>
      <header className="border-b border-yellow-900/40 py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <span className="text-4xl">⚔️</span>
          <div>
            <h1 className="text-3xl font-bold text-yellow-400" style={{fontFamily:'Georgia,serif'}}>Loot Oracle</h1>
            <p className="text-gray-400 text-sm">AI-Powered GameFi Loot Advisor · OneHack 3.0</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-yellow-900/40 p-8 mb-8" style={{background:'rgba(18,18,26,0.95)'}}>
          <h2 className="text-xl font-semibold text-yellow-300 mb-6">🎮 Enter Your Player Profile</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div>
              <label className="block text-sm text-gray-400 mb-2">Level: <span className="text-yellow-400 font-bold text-lg">{level}</span></label>
              <input type="range" min={1} max={100} value={level} onChange={e=>setLevel(+e.target.value)} className="w-full accent-yellow-400"/>
              <div className="flex justify-between text-xs text-gray-600 mt-1"><span>1</span><span>100</span></div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Gold</label>
              <input type="number" min={0} value={gold} onChange={e=>setGold(+e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"/>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Class</label>
              <div className="flex flex-wrap gap-2">
                {CLASSES.map(c=>(
                  <button key={c} type="button" onClick={()=>setPlayerClass(c)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${playerClass===c?'bg-yellow-500 border-yellow-500 text-black font-semibold':'border-gray-600 text-gray-400 hover:border-yellow-600'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Play Style</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(s=>(
                  <button key={s} type="button" onClick={()=>setPlayStyle(s)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all capitalize ${playStyle===s?'bg-purple-500 border-purple-500 text-white font-semibold':'border-gray-600 text-gray-400 hover:border-purple-600'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Element <span className="text-gray-600">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {[{v:'',l:'Any'},...ELEMENTS.map(e=>({v:e,l:{Fire:'🔥 Fire',Ice:'❄️ Ice',Lightning:'⚡ Lightning',Dark:'🌑 Dark',Light:'✨ Light'}[e]??e}))].map(({v,l})=>(
                  <button key={v} type="button" onClick={()=>setElement(v)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${element===v?'bg-blue-600 border-blue-500 text-white font-semibold':'border-gray-600 text-gray-400 hover:border-blue-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-lg transition-all disabled:opacity-50 text-black"
                style={{background:loading?'#555':'linear-gradient(90deg,#f59e0b,#ef4444)'}}>
                {loading?'🔮 Consulting the Oracle...':'⚔️ Get Loot Recommendations'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/50 p-4 mb-6 text-red-300">⚠️ {error}</div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-yellow-700/50 p-6" style={{background:'rgba(18,18,26,0.95)'}}>
              <div className="flex items-start gap-3">
                <span className="text-3xl">🧙</span>
                <div>
                  <p className="text-yellow-300 font-semibold text-lg">{result.player_summary}</p>
                  <p className="text-gray-300 mt-2 leading-relaxed">{result.strategy_tip}</p>
                  <p className="text-xs text-gray-600 mt-3">Powered by: {result.powered_by}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-4">🎁 Top Recommended Loot</h3>
              <div className="grid gap-4">
                {result.recommendations.map((item,i)=>{
                  const [textC, borderC] = (RARITY_COLORS[item.rarity]??'text-gray-400 border-gray-600').split(' ')
                  return (
                    <div key={i} className={`rounded-xl border p-5 ${RARITY_BG[item.rarity]??'bg-gray-900/60'} ${borderC}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{rankIcon(i)}</span>
                            <h4 className={`font-bold text-lg ${textC}`}>{item.name}</h4>
                          </div>
                          <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded border ${textC} ${borderC}`}>{item.rarity}</span>
                          <p className="text-gray-500 text-xs mt-1">{item.type}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(item.stats).map(([k,v])=>(
                          <span key={k} className="bg-gray-800/80 text-gray-300 text-xs px-2 py-1 rounded">
                            {k}: <span className="text-white font-semibold">+{v}</span>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>💰 {item.estimated_value.toLocaleString()} gold</span>
                        <div className="flex items-center gap-2">
                          <span>Match:</span>
                          <div className="w-24 bg-gray-800 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300"
                              style={{width:`${Math.min(100,(item.match_score/100)*100)}%`}}/>
                          </div>
                          <span className="text-yellow-400 font-semibold">{item.match_score}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-16 text-center text-gray-700 text-sm pb-8">
          <p>Built for <span className="text-yellow-600">OneHack 3.0</span> · AI Track · GameFi Loot Oracle</p>
          <a href="https://github.com/mgnlia/onehack-loot-oracle" target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-block hover:text-gray-400 transition-colors">GitHub ↗</a>
        </footer>
      </div>
    </main>
  )
}
