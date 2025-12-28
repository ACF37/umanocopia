// シンプルなJSONファイルベースのデータストア
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// データディレクトリ
const DATA_DIR = join(process.cwd(), 'data')

// データファイルパス
const PARTICIPANTS_FILE = join(DATA_DIR, 'participants.json')
const BETS_FILE = join(DATA_DIR, 'bets.json')
const RACE_RESULT_FILE = join(DATA_DIR, 'race_result.json')
const HORSES_FILE = join(DATA_DIR, 'horses.json')

// 型定義
export interface Participant {
    id: string
    trapId: string          // traP ID (ユーザー名)
    billId: string          // Plutus Bill ID
    status: 'pending' | 'paid' | 'cancelled'
    units: number           // 口数 (100固定)
    createdAt: string
    paidAt?: string
}

export interface BetTicket {
    type: 'trifecta' | 'trio' | 'exacta' | 'quinella' | 'win' | 'place'
    horses: number[]        // 馬番の配列
    units: number           // この馬券に賭けた口数
}

export interface Bet {
    participantId: string
    tickets: BetTicket[]
    totalUnits: number      // 合計口数（100以下）
    createdAt: string
    updatedAt: string
}

export interface RaceResult {
    first: number           // 1着馬番
    second: number          // 2着馬番
    third: number           // 3着馬番
    odds: {
        trifecta: Record<string, number>    // "1-2-3": 123.4
        trio: Record<string, number>        // "1-2-3": 45.6
        exacta: Record<string, number>      // "1-2": 12.3
        quinella: Record<string, number>    // "1-2": 6.7
        win: Record<string, number>         // "1": 2.3
        place: Record<string, number>       // "1": 1.5
    }
    confirmed: boolean
    createdAt: string
}

export interface Horse {
    number: number
    name: string
    jockey?: string
}

export interface Payout {
    participantId: string
    trapId: string
    amount: number
    details: {
        ticketType: string
        horses: number[]
        units: number
        odds: number
        payout: number
    }[]
    transactionId?: string
    status: 'pending' | 'sent' | 'failed'
}

// 初期化
function ensureDataDir() {
    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true })
    }
}

function readJsonFile<T>(path: string, defaultValue: T): T {
    ensureDataDir()
    if (!existsSync(path)) {
        writeFileSync(path, JSON.stringify(defaultValue, null, 2))
        return defaultValue
    }
    try {
        const content = readFileSync(path, 'utf-8')
        return JSON.parse(content)
    } catch {
        return defaultValue
    }
}

function writeJsonFile<T>(path: string, data: T): void {
    ensureDataDir()
    writeFileSync(path, JSON.stringify(data, null, 2))
}

// ========================================
// Participants
// ========================================
export function getParticipants(): Participant[] {
    return readJsonFile<Participant[]>(PARTICIPANTS_FILE, [])
}

export function getParticipant(id: string): Participant | undefined {
    return getParticipants().find(p => p.id === id)
}

export function getParticipantByTrapId(trapId: string): Participant | undefined {
    return getParticipants().find(p => p.trapId === trapId)
}

export function getParticipantByBillId(billId: string): Participant | undefined {
    return getParticipants().find(p => p.billId === billId)
}

export function addParticipant(participant: Participant): Participant {
    const participants = getParticipants()
    participants.push(participant)
    writeJsonFile(PARTICIPANTS_FILE, participants)
    return participant
}

export function updateParticipant(id: string, updates: Partial<Participant>): Participant | undefined {
    const participants = getParticipants()
    const index = participants.findIndex(p => p.id === id)
    if (index === -1) return undefined

    participants[index] = { ...participants[index], ...updates }
    writeJsonFile(PARTICIPANTS_FILE, participants)
    return participants[index]
}

// ========================================
// Bets
// ========================================
export function getBets(): Bet[] {
    return readJsonFile<Bet[]>(BETS_FILE, [])
}

export function getBet(participantId: string): Bet | undefined {
    return getBets().find(b => b.participantId === participantId)
}

export function saveBet(bet: Bet): Bet {
    const bets = getBets()
    const index = bets.findIndex(b => b.participantId === bet.participantId)

    if (index === -1) {
        bets.push(bet)
    } else {
        bets[index] = bet
    }

    writeJsonFile(BETS_FILE, bets)
    return bet
}

// ========================================
// Race Result
// ========================================
export function getRaceResult(): RaceResult | null {
    return readJsonFile<RaceResult | null>(RACE_RESULT_FILE, null)
}

export function saveRaceResult(result: RaceResult): RaceResult {
    writeJsonFile(RACE_RESULT_FILE, result)
    return result
}

