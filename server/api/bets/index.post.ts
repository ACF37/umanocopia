// POST /api/bets - 賭け情報を登録・更新
import { saveBet, getParticipantByTrapId, type BetTicket } from '~~/server/utils/db'
import { requireAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
    // X-Forwarded-User から認証情報を取得
    const user = requireAuth(event)
    const trapId = user.trapId

    const body = await readBody(event)
    const { tickets } = body as { tickets: BetTicket[] }

    if (!tickets || !Array.isArray(tickets)) {
        throw createError({
            statusCode: 400,
            message: 'tickets must be an array'
        })
    }

    // 参加者を確認
    const participant = await getParticipantByTrapId(trapId)
    if (!participant) {
        throw createError({
            statusCode: 404,
            message: '参加者が見つかりません。まず参加登録をしてください。'
        })
    }

    if (participant.status !== 'paid') {
        throw createError({
            statusCode: 403,
            message: '参加費の支払いが完了していません'
        })
    }

    // 馬券のバリデーション
    const validTypes = ['trifecta', 'trio', 'exacta', 'quinella', 'win', 'place']
    for (const ticket of tickets) {
        if (!validTypes.includes(ticket.type)) {
            throw createError({
                statusCode: 400,
                message: `Invalid ticket type: ${ticket.type}`
            })
        }

        if (typeof ticket.units !== 'number' || ticket.units < 0) {
            throw createError({
                statusCode: 400,
                message: 'Invalid units value'
            })
        }

        // 馬券タイプに応じた馬の数をチェック
        const requiredHorses: Record<string, number> = {
            trifecta: 3,
            trio: 3,
            exacta: 2,
            quinella: 2,
            win: 1,
            place: 1
        }

        if (ticket.horses.length !== requiredHorses[ticket.type]) {
            throw createError({
                statusCode: 400,
                message: `${ticket.type} requires ${requiredHorses[ticket.type]} horses`
            })
        }
    }

    // 合計口数をチェック
    const totalUnits = tickets.reduce((sum, t) => sum + t.units, 0)
    if (totalUnits > participant.units) {
        throw createError({
            statusCode: 400,
            message: `合計口数が持ち口数(${participant.units}口)を超えています`
        })
    }

    // 賭け情報を保存
    const now = new Date().toISOString()
    const bet = await saveBet({
        participantId: participant.id,
        tickets,
        totalUnits,
        createdAt: now,
        updatedAt: now
    })

    return {
        success: true,
        bet,
        remainingUnits: participant.units - totalUnits
    }
})
