<template>
  <div class="min-h-screen pb-24">
    <!-- 顶部 -->
    <div class="px-6 pt-8 pb-4">
      <div class="flex items-center justify-between mb-6">
        <button @click="$router.push('/')" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
          <span class="material-icons-round text-white">arrow_back</span>
        </button>
        <h2 class="text-lg font-bold gold-text-gradient">计分面板</h2>
        <button @click="handleEndGame" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
          <span class="material-symbols-outlined text-red-400">stop_circle</span>
        </button>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="glass-card rounded-xl p-4 text-center">
          <p class="text-white/40 text-xs mb-1">总局数</p>
          <p class="text-2xl font-bold text-gold-500">{{ roomStore.currentRound }}</p>
        </div>
        <div class="glass-card rounded-xl p-4 text-center">
          <p class="text-white/40 text-xs mb-1">游戏时长</p>
          <p class="text-2xl font-bold text-gold-500">{{ formatTime(elapsed) }}</p>
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
          class="glass-card rounded-xl p-4 flex items-center"
        >
          <!-- 排名 -->
          <div :class="[
            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0',
            index === 0 ? 'bg-gold-500 text-bg-dark' :
            index === 1 ? 'bg-white/20 text-white' :
            index === 2 ? 'bg-amber-800/50 text-amber-200' :
            'bg-white/5 text-white/40'
          ]">
            {{ index + 1 }}
          </div>
          <!-- 头像 -->
          <div class="w-10 h-10 avatar-ring flex items-center justify-center bg-bg-dark text-lg mr-3 flex-shrink-0">
            {{ player.profiles?.avatar_url === '/avatars/default.png' ? '🎴' : '👤' }}
          </div>
          <!-- 昵称 -->
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate">{{ player.profiles?.nickname || '新玩家' }}</p>
            <p class="text-white/30 text-xs">{{ getPlayerTrend(player) }}</p>
          </div>
          <!-- 分数 -->
          <p :class="[
            'text-xl font-bold ml-2',
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

    <!-- 录分弹窗 -->
    <ScoreEntryModal
      v-if="showScoreEntry"
      :players="roomStore.players"
      @close="showScoreEntry = false"
      @confirm="handleScoreConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '../stores/room'
import ScoreEntryModal from '../components/ScoreEntryModal.vue'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const showScoreEntry = ref(false)
const elapsed = ref(0)
let timer = null

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

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

async function handleEndGame() {
  if (confirm('确定要结束游戏吗？')) {
    await roomStore.endGame()
    router.push(`/settlement/${route.params.roomId}`)
  }
}

onMounted(() => {
  roomStore.loadRoom(route.params.roomId)
  roomStore.subscribeToRoom(route.params.roomId)
  timer = setInterval(() => elapsed.value++, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>
