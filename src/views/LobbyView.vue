<template>
  <div class="min-h-screen px-6 py-8">
    <!-- 顶部导航 -->
    <div class="flex items-center justify-between mb-6">
      <button @click="handleLeave" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
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
          'rounded-xl p-4 flex flex-col items-center justify-center min-h-[140px] transition-all relative',
          getPlayerAtSeat(seat - 1) ? 'glass-card' : 'border-2 border-dashed border-white/10 rounded-xl'
        ]"
      >
        <template v-if="getPlayerAtSeat(seat - 1)">
          <!-- 房主踢人按钮 -->
          <button
            v-if="isHost && getPlayerAtSeat(seat - 1).player_id !== authStore.userId"
            @click="handleKick(getPlayerAtSeat(seat - 1).player_id)"
            class="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-colors"
            title="踢出玩家"
          >
            <span class="material-icons-round text-red-400 text-sm">close</span>
          </button>
          <!-- 房主标识 -->
          <div
            v-if="getPlayerAtSeat(seat - 1).player_id === roomStore.room?.host_id"
            class="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-500 font-bold"
          >
            房主
          </div>
          <div class="w-14 h-14 avatar-ring mb-2 flex items-center justify-center bg-bg-dark overflow-hidden">
            <img
              v-if="getPlayerAtSeat(seat - 1).profiles?.avatar_url?.startsWith('/avatars/')"
              :src="getPlayerAtSeat(seat - 1).profiles.avatar_url"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-2xl">👤</span>
          </div>
          <p class="text-white text-sm font-medium truncate max-w-full">
            {{ getPlayerAtSeat(seat - 1).profiles?.nickname || '新玩家' }}
          </p>
          <span :class="[
            'text-xs mt-1 px-2 py-0.5 rounded-full',
            getPlayerAtSeat(seat - 1).player_id === roomStore.room?.host_id
              ? 'bg-gold-500/20 text-gold-500'
              : getPlayerAtSeat(seat - 1).is_ready
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/10 text-white/40'
          ]">
            {{ getPlayerAtSeat(seat - 1).player_id === roomStore.room?.host_id
                ? '房主'
                : getPlayerAtSeat(seat - 1).is_ready ? '已准备' : '等待中' }}
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
    <button @click="copyInviteLink" class="w-full h-12 rounded-xl secondary-glass-btn flex items-center justify-center mb-4">
      <span class="material-icons-round text-gold-500 mr-2">{{ copied ? 'check' : 'share' }}</span>
      <span class="text-gold-500 text-sm font-medium">{{ copied ? '链接已复制' : '分享邀请链接' }}</span>
    </button>

    <!-- 开始游戏 / 准备 -->
    <button
      v-if="isHost"
      @click="handleStartGame"
      :disabled="!allReady"
      class="w-full h-14 rounded-full primary-gold-btn flex items-center justify-center disabled:opacity-40"
    >
      <span class="material-icons-round text-bg-dark mr-2 text-2xl">play_arrow</span>
      <span class="font-display font-bold text-lg text-bg-dark">开始游戏</span>
    </button>
    <p v-if="isHost && !allReady" class="text-center text-white/40 text-xs mt-2">
      {{ roomStore.players.length < 2 ? '至少需要2名玩家' : `还有 ${notReadyCount} 名玩家未准备` }}
    </p>
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
const otherPlayers = computed(() => roomStore.players.filter(p => p.player_id !== authStore.userId))
const notReadyCount = computed(() => otherPlayers.value.filter(p => !p.is_ready).length)
const allReady = computed(() => roomStore.players.length >= 2 && notReadyCount.value === 0)

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

function copyInviteLink() {
  if (roomStore.roomCode) {
    const url = `${window.location.origin}/join?code=${roomStore.roomCode}`
    navigator.clipboard?.writeText(url)
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

// 踢人
async function handleKick(playerId) {
  if (confirm('确定要踢出该玩家吗？')) {
    await roomStore.kickPlayer(playerId)
  }
}

// 离开房间
async function handleLeave() {
  if (isHost.value) {
    // 房主离开需要确认
    if (confirm('确定要退出房间吗？这将踢掉房间内所有成员并关闭房间。')) {
      await roomStore.disbandRoom()
      roomStore.reset()
      router.push('/')
    }
  } else {
    await roomStore.leaveRoom()
    roomStore.reset()
    router.push('/')
  }
}

// 浏览器关闭/刷新时自动离开房间（非房主）
function onBeforeUnload() {
  if (!isHost.value && roomStore.room) {
    // 使用 sendBeacon 确保请求不会被取消
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/room_players?room_id=eq.${roomStore.room.id}&player_id=eq.${authStore.userId}`
    navigator.sendBeacon && fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${supabase.auth.session?.()?.access_token || ''}`,
      },
      keepalive: true,
    }).catch(() => {})
  }
}

// 监听被踢出（自己在 players 列表中消失了）
const hasJoined = ref(false)
watch(() => roomStore.players, (newPlayers) => {
  // 标记已加入（首次加载到包含自己的数据后）
  if (!hasJoined.value && newPlayers.some(p => p.player_id === authStore.userId)) {
    hasJoined.value = true
    return
  }
  // 已加入后如果不在列表中了，说明被踢了
  if (hasJoined.value && roomStore.room && newPlayers.length > 0) {
    const stillInRoom = newPlayers.some(p => p.player_id === authStore.userId)
    if (!stillInRoom) {
      alert('你已被房主踢出房间')
      roomStore.reset()
      router.push('/')
    }
  }
}, { deep: true })

// 监听游戏开始（非房主自动跳转）
watch(() => roomStore.room?.status, (newStatus) => {
  if (newStatus === 'playing') {
    router.push(`/game/${route.params.roomId}`)
  }
})

onMounted(() => {
  roomStore.loadRoom(route.params.roomId)
  roomStore.subscribeToRoom(route.params.roomId)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>
