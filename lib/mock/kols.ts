export interface MockKOL {
  id: string
  rank: number
  name: string
  handle: string
  avatar: string
  winRate: number
  totalCalls: number
  avgRoi: number
  bestCall: string
  bestCallRoi: number
  tier: 'elite' | 'verified' | 'rising' | 'unverified'
  score: number
  sparkline: number[]
  followed: boolean
}

function genSparkline(trend: 'up' | 'down' | 'volatile'): number[] {
  const points: number[] = []
  let val = 50 + Math.random() * 30
  for (let i = 0; i < 30; i++) {
    const delta = (Math.random() - (trend === 'up' ? 0.35 : trend === 'down' ? 0.65 : 0.5)) * 12
    val = Math.max(10, Math.min(200, val + delta))
    points.push(Math.round(val * 10) / 10)
  }
  return points
}

export const MOCK_KOLS: MockKOL[] = [
  {
    id: '1', rank: 1, name: 'DegenKing', handle: '@DegenKing', avatar: 'DK',
    winRate: 76, totalCalls: 412, avgRoi: 187, bestCall: 'WIF', bestCallRoi: 2840,
    tier: 'elite', score: 98, sparkline: genSparkline('up'), followed: false,
  },
  {
    id: '2', rank: 2, name: 'SolAlpha', handle: '@SolAlpha', avatar: 'SA',
    winRate: 71, totalCalls: 289, avgRoi: 134, bestCall: 'BONK', bestCallRoi: 1560,
    tier: 'elite', score: 94, sparkline: genSparkline('up'), followed: true,
  },
  {
    id: '3', rank: 3, name: 'WhaleWatcher', handle: '@WhaleWatch', avatar: 'WW',
    winRate: 68, totalCalls: 674, avgRoi: 98, bestCall: 'JTO', bestCallRoi: 920,
    tier: 'elite', score: 91, sparkline: genSparkline('up'), followed: false,
  },
  {
    id: '4', rank: 4, name: 'CryptoOracle', handle: '@CryptoOracle', avatar: 'CO',
    winRate: 66, totalCalls: 198, avgRoi: 211, bestCall: 'PYTH', bestCallRoi: 780,
    tier: 'verified', score: 87, sparkline: genSparkline('volatile'), followed: false,
  },
  {
    id: '5', rank: 5, name: 'AltSeason', handle: '@AltSeason_', avatar: 'AS',
    winRate: 64, totalCalls: 543, avgRoi: 76, bestCall: 'RNDR', bestCallRoi: 640,
    tier: 'verified', score: 83, sparkline: genSparkline('up'), followed: false,
  },
  {
    id: '6', rank: 6, name: 'MoonSignals', handle: '@MoonSignals', avatar: 'MS',
    winRate: 62, totalCalls: 321, avgRoi: 145, bestCall: 'SAMO', bestCallRoi: 1120,
    tier: 'verified', score: 79, sparkline: genSparkline('volatile'), followed: true,
  },
  {
    id: '7', rank: 7, name: 'OnChainSpy', handle: '@OnChainSpy', avatar: 'OS',
    winRate: 61, totalCalls: 89, avgRoi: 340, bestCall: 'MYRO', bestCallRoi: 4200,
    tier: 'verified', score: 76, sparkline: genSparkline('up'), followed: false,
  },
  {
    id: '8', rank: 8, name: 'TxTracker', handle: '@TxTracker', avatar: 'TT',
    winRate: 59, totalCalls: 712, avgRoi: 54, bestCall: 'RAY', bestCallRoi: 380,
    tier: 'verified', score: 72, sparkline: genSparkline('volatile'), followed: false,
  },
  {
    id: '9', rank: 9, name: 'VolatileVince', handle: '@VolVince', avatar: 'VV',
    winRate: 57, totalCalls: 234, avgRoi: 88, bestCall: 'POPCAT', bestCallRoi: 890,
    tier: 'rising', score: 68, sparkline: genSparkline('volatile'), followed: false,
  },
  {
    id: '10', rank: 10, name: 'BlockchainBob', handle: '@BCBob', avatar: 'BB',
    winRate: 56, totalCalls: 156, avgRoi: 67, bestCall: 'SLND', bestCallRoi: 560,
    tier: 'rising', score: 65, sparkline: genSparkline('up'), followed: false,
  },
  {
    id: '11', rank: 11, name: 'GmGang', handle: '@GmGang', avatar: 'GG',
    winRate: 54, totalCalls: 445, avgRoi: 43, bestCall: 'STEP', bestCallRoi: 310,
    tier: 'rising', score: 61, sparkline: genSparkline('volatile'), followed: false,
  },
  {
    id: '12', rank: 12, name: 'NftNomad', handle: '@NftNomad', avatar: 'NN',
    winRate: 53, totalCalls: 78, avgRoi: 156, bestCall: 'DUST', bestCallRoi: 720,
    tier: 'rising', score: 58, sparkline: genSparkline('down'), followed: false,
  },
  {
    id: '13', rank: 13, name: 'ApeCaller', handle: '@ApeCaller', avatar: 'AC',
    winRate: 51, totalCalls: 367, avgRoi: 29, bestCall: 'MANGO', bestCallRoi: 240,
    tier: 'rising', score: 55, sparkline: genSparkline('volatile'), followed: true,
  },
  {
    id: '14', rank: 14, name: 'RugDetector', handle: '@RugDetector', avatar: 'RD',
    winRate: 49, totalCalls: 521, avgRoi: -8, bestCall: 'MEAN', bestCallRoi: 190,
    tier: 'rising', score: 51, sparkline: genSparkline('down'), followed: false,
  },
  {
    id: '15', rank: 15, name: 'GemFinder', handle: '@GemFinder', avatar: 'GF',
    winRate: 48, totalCalls: 112, avgRoi: 234, bestCall: 'FIDA', bestCallRoi: 1800,
    tier: 'rising', score: 48, sparkline: genSparkline('up'), followed: false,
  },
  {
    id: '16', rank: 16, name: 'DeepValue', handle: '@DeepValue', avatar: 'DV',
    winRate: 47, totalCalls: 203, avgRoi: 12, bestCall: 'TULIP', bestCallRoi: 280,
    tier: 'unverified', score: 44, sparkline: genSparkline('volatile'), followed: false,
  },
  {
    id: '17', rank: 17, name: 'MicroCap', handle: '@MicroCap', avatar: 'MC',
    winRate: 46, totalCalls: 88, avgRoi: 67, bestCall: 'PORT', bestCallRoi: 420,
    tier: 'unverified', score: 41, sparkline: genSparkline('volatile'), followed: false,
  },
  {
    id: '18', rank: 18, name: 'RetailTrader', handle: '@RetailT', avatar: 'RT',
    winRate: 45, totalCalls: 799, avgRoi: -12, bestCall: 'COPE', bestCallRoi: 150,
    tier: 'unverified', score: 38, sparkline: genSparkline('down'), followed: false,
  },
  {
    id: '19', rank: 19, name: 'NewEntry', handle: '@NewEntry', avatar: 'NE',
    winRate: 45, totalCalls: 51, avgRoi: 45, bestCall: 'HXRO', bestCallRoi: 310,
    tier: 'unverified', score: 35, sparkline: genSparkline('volatile'), followed: false,
  },
  {
    id: '20', rank: 20, name: 'DGenBot', handle: '@DGenBot', avatar: 'DB',
    winRate: 45, totalCalls: 62, avgRoi: 23, bestCall: 'ATLAS', bestCallRoi: 180,
    tier: 'unverified', score: 32, sparkline: genSparkline('volatile'), followed: false,
  },
]

export const MOCK_CALL_FEED = [
  { kol: 'DegenKing', avatar: 'DK', token: '$WIF', entry: 0.42, current: 0.68, time: '2m ago' },
  { kol: 'SolAlpha', avatar: 'SA', token: '$BONK', entry: 0.00002, current: 0.000031, time: '5m ago' },
  { kol: 'OnChainSpy', avatar: 'OS', token: '$MYRO', entry: 0.18, current: 0.11, time: '8m ago' },
  { kol: 'WhaleWatcher', avatar: 'WW', token: '$JTO', entry: 3.40, current: 4.12, time: '12m ago' },
  { kol: 'CryptoOracle', avatar: 'CO', token: '$PYTH', entry: 0.55, current: 0.61, time: '18m ago' },
  { kol: 'MoonSignals', avatar: 'MS', token: '$SAMO', entry: 0.021, current: 0.019, time: '24m ago' },
  { kol: 'AltSeason', avatar: 'AS', token: '$RNDR', entry: 7.20, current: 8.90, time: '31m ago' },
  { kol: 'TxTracker', avatar: 'TT', token: '$RAY', entry: 4.10, current: 3.80, time: '45m ago' },
]
