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
    <div v-if="!loading && matches.length === 0" class="flex flex-col items-center justify-center mt-20 text-center">
      <span class="text-6xl mb-4 opacity-30">🎴</span>
      <p class="text-white/40 text-sm">还没有对局记录</p>
      <p class="text-white/20 text-xs mt-1">快去创建或加入一个房间吧</p>
    </div>

    <!-- 对局列表 -->
    <div v-else class="space-y-4">
      <div
        v-for="match in groupedMatches"
        :key="match.room_id"
        class="glass-card rounded-xl p-4"
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
        <!-- 房间号 -->
        <div class="flex items-center text-white/30 text-xs">
          <span class="material-symbols-outlined text-sm mr-1">meeting_room</span>
          房间 {{ match.rooms?.room_code || '---' }}
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
const matches = ref([])
const loading = ref(true)

const groupedMatches = ref([])

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
