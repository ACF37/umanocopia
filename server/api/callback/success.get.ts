// GET /api/callback/success - Plutus Bill支払い成功時のコールバック
import { getParticipant, updateParticipant } from '~~/server/utils/db'
import { usePlutus } from '~~/server/utils/plutus'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const participantId = query.participantId as string

    if (!participantId) {
        // エラーページにリダイレクト
        return sendRedirect(event, '/?error=missing_participant_id')
    }

    const participant = getParticipant(participantId)
    if (!participant) {
        return sendRedirect(event, '/?error=participant_not_found')
    }

    // 既に支払い済みの場合はスキップ
    if (participant.status === 'paid') {
        return sendRedirect(event, `/bet?success=true&trapId=${encodeURIComponent(participant.trapId)}`)
    }

    // Plutus APIで請求ステータスを確認
    try {
        const plutus = usePlutus()
        const bill = await plutus.getBill(participant.billId)

        if (bill.status !== 'COMPLETED') {
            console.warn(`Bill ${participant.billId} is not completed. Status: ${bill.status}`)
            return sendRedirect(event, '/?error=payment_not_completed')
        }
    } catch (error: any) {
        console.error(`Failed to verify bill ${participant.billId}:`, error)
        return sendRedirect(event, '/?error=payment_verification_failed')
    }

    // ステータスを更新
    updateParticipant(participantId, {
        status: 'paid',
        paidAt: new Date().toISOString()
    })

    // 賭けページにリダイレクト
    return sendRedirect(event, `/bet?success=true&trapId=${encodeURIComponent(participant.trapId)}`)
})
