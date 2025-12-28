// GET /api/bets - 賭け情報を取得
import { getBets, getBet, getParticipantByTrapId } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const trapId = query.trapId as string | undefined

    if (trapId) {
        // 特定ユーザーの賭け情報を取得
        const participant = await getParticipantByTrapId(trapId)
        if (!participant) {
            throw createError({
                statusCode: 404,
                message: '参加者が見つかりません'
            })
        }
        const bet = await getBet(participant.id)
        return bet || null
    }

    // 全員の賭け情報を取得
    return await getBets()
})
