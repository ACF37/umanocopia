<template>
  <div class="container">
    <section class="hero">
      <h1 class="hero-title">⚙️ 管理画面</h1>
    </section>

    <!-- 統計 -->
    <section class="mt-6">
      <div class="grid grid-4">
        <div class="card stat-card">
          <div class="stat-value">{{ stats?.paidParticipants || 0 }}</div>
          <div class="stat-label">参加者（支払済）</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ stats?.totalParticipants || 0 }}</div>
          <div class="stat-label">参加者（全体）</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ formatCopia(stats?.totalPool || 0) }}</div>
          <div class="stat-label">総プール</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ resultStatus }}</div>
          <div class="stat-label">レース結果</div>
        </div>
      </div>
    </section>

    <!-- タブ -->
    <section class="mt-6">
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
      </div>

      <!-- 参加者一覧 -->
      <div v-if="activeTab === 'participants'" class="card mt-4">
        <div class="card-header">
          <h2 class="card-title">👥 参加者一覧</h2>
          <button @click="refreshParticipants" class="btn btn-secondary btn-sm">
            🔄 更新
          </button>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>traP ID</th>
                <th>ステータス</th>
                <th>口数</th>
                <th>参加日時</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in participants?.items" :key="p.id">
                <td>{{ p.trapId }}</td>
                <td>
                  <span :class="['badge', getStatusBadge(p.status)]">
                    {{ getStatusText(p.status) }}
                  </span>
                </td>
                <td>{{ p.units }}口</td>
                <td>{{ formatDate(p.createdAt) }}</td>
              </tr>
              <tr v-if="!participants?.items?.length">
                <td colspan="4" class="text-center text-muted">参加者がいません</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- レース結果入力 -->
      <div v-if="activeTab === 'result'" class="card mt-4">
        <div class="card-header">
          <h2 class="card-title">🏇 レース結果入力</h2>
        </div>
        
        <div class="result-form">
          <!-- 着順入力 -->
          <div class="form-section">
            <h3 class="form-section-title">着順</h3>
            <div class="grid grid-3">
              <div class="form-group">
                <label class="form-label">🥇 1着</label>
                <select v-model.number="resultForm.first" class="form-select">
                  <option :value="null">選択...</option>
                  <option v-for="h in horses" :key="h.number" :value="h.number">
                    {{ h.number }}. {{ h.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">🥈 2着</label>
                <select v-model.number="resultForm.second" class="form-select">
                  <option :value="null">選択...</option>
                  <option v-for="h in horses" :key="h.number" :value="h.number">
                    {{ h.number }}. {{ h.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">🥉 3着</label>
                <select v-model.number="resultForm.third" class="form-select">
                  <option :value="null">選択...</option>
                  <option v-for="h in horses" :key="h.number" :value="h.number">
                    {{ h.number }}. {{ h.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- オッズ入力 -->
          <div class="form-section">
            <h3 class="form-section-title">オッズ</h3>
            
            <div class="odds-grid">
              <!-- 3連単 -->
              <div class="form-group">
                <label class="form-label">
                  3連単 ({{ resultForm.first }}-{{ resultForm.second }}-{{ resultForm.third }})
                </label>
                <input 
                  v-model.number="oddsForm.trifecta" 
                  type="number" 
                  step="0.1"
                  class="form-input" 
                  placeholder="例: 123.4"
                >
              </div>
              
              <!-- 3連複 -->
              <div class="form-group">
                <label class="form-label">
                  3連複 ({{ sortedPlaces.join('-') }})
                </label>
                <input 
                  v-model.number="oddsForm.trio" 
                  type="number" 
                  step="0.1"
                  class="form-input" 
                  placeholder="例: 45.6"
                >
              </div>
              
              <!-- 馬単 -->
              <div class="form-group">
                <label class="form-label">
                  馬単 ({{ resultForm.first }}-{{ resultForm.second }})
                </label>
                <input 
                  v-model.number="oddsForm.exacta" 
                  type="number" 
                  step="0.1"
                  class="form-input" 
                  placeholder="例: 12.3"
                >
              </div>
              
              <!-- 馬連 -->
              <div class="form-group">
                <label class="form-label">
                  馬連 ({{ sortedTop2.join('-') }})
                </label>
                <input 
                  v-model.number="oddsForm.quinella" 
                  type="number" 
                  step="0.1"
                  class="form-input" 
                  placeholder="例: 6.7"
                >
              </div>
              
              <!-- 単勝 -->
              <div class="form-group">
                <label class="form-label">単勝 ({{ resultForm.first }}番)</label>
                <input 
                  v-model.number="oddsForm.win" 
                  type="number" 
                  step="0.1"
                  class="form-input" 
                  placeholder="例: 2.3"
                >
              </div>
            </div>
            
            <!-- 複勝 -->
            <div class="form-section-sub">
              <h4>複勝オッズ</h4>
              <div class="grid grid-3">
                <div class="form-group">
                  <label class="form-label">{{ resultForm.first }}番</label>
                  <input 
                    v-model.number="oddsForm.place1" 
                    type="number" 
                    step="0.1"
                    class="form-input" 
                    placeholder="例: 1.5"
                  >
                </div>
                <div class="form-group">
                  <label class="form-label">{{ resultForm.second }}番</label>
                  <input 
                    v-model.number="oddsForm.place2" 
                    type="number" 
                    step="0.1"
                    class="form-input" 
                    placeholder="例: 1.8"
                  >
                </div>
                <div class="form-group">
                  <label class="form-label">{{ resultForm.third }}番</label>
                  <input 
                    v-model.number="oddsForm.place3" 
                    type="number" 
                    step="0.1"
                    class="form-input" 
                    placeholder="例: 2.1"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 確定チェック -->
          <div class="form-section">
            <label class="checkbox-label">
              <input v-model="resultForm.confirm" type="checkbox">
              <span>レース結果を確定する（配当計算が可能になります）</span>
            </label>
          </div>

          <button @click="saveResult" class="btn btn-primary btn-lg btn-block" :disabled="isSaving">
            <span v-if="isSaving">保存中...</span>
            <span v-else>💾 結果を保存</span>
          </button>
        </div>
      </div>

      <!-- 配当計算・送金 -->
      <div v-if="activeTab === 'payout'" class="card mt-4">
        <div class="card-header">
          <h2 class="card-title">💰 配当計算・送金</h2>
        </div>

        <div v-if="!stats?.raceResult?.confirmed" class="alert alert-warning">
          レース結果が確定していません。先にレース結果を確定してください。
        </div>

        <template v-else>
          <div class="payout-actions">
            <button @click="calculatePayouts" class="btn btn-secondary" :disabled="isCalculating">
              🔢 配当を計算
            </button>
            <button 
              @click="executePayouts" 
              class="btn btn-primary" 
              :disabled="!payoutPreview || isExecuting"
            >
              💸 送金を実行
            </button>
          </div>

          <div v-if="payoutPreview" class="payout-preview mt-6">
            <h3 class="section-title">📊 配当プレビュー</h3>
            
            <div class="grid grid-4 mb-4">
              <div class="mini-stat">
                <div class="mini-stat-value">{{ payoutPreview.summary.totalParticipants }}</div>
                <div class="mini-stat-label">参加者数</div>
              </div>
              <div class="mini-stat">
                <div class="mini-stat-value">{{ payoutPreview.summary.winners }}</div>
                <div class="mini-stat-label">的中者数</div>
              </div>
              <div class="mini-stat">
                <div class="mini-stat-value">{{ formatCopia(payoutPreview.summary.totalPayout) }}</div>
                <div class="mini-stat-label">総配当</div>
              </div>
              <div class="mini-stat">
                <div class="mini-stat-value">{{ formatCopia(payoutPreview.summary.maxPayout) }}</div>
                <div class="mini-stat-label">最高配当</div>
              </div>
            </div>

            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>traP ID</th>
                    <th>配当金</th>
                    <th>詳細</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in payoutPreview.payouts" :key="p.participantId">
                    <td>{{ p.trapId }}</td>
                    <td>
                      <span :class="{ 'text-gold': p.amount > 0 }">
                        {{ formatCopia(p.amount) }}
                      </span>
                    </td>
                    <td>
                      <span v-if="p.details.length === 0" class="text-muted">的中なし</span>
                      <span v-else>
                        {{ p.details.map(d => `${d.ticketType} ×${d.units}`).join(', ') }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="payoutResult" class="payout-result mt-6">
            <h3 class="section-title">✅ 送金結果</h3>
            
            <div class="alert" :class="payoutResult.summary.failedCount > 0 ? 'alert-warning' : 'alert-success'">
              <span v-if="payoutResult.summary.failedCount > 0">
                ⚠️ {{ payoutResult.summary.successCount }}件成功、{{ payoutResult.summary.failedCount }}件失敗
              </span>
              <span v-else>
                ✅ {{ payoutResult.summary.successCount }}件の送金が完了しました
              </span>
            </div>

            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>traP ID</th>
                    <th>金額</th>
                    <th>ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in payoutResult.results.filter((r: any) => r.amount > 0)" :key="r.trapId">
                    <td>{{ r.trapId }}</td>
                    <td>{{ formatCopia(r.amount) }}</td>
                    <td>
                      <span v-if="r.success" class="badge badge-success">成功</span>
                      <span v-else class="badge badge-error">失敗: {{ r.error }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
interface Horse {
  number: number
  name: string
}

interface Participant {
  id: string
  trapId: string
  status: string
  units: number
  createdAt: string
}

const tabs = [
  { id: 'participants', name: '参加者', icon: '👥' },
  { id: 'result', name: 'レース結果', icon: '🏇' },
  { id: 'payout', name: '配当・送金', icon: '💰' }
]

const activeTab = ref('participants')

// データ取得
const { data: stats, refresh: refreshStats } = await useFetch('/api/stats')
const { data: participants, refresh: refreshParticipants } = await useFetch<{ items: Participant[] }>('/api/participants')
const { data: horses } = await useFetch<Horse[]>('/api/horses')

// フォーム状態
const resultForm = reactive({
  first: null as number | null,
  second: null as number | null,
  third: null as number | null,
  confirm: false
})

const oddsForm = reactive({
  trifecta: null as number | null,
  trio: null as number | null,
  exacta: null as number | null,
  quinella: null as number | null,
  win: null as number | null,
  place1: null as number | null,
  place2: null as number | null,
  place3: null as number | null
})

const isSaving = ref(false)
const isCalculating = ref(false)
const isExecuting = ref(false)

const payoutPreview = ref<any>(null)
const payoutResult = ref<any>(null)

// 計算プロパティ
const resultStatus = computed(() => {
  if (stats.value?.raceResult?.confirmed) return '確定済'
  if (stats.value?.raceResult) return '入力済'
  return '未入力'
})

const sortedPlaces = computed(() => {
  const places = [resultForm.first, resultForm.second, resultForm.third]
    .filter(p => p !== null) as number[]
  return places.sort((a, b) => a - b)
})

const sortedTop2 = computed(() => {
  const places = [resultForm.first, resultForm.second]
    .filter(p => p !== null) as number[]
  return places.sort((a, b) => a - b)
})

// フォーマット関数
function formatCopia(amount: number): string {
  return amount.toLocaleString() + ' C'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ja-JP')
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'paid': return 'badge-success'
    case 'pending': return 'badge-warning'
    case 'cancelled': return 'badge-error'
    default: return ''
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'paid': return '支払済'
    case 'pending': return '支払待ち'
    case 'cancelled': return 'キャンセル'
    default: return status
  }
}

// 結果保存
async function saveResult() {
  if (!resultForm.first || !resultForm.second || !resultForm.third) {
    alert('着順を入力してください')
    return
  }

  isSaving.value = true
  try {
    const trifectaKey = `${resultForm.first}-${resultForm.second}-${resultForm.third}`
    const trioKey = sortedPlaces.value.join('-')
    const exactaKey = `${resultForm.first}-${resultForm.second}`
    const quinellaKey = sortedTop2.value.join('-')

    await $fetch('/api/admin/result', {
      method: 'POST',
      body: {
        first: resultForm.first,
        second: resultForm.second,
        third: resultForm.third,
        odds: {
          trifecta: { [trifectaKey]: oddsForm.trifecta || 0 },
          trio: { [trioKey]: oddsForm.trio || 0 },
          exacta: { [exactaKey]: oddsForm.exacta || 0 },
          quinella: { [quinellaKey]: oddsForm.quinella || 0 },
          win: { [String(resultForm.first)]: oddsForm.win || 0 },
          place: {
            [String(resultForm.first)]: oddsForm.place1 || 0,
            [String(resultForm.second)]: oddsForm.place2 || 0,
            [String(resultForm.third)]: oddsForm.place3 || 0
          }
        },
        confirm: resultForm.confirm
      }
    })

    alert('結果を保存しました')
    refreshStats()
  } catch (error: any) {
    alert(error.data?.message || '保存に失敗しました')
  } finally {
    isSaving.value = false
  }
}

// 配当計算
async function calculatePayouts() {
  isCalculating.value = true
  try {
    const result = await $fetch('/api/admin/payout', {
      method: 'POST',
      body: { execute: false }
    })
    payoutPreview.value = result
  } catch (error: any) {
    alert(error.data?.message || '計算に失敗しました')
  } finally {
    isCalculating.value = false
  }
}

// 送金実行
async function executePayouts() {
  if (!confirm('本当に送金を実行しますか？この操作は取り消せません。')) {
    return
  }

  isExecuting.value = true
  try {
    const result = await $fetch('/api/admin/payout', {
      method: 'POST',
      body: { execute: true }
    })
    payoutResult.value = result
  } catch (error: any) {
    alert(error.data?.message || '送金に失敗しました')
  } finally {
    isExecuting.value = false
  }
}

// 既存の結果があれば読み込む
onMounted(() => {
  if (stats.value?.raceResult) {
    resultForm.first = stats.value.raceResult.first
    resultForm.second = stats.value.raceResult.second
    resultForm.third = stats.value.raceResult.third
    resultForm.confirm = stats.value.raceResult.confirmed
  }
})
</script>

<style scoped>
.tabs {
  display: flex;
  gap: var(--spacing-2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: var(--spacing-2);
}

.tab {
  padding: var(--spacing-3) var(--spacing-6);
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 500;
  border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
  transition: all var(--transition-fast);
}

.tab:hover {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.05);
}

.tab.active {
  color: var(--color-accent);
  background: var(--color-bg-card);
  border-bottom: 2px solid var(--color-accent);
}

.result-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.form-section {
  padding-bottom: var(--spacing-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-4);
  color: var(--color-accent);
}

.form-section-sub {
  margin-top: var(--spacing-4);
}

.form-section-sub h4 {
  margin-bottom: var(--spacing-3);
  color: var(--color-text-muted);
}

.odds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
}

.checkbox-label input {
  width: 20px;
  height: 20px;
}

.payout-actions {
  display: flex;
  gap: var(--spacing-4);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-4);
}

.mini-stat {
  text-align: center;
  padding: var(--spacing-4);
  background: var(--color-bg-elevated);
  border-radius: var(--border-radius-md);
}

.mini-stat-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-accent);
}

.mini-stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab {
    flex: 1;
    min-width: 100px;
  }
  
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
