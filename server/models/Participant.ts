import mongoose, { Schema, type Document } from 'mongoose'

export interface IParticipant extends Document {
    id: string
    trapId: string          // traP ID (ユーザー名)
    billId: string          // Plutus Bill ID
    status: 'pending' | 'paid' | 'cancelled'
    units: number           // 口数 (100固定)
    createdAt: Date
    paidAt?: Date
}

const ParticipantSchema = new Schema<IParticipant>({
    id: { type: String, required: true, unique: true },
    trapId: { type: String, required: true, index: true },
    billId: { type: String, required: true, index: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    units: { type: Number, default: 100 },
    createdAt: { type: Date, default: Date.now },
    paidAt: { type: Date }
})

export const ParticipantModel = mongoose.models.Participant || mongoose.model<IParticipant>('Participant', ParticipantSchema)
