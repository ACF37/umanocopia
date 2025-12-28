// MongoDB を使用したデータストア
import { ensureConnection } from './mongodb'
import { ParticipantModel, type IParticipant } from '../models/Participant'
import { BetModel, type IBet, type IBetTicket } from '../models/Bet'
import { RaceResultModel, type IRaceResult } from '../models/RaceResult'
import { HorseModel, type IHorse } from '../models/Horse'

// 型定義（API互換性のため維持）
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

// ========================================
// ヘルパー: MongoDB ドキュメント → API型への変換
// ========================================
function toParticipant(doc: IParticipant): Participant {
    return {
        id: doc.id,
        trapId: doc.trapId,
        billId: doc.billId,
        status: doc.status,
        units: doc.units,
        createdAt: doc.createdAt.toISOString(),
        paidAt: doc.paidAt?.toISOString()
    }
}

function toBet(doc: IBet): Bet {
    return {
        participantId: doc.participantId,
        tickets: doc.tickets.map(t => ({
            type: t.type,
            horses: t.horses,
            units: t.units
        })),
        totalUnits: doc.totalUnits,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
    }
}

function toRaceResult(doc: IRaceResult): RaceResult {
    return {
        first: doc.first,
        second: doc.second,
        third: doc.third,
        odds: {
            trifecta: Object.fromEntries(doc.odds.trifecta || new Map()),
            trio: Object.fromEntries(doc.odds.trio || new Map()),
            exacta: Object.fromEntries(doc.odds.exacta || new Map()),
            quinella: Object.fromEntries(doc.odds.quinella || new Map()),
            win: Object.fromEntries(doc.odds.win || new Map()),
            place: Object.fromEntries(doc.odds.place || new Map())
        },
        confirmed: doc.confirmed,
        createdAt: doc.createdAt.toISOString()
    }
}

function toHorse(doc: IHorse): Horse {
    return {
        number: doc.number,
        name: doc.name,
        jockey: doc.jockey
    }
}

// ========================================
// Participants
// ========================================
export async function getParticipants(): Promise<Participant[]> {
    await ensureConnection()
    const docs = await ParticipantModel.find().lean() as IParticipant[]
    return docs.map(toParticipant)
}

export async function getParticipant(id: string): Promise<Participant | undefined> {
    await ensureConnection()
    const doc = await ParticipantModel.findOne({ id }).lean() as IParticipant | null
    return doc ? toParticipant(doc) : undefined
}

export async function getParticipantByTrapId(trapId: string): Promise<Participant | undefined> {
    await ensureConnection()
    const doc = await ParticipantModel.findOne({ trapId }).lean() as IParticipant | null
    return doc ? toParticipant(doc) : undefined
}

export async function getParticipantByBillId(billId: string): Promise<Participant | undefined> {
    await ensureConnection()
    const doc = await ParticipantModel.findOne({ billId }).lean() as IParticipant | null
    return doc ? toParticipant(doc) : undefined
}

export async function addParticipant(participant: Participant): Promise<Participant> {
    await ensureConnection()
    const doc = await ParticipantModel.create({
        id: participant.id,
        trapId: participant.trapId,
        billId: participant.billId,
        status: participant.status,
        units: participant.units,
        createdAt: new Date(participant.createdAt),
        paidAt: participant.paidAt ? new Date(participant.paidAt) : undefined
    })
    return toParticipant(doc)
}

export async function updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | undefined> {
    await ensureConnection()
    const updateData: Record<string, unknown> = { ...updates }
    if (updates.createdAt) updateData.createdAt = new Date(updates.createdAt)
    if (updates.paidAt) updateData.paidAt = new Date(updates.paidAt)

    const doc = await ParticipantModel.findOneAndUpdate(
        { id },
        { $set: updateData },
        { new: true }
    ).lean() as IParticipant | null
    return doc ? toParticipant(doc) : undefined
}

// ========================================
// Bets
// ========================================
export async function getBets(): Promise<Bet[]> {
    await ensureConnection()
    const docs = await BetModel.find().lean() as IBet[]
    return docs.map(toBet)
}

export async function getBet(participantId: string): Promise<Bet | undefined> {
    await ensureConnection()
    const doc = await BetModel.findOne({ participantId }).lean() as IBet | null
    return doc ? toBet(doc) : undefined
}

export async function saveBet(bet: Bet): Promise<Bet> {
    await ensureConnection()
    const doc = await BetModel.findOneAndUpdate(
        { participantId: bet.participantId },
        {
            $set: {
                tickets: bet.tickets,
                totalUnits: bet.totalUnits,
                updatedAt: new Date()
            },
            $setOnInsert: {
                participantId: bet.participantId,
                createdAt: new Date()
            }
        },
        { upsert: true, new: true }
    ).lean() as IBet
    return toBet(doc)
}

// ========================================
// Race Result
// ========================================
export async function getRaceResult(): Promise<RaceResult | null> {
    await ensureConnection()
    const doc = await RaceResultModel.findOne().lean() as IRaceResult | null
    return doc ? toRaceResult(doc) : null
}

export async function saveRaceResult(result: RaceResult): Promise<RaceResult> {
    await ensureConnection()
    // 既存の結果を削除して新しく作成（1つしか存在しない想定）
    await RaceResultModel.deleteMany({})
    const doc = await RaceResultModel.create({
        first: result.first,
        second: result.second,
        third: result.third,
        odds: {
            trifecta: new Map(Object.entries(result.odds.trifecta)),
            trio: new Map(Object.entries(result.odds.trio)),
            exacta: new Map(Object.entries(result.odds.exacta)),
            quinella: new Map(Object.entries(result.odds.quinella)),
            win: new Map(Object.entries(result.odds.win)),
            place: new Map(Object.entries(result.odds.place))
        },
        confirmed: result.confirmed,
        createdAt: new Date()
    })
    return toRaceResult(doc)
}

// ========================================
// Horses
// ========================================
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

export async function getHorses(): Promise<Horse[]> {
    await ensureConnection()
    const docs = await HorseModel.find().sort({ number: 1 }).lean() as IHorse[]

    // データがなければデフォルトを入れる
    if (docs.length === 0) {
        await HorseModel.insertMany(defaultHorses)
        return defaultHorses
    }

    return docs.map(toHorse)
}

export async function saveHorses(horses: Horse[]): Promise<Horse[]> {
    await ensureConnection()
    await HorseModel.deleteMany({})
    await HorseModel.insertMany(horses)
    return horses
}

// ========================================
// Payout Calculation
// ========================================
export async function calculatePayouts(): Promise<Payout[]> {
    const result = await getRaceResult()
    if (!result || !result.confirmed) return []

    const participants = (await getParticipants()).filter(p => p.status === 'paid')
    const bets = await getBets()
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
export async function getStats() {
    const participants = await getParticipants()
    const paidParticipants = participants.filter(p => p.status === 'paid')
    const bets = await getBets()

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
