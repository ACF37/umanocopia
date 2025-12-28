// サーバーサイドで X-Forwarded-User ヘッダーから認証情報を取得するユーティリティ
import type { H3Event } from 'h3'

export interface AuthUser {
    trapId: string
}

/**
 * X-Forwarded-User ヘッダーからユーザー情報を取得
 * PaaSのプロキシが付与するヘッダーを使用
 */
export function getAuthUser(event: H3Event): AuthUser | null {
    const trapId = getHeader(event, 'X-Forwarded-User')

    if (!trapId) {
        return null
    }

    return { trapId }
}

/**
 * 認証必須のエンドポイント用
 * 認証されていない場合は401エラーをスロー
 */
export function requireAuth(event: H3Event): AuthUser {
    const user = getAuthUser(event)

    if (!user) {
        throw createError({
            statusCode: 401,
            message: '認証が必要です（X-Forwarded-User ヘッダーがありません）'
        })
    }

    return user
}
