<template>
  <div class="min-h-screen pb-24">
    <!-- 顶部 -->
    <div class="px-6 pt-8 pb-4">
      <div class="flex items-center justify-between mb-6">
        <button @click="$router.push('/')" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
          <span class="material-icons-round text-white">arrow_back</span>
        </button>
        <h2 class="text-lg font-bold gold-text-gradient">计分面板</h2>
        <!-- 右上角菜单按钮 -->
        <div class="relative">
          <button @click="showMenu = !showMenu" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
            <span class="material-icons-round text-white/60">more_vert</span>
          </button>
          <!-- 下拉菜单 -->
          <div
            v-if="showMenu"
            class="absolute right-0 top-12 w-44 glass-card rounded-xl py-2 z-50 shadow-xl border border-white/10"
          >
            <template v-if="isHost">
              <button
                @click="handleEndGame"
                class="w-full px-4 py-3 flex items-center gap-2 text-sm text-red-400 hover:bg-white/5 transition"
              >
                <span class="material-icons-round text-lg">stop_circle</span>
                结束游戏
              </button>
              <button
                @click="handleTransferAndLeave"
                class="w-full px-4 py-3 flex items-center gap-2 text-sm text-white/70 hover:bg-white/5 transition"
              >
                <span class="material-icons-round text-lg">exit_to_app</span>
                退出并转交房主
              </button>
            </template>
            <template v-else>
              <button
                @click="handleLeaveGame"
                class="w-full px-4 py-3 flex items-center gap-2 text-sm text-red-400 hover:bg-white/5 transition"
              >
                <span class="material-icons-round text-lg">exit_to_app</span>
                退出房间
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="glass-card rounded-xl p-4 text-center">
          <p class="text-white/40 text-xs mb-1">总局数</p>
          <p class="text-2xl font-bold text-gold-500">{{ roomStore.currentRound }}</p>
        </div>
        <div class="glass-card rounded-xl p-4 text-center">
          <p class="text-white/40 text-xs mb-1">游戏时长</p>
          <p class="text-2xl font-bold text-gold-500">{{ elapsedMinutes }} 分钟</p>
        </div>
      </div>
    </div>

    <!-- 排行榜 -->
    <div class="px-6">
      <h3 class="text-white/60 text-sm font-medium mb-3 flex items-center">
        <span class="material-symbols-outlined mr-1 text-lg text-gold-500">leaderboard</span>
        排行榜
      </h3>
      <div class="space-y-3">
        <div
          v-for="(player, index) in roomStore.sortedPlayers"
          :key="player.id"
          :class="[
            'glass-card rounded-xl p-4 flex items-center transition-opacity',
            !player.is_active ? 'opacity-40' : ''
          ]"
        >
          <!-- 排名 -->
          <div :class="[
            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0',
            !player.is_active ? 'bg-white/5 text-white/30' :
            index === 0 ? 'bg-gold-500 text-bg-dark' :
            index === 1 ? 'bg-white/20 text-white' :
            index === 2 ? 'bg-amber-800/50 text-amber-200' :
            'bg-white/5 text-white/40'
          ]">
            {{ index + 1 }}
          </div>
          <!-- 头像 -->
          <div :class="[
            'w-10 h-10 flex items-center justify-center mr-3 flex-shrink-0 rounded-full overflow-hidden',
            player.is_active ? 'avatar-ring bg-bg-dark' : 'bg-white/5 grayscale'
          ]">
            <img
              v-if="player.profiles?.avatar_url?.startsWith('/avatars/')"
              :src="player.profiles.avatar_url"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-lg">👤</span>
          </div>
          <!-- 昵称 -->
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate flex items-center gap-1">
              {{ player.profiles?.nickname || '新玩家' }}
              <span v-if="!player.is_active" class="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">已离开</span>
            </p>
            <p class="text-white/30 text-xs">{{ getPlayerTrend(player) }}</p>
          </div>
          <!-- 分数 -->
          <p :class="[
            'text-xl font-bold ml-2',
            !player.is_active ? 'text-white/30' :
            player.current_score > 0 ? 'text-green-400' :
            player.current_score < 0 ? 'text-red-400' : 'text-white/40'
          ]">
            {{ player.current_score > 0 ? '+' : '' }}{{ player.current_score }}
          </p>
        </div>
      </div>
    </div>

    <!-- 浮动记分按钮 -->
    <div class="fixed bottom-8 left-0 right-0 px-6">
      <button
        @click="showScoreEntry = true"
        class="w-full h-14 rounded-full primary-gold-btn flex items-center justify-center shadow-lg shadow-gold-500/30"
      >
        <span class="material-icons-round text-bg-dark mr-2 text-2xl">edit_note</span>
        <span class="font-display font-bold text-lg text-bg-dark">记分</span>
      </button>
    </div>

    <!-- 录分弹窗（只传活跃玩家） -->
    <ScoreEntryModal
      v-if="showScoreEntry"
      :players="roomStore.activePlayers"
      @close="showScoreEntry = false"
      @confirm="handleScoreConfirm"
    />

    <!-- 转交房主弹窗 -->
    <div v-if="showTransfer" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6" @click.self="showTransfer = false">
      <div class="glass-card rounded-2xl p-6 w-full max-w-sm">
        <h3 class="text-white font-bold text-lg mb-4 text-center">选择新房主</h3>
        <div class="space-y-3 mb-4">
          <button
            v-for="player in otherActivePlayers"
            :key="player.id"
            @click="confirmTransfer(player.player_id)"
            class="w-full glass-panel rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition"
          >
            <div class="w-10 h-10 avatar-ring flex items-center justify-center bg-bg-dark overflow-hidden">
              <img
                v-if="player.profiles?.avatar_url?.startsWith('/avatars/')"
                :src="player.profiles.avatar_url"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-lg">👤</span>
            </div>
            <span class="text-white text-sm font-medium">{{ player.profiles?.nickname || '新玩家' }}</span>
          </button>
        </div>
        <button @click="showTransfer = false" class="w-full h-10 rounded-lg bg-white/5 text-white/50 text-sm">取消</button>
      </div>
    </div>

    <!-- 点击空白关闭菜单的遮罩 -->
    <div v-if="showMenu" class="fixed inset-0 z-40" @click="showMenu = false"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '../stores/room'
