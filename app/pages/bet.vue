<template>
  <div class="container-md">
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">🎯 馬券購入</h1>
        <div class="units-display">
          <span class="units-label">残り口数:</span>
          <span class="units-value">{{ remainingUnits }}</span>
          <span class="units-total">/ {{ totalUnits }}</span>
        </div>
      </div>

      <!-- 認証・参加状況チェック -->
      <div v-if="!me?.authenticated" class="alert alert-warning">
        認証情報がありません。PaaS経由でアクセスしてください。
      </div>
      <div v-else-if="!me.participant" class="alert alert-warning">
        参加登録がありません。<NuxtLink to="/">ホーム</NuxtLink>から参加登録をしてください。
      </div>
      <div v-else-if="me.participant.status !== 'paid'" class="alert alert-warning">
        参加費の支払いが完了していません。
      </div>

      <!-- 馬券選択 -->
      <div v-else>
        <div class="user-info-bar">
          <span>🎫 {{ me.trapId }}</span>
        </div>

        <div v-if="successMessage" class="alert alert-success mb-4">
          {{ successMessage }}
        </div>

        <!-- 購入モード切替タブ -->
        <div class="mode-tabs">
          <button 
            :class="['mode-tab', { active: purchaseMode === 'normal' }]"
            @click="purchaseMode = 'normal'"
          >
            📝 通常購入
          </button>
          <button 
            :class="['mode-tab', { active: purchaseMode === 'formation' }]"
            @click="purchaseMode = 'formation'"
          >
            🎲 フォーメーション
          </button>
        </div>

        <!-- 通常購入モード -->
        <template v-if="purchaseMode === 'normal'">
          <!-- 馬券タイプ選択 -->
          <div class="section">
            <h3 class="section-title">馬券の種類を選択</h3>
            <div class="ticket-types">
              <button 
                v-for="type in ticketTypes" 
                :key="type.id"
                :class="['ticket-type-btn', { active: selectedType === type.id }]"
                @click="selectedType = type.id"
              >
                <span class="ticket-type-icon">{{ type.icon }}</span>
                <span class="ticket-type-name">{{ type.name }}</span>
                <span class="ticket-type-desc">{{ type.description }}</span>
              </button>
            </div>
          </div>

          <!-- 馬選択 -->
          <div class="section" v-if="selectedType">
            <h3 class="section-title">
              馬番を選択
              <span class="selection-hint">
                ({{ requiredHorses }}頭{{ selectedType === 'trifecta' || selectedType === 'exacta' ? '・順番通り' : '' }})
              </span>
            </h3>
            <div class="horse-grid">
              <button 
                v-for="horse in horses" 
                :key="horse.number"
                :class="['horse-btn', { 
                  selected: selectedHorses.includes(horse.number),
                  'first': selectedHorses[0] === horse.number,
                  'second': selectedHorses[1] === horse.number,
                  'third': selectedHorses[2] === horse.number
                }]"
                @click="toggleHorse(horse.number)"
                :disabled="isHorseDisabled(horse.number)"
              >
                <span class="horse-number">{{ horse.number }}</span>
                <span class="horse-order" v-if="getHorseOrder(horse.number)">{{ getHorseOrder(horse.number) }}</span>
              </button>
            </div>
            <div class="selected-display" v-if="selectedHorses.length > 0">
              <span class="selected-label">選択中:</span>
              <span class="selected-horses">
                {{ selectedHorses.map(n => horses?.find(h => h.number === n)?.name || n).join(' → ') }}
              </span>
            </div>
          </div>

          <!-- 口数入力 -->
          <div class="section" v-if="selectedHorses.length === requiredHorses">
            <h3 class="section-title">口数を入力</h3>
            <div class="units-input-group">
              <button @click="units = Math.max(1, units - 10)" class="btn btn-secondary">-10</button>
              <button @click="units = Math.max(1, units - 1)" class="btn btn-secondary">-1</button>
              <input 
                v-model.number="units" 
                type="number" 
                class="form-input units-input" 
                min="1"
                :max="remainingUnits"
              >
              <button @click="units = Math.min(remainingUnits, units + 1)" class="btn btn-secondary">+1</button>
              <button @click="units = Math.min(remainingUnits, units + 10)" class="btn btn-secondary">+10</button>
            </div>
            <div class="units-info">
              <span>{{ units }}口 × 100コピア = <strong>{{ (units * 100).toLocaleString() }}コピア</strong></span>
            </div>
          </div>

          <!-- カートに追加 -->
          <div class="section" v-if="selectedHorses.length === requiredHorses && units > 0">
            <button @click="addToCart" class="btn btn-primary btn-block">
              🛒 カートに追加
            </button>
          </div>
        </template>

        <!-- フォーメーションモード -->
        <template v-else-if="purchaseMode === 'formation'">
          <div class="section">
            <h3 class="section-title">🥇🥈🥉 3連単フォーメーション</h3>
            <p class="formation-desc">1着・2着・3着の候補をそれぞれ選択し、全組み合わせを一括購入できます。</p>
          </div>

          <!-- 1着候補選択 -->
          <div class="section">
            <h3 class="section-title formation-position first">1着候補</h3>
            <div class="horse-grid">
              <button 
                v-for="horse in horses" 
                :key="'first-' + horse.number"
                :class="['horse-btn', { selected: formationFirst.includes(horse.number), first: formationFirst.includes(horse.number) }]"
                @click="toggleFormationHorse('first', horse.number)"
              >
                <span class="horse-number">{{ horse.number }}</span>
              </button>
            </div>
            <div class="selected-display" v-if="formationFirst.length > 0">
              <span class="selected-label">1着候補:</span>
              <span class="selected-horses">{{ formationFirst.join(', ') }}</span>
            </div>
          </div>

          <!-- 2着候補選択 -->
          <div class="section">
            <h3 class="section-title formation-position second">2着候補</h3>
            <div class="horse-grid">
              <button 
                v-for="horse in horses" 
                :key="'second-' + horse.number"
                :class="['horse-btn', { selected: formationSecond.includes(horse.number), second: formationSecond.includes(horse.number) }]"
                @click="toggleFormationHorse('second', horse.number)"
              >
                <span class="horse-number">{{ horse.number }}</span>
              </button>
            </div>
            <div class="selected-display" v-if="formationSecond.length > 0">
              <span class="selected-label">2着候補:</span>
              <span class="selected-horses">{{ formationSecond.join(', ') }}</span>
            </div>
          </div>

          <!-- 3着候補選択 -->
          <div class="section">
            <h3 class="section-title formation-position third">3着候補</h3>
            <div class="horse-grid">
              <button 
                v-for="horse in horses" 
                :key="'third-' + horse.number"
                :class="['horse-btn', { selected: formationThird.includes(horse.number), third: formationThird.includes(horse.number) }]"
                @click="toggleFormationHorse('third', horse.number)"
              >
                <span class="horse-number">{{ horse.number }}</span>
              </button>
            </div>
            <div class="selected-display" v-if="formationThird.length > 0">
              <span class="selected-label">3着候補:</span>
              <span class="selected-horses">{{ formationThird.join(', ') }}</span>
            </div>
          </div>

          <!-- 展開プレビュー -->
          <div class="section" v-if="expandedFormation.length > 0">
            <h3 class="section-title">📊 展開結果 ({{ expandedFormation.length }}点)</h3>
            
            <div v-if="expandedFormation.length > remainingUnits" class="alert alert-warning">
              ⚠️ 組み合わせ数({{ expandedFormation.length }}点)が残り口数({{ remainingUnits }}口)を超えています。
            </div>
            
            <div v-else class="formation-distribution">
              <div class="distribution-header">
                <span>合計: {{ formationTotalUnits }}口</span>
                <button @click="resetFormationUnits" class="btn btn-secondary btn-sm">均等分配にリセット</button>
              </div>
              
              <div class="formation-items">
                <div 
                  v-for="(combo, index) in expandedFormation" 
                  :key="combo.key"
                  class="formation-item"
                >
                  <div class="formation-item-horses">
                    <span class="formation-horse first">{{ combo.horses[0] }}</span>
                    <span class="formation-arrow">→</span>
                    <span class="formation-horse second">{{ combo.horses[1] }}</span>
                    <span class="formation-arrow">→</span>
                    <span class="formation-horse third">{{ combo.horses[2] }}</span>
                  </div>
                  <div class="formation-item-slider">
                    <input 
                      type="range" 
                      :min="0" 
                      :max="Math.min(remainingUnits, 20)"
                      :value="formationUnits[combo.key] || 0"
                      @input="updateFormationUnit(combo.key, Number(($event.target as HTMLInputElement).value))"
                      class="slider"
                    >
                    <input 
                      type="number" 
                      :value="formationUnits[combo.key] || 0"
                      @change="updateFormationUnit(combo.key, Number(($event.target as HTMLInputElement).value))"
                      class="form-input formation-unit-input"
                      min="0"
                      :max="remainingUnits"
                    >
                    <span class="formation-unit-label">口</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- フォーメーションをカートに追加 -->
          <div class="section" v-if="expandedFormation.length > 0 && formationTotalUnits > 0 && formationTotalUnits <= remainingUnits">
            <button @click="addFormationToCart" class="btn btn-primary btn-block">
              🛒 フォーメーションをカートに追加 ({{ formationTotalUnits }}口)
            </button>
          </div>
        </template>

        <!-- カート -->
        <div class="section" v-if="cart.length > 0">
          <h3 class="section-title">🛒 カート</h3>
          <div class="cart-items">
            <div v-for="(item, index) in cart" :key="index" class="cart-item">
              <div class="cart-item-info">
                <span class="cart-item-type">{{ getTicketTypeName(item.type) }}</span>
                <span class="cart-item-horses">
                  {{ item.horses.map(n => horses?.find(h => h.number === n)?.name || n).join(' → ') }}
                </span>
              </div>
              <div class="cart-item-units">{{ item.units }}口</div>
              <button @click="removeFromCart(index)" class="cart-item-remove">&times;</button>
            </div>
          </div>
          <div class="cart-total">
            <span>合計: {{ cartTotalUnits }}口</span>
            <span class="cart-total-amount">{{ (cartTotalUnits * 100).toLocaleString() }}コピア</span>
          </div>
        </div>

        <!-- 確定ボタン -->
        <div class="section" v-if="cart.length > 0">
          <button @click="submitBets" class="btn btn-primary btn-lg btn-block" :disabled="isSubmitting">
            <span v-if="isSubmitting">送信中...</span>
            <span v-else>✅ 馬券を確定する</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Horse {
  number: number
  name: string
}

