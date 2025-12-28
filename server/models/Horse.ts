import mongoose, { Schema, type Document } from 'mongoose'

export interface IHorse extends Document {
    number: number
    name: string
    jockey?: string
}

const HorseSchema = new Schema<IHorse>({
    number: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    jockey: { type: String }
})

export const HorseModel = mongoose.models.Horse || mongoose.model<IHorse>('Horse', HorseSchema)