import { useAuthStore } from '../stores/auth'
import ScoreEntryModal from '../components/ScoreEntryModal.vue'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const authStore = useAuthStore()

const isHost = computed(() => roomStore.room?.host_id === authStore.userId)
const otherActivePlayers = computed(() =>
  roomStore.activePlayers.filter(p => p.player_id !== authStore.userId)
)

// 监听游戏结束（非房主自动跳转到结算页）
watch(() => roomStore.room?.status, (newStatus) => {
  if (newStatus === 'finished') {
    router.push(`/settlement/${route.params.roomId}`)
  }
})

const showScoreEntry = ref(false)
const showMenu = ref(false)
const showTransfer = ref(false)
const elapsedMinutes = ref(0)
let timer = null

function updateElapsed() {
  const startedAt = roomStore.room?.started_at || roomStore.room?.created_at
  if (startedAt) {
    const diff = Date.now() - new Date(startedAt).getTime()
    elapsedMinutes.value = Math.floor(diff / 60000)
  }
}

// 监听房间数据加载后立即计算时长
watch(() => roomStore.room?.started_at || roomStore.room?.created_at, (val) => {
  if (val) {
    updateElapsed()
    if (!timer) {
      timer = setInterval(updateElapsed, 60000)
    }
  }
}, { immediate: true })

function getPlayerTrend(player) {
  if (roomStore.rounds.length === 0) return '暂无数据'
  const lastRound = roomStore.rounds[roomStore.rounds.length - 1]
  const lastScore = lastRound?.scores?.[player.player_id]
  if (lastScore > 0) return `上局 +${lastScore}`
  if (lastScore < 0) return `上局 ${lastScore}`
  return '上局 ±0'
}

async function handleScoreConfirm(scores) {
  await roomStore.recordRound(scores)
  showScoreEntry.value = false
}

// 房主：结束游戏
async function handleEndGame() {
  showMenu.value = false
  if (confirm('确定要结束游戏吗？所有玩家将进入结算页面。')) {
    await roomStore.endGame()
    router.push(`/settlement/${route.params.roomId}`)
  }
}

// 房主：退出并转交房主
function handleTransferAndLeave() {
  showMenu.value = false
  if (otherActivePlayers.value.length === 0) {
    alert('没有其他活跃玩家可以接管房主')
    return
  }
  showTransfer.value = true
}

async function confirmTransfer(newHostId) {
  await roomStore.transferHost(newHostId)
  showTransfer.value = false
  roomStore.reset()
  router.push('/')
}

// 普通成员：退出房间
async function handleLeaveGame() {
  showMenu.value = false
  if (confirm('退出后你的分数将被锁定，你可以稍后重新加入继续游戏。确定退出吗？')) {
    await roomStore.leaveGame()
    roomStore.reset()
    router.push('/')
  }
}

// 浏览器关闭/刷新时自动标记不活跃
function onBeforeUnload() {
  if (roomStore.room) {
    const authStore2 = useAuthStore()
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    // 标记自己为不活跃
    const leaveUrl = `${supabaseUrl}/rest/v1/room_players?room_id=eq.${roomStore.room.id}&player_id=eq.${authStore2.userId}`
    fetch(leaveUrl, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ is_active: false }),
      keepalive: true,
    }).catch(() => {})

    // 如果自己是最后一个活跃玩家，关闭房间
    const remainingActive = roomStore.activePlayers.filter(p => p.player_id !== authStore2.userId)
    if (remainingActive.length === 0) {
      const finishUrl = `${supabaseUrl}/rest/v1/rooms?id=eq.${roomStore.room.id}`
      fetch(finishUrl, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ status: 'finished' }),
        keepalive: true,
      }).catch(() => {})
    }
  }
}

onMounted(() => {
  roomStore.loadRoom(route.params.roomId)
  roomStore.subscribeToRoom(route.params.roomId)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>
