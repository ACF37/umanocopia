// POST /api/participants - 新規参加者登録（Bill作成）
import { v4 as uuidv4 } from 'uuid'
import { addParticipant, getParticipantByTrapId } from '~~/server/utils/db'
import { usePlutus } from '~~/server/utils/plutus'
import { requireAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
    // X-Forwarded-User から認証情報を取得
    const user = requireAuth(event)
    const trapId = user.trapId

    // 既に参加済みかチェック
    const existing = getParticipantByTrapId(trapId)
    if (existing) {
        if (existing.status === 'paid') {
            throw createError({
                statusCode: 409,
                message: '既に参加済みです'
            })
        }
        // pending状態なら既存のpaymentUrlを返す
        if (existing.status === 'pending') {
            return {
                participantId: existing.id,
                billId: existing.billId,
                message: '支払い待ちの請求があります',
            }
        }
    }

    const config = useRuntimeConfig()
    const unitPrice = config.public.unitPrice as number
    const totalUnits = config.public.totalUnits as number
    const amount = unitPrice * totalUnits // 100 × 100 = 10,000コピア

    // 参加者IDを生成
    const participantId = uuidv4()

    // コールバックURL
    const baseUrl = getRequestURL(event).origin
    const successUrl = `${baseUrl}/api/callback/success?participantId=${participantId}`
    const cancelUrl = `${baseUrl}/api/callback/cancel?participantId=${participantId}`

    try {
        // Plutus Bill作成
        const plutus = usePlutus()
        const bill = await plutus.createBill({
            targetUser: trapId,
            amount,
            description: `ウマノコピア参加費 (${totalUnits}口 × ${unitPrice}コピア)`,
            successUrl,
            cancelUrl
        })

        // 参加者を保存
        const participant = addParticipant({
            id: participantId,
            trapId,
            billId: bill.billId,
            status: 'pending',
            units: totalUnits,
            createdAt: new Date().toISOString()
        })

        return {
            participantId: participant.id,
            billId: bill.billId,
            paymentUrl: bill.paymentUrl,
            expiresAt: bill.expiresAt,
            amount
        }
    } catch (error: any) {
        console.error('Failed to create bill:', error)
        throw createError({
            statusCode: 500,
            message: `請求の作成に失敗しました: ${error.message}`
        })
    }
})
