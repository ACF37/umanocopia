// POST /api/admin/payout - 配当金の計算と送金実行
import { v4 as uuidv4 } from 'uuid'
import { calculatePayouts, getRaceResult } from '~~/server/utils/db'
import { usePlutus } from '~~/server/utils/plutus'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { execute } = body // trueなら実際に送金を実行

    // レース結果を確認
    const result = getRaceResult()
    if (!result || !result.confirmed) {
        throw createError({
            statusCode: 400,
            message: 'レース結果が確定していません'
        })
    }

    // 配当を計算
    const payouts = calculatePayouts()

    if (!execute) {
        // プレビューモード：計算結果のみ返す
        const totalPayout = payouts.reduce((sum, p) => sum + p.amount, 0)
        const winners = payouts.filter(p => p.amount > 0)

        return {
            preview: true,
            payouts,
            summary: {
                totalParticipants: payouts.length,
                winners: winners.length,
                totalPayout,
                maxPayout: Math.max(...payouts.map(p => p.amount)),
                avgPayout: winners.length > 0 ? Math.floor(totalPayout / winners.length) : 0
            }
        }
    }

    // 送金実行モード
    const plutus = usePlutus()
    const results: Array<{
        trapId: string
        amount: number
        success: boolean
        transactionId?: string
        error?: string
    }> = []

    for (const payout of payouts) {
        if (payout.amount <= 0) {
            results.push({
                trapId: payout.trapId,
                amount: 0,
                success: true
            })
            continue
        }

        try {
            const transaction = await plutus.createTransaction({
                toUser: payout.trapId,
                amount: payout.amount,
                description: `ウマノコピア配当金`,
                requestId: uuidv4() // 冪等性キー
            })

            results.push({
                trapId: payout.trapId,
                amount: payout.amount,
                success: true,
                transactionId: transaction.id
            })
        } catch (error: any) {
            console.error(`Failed to send payout to ${payout.trapId}:`, error)
            results.push({
                trapId: payout.trapId,
                amount: payout.amount,
                success: false,
                error: error.message
            })
        }
    }

    const successCount = results.filter(r => r.success && r.amount > 0).length
    const failedCount = results.filter(r => !r.success).length
    const totalSent = results.filter(r => r.success).reduce((sum, r) => sum + r.amount, 0)

    return {
        executed: true,
        results,
        summary: {
            successCount,
            failedCount,
            totalSent
        }
    }
})
