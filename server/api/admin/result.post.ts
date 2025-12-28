// POST /api/admin/result - レース結果の登録
import { saveRaceResult, type RaceResult } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { first, second, third, odds, confirm } = body

    // バリデーション
    if (!first || !second || !third) {
        throw createError({
            statusCode: 400,
            message: '1着、2着、3着の馬番を指定してください'
        })
    }

    if (!odds) {
        throw createError({
            statusCode: 400,
            message: 'オッズ情報を指定してください'
        })
    }

    const result: RaceResult = {
        first: Number(first),
        second: Number(second),
        third: Number(third),
        odds: {
            trifecta: odds.trifecta || {},
            trio: odds.trio || {},
            exacta: odds.exacta || {},
            quinella: odds.quinella || {},
            win: odds.win || {},
            place: odds.place || {}
        },
        confirmed: !!confirm,
        createdAt: new Date().toISOString()
    }

    saveRaceResult(result)

    return {
        success: true,
        result
    }
})
