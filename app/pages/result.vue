<template>
  <div class="container">
    <section class="hero">
      <h1 class="hero-title">🏆 結果発表</h1>
    </section>

    <div v-if="!result?.confirmed" class="card text-center">
      <div class="loading-state">
        <div class="loading-icon">⏳</div>
        <h2>レース結果待ち</h2>
        <p class="text-muted">レース結果が確定するまでお待ちください</p>
      </div>
    </div>

    <template v-else>
      <!-- レース結果 -->
      <section class="mt-6">
        <div class="card card-gold">
          <div class="card-header">
            <h2 class="card-title">🏇 レース結果</h2>
          </div>
          <div class="race-result">
            <div class="race-place first">
              <div class="place-badge">🥇 1着</div>
              <div class="place-number">{{ result.raceResult.first.number }}番</div>
              <div class="place-name">{{ result.raceResult.first.name }}</div>
            </div>
            <div class="race-place second">
              <div class="place-badge">🥈 2着</div>
              <div class="place-number">{{ result.raceResult.second.number }}番</div>
              <div class="place-name">{{ result.raceResult.second.name }}</div>
            </div>
            <div class="race-place third">
              <div class="place-badge">🥉 3着</div>
              <div class="place-number">{{ result.raceResult.third.number }}番</div>
              <div class="place-name">{{ result.raceResult.third.name }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- サマリー統計 -->
      <section class="mt-6">
        <div class="grid grid-4">
          <div class="card stat-card">
            <div class="stat-value">{{ result.summary.totalParticipants }}</div>
            <div class="stat-label">参加者数</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value">{{ result.summary.winnersCount }}</div>
            <div class="stat-label">的中者数</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value">{{ formatCopia(result.summary.totalPayout) }}</div>
            <div class="stat-label">総配当金</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value">{{ formatCopia(result.summary.maxPayout) }}</div>
            <div class="stat-label">最高配当</div>
          </div>
        </div>
      </section>

      <!-- ランキング -->
      <section class="mt-6">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">🏆 配当金ランキング</h2>
          </div>
          
          <!-- トップ3 -->
          <div class="top-three" v-if="result.ranking.length >= 3">
            <div class="podium">
              <div class="podium-item second">
                <div class="podium-rank">🥈</div>
                <div class="podium-name">{{ result.ranking[1]?.trapId }}</div>
                <div class="podium-amount">{{ formatCopia(result.ranking[1]?.amount || 0) }}</div>
                <div class="podium-profit" :class="getProfitClass(result.ranking[1]?.profit)">
                  {{ formatProfit(result.ranking[1]?.profit || 0) }}
                </div>
              </div>
              <div class="podium-item first">
                <div class="podium-rank">🥇</div>
                <div class="podium-name">{{ result.ranking[0]?.trapId }}</div>
                <div class="podium-amount">{{ formatCopia(result.ranking[0]?.amount || 0) }}</div>
                <div class="podium-profit" :class="getProfitClass(result.ranking[0]?.profit)">
                  {{ formatProfit(result.ranking[0]?.profit || 0) }}
                </div>
              </div>
              <div class="podium-item third">
                <div class="podium-rank">🥉</div>
                <div class="podium-name">{{ result.ranking[2]?.trapId }}</div>
                <div class="podium-amount">{{ formatCopia(result.ranking[2]?.amount || 0) }}</div>
                <div class="podium-profit" :class="getProfitClass(result.ranking[2]?.profit)">
                  {{ formatProfit(result.ranking[2]?.profit || 0) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 全員のランキング -->
          <div class="ranking-list">
            <div 
              v-for="item in result.ranking" 
              :key="item.trapId"
              :class="['rank-item', { winner: item.amount > 0, profit: item.profit > 0 }]"
            >
              <div :class="['rank-number', `rank-${item.rank}`]">{{ item.rank }}</div>
              <div class="rank-info">
                <div class="rank-name">{{ item.trapId }}</div>
                <div class="rank-detail" v-if="item.details.length > 0">
                  <span v-for="(d, i) in item.details" :key="i" class="detail-item">
                    {{ getTicketTypeName(d.ticketType) }} ×{{ d.units }}口 ({{ d.odds }}倍)
                  </span>
                </div>
              </div>
              <div class="rank-values">
                <div class="rank-value">{{ formatCopia(item.amount) }}</div>
                <div class="rank-profit" :class="getProfitClass(item.profit)">
                  {{ formatProfit(item.profit) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
interface RankingItem {
  rank: number
  trapId: string
  amount: number
  profit: number
  details: Array<{
    ticketType: string
    horses: number[]
    units: number
    odds: number
    payout: number
  }>
}

interface ResultData {
  confirmed: boolean
  raceResult?: {
    first: { number: number; name: string }
    second: { number: number; name: string }
    third: { number: number; name: string }
    odds: Record<string, any>
  }
  ranking: RankingItem[]
  summary: {
    totalParticipants: number
    totalPool: number
    totalPayout: number
    winnersCount: number
    profitWinnersCount: number
    maxPayout: number
    maxProfit: number
  }
}

const { data: result } = await useFetch<ResultData>('/api/result')

const ticketTypeNames: Record<string, string> = {
  trifecta: '3連単',
  trio: '3連複',
  exacta: '馬単',
  quinella: '馬連',
  win: '単勝',
  place: '複勝'
}

function formatCopia(amount: number): string {
  return amount.toLocaleString() + ' C'
}

function formatProfit(profit: number): string {
  if (profit > 0) return '+' + profit.toLocaleString() + ' C'
  if (profit < 0) return profit.toLocaleString() + ' C'
  return '±0 C'
}

function getProfitClass(profit: number | undefined): string {
  if (!profit) return ''
  if (profit > 0) return 'positive'
  if (profit < 0) return 'negative'
  return ''
}

function getTicketTypeName(type: string): string {
  return ticketTypeNames[type] || type
}
</script>

<style scoped>
.loading-state {
  padding: var(--spacing-12);
}

.loading-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-4);
}

/* レース結果 */
.race-result {
  display: flex;
  justify-content: center;
  gap: var(--spacing-6);
  padding: var(--spacing-6) 0;
}

.race-place {
  text-align: center;
  padding: var(--spacing-4);
  background: var(--color-bg-elevated);
  border-radius: var(--border-radius-lg);
  min-width: 150px;
}

.place-badge {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin-bottom: var(--spacing-2);
}

.place-number {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  color: var(--color-accent);
}

.place-name {
  margin-top: var(--spacing-2);
  font-weight: 600;
}

/* 表彰台 */
.top-three {
  margin-bottom: var(--spacing-6);
  padding-bottom: var(--spacing-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: var(--spacing-4);
}

.podium-item {
  text-align: center;
  padding: var(--spacing-4);
  background: var(--color-bg-elevated);
  border-radius: var(--border-radius-lg);
  min-width: 150px;
}

.podium-item.first {
  padding-bottom: var(--spacing-8);
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.2) 0%, var(--color-bg-elevated) 100%);
  border: 2px solid #ffd700;
}

.podium-item.second {
  padding-bottom: var(--spacing-6);
  background: linear-gradient(180deg, rgba(192, 192, 192, 0.2) 0%, var(--color-bg-elevated) 100%);
  border: 2px solid #c0c0c0;
}

.podium-item.third {
  padding-bottom: var(--spacing-4);
  background: linear-gradient(180deg, rgba(205, 127, 50, 0.2) 0%, var(--color-bg-elevated) 100%);
  border: 2px solid #cd7f32;
}

.podium-rank {
  font-size: 2rem;
  margin-bottom: var(--spacing-2);
}

.podium-name {
  font-weight: 600;
  font-size: var(--font-size-lg);
}

.podium-amount {
  margin-top: var(--spacing-2);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-accent);
}

.podium-profit {
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-1);
}

