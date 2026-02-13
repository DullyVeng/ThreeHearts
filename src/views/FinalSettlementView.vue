<template>
  <div class="min-h-screen px-6 py-8 flex flex-col items-center justify-center relative overflow-hidden">
    <!-- 装饰浮动元素 -->
    <div class="absolute top-10 left-8 text-4xl opacity-20 animate-float">🃏</div>
    <div class="absolute top-20 right-10 text-3xl opacity-20 animate-float" style="animation-delay: 1s">💰</div>
    <div class="absolute bottom-32 left-12 text-5xl opacity-15 animate-float" style="animation-delay: 3s">🧧</div>
    <div class="absolute bottom-20 right-8 text-3xl opacity-15 animate-float" style="animation-delay: 2s">🎴</div>

    <!-- 标题 -->
    <div class="text-center mb-8">
      <p class="text-white/40 text-sm tracking-widest mb-2">🎊 恭喜 🎊</p>
      <h1 class="text-4xl font-black text-3d-gold tracking-wider">大赢家</h1>
    </div>

    <!-- 冠军卡片 -->
    <div v-if="winner" class="glass-card rounded-2xl p-8 text-center mb-8 w-full max-w-xs relative">
      <div class="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl">👑</div>
      <div class="w-20 h-20 avatar-ring mx-auto mb-4 flex items-center justify-center bg-bg-dark text-3xl">
        🏆
      </div>
      <h2 class="text-xl font-bold text-white mb-1">{{ winner.profiles?.nickname || '新玩家' }}</h2>
      <p class="text-3xl font-black text-gold-500 mt-2">
        {{ winner.current_score > 0 ? '+' : '' }}{{ winner.current_score }}
      </p>
      <p class="text-white/40 text-xs mt-2">总得分</p>
    </div>

    <!-- 其他玩家 -->
    <div class="w-full max-w-xs space-y-2 mb-8">
      <div
        v-for="(player, index) in otherPlayers"
        :key="player.id"
        class="glass-panel rounded-xl p-3 flex items-center"
      >
        <span class="text-white/40 text-sm w-6">{{ index + 2 }}</span>
        <div class="w-8 h-8 rounded-full bg-bg-dark border border-white/10 flex items-center justify-center text-sm mr-2">👤</div>
        <span class="text-white text-sm flex-1">{{ player.profiles?.nickname || '新玩家' }}</span>
        <span :class="[
          'font-bold text-sm',
          player.current_score > 0 ? 'text-green-400' :
          player.current_score < 0 ? 'text-red-400' : 'text-white/40'
        ]">
          {{ player.current_score > 0 ? '+' : '' }}{{ player.current_score }}
        </span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="w-full max-w-xs space-y-3">
      <button
        @click="$router.push('/')"
        class="w-full h-12 rounded-full primary-gold-btn flex items-center justify-center"
      >
        <span class="material-icons-round text-bg-dark mr-2">home</span>
        <span class="font-bold text-bg-dark">返回首页</span>
      </button>
      <button
        @click="$router.push('/history')"
        class="w-full h-12 rounded-full secondary-glass-btn flex items-center justify-center"
      >
        <span class="text-gold-500 font-medium">查看历史</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRoomStore } from '../stores/room'

const route = useRoute()
const roomStore = useRoomStore()

const winner = computed(() => roomStore.sortedPlayers[0])
const otherPlayers = computed(() => roomStore.sortedPlayers.slice(1))

onMounted(() => {
  if (!roomStore.room) {
    roomStore.loadRoom(route.params.roomId)
  }
})
</script>