interface CartItem {
  type: string
  horses: number[]
  units: number
}

interface MeResponse {
  authenticated: boolean
  trapId: string | null
  participant: {
    id: string
    trapId: string
    status: string
    units: number
  } | null
  bet: {
    tickets: CartItem[]
    totalUnits: number
  } | null
}

const route = useRoute()

// 状態
const successMessage = ref('')
const selectedType = ref<string | null>(null)
const selectedHorses = ref<number[]>([])
const units = ref(1)
const cart = ref<CartItem[]>([])
const isSubmitting = ref(false)

// フォーメーションモード用の状態
const purchaseMode = ref<'normal' | 'formation'>('normal')
const formationFirst = ref<number[]>([])
const formationSecond = ref<number[]>([])
const formationThird = ref<number[]>([])
const formationUnits = ref<Record<string, number>>({})

interface FormationCombo {
  key: string
  horses: number[]
}

const totalUnits = 100

// クエリからの成功メッセージ
if (route.query.success) {
  successMessage.value = '参加費の支払いが完了しました！馬券を購入してください。'
}

// ユーザー情報を取得
const { data: me, refresh: refreshMe } = await useFetch<MeResponse>('/api/me')
const { data: horses } = await useFetch<Horse[]>('/api/horses')

// 既存の賭け情報があれば読み込む
if (me.value?.bet?.tickets) {
  cart.value = me.value.bet.tickets
}

