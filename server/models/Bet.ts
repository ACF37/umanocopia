import mongoose, { Schema, type Document } from 'mongoose'

export interface IBetTicket {
    type: 'trifecta' | 'trio' | 'exacta' | 'quinella' | 'win' | 'place'
    horses: number[]        // 馬番の配列
    units: number           // この馬券に賭けた口数
}

export interface IBet extends Document {
    participantId: string
    tickets: IBetTicket[]
    totalUnits: number      // 合計口数（100以下）
    createdAt: Date
    updatedAt: Date
}

const BetTicketSchema = new Schema<IBetTicket>({
    type: { type: String, enum: ['trifecta', 'trio', 'exacta', 'quinella', 'win', 'place'], required: true },
    horses: [{ type: Number }],
    units: { type: Number, required: true }
}, { _id: false })

const BetSchema = new Schema<IBet>({
    participantId: { type: String, required: true, unique: true },
    tickets: [BetTicketSchema],
    totalUnits: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

export const BetModel = mongoose.models.Bet || mongoose.model<IBet>('Bet', BetSchema)