.podium-profit.positive {
  color: var(--color-success);
}

.podium-profit.negative {
  color: var(--color-error);
}

/* ランキングリスト */
.ranking-list {
  display: flex;
  flex-direction: column;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.rank-item:last-child {
  border-bottom: none;
}

.rank-item.winner {
  background: rgba(212, 175, 55, 0.05);
}

.rank-item.profit {
  background: rgba(34, 197, 94, 0.05);
}

.rank-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-full);
  font-weight: 700;
  background: var(--color-bg-elevated);
}

.rank-number.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffed4a);
  color: var(--color-primary-dark);
}

.rank-number.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #e5e5e5);
  color: var(--color-primary-dark);
}

.rank-number.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #daa06d);
  color: white;
}

.rank-info {
  flex: 1;
}

.rank-name {
  font-weight: 600;
}

.rank-detail {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-top: var(--spacing-1);
}

.detail-item {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background: var(--color-bg-elevated);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
}

.rank-values {
  text-align: right;
}

.rank-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-accent);
}

.rank-profit {
  font-size: var(--font-size-sm);
}

.rank-profit.positive {
  color: var(--color-success);
}

.rank-profit.negative {
  color: var(--color-error);
}

@media (max-width: 768px) {
  .race-result {
    flex-direction: column;
    align-items: center;
  }
  
  .podium {
    flex-direction: column;
    align-items: center;
  }
  
  .podium-item {
    width: 100%;
    max-width: 250px;
  }
  
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
