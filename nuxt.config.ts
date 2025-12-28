// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // SSR無効（SPAモード）
  ssr: false,

  // 環境変数
  runtimeConfig: {
    // サーバーサイドのみ
    plutusApiUrl: process.env.PLUTUS_API_URL || 'https://plutus.trap.show/api/v1',
    plutusApiToken: process.env.PLUTUS_API_TOKEN || '',

    // クライアントにも公開
    public: {
      appName: 'ウマノコピア',
      unitPrice: 100, // 1口 = 100コピア
      totalUnits: 100, // 参加者が持つ口数
    }
  },

  // CSS
  css: ['~/assets/css/main.css'],

  // アプリ設定
  app: {
    head: {
      title: 'ウマノコピア - 有馬記念観戦サービス',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '部内通貨コピアを使った有馬記念疑似賭博サービス' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap' }
      ]
    }
  },

  // 将来のNuxt 4に対応
  future: {
    compatibilityVersion: 4
  }
})
