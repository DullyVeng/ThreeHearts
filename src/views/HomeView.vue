<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
    <!-- 装饰背景 -->
    <div class="absolute top-10 right-10 text-6xl opacity-10 animate-float">🏮</div>
    <div class="absolute bottom-20 left-8 text-5xl opacity-10 animate-float" style="animation-delay: 2s">🧧</div>
    <div class="absolute top-1/4 left-6 text-4xl opacity-10 animate-float" style="animation-delay: 4s">🎴</div>

    <!-- Logo 区域 -->
    <div class="text-center mb-10 animate-float">
      <!-- 红桃 SVG -->
      <div class="mx-auto mb-4 relative">
        <svg width="80" height="80" viewBox="0 0 100 100" class="mx-auto drop-shadow-lg">
          <defs>
            <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#ff4d55" />
              <stop offset="100%" style="stop-color:#f4252f" />
            </linearGradient>
          </defs>
          <path d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C40 5 48 12 50 18 C52 12 60 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z" fill="url(#heartGrad)" />
          <text x="50" y="55" text-anchor="middle" fill="white" font-size="28" font-weight="bold">3</text>
        </svg>
      </div>

      <h1 class="text-5xl font-black text-3d-gold tracking-wider mb-2">红桃三</h1>
      <p class="text-gold-500/60 text-sm tracking-widest">春节快乐 · 恭喜发财</p>
    </div>

    <!-- 按钮区域 -->
    <div class="w-full max-w-sm space-y-4">
      <!-- 创建房间 -->
      <button
        @click="$router.push('/create')"
        class="group relative w-full h-14 rounded-full primary-gold-btn flex items-center justify-center"
      >
        <span class="material-icons-round text-bg-dark mr-2 text-2xl">add_circle</span>
        <span class="font-display font-bold text-lg text-bg-dark tracking-wider">创建房间</span>
      </button>

      <!-- 加入房间 -->
      <button
        @click="$router.push('/join')"
        class="group relative w-full h-14 rounded-full secondary-glass-btn flex items-center justify-center"
      >
        <span class="material-icons-round text-gold-500 mr-2 text-2xl">login</span>
        <span class="font-display font-bold text-lg text-gold-500 tracking-wider">加入房间</span>
      </button>
    </div>

    <!-- 底部入口 -->
    <div class="flex gap-8 mt-12">
      <button @click="$router.push('/history')" class="flex flex-col items-center gap-1 text-white/40 hover:text-gold-500 transition-colors">
        <span class="material-symbols-outlined text-2xl">history</span>
        <span class="text-xs">历史记录</span>
      </button>
      <button @click="$router.push('/profile')" class="flex flex-col items-center gap-1 text-white/40 hover:text-gold-500 transition-colors">
        <span class="material-symbols-outlined text-2xl">person</span>
        <span class="text-xs">个人中心</span>
      </button>
    </div>

    <!-- 底部版权 -->
    <p class="absolute bottom-6 text-white/20 text-xs">v1.0 · 红桃三计分器</p>
  </div>
</template>

<script setup>
// Home page — no special logic needed
</script>