// 馬券タイプ
const ticketTypes = [
  { id: 'trifecta', name: '3連単', description: '1-2-3着を順番通り', icon: '🥇🥈🥉', horses: 3 },
  { id: 'trio', name: '3連複', description: '1-2-3着を順不同', icon: '🎯🎯🎯', horses: 3 },
  { id: 'exacta', name: '馬単', description: '1-2着を順番通り', icon: '🥇🥈', horses: 2 },
  { id: 'quinella', name: '馬連', description: '1-2着を順不同', icon: '🎯🎯', horses: 2 },
  { id: 'win', name: '単勝', description: '1着を予想', icon: '🥇', horses: 1 },
  { id: 'place', name: '複勝', description: '3着以内を予想', icon: '🎖️', horses: 1 }
]

// 必要な馬の数
const requiredHorses = computed(() => {
  const type = ticketTypes.find(t => t.id === selectedType.value)
  return type?.horses || 0
})

// カートの合計口数
const cartTotalUnits = computed(() => cart.value.reduce((sum, item) => sum + item.units, 0))

// 残り口数
const remainingUnits = computed(() => totalUnits - cartTotalUnits.value)

// 馬を選択/解除
function toggleHorse(number: number) {
  const index = selectedHorses.value.indexOf(number)
  if (index >= 0) {
    selectedHorses.value.splice(index, 1)
  } else if (selectedHorses.value.length < requiredHorses.value) {
    selectedHorses.value.push(number)
  }
}

