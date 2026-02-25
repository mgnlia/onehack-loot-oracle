import { useState } from 'react'
import './App.css'

interface LootItem {
  id: string
  name: string
  rarity: string
  power: number
  element: string
  description: string
  ai_score: number
  recommendation: string
}

interface LootResult {
  player_address: string
  session_id: string
  items: LootItem[]
  total_score: number
  tier: string
  timestamp: string
}

interface RecommendationResult {
  player_address: string
  play_style: string
  recommended_items: Array<{
    name: string
    reason: string
    synergy_score: number
  }>
  strategy: string
}

const RARITY_COLORS: Record<string, string> = {
  Common: '#9ca3af',
  Uncommon: '#22c55e',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#f59e0b',
  Mythic: '#ef4444',
}

const ELEMENT_EMOJIS: Record<string, string> = {
  Fire: '🔥',
  Ice: '❄️',
  Lightning: '⚡',
  Shadow: '🌑',
  Light: '✨',
  Earth: '🌍',
  Wind: '🌪️',
  Void: '🕳️',
}

export default function App() {
  const [playerAddress, setPlayerAddress] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [lootResult, setLootResult] = useState<LootResult | null>(null)
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [recLoading, setRecLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'oracle' | 'recommend'>('oracle')

  const API_BASE = import.meta.env.VITE_API_URL || 'https://onehack-loot-oracle-api.up.railway.app'

  const rollLoot = async () => {
    if (!playerAddress) {
      setError('Please enter a player address')
      return
    }
    setLoading(true)
    setError('')
    setLootResult(null)
    try {
      const sid = sessionId || `session_${Date.now()}`
      const res = await fetch(`${API_BASE}/loot/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_address: playerAddress,
          session_id: sid,
          num_items: 5,
        }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setLootResult(data)
    } catch (e: any) {
      setError(e.message || 'Failed to roll loot')
    } finally {
      setLoading(false)
    }
  }

  const getRecommendation = async () => {
    if (!playerAddress) {
      setError('Please enter a player address')
      return
    }
    setRecLoading(true)
    setError('')
    setRecommendation(null)
    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_address: playerAddress,
          game_context: 'GameFi RPG',
          current_items: [],
        }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setRecommendation(data)
    } catch (e: any) {
      setError(e.message || 'Failed to get recommendation')
    } finally {
      setRecLoading(false)
    }
  }

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      Bronze: '#cd7f32',
      Silver: '#c0c0c0',
      Gold: '#ffd700',
      Platinum: '#e5e4e2',
      Diamond: '#b9f2ff',
    }
    return (
      <span
        style={{
          background: colors[tier] || '#9ca3af',
          color: '#000',
          padding: '2px 10px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '0.85rem',
        }}
      >
        {tier}
      </span>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🎰</span>
            <div>
              <h1>OneHack Loot Oracle</h1>
              <p>AI-Powered GameFi Item Intelligence on OneChain</p>
            </div>
          </div>
          <div className="badges">
            <span className="badge badge-onechain">OneChain</span>
            <span className="badge badge-ai">AI Scoring</span>
            <span className="badge badge-onehack">OneHack 3.0</span>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Input Section */}
        <div className="card input-card">
          <h2>🎮 Player Setup</h2>
          <div className="input-row">
            <input
              className="input"
              placeholder="Player wallet address (0x...)"
              value={playerAddress}
              onChange={(e) => setPlayerAddress(e.target.value)}
            />
            <input
              className="input"
              placeholder="Session ID (optional)"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            />
          </div>
          {error && <div className="error">{error}</div>}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'oracle' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('oracle')}
          >
            🎲 Loot Oracle
          </button>
          <button
            className={`tab ${activeTab === 'recommend' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('recommend')}
          >
            🤖 AI Recommender
          </button>
        </div>

        {/* Loot Oracle Tab */}
        {activeTab === 'oracle' && (
          <div className="tab-content">
            <div className="card">
              <h2>🎲 Roll Loot Oracle</h2>
              <p className="description">
                Generate AI-scored loot drops based on on-chain randomness and player behavior analysis.
                Each roll uses verifiable randomness from OneChain + GPT-4 scoring.
              </p>
              <button
                className="btn btn-primary"
                onClick={rollLoot}
                disabled={loading}
              >
                {loading ? '🔄 Rolling...' : '🎰 Roll Loot (5 items)'}
              </button>
            </div>

            {lootResult && (
              <div className="card results-card">
                <div className="results-header">
                  <h2>🏆 Loot Results</h2>
                  <div className="results-meta">
                    <span>Session: <code>{lootResult.session_id}</code></span>
                    <span>Total Score: <strong>{lootResult.total_score.toFixed(1)}</strong></span>
                    {getTierBadge(lootResult.tier)}
                  </div>
                </div>

                <div className="items-grid">
                  {lootResult.items.map((item) => (
                    <div
                      key={item.id}
                      className="item-card"
                      style={{ borderColor: RARITY_COLORS[item.rarity] || '#9ca3af' }}
                    >
                      <div className="item-header">
                        <span className="item-element">{ELEMENT_EMOJIS[item.element] || '⚔️'}</span>
                        <div>
                          <div className="item-name">{item.name}</div>
                          <div
                            className="item-rarity"
                            style={{ color: RARITY_COLORS[item.rarity] }}
                          >
                            {item.rarity}
                          </div>
                        </div>
                        <div className="item-score">
                          <div className="score-value">{item.ai_score.toFixed(0)}</div>
                          <div className="score-label">AI Score</div>
                        </div>
                      </div>
                      <div className="item-stats">
                        <span>⚡ Power: {item.power}</span>
                        <span>🌊 {item.element}</span>
                      </div>
                      <p className="item-desc">{item.description}</p>
                      <div className="item-rec">💡 {item.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Recommender Tab */}
        {activeTab === 'recommend' && (
          <div className="tab-content">
            <div className="card">
              <h2>🤖 AI GameFi Recommender</h2>
              <p className="description">
                Get personalized item recommendations based on your play style and on-chain history.
                Powered by GPT-4 with GameFi-specific fine-tuning.
              </p>
              <button
                className="btn btn-secondary"
                onClick={getRecommendation}
                disabled={recLoading}
              >
                {recLoading ? '🔄 Analyzing...' : '🧠 Get AI Recommendations'}
              </button>
            </div>

            {recommendation && (
              <div className="card results-card">
                <div className="results-header">
                  <h2>🎯 Your Recommendations</h2>
                  <div className="results-meta">
                    <span>Play Style: <strong>{recommendation.play_style}</strong></span>
                  </div>
                </div>

                <div className="strategy-box">
                  <h3>📋 Strategy</h3>
                  <p>{recommendation.strategy}</p>
                </div>

                <div className="rec-grid">
                  {recommendation.recommended_items.map((item, i) => (
                    <div key={i} className="rec-card">
                      <div className="rec-header">
                        <span className="rec-rank">#{i + 1}</span>
                        <span className="rec-name">{item.name}</span>
                        <span className="rec-score">{(item.synergy_score * 100).toFixed(0)}% match</span>
                      </div>
                      <p className="rec-reason">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* How It Works */}
        <div className="card how-it-works">
          <h2>⚙️ How It Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-icon">🔗</div>
              <h3>On-Chain Randomness</h3>
              <p>Loot seeds generated from OneChain block hashes — verifiable and tamper-proof</p>
            </div>
            <div className="step">
              <div className="step-icon">🤖</div>
              <h3>AI Behavior Scoring</h3>
              <p>GPT-4 analyzes player history and scores each item for optimal gameplay synergy</p>
            </div>
            <div className="step">
              <div className="step-icon">⚖️</div>
              <h3>Rarity Engine</h3>
              <p>Weighted probability curves ensure fair distribution across all rarity tiers</p>
            </div>
            <div className="step">
              <div className="step-icon">📊</div>
              <h3>GameFi Analytics</h3>
              <p>Track loot history, tier progression, and item performance over time</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Built for <strong>OneHack 3.0</strong> · Powered by <strong>OneChain</strong> · AI by GPT-4</p>
        <p>
          <a href="https://github.com/mgnlia/onehack-loot-oracle" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {' · '}
          <a href="https://dorahacks.io/hackathon/onehackathon" target="_blank" rel="noopener noreferrer">
            OneHack 3.0
          </a>
        </p>
      </footer>
    </div>
  )
}
