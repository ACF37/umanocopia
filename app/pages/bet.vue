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
</style>