// 馬が選択不可かどうか
function isHorseDisabled(number: number): boolean {
  if (selectedHorses.value.includes(number)) return false
  return selectedHorses.value.length >= requiredHorses.value
}

// 馬の順番を取得
function getHorseOrder(number: number): string {
  const index = selectedHorses.value.indexOf(number)
  if (index < 0) return ''
  const orders = ['1st', '2nd', '3rd']
  return orders[index] || ''
}

// 馬券タイプ名を取得
function getTicketTypeName(type: string): string {
  return ticketTypes.find(t => t.id === type)?.name || type
}

// カートに追加
function addToCart() {
  if (selectedHorses.value.length !== requiredHorses.value) return
  if (units.value < 1 || units.value > remainingUnits.value) return
  
  cart.value.push({
    type: selectedType.value!,
    horses: [...selectedHorses.value],
    units: units.value
  })
  
  // リセット
  selectedHorses.value = []
  units.value = 1
}

// カートから削除
function removeFromCart(index: number) {
  cart.value.splice(index, 1)
}

// 馬券を確定
async function submitBets() {
  if (cart.value.length === 0) return
  
  isSubmitting.value = true
  try {
    await $fetch('/api/bets', {
      method: 'POST',
      body: {
        tickets: cart.value
      }
    })
    
    successMessage.value = '馬券の購入が完了しました！'
    await refreshMe()
  } catch (error: any) {
    alert(error.data?.message || '馬券の購入に失敗しました')
  } finally {
    isSubmitting.value = false
  }
}

// 馬券タイプが変わったら選択をリセット
watch(selectedType, () => {
  selectedHorses.value = []
})

// ========== フォーメーションモード用の機能 ==========

// フォーメーションの展開結果
const expandedFormation = computed<FormationCombo[]>(() => {
  if (formationFirst.value.length === 0 || formationSecond.value.length === 0 || formationThird.value.length === 0) {
    return []
  }
  
  const results: FormationCombo[] = []
  for (const f of formationFirst.value) {
    for (const s of formationSecond.value) {
      if (s === f) continue  // 同じ馬は除外
      for (const t of formationThird.value) {
        if (t === f || t === s) continue  // 同じ馬は除外
        results.push({
          key: `${f}-${s}-${t}`,
          horses: [f, s, t]
        })
      }
    }
  }
  return results
})

// フォーメーションの合計口数
const formationTotalUnits = computed(() => {
  return Object.values(formationUnits.value).reduce((sum, u) => sum + u, 0)
})

// フォーメーションの馬を選択/解除
function toggleFormationHorse(position: 'first' | 'second' | 'third', number: number) {
  const targetRef = position === 'first' ? formationFirst : position === 'second' ? formationSecond : formationThird
  const index = targetRef.value.indexOf(number)
  if (index >= 0) {
    targetRef.value.splice(index, 1)
  } else {
    targetRef.value.push(number)
  }
  // 展開が変わったら口数をリセット
  resetFormationUnits()
}

// フォーメーションの口数を均等分配にリセット
function resetFormationUnits() {
  const combos = expandedFormation.value
  if (combos.length === 0) {
    formationUnits.value = {}
    return
  }
  
  const maxUnits = Math.min(remainingUnits.value, totalUnits)
  const baseUnits = Math.floor(maxUnits / combos.length)
  const remainder = maxUnits % combos.length
  
  const newUnits: Record<string, number> = {}
  combos.forEach((combo, index) => {
    // 余りは先頭から分配
    newUnits[combo.key] = baseUnits + (index < remainder ? 1 : 0)
  })
  formationUnits.value = newUnits
}

// 個別の口数を更新
function updateFormationUnit(key: string, value: number) {
  const safeValue = Math.max(0, Math.min(value, remainingUnits.value))
  formationUnits.value = {
    ...formationUnits.value,
    [key]: safeValue
  }
}

