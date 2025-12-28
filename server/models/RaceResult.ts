import mongoose, { Schema, type Document } from 'mongoose'

export interface IRaceResult extends Document {
    first: number           // 1着馬番
    second: number          // 2着馬番
    third: number           // 3着馬番
    odds: {
        trifecta: Map<string, number>    // "1-2-3": 123.4
        trio: Map<string, number>        // "1-2-3": 45.6
        exacta: Map<string, number>      // "1-2": 12.3
        quinella: Map<string, number>    // "1-2": 6.7
        win: Map<string, number>         // "1": 2.3
        place: Map<string, number>       // "1": 1.5
    }
    confirmed: boolean
    createdAt: Date
}

const RaceResultSchema = new Schema<IRaceResult>({
    first: { type: Number, required: true },
    second: { type: Number, required: true },
    third: { type: Number, required: true },
    odds: {
        trifecta: { type: Map, of: Number },
        trio: { type: Map, of: Number },
        exacta: { type: Map, of: Number },
        quinella: { type: Map, of: Number },
        win: { type: Map, of: Number },
        place: { type: Map, of: Number }
    },
    confirmed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

export const RaceResultModel = mongoose.models.RaceResult || mongoose.model<IRaceResult>('RaceResult', RaceResultSchema)
