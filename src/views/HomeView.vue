<template>
  <div class="min-h-screen flex flex-col items-center justify-between px-6 py-12 relative">
    <!-- 装饰背景 - 金币光晕 -->
    <div class="absolute top-[-20px] left-[-40px] w-48 h-48 rounded-full bg-gradient-to-br from-gold-300/30 to-gold-900/10 blur-xl pointer-events-none"></div>
    <div class="absolute top-[20%] right-[-20px] w-24 h-24 opacity-80 pointer-events-none">
      <div class="w-full h-full rounded-full bg-gradient-to-br from-gold-100 via-gold-500 to-gold-900 shadow-2xl flex items-center justify-center transform rotate-12">
        <div class="w-12 h-12 border-2 border-gold-900/50 rounded-sm transform rotate-45"></div>
      </div>
    </div>
    <div class="absolute bottom-[15%] left-[10%] w-32 h-32 opacity-40 blur-sm pointer-events-none">
      <div class="w-full h-full rounded-full bg-gradient-to-br from-gold-300 via-gold-700 to-gold-900 shadow-2xl flex items-center justify-center transform -rotate-12">
        <div class="w-16 h-16 border-2 border-gold-900/50 rounded-sm transform rotate-45"></div>
      </div>
    </div>
    <div class="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none"></div>

    <!-- Logo 区域 -->
    <div class="flex flex-col items-center mt-12 space-y-4">
      <div class="w-28 h-28 relative flex items-center justify-center mb-6">
        <!-- 光晕 -->
        <div class="absolute inset-0 bg-gold-500/10 blur-2xl rounded-full"></div>
        <!-- 宝石切割红桃 SVG -->
        <svg class="w-full h-full transform hover:scale-105 transition-transform duration-500" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5))">
          <defs>
            <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#d40000;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#660000;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FFF9C4" />
              <stop offset="50%" style="stop-color:#FFD700" />
              <stop offset="100%" style="stop-color:#F57F17" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <!-- 主红桃形状 -->
          <path d="M50 88 C50 88 12 65 12 35 C12 20 24 10 36 10 C44 10 48 15 50 20 C52 15 56 10 64 10 C76 10 88 20 88 35 C88 65 50 88 50 88 Z"
                fill="url(#heartGradient)" stroke="url(#goldStroke)" stroke-width="2"
                style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.25))" />
          <!-- 宝石切面 - 亮面 -->
          <path d="M50 35 L36 10 L12 35 L50 88 Z" fill="rgba(255,255,255,0.2)" opacity="0.3" style="mix-blend-mode: overlay" />
          <!-- 宝石切面 - 暗面 -->
          <path d="M50 35 L64 10 L88 35 L50 88 Z" fill="rgba(50,0,0,0.4)" opacity="0.4" style="mix-blend-mode: multiply" />
          <!-- 中心钻石切面 -->
          <path d="M50 20 L64 35 L50 55 L36 35 Z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,215,0,0.3)" stroke-width="0.5" />
          <!-- 高光点 -->
          <ellipse cx="30" cy="25" rx="8" ry="12" transform="rotate(-30 30 25)" fill="rgba(255,255,255,0.6)" opacity="0.4" style="filter: blur(1px)" />
          <circle cx="70" cy="25" r="3" fill="rgba(255,255,255,0.6)" opacity="0.3" style="filter: blur(1px)" />
          <!-- 金色棱线 -->
          <path d="M50 88 L12 35" fill="none" stroke="url(#goldStroke)" stroke-width="0.5" opacity="0.5" />
          <path d="M50 88 L88 35" fill="none" stroke="url(#goldStroke)" stroke-width="0.5" opacity="0.5" />
        </svg>
      </div>

      <div class="text-center space-y-1">
        <h1 class="font-black text-6xl tracking-wide gold-text-gradient drop-shadow-2xl">红桃三</h1>
        <p class="font-display text-sm font-medium text-gold-100/60 uppercase tracking-[0.2em] mt-3">春节快乐 • 阖家团圆</p>
      </div>
    </div>

    <!-- 恢复游戏卡片 -->
    <div v-if="resumeRoom" class="w-full max-w-sm mb-6 animate-fade-in-up">
      <div 
        @click="handleResume"
        class="glass-panel p-4 rounded-2xl flex items-center justify-between cursor-pointer border border-gold-500/30 hover:bg-gold-500/10 transition-colors"
      >
        <div class="flex items-center">
          <div class="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center mr-4">
            <span class="material-icons-round text-gold-500 text-2xl">sports_esports</span>
          </div>
          <div>
            <p class="text-gold-500 font-bold text-lg">回到游戏</p>
            <p class="text-white/40 text-xs">房间号 {{ resumeRoom.room_code }} · {{ resumeRoom.status === 'playing' ? '进行中' : '等待中' }}</p>
          </div>
        </div>
        <span class="material-icons-round text-white/40">chevron_right</span>
      </div>
    </div>

    <!-- 按钮区域 -->
    <div class="w-full max-w-sm flex flex-col space-y-5 mb-8">
      <!-- 创建房间 -->
      <button
        @click="$router.push('/create')"
        class="group relative w-full h-16 rounded-full primary-gold-btn flex items-center justify-center transition-all duration-300 transform active:scale-95 hover:brightness-110 shadow-[0_0_30px_rgba(255,215,0,0.2)]"
      >
        <div class="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <span class="material-icons-round text-bg-dark mr-2 text-2xl">add_circle</span>
        <span class="font-display font-bold text-xl text-bg-dark tracking-wider">创建房间</span>
      </button>

      <!-- 加入房间 -->
      <button
        @click="$router.push('/join')"
        class="w-full h-16 rounded-full secondary-glass-btn flex items-center justify-center transition-all duration-300 active:scale-95 hover:bg-white/10"
      >
        <span class="material-icons-round text-gold-300 mr-2 text-2xl">login</span>
        <span class="font-display font-bold text-xl text-gold-100 tracking-wider">加入房间</span>
      </button>
    </div>

    <!-- 底部入口 - 玻璃面板卡片 -->
    <div class="w-full max-w-sm grid grid-cols-2 gap-4">
      <button
        @click="$router.push('/history')"
        class="glass-panel h-24 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 hover:bg-white/5"
      >
        <span class="material-icons-round text-gold-300 mb-1 text-2xl">history</span>
        <span class="text-xs font-display text-white/70">历史记录</span>
      </button>
      <button
        @click="$router.push('/profile')"
        class="glass-panel h-24 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 hover:bg-white/5"
      >
        <span class="material-icons-round text-gold-300 mb-1 text-2xl">person</span>
        <span class="text-xs font-display text-white/70">个人中心</span>
      </button>
    </div>

    <!-- 底部版权 -->
    <p class="absolute bottom-4 text-center w-full text-[10px] text-white/20 font-display">v1.0 · 红桃三计分器</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const resumeRoom = ref(null)

function handleResume() {
  if (!resumeRoom.value) return
  if (resumeRoom.value.status === 'playing') {
    router.push(`/game/${resumeRoom.value.id}`)
  } else {
    router.push(`/lobby/${resumeRoom.value.id}`)
  }
}

onMounted(async () => {
  const saved = localStorage.getItem('currentRoom')
  if (saved) {
    try {
      const { id } = JSON.parse(saved)
      if (!id) return
      
      const { data, error } = await supabase
        .from('rooms')
        .select('id, room_code, status')
        .eq('id', id)
        .in('status', ['waiting', 'playing'])
        .single()
      
      if (!error && data) {
        resumeRoom.value = data
      } else {
        localStorage.removeItem('currentRoom')
      }
    } catch (e) {
      localStorage.removeItem('currentRoom')
    }
  }
})
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