// ========================================
// Horses
// ========================================
export function getHorses(): Horse[] {
    // 2025年有馬記念のデフォルト出走馬
    const defaultHorses: Horse[] = [
        { number: 1, name: 'エキサイトバイオ', jockey: '荻野極' },
        { number: 2, name: 'シンエンペラー', jockey: '坂井瑠星' },
        { number: 3, name: 'ジャスティンパレス', jockey: '団野大成' },
        { number: 4, name: 'ミュージアムマイル', jockey: 'C.デムーロ' },
        { number: 5, name: 'レガレイラ', jockey: 'C.ルメール' },
        { number: 6, name: 'メイショウタバル', jockey: '武豊' },
        { number: 7, name: 'サンライズジパング', jockey: '鮫島克駿' },
        { number: 8, name: 'シュヴァリエローズ', jockey: '北村友一' },
        { number: 9, name: 'ダノンデサイル', jockey: '戸崎圭太' },
        { number: 10, name: 'コスモキュランダ', jockey: '横山武史' },
        { number: 11, name: 'ミステリーウェイ', jockey: '松本大輝' },
        { number: 12, name: 'マイネルエンペラー', jockey: '丹内祐次' },
        { number: 13, name: 'アドマイヤテラ', jockey: '川田将雅' },
        { number: 14, name: 'アラタ', jockey: '大野拓弥' },
        { number: 15, name: 'エルトンバローズ', jockey: '西村淳也' },
        { number: 16, name: 'タスティエーラ', jockey: '松山弘平' },
    ]
    return readJsonFile<Horse[]>(HORSES_FILE, defaultHorses)
}

export function saveHorses(horses: Horse[]): Horse[] {
    writeJsonFile(HORSES_FILE, horses)
    return horses
}

// ========================================
// Payout Calculation
// ========================================
export function calculatePayouts(): Payout[] {
    const result = getRaceResult()
    if (!result || !result.confirmed) return []

    const participants = getParticipants().filter(p => p.status === 'paid')
    const bets = getBets()
    const payouts: Payout[] = []

    for (const participant of participants) {
        const bet = bets.find(b => b.participantId === participant.id)
        if (!bet) continue

        const details: Payout['details'] = []
        let totalPayout = 0

        for (const ticket of bet.tickets) {
            let odds = 0
            let isWin = false

            switch (ticket.type) {
                case 'trifecta':
                    // 3連単: 1-2-3着を順番通りに
                    if (ticket.horses.length === 3) {
                        const key = `${result.first}-${result.second}-${result.third}`
                        if (ticket.horses[0] === result.first &&
                            ticket.horses[1] === result.second &&
                            ticket.horses[2] === result.third) {
                            odds = result.odds.trifecta[key] || 0
                            isWin = odds > 0
                        }
                    }
                    break

                case 'trio':
                    // 3連複: 1-2-3着を順不同で
                    if (ticket.horses.length === 3) {
                        const sorted = [result.first, result.second, result.third].sort((a, b) => a - b)
                        const ticketSorted = [...ticket.horses].sort((a, b) => a - b)
                        const key = sorted.join('-')
                        if (ticketSorted[0] === sorted[0] &&
                            ticketSorted[1] === sorted[1] &&
                            ticketSorted[2] === sorted[2]) {
                            odds = result.odds.trio[key] || 0
                            isWin = odds > 0
                        }
                    }
                    break

                case 'exacta':
                    // 馬単: 1-2着を順番通りに
                    if (ticket.horses.length === 2) {
                        const key = `${result.first}-${result.second}`
                        if (ticket.horses[0] === result.first && ticket.horses[1] === result.second) {
                            odds = result.odds.exacta[key] || 0
                            isWin = odds > 0
                        }
                    }
                    break

                case 'quinella':
                    // 馬連: 1-2着を順不同で
                    if (ticket.horses.length === 2) {
                        const sorted = [result.first, result.second].sort((a, b) => a - b)
                        const ticketSorted = [...ticket.horses].sort((a, b) => a - b)
                        const key = sorted.join('-')
                        if (ticketSorted[0] === sorted[0] && ticketSorted[1] === sorted[1]) {
                            odds = result.odds.quinella[key] || 0
                            isWin = odds > 0
                        }
                    }
                    break

                case 'win':
                    // 単勝: 1着を予想
                    if (ticket.horses.length === 1) {
                        const key = `${result.first}`
                        if (ticket.horses[0] === result.first) {
                            odds = result.odds.win[key] || 0
                            isWin = odds > 0
                        }
                    }
                    break

                case 'place':
                    // 複勝: 1-2-3着のいずれかを予想
                    if (ticket.horses.length === 1) {
                        const horse = ticket.horses[0]
                        if (horse === result.first || horse === result.second || horse === result.third) {
                            const key = `${horse}`
                            odds = result.odds.place[key] || 0
                            isWin = odds > 0
                        }
                    }
                    break
            }

            if (isWin) {
                const payout = Math.floor(ticket.units * 100 * odds)
                totalPayout += payout
                details.push({
                    ticketType: ticket.type,
                    horses: ticket.horses,
                    units: ticket.units,
                    odds,
                    payout
                })
            }
        }

        payouts.push({
            participantId: participant.id,
            trapId: participant.trapId,
            amount: totalPayout,
            details,
            status: 'pending'
        })
    }

    return payouts
}

// ========================================
// 統計
// ========================================
export function getStats() {
    const participants = getParticipants()
    const paidParticipants = participants.filter(p => p.status === 'paid')
    const bets = getBets()

    const totalPool = paidParticipants.length * 100 * 100 // 人数 × 100口 × 100コピア

    const ticketTypeCounts: Record<string, number> = {
        trifecta: 0,
        trio: 0,
        exacta: 0,
        quinella: 0,
        win: 0,
        place: 0
    }

    for (const bet of bets) {
        for (const ticket of bet.tickets) {
            ticketTypeCounts[ticket.type] = (ticketTypeCounts[ticket.type] || 0) + ticket.units
        }
    }

    return {
        totalParticipants: participants.length,
        paidParticipants: paidParticipants.length,
        totalPool,
        ticketTypeCounts
    }
}
