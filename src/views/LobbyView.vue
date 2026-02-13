<template>
  <div class="min-h-screen px-6 py-8">
    <!-- 顶部导航 -->
    <div class="flex items-center justify-between mb-6">
      <button @click="$router.push('/')" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
        <span class="material-icons-round text-white">arrow_back</span>
      </button>
      <h2 class="text-lg font-bold gold-text-gradient">等待大厅</h2>
      <button class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
        <span class="material-symbols-outlined text-white/60">settings</span>
      </button>
    </div>

    <!-- 房间号卡片 -->
    <div class="glass-card rounded-xl p-4 mb-6 flex items-center justify-between">
      <div>
        <p class="text-white/40 text-xs mb-1">房间号</p>
        <p class="text-3xl font-black text-gold-500 tracking-[0.3em]">{{ roomStore.roomCode || '----' }}</p>
      </div>
      <button
        @click="copyRoomCode"
        class="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition"
      >
        <span class="material-icons-round text-gold-500 text-xl">
          {{ copied ? 'check' : 'content_copy' }}
        </span>
      </button>
    </div>

    <!-- 玩家网格 (2x2) -->
    <div class="grid grid-cols-2 gap-4 mb-8">
      <div
        v-for="seat in 4"
        :key="seat"
        :class="[
          'rounded-xl p-4 flex flex-col items-center justify-center min-h-[140px] transition-all',
          getPlayerAtSeat(seat - 1) ? 'glass-card' : 'border-2 border-dashed border-white/10 rounded-xl'
        ]"
      >
        <template v-if="getPlayerAtSeat(seat - 1)">
          <div class="w-14 h-14 avatar-ring mb-2 flex items-center justify-center bg-bg-dark text-2xl">
            {{ getPlayerAtSeat(seat - 1).profiles?.avatar_url === '/avatars/default.png' ? '🎴' : '👤' }}
          </div>
          <p class="text-white text-sm font-medium truncate max-w-full">
            {{ getPlayerAtSeat(seat - 1).profiles?.nickname || '新玩家' }}
          </p>
          <span :class="[
            'text-xs mt-1 px-2 py-0.5 rounded-full',
            getPlayerAtSeat(seat - 1).is_ready ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
          ]">
            {{ getPlayerAtSeat(seat - 1).is_ready ? '已准备' : '等待中' }}
          </span>
        </template>
        <template v-else>
          <div class="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-2">
            <span class="material-icons-round text-white/20 text-2xl">person_add</span>
          </div>
          <p class="text-white/20 text-sm">空位</p>
        </template>
      </div>
    </div>

    <!-- 分享邀请 -->
    <button @click="copyRoomCode" class="w-full h-12 rounded-xl secondary-glass-btn flex items-center justify-center mb-4">
      <span class="material-icons-round text-gold-500 mr-2">share</span>
      <span class="text-gold-500 text-sm font-medium">分享邀请链接</span>
    </button>

    <!-- 开始游戏 / 准备 -->
    <button
      v-if="isHost"
      @click="handleStartGame"
      :disabled="roomStore.players.length < 2"
      class="w-full h-14 rounded-full primary-gold-btn flex items-center justify-center disabled:opacity-40"
    >
      <span class="material-icons-round text-bg-dark mr-2 text-2xl">play_arrow</span>
      <span class="font-display font-bold text-lg text-bg-dark">开始游戏</span>
    </button>
    <button
      v-else
      @click="toggleReady"
      class="w-full h-14 rounded-full primary-gold-btn flex items-center justify-center"
    >
      <span class="font-display font-bold text-lg text-bg-dark">
        {{ myPlayer?.is_ready ? '取消准备' : '准备' }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '../stores/room'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const authStore = useAuthStore()
const copied = ref(false)

const isHost = computed(() => roomStore.room?.host_id === authStore.userId)
const myPlayer = computed(() => roomStore.players.find(p => p.player_id === authStore.userId))

function getPlayerAtSeat(seatIndex) {
  return roomStore.players.find(p => p.seat_index === seatIndex)
}

function copyRoomCode() {
  if (roomStore.roomCode) {
    navigator.clipboard?.writeText(roomStore.roomCode)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

async function toggleReady() {
  if (!myPlayer.value) return
  await supabase
    .from('room_players')
    .update({ is_ready: !myPlayer.value.is_ready })
    .eq('id', myPlayer.value.id)
}

async function handleStartGame() {
  await roomStore.startGame()
  router.push(`/game/${route.params.roomId}`)
}

// 监听游戏开始（非房主自动跳转）
watch(() => roomStore.room?.status, (newStatus) => {
  if (newStatus === 'playing') {
    router.push(`/game/${route.params.roomId}`)
  }
})

onMounted(() => {
  roomStore.loadRoom(route.params.roomId)
  roomStore.subscribeToRoom(route.params.roomId)
})

onUnmounted(() => {
  // 不取消订阅，因为可能要跳去game页
})
</script>
