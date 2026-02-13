<template>
  <div class="min-h-screen px-6 py-8">
    <!-- 顶部 -->
    <div class="flex items-center justify-between mb-6">
      <button @click="$router.push('/')" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
        <span class="material-icons-round text-white">arrow_back</span>
      </button>
      <h2 class="text-lg font-bold gold-text-gradient">历史记录</h2>
      <div class="w-10"></div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && groupedMatches.length === 0" class="flex flex-col items-center justify-center mt-20 text-center">
      <span class="text-6xl mb-4 opacity-30">🎴</span>
      <p class="text-white/40 text-sm">还没有对局记录</p>
      <p class="text-white/20 text-xs mt-1">快去创建或加入一个房间吧</p>
    </div>

    <!-- 对局列表 -->
    <div v-else class="space-y-4">
      <div
        v-for="match in groupedMatches"
        :key="match.id"
        @click="openDetail(match)"
        class="glass-card rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <span :class="[
              'text-xs font-bold px-2 py-0.5 rounded mr-2',
              match.is_winner ? 'badge-win' : 'badge-lose'
            ]">
              {{ match.is_winner ? '胜' : '负' }}
            </span>
            <span class="text-white/40 text-xs">{{ formatDate(match.finished_at) }}</span>
          </div>
          <span :class="[
            'font-bold text-sm',
            match.final_score > 0 ? 'text-green-400' :
            match.final_score < 0 ? 'text-red-400' : 'text-white/40'
          ]">
            {{ match.final_score > 0 ? '+' : '' }}{{ match.final_score }}
          </span>
        </div>
        <!-- 房间号 + 查看提示 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center text-white/30 text-xs">
            <span class="material-symbols-outlined text-sm mr-1">meeting_room</span>
            房间 {{ match.rooms?.room_code || '---' }}
          </div>
          <span class="text-white/20 text-xs flex items-center">
            查看详情
            <span class="material-icons-round text-sm ml-0.5">chevron_right</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div
      v-if="showDetail"
      class="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      @click.self="showDetail = false"
    >
      <div class="w-full max-w-lg glass-card rounded-t-2xl p-6 pb-8 animate-slide-up">
        <!-- 标题 -->
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-white font-bold text-lg">对局详情</h3>
          <button @click="showDetail = false" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span class="material-icons-round text-white/60 text-lg">close</span>
          </button>
        </div>

        <!-- 信息卡片 -->
        <div class="grid grid-cols-3 gap-3 mb-5">
          <div class="glass-panel rounded-xl p-3 text-center">
            <p class="text-white/40 text-[10px] mb-0.5">房间号</p>
            <p class="text-gold-500 font-bold text-sm">{{ selectedMatch?.rooms?.room_code || '---' }}</p>
          </div>
          <div class="glass-panel rounded-xl p-3 text-center">
            <p class="text-white/40 text-[10px] mb-0.5">日期</p>
            <p class="text-white font-bold text-sm">{{ formatDate(selectedMatch?.finished_at) }}</p>
          </div>
          <div class="glass-panel rounded-xl p-3 text-center">
            <p class="text-white/40 text-[10px] mb-0.5">总局数</p>
            <p class="text-white font-bold text-sm">{{ detailRoundCount }}</p>
          </div>
        </div>

        <!-- 玩家排行 -->
        <div class="space-y-2">
          <div
            v-for="(player, index) in detailPlayers"
            :key="player.player_id"
            :class="[
              'glass-panel rounded-xl px-4 py-3 flex items-center',
              player.player_id === authStore.userId ? 'border border-gold-500/30' : ''
            ]"
          >
            <!-- 排名 icon -->
            <div :class="[
              'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0',
              index === 0 ? 'bg-gold-500 text-bg-dark' :
              index === 1 ? 'bg-white/20 text-white' :
              index === 2 ? 'bg-amber-800/50 text-amber-200' :
              'bg-white/5 text-white/40'
            ]">
              {{ index + 1 }}
            </div>
            <!-- 头像 -->
            <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
              <img
                v-if="player.profiles?.avatar_url?.startsWith('/avatars/')"
                :src="player.profiles.avatar_url"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-sm">👤</span>
            </div>
            <!-- 昵称 -->
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">
                {{ player.profiles?.nickname || '玩家' }}
                <span v-if="player.player_id === authStore.userId" class="text-[10px] text-gold-500 ml-1">我</span>
              </p>
            </div>
            <!-- 分数 -->
            <p :class="[
              'text-lg font-bold ml-2',
              player.final_score > 0 ? 'text-green-400' :
              player.final_score < 0 ? 'text-red-400' : 'text-white/40'
            ]">
              {{ player.final_score > 0 ? '+' : '' }}{{ player.final_score }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const loading = ref(true)
const groupedMatches = ref([])
const showDetail = ref(false)
const selectedMatch = ref(null)
const detailPlayers = ref([])
const detailRoundCount = ref(0)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function openDetail(match) {
  selectedMatch.value = match
  showDetail.value = true
  detailPlayers.value = []
  detailRoundCount.value = 0

  // 查询该房间所有玩家的成绩
  const { data: allMatches } = await supabase
    .from('matches')
    .select('*, profiles:player_id(nickname, avatar_url)')
    .eq('room_id', match.room_id)
    .order('final_score', { ascending: false })

  if (allMatches) {
    detailPlayers.value = allMatches
  }

  // 查询总局数
  const { count } = await supabase
    .from('rounds')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', match.room_id)

  detailRoundCount.value = count || 0
}

onMounted(async () => {
  loading.value = true
  if (!authStore.userId) {
    loading.value = false
    return
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*, rooms(room_code)')
    .eq('player_id', authStore.userId)
    .order('finished_at', { ascending: false })
    .limit(30)

  if (!error && data) {
    groupedMatches.value = data
  }
  loading.value = false
})
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
