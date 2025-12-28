// GET /api/me - 現在のログインユーザー情報を取得
import { getAuthUser } from '~~/server/utils/auth'
import { getParticipantByTrapId, getBet } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
    const user = getAuthUser(event)

    if (!user) {
        return {
            authenticated: false,
            trapId: null,
            participant: null,
            bet: null
        }
    }

    const participant = await getParticipantByTrapId(user.trapId)
    const bet = participant ? await getBet(participant.id) : null

    return {
        authenticated: true,
        trapId: user.trapId,
        participant: participant || null,
        bet: bet || null
    }
})
