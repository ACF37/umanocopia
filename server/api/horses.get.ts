// GET /api/horses - 出走馬一覧を取得
import { getHorses } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
    return getHorses()
})
