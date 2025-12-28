// GET /api/result - 結果発表ページ用のデータ
import { getRaceResult, calculatePayouts, getHorses, getParticipants } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
    const result = await getRaceResult()

    if (!result || !result.confirmed) {
        return {
            confirmed: false,
            message: 'レース結果はまだ確定していません'
        }
    }

    const horses = await getHorses()
    const payouts = await calculatePayouts()
    const participants = (await getParticipants()).filter(p => p.status === 'paid')

    // 馬名を取得するヘルパー
    const getHorseName = (num: number) => {
        const horse = horses.find(h => h.number === num)
        return horse ? horse.name : `${num}番`
    }

    // ランキング（配当金順）
    const ranking = payouts
        .sort((a, b) => b.amount - a.amount)
        .map((p, index) => ({
            rank: index + 1,
            trapId: p.trapId,
            amount: p.amount,
            profit: p.amount - 10000, // 参加費10000コピアを引いた利益
            details: p.details
        }))

    const totalPayout = payouts.reduce((sum, p) => sum + p.amount, 0)
    const totalPool = participants.length * 10000
    const winners = ranking.filter(r => r.amount > 0)
    const profitWinners = ranking.filter(r => r.profit > 0)

    return {
        confirmed: true,
        raceResult: {
            first: { number: result.first, name: getHorseName(result.first) },
            second: { number: result.second, name: getHorseName(result.second) },
            third: { number: result.third, name: getHorseName(result.third) },
            odds: result.odds
        },
        ranking,
        summary: {
            totalParticipants: participants.length,
            totalPool,
            totalPayout,
            winnersCount: winners.length,
            profitWinnersCount: profitWinners.length,
            maxPayout: ranking.length > 0 ? ranking[0].amount : 0,
            maxProfit: ranking.length > 0 ? ranking[0].profit : 0
        }
    }
})
