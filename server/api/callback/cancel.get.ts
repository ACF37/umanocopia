// GET /api/callback/cancel - Plutus Bill支払いキャンセル時のコールバック
import { getParticipant, updateParticipant } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const participantId = query.participantId as string

    if (!participantId) {
        return sendRedirect(event, '/?error=missing_participant_id')
    }

    const participant = await getParticipant(participantId)
    if (!participant) {
        return sendRedirect(event, '/?error=participant_not_found')
    }

    // ステータスを更新
    await updateParticipant(participantId, {
        status: 'cancelled'
    })

    // トップページにリダイレクト
    return sendRedirect(event, '/?cancelled=true')
})
