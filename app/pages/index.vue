<template>
  <div class="container">
    <!-- ヒーローセクション -->
    <section class="hero">
      <h1 class="hero-title">🏇 有馬記念 2024 🏆</h1>
      <p class="hero-subtitle">
        部内通貨「コピア」を使った観戦サービス<br>
        10,000コピアで100口を手に入れて、夢の配当を目指せ！
      </p>
      
      <!-- ユーザー情報表示 -->
      <div v-if="me?.authenticated" class="user-info">
        <span class="user-badge">🎫 {{ me.trapId }}</span>
        <span v-if="me.participant?.status === 'paid'" class="badge badge-success">参加済み</span>
        <span v-else-if="me.participant?.status === 'pending'" class="badge badge-warning">支払い待ち</span>
      </div>
      
      <div class="mt-8">
        <div v-if="!me?.authenticated" class="alert alert-warning">
          認証情報がありません。PaaS経由でアクセスしてください。
        </div>
        <div v-else-if="me.participant?.status === 'paid'">
          <NuxtLink to="/bet" class="btn btn-primary btn-lg">
            🎯 馬券を買う
          </NuxtLink>
        </div>
        <div v-else>
          <button @click="handleJoin" class="btn btn-primary btn-lg" :disabled="isJoining">
            <span v-if="isJoining">処理中...</span>
            <span v-else>🎫 参加する（10,000コピア）</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 統計情報 -->
    <section class="mt-8">
      <div class="grid grid-3">
        <div class="card stat-card">
          <div class="stat-value">{{ stats?.paidParticipants || 0 }}</div>
          <div class="stat-label">参加者数</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ formatCopia(stats?.totalPool || 0) }}</div>
          <div class="stat-label">総プール金額</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ horses?.length || 0 }}</div>
          <div class="stat-label">出走馬</div>
        </div>
      </div>
    </section>

    <!-- 出走馬一覧 -->
    <section class="mt-8">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🐴 出走馬</h2>
        </div>
        <div class="horse-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));">
          <div 
            v-for="horse in horses" 
            :key="horse.number"
            class="horse-item"
          >
            <span class="horse-number-badge">{{ horse.number }}</span>
            <span class="horse-name">{{ horse.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ルール説明 -->
    <section class="mt-8">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📋 ルール</h2>
        </div>
        <div class="rules-content">
          <div class="rule-item">
            <div class="rule-icon">💰</div>
            <div class="rule-text">
              <strong>参加費</strong>
              <p>10,000コピア（100口）を支払って参加</p>
            </div>
          </div>
          <div class="rule-item">
            <div class="rule-icon">🎯</div>
            <div class="rule-text">
              <strong>馬券購入</strong>
              <p>100口を自由に分配して馬券を購入（1口 = 100コピア）</p>
            </div>
          </div>
          <div class="rule-item">
            <div class="rule-icon">🏆</div>
            <div class="rule-text">
              <strong>配当金</strong>
              <p>的中した場合、実際のオッズに基づいて配当金を獲得</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 馬券種類 -->
    <section class="mt-8">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🎫 馬券の種類</h2>
        </div>
        <div class="grid grid-2">
          <div class="ticket-type">
            <div class="ticket-icon">🥇🥈🥉</div>
            <div class="ticket-info">
              <div class="ticket-name">3連単</div>
              <div class="ticket-description">1-2-3着を順番通りに予想</div>
            </div>
          </div>
          <div class="ticket-type">
            <div class="ticket-icon">🎯🎯🎯</div>
            <div class="ticket-info">
              <div class="ticket-name">3連複</div>
              <div class="ticket-description">1-2-3着を順不同で予想</div>
            </div>
          </div>
          <div class="ticket-type">
            <div class="ticket-icon">🥇🥈</div>
            <div class="ticket-info">
              <div class="ticket-name">馬単</div>
              <div class="ticket-description">1-2着を順番通りに予想</div>
            </div>
          </div>
          <div class="ticket-type">
            <div class="ticket-icon">🎯🎯</div>
            <div class="ticket-info">
              <div class="ticket-name">馬連</div>
              <div class="ticket-description">1-2着を順不同で予想</div>
            </div>
          </div>
          <div class="ticket-type">
            <div class="ticket-icon">🥇</div>
            <div class="ticket-info">
              <div class="ticket-name">単勝</div>
              <div class="ticket-description">1着を予想</div>
            </div>
          </div>
          <div class="ticket-type">
            <div class="ticket-icon">🎖️</div>
            <div class="ticket-info">
              <div class="ticket-name">複勝</div>
              <div class="ticket-description">1-2-3着のいずれかを予想</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
interface MeResponse {
  authenticated: boolean
  trapId: string | null
  participant: {
    id: string
    trapId: string
    status: string
    units: number
  } | null
  bet: any | null
}

const isJoining = ref(false)

// ユーザー情報を取得
const { data: me, refresh: refreshMe } = await useFetch<MeResponse>('/api/me')
const { data: stats } = await useFetch('/api/stats')
const { data: horses } = await useFetch('/api/horses')

// コピアのフォーマット
function formatCopia(amount: number): string {
  return amount.toLocaleString() + ' C'
}

// 参加処理
async function handleJoin() {
  if (isJoining.value) return
  
  isJoining.value = true
  try {
    const response = await $fetch('/api/participants', {
      method: 'POST'
    }) as { paymentUrl?: string }
    
    if (response.paymentUrl) {
      // Plutusの決済ページにリダイレクト
      window.location.href = response.paymentUrl
    } else {
      // Plutusが設定されていない場合
      alert('決済ページのURLが取得できませんでした')
    }
  } catch (error: any) {
    alert(error.data?.message || '参加登録に失敗しました')
  } finally {
    isJoining.value = false
  }
}
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  margin-top: var(--spacing-4);
}

.user-badge {
  background: var(--color-bg-elevated);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-full);
  font-weight: 600;
  color: var(--color-accent);
}

.horse-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--color-bg-elevated);
  border-radius: var(--border-radius-md);
}

.horse-number-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent);
  color: var(--color-primary-dark);
  border-radius: var(--border-radius-full);
  font-weight: 700;
  font-size: var(--font-size-sm);
}

.horse-name {
  font-weight: 500;
}

.rules-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--color-bg-elevated);
  border-radius: var(--border-radius-md);
}

.rule-icon {
  font-size: 2rem;
}

.rule-text strong {
  color: var(--color-accent);
  display: block;
  margin-bottom: var(--spacing-1);
}

.rule-text p {
  color: var(--color-text-muted);
  margin: 0;
}
</style>
