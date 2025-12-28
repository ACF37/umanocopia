// Plutus API Client
// https://github.com/traP-jp/plutus

import type { H3Event } from 'h3'

const config = useRuntimeConfig()

interface CreateBillRequest {
    targetUser: string
    amount: number
    description: string
    successUrl: string
    cancelUrl: string
}

interface CreateBillResponse {
    billId: string
    paymentUrl: string
    expiresAt: string
}

interface Bill {
    id: string
    amount: number
    userId: string
    userName?: string
    description?: string
    status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FAILED'
    createdAt: string
}

interface CreateTransactionRequest {
    toUser: string
    amount: number
    description?: string
    requestId?: string
}

interface Transaction {
    id: string
    amount: number
    type: 'TRANSFER' | 'BILL_PAYMENT' | 'SYSTEM'
    userId?: string
    userName?: string
    description?: string
    createdAt: string
}

interface Project {
    id: string
    name: string
    balance: number
}

class PlutusClient {
    private baseUrl: string
    private token: string

    constructor(baseUrl: string, token: string) {
        this.baseUrl = baseUrl
        this.token = token
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`
        }

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Plutus API error: ${response.status} - ${errorText}`)
        }

        // 204 No Content の場合はnullを返す
        if (response.status === 204) {
            return null as T
        }

        return response.json()
    }

    // プロジェクト情報を取得
    async getMe(): Promise<Project> {
        return this.request<Project>('GET', '/me')
    }

    // 請求を作成
    async createBill(req: CreateBillRequest): Promise<CreateBillResponse> {
        return this.request<CreateBillResponse>('POST', '/bills', req)
    }

    // 請求ステータスを確認
    async getBill(billId: string): Promise<Bill> {
        return this.request<Bill>('GET', `/bills/${billId}`)
    }

    // 請求をキャンセル
    async cancelBill(billId: string): Promise<void> {
        return this.request<void>('POST', `/bills/${billId}/cancel`)
    }

    // ユーザーへ送金
    async createTransaction(req: CreateTransactionRequest): Promise<Transaction> {
        return this.request<Transaction>('POST', '/transactions', req)
    }

    // 取引履歴を取得
    async getTransactions(limit = 20, cursor?: string): Promise<{ items: Transaction[]; nextCursor?: string }> {
        const params = new URLSearchParams({ limit: limit.toString() })
        if (cursor) params.set('cursor', cursor)
        return this.request('GET', `/me/transactions?${params}`)
    }
}

// サーバーサイドで使用するPlutusクライアントを取得
export function usePlutus(): PlutusClient {
    const config = useRuntimeConfig()
    return new PlutusClient(
        config.plutusApiUrl as string,
        config.plutusApiToken as string
    )
}

// 型エクスポート
export type {
    CreateBillRequest,
    CreateBillResponse,
    Bill,
    CreateTransactionRequest,
    Transaction,
    Project
}
