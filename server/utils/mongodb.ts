// MongoDB接続管理ユーティリティ
import mongoose from 'mongoose'

let isConnected = false

export async function connectMongoDB(): Promise<void> {
    if (isConnected) {
        return
    }

    const config = useRuntimeConfig()
    const mongodbUri = config.mongodbUri

    if (!mongodbUri) {
        throw new Error('MONGODB_URI environment variable is not set')
    }

    try {
        await mongoose.connect(mongodbUri)
        isConnected = true
        console.log('✅ MongoDB connected successfully')
    } catch (error) {
        console.error('❌ MongoDB connection error:', error)
        throw error
    }
}

// DB操作前に接続を確保するヘルパー
export async function ensureConnection(): Promise<void> {
    if (!isConnected) {
        await connectMongoDB()
    }
}
