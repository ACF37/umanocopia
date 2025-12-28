// GET /api/participants - 参加者一覧を取得
import { getParticipants } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
    const participants = await getParticipants()
    return {
        items: participants,
        total: participants.length,
        paid: participants.filter(p => p.status === 'paid').length
    }
})