// フォーメーションをカートに追加
function addFormationToCart() {
  const combos = expandedFormation.value
  if (combos.length === 0) return
  
  // 口数が1以上の組み合わせだけカートに追加
  for (const combo of combos) {
    const units = formationUnits.value[combo.key] || 0
    if (units > 0) {
      cart.value.push({
        type: 'trifecta',
        horses: [...combo.horses],
        units: units
      })
    }
  }
  
  // フォーメーションをリセット
  formationFirst.value = []
  formationSecond.value = []
  formationThird.value = []
  formationUnits.value = {}
}
</script>

<style scoped>
.user-info-bar {
  background: var(--color-bg-elevated);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-4);
  font-weight: 600;
  color: var(--color-accent);
}

.units-display {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
}

.units-label {
  color: var(--color-text-muted);
}

.units-value {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  color: var(--color-accent);
}

.units-total {
  color: var(--color-text-muted);
}

.section {
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-6);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-4);
  color: var(--color-text);
}

.selection-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: normal;
}

.ticket-types {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-3);
}

.ticket-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--color-bg-elevated);
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.ticket-type-btn:hover {
  border-color: var(--color-accent);
}

.ticket-type-btn.active {
  border-color: var(--color-accent);
  background: rgba(212, 175, 55, 0.1);
}

.ticket-type-icon {
  font-size: 1.5rem;
}

.ticket-type-name {
  font-weight: 600;
  color: var(--color-text);
}

.ticket-type-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.horse-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: var(--spacing-2);
}

@media (max-width: 640px) {
  .horse-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.horse-btn {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated);
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.horse-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  transform: scale(1.05);
}

.horse-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.horse-btn.selected {
  background: var(--color-accent);
  color: var(--color-primary-dark);
  border-color: var(--color-accent);
}

.horse-btn.first {
  background: #ffd700;
  border-color: #ffd700;
}

.horse-btn.second {
  background: #c0c0c0;
  border-color: #c0c0c0;
}

.horse-btn.third {
  background: #cd7f32;
  border-color: #cd7f32;
}

.horse-number {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.horse-order {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.selected-display {
  margin-top: var(--spacing-4);
  padding: var(--spacing-3);
  background: var(--color-bg-elevated);
  border-radius: var(--border-radius-md);
  display: flex;
  gap: var(--spacing-3);
}

.selected-label {
  color: var(--color-text-muted);
}

.selected-horses {
  color: var(--color-accent);
  font-weight: 600;
}

.units-input-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.units-input {
  width: 100px;
  text-align: center;
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.units-info {
  margin-top: var(--spacing-3);
  color: var(--color-text-muted);
}

.units-info strong {
  color: var(--color-accent);
}

/* カート */
.cart-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.cart-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3);
  background: var(--color-bg-elevated);
  border-radius: var(--border-radius-md);
}

.cart-item-info {
  flex: 1;
}

.cart-item-type {
  font-weight: 600;
  color: var(--color-accent);
  display: block;
}

.cart-item-horses {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.cart-item-units {
  font-weight: 600;
}

.cart-item-remove {
  background: none;
  border: none;
  color: var(--color-error);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
}

.cart-total-amount {
  font-size: var(--font-size-xl);
  color: var(--color-accent);
}

/* モード切替タブ */
.mode-tabs {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.mode-tab {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-bg-elevated);
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.mode-tab:hover {
  border-color: var(--color-accent);
}

.mode-tab.active {
  border-color: var(--color-accent);
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-accent);
}

/* フォーメーション */
.formation-desc {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
}

.formation-position {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.formation-position.first::before {
  content: '🥇';
}

.formation-position.second::before {
  content: '🥈';
}

.formation-position.third::before {
  content: '🥉';
}

.formation-distribution {
  background: var(--color-bg-elevated);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
}

.distribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
}

.formation-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  max-height: 400px;
  overflow-y: auto;
}

.formation-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-2);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--border-radius-sm);
}

.formation-item-horses {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  min-width: 100px;
  font-weight: 600;
}

.formation-horse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.formation-horse.first {
  background: #ffd700;
  color: #000;
}

.formation-horse.second {
  background: #c0c0c0;
  color: #000;
}

.formation-horse.third {
  background: #cd7f32;
  color: #000;
}

.formation-arrow {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.formation-item-slider {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: grab;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-accent);
  border-radius: 50%;
  border: none;
  cursor: grab;
}

.formation-unit-input {
  width: 60px;
  text-align: center;
  padding: var(--spacing-1) var(--spacing-2);
}

.formation-unit-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-sm);
}
</style>
