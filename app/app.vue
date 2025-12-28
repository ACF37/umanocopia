<template>
  <div>
    <header class="header">
      <div class="header-content">
        <NuxtLink to="/" class="logo">
          <span class="logo-icon">🏇</span>
          <span class="logo-text">ウマノコピア</span>
        </NuxtLink>
        <nav class="nav">
          <NuxtLink to="/" class="nav-link">ホーム</NuxtLink>
          <NuxtLink to="/bet" class="nav-link">賭ける</NuxtLink>
          <NuxtLink to="/result" class="nav-link">結果</NuxtLink>
          <NuxtLink to="/admin" class="nav-link">管理</NuxtLink>
          <span v-if="me?.trapId" class="user-display">
            👤 {{ me.trapId }}
          </span>
        </nav>
      </div>
    </header>

    <main class="main">
      <NuxtPage />
    </main>

    <footer class="footer">
      <p>ウマノコピア - 有馬記念観戦サービス</p>
      <p>Powered by Plutus (部内通貨コピア)</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
interface MeResponse {
  authenticated: boolean
  trapId: string | null
}

// ユーザー情報を取得（X-Forwarded-User ヘッダーから）
const { data: me } = await useFetch<MeResponse>('/api/me')
</script>

<style scoped>
.nav-link.router-link-active {
  background: var(--color-accent);
  color: var(--color-primary-dark);
}

.user-display {
  margin-left: var(--spacing-4);
  padding: var(--spacing-2) var(--spacing-4);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-accent);
}
</style>
