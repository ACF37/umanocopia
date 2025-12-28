// GET /api/stats - 統計情報を取得
import { getStats, getRaceResult, calculatePayouts } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
    const stats = await getStats()
    const result = await getRaceResult()

    let payoutsPreview = null
    if (result && result.confirmed) {
        const payouts = await calculatePayouts()
        const totalPayout = payouts.reduce((sum, p) => sum + p.amount, 0)
        const winners = payouts.filter(p => p.amount > 0)

        payoutsPreview = {
            totalPayout,
            winnersCount: winners.length,
            topPayouts: payouts
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 10)
        }
    }

    return {
        ...stats,
        raceResult: result,
        payoutsPreview
    }
})
