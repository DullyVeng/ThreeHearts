<template>
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center" @click.self="$emit('close')">
    <div class="w-full max-w-lg bg-bg-dark rounded-t-2xl border-t border-gold-500/20 p-6 pb-8 max-h-[80vh] overflow-y-auto">
      <!-- 标题 -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-bold gold-text-gradient">第 {{ roundNumber }} 局录分</h3>
        <button @click="$emit('close')" class="w-8 h-8 rounded-full glass-panel flex items-center justify-center">
          <span class="material-icons-round text-white/60 text-lg">close</span>
        </button>
      </div>

      <!-- 玩家分数列表 -->
      <div class="space-y-4 mb-6">
        <div v-for="player in players" :key="player.id" class="glass-card rounded-xl p-4">
          <div class="flex items-center justify-between">
            <!-- 玩家信息 -->
            <div class="flex items-center">
              <div class="w-10 h-10 avatar-ring flex items-center justify-center bg-bg-dark text-lg mr-3 flex-shrink-0">
                🎴
              </div>
              <p class="text-white text-sm font-medium">{{ player.profiles?.nickname || '新玩家' }}</p>
            </div>

            <!-- 分数调整 -->
            <div class="flex items-center gap-2">
              <button
                @click="adjustScore(player.player_id, -getStep())"
                class="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-red-400 hover:bg-red-500/20 active:scale-90 transition-all"
              >
                <span class="material-icons-round text-lg">remove</span>
              </button>
              <span :class="[
                'w-16 text-center text-xl font-bold tabular-nums',
                scores[player.player_id] > 0 ? 'text-green-400' :
                scores[player.player_id] < 0 ? 'text-red-400' : 'text-white/40'
              ]">
                {{ scores[player.player_id] > 0 ? '+' : '' }}{{ scores[player.player_id] || 0 }}
              </span>
              <button
                @click="adjustScore(player.player_id, getStep())"
                class="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-green-400 hover:bg-green-500/20 active:scale-90 transition-all"
              >
                <span class="material-icons-round text-lg">add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 校验行：分数总和 -->
      <div class="glass-panel rounded-lg p-3 mb-6 flex items-center justify-between">
        <span class="text-white/40 text-sm">分数总和</span>
        <span :class="[
          'font-bold',
          totalScore === 0 ? 'text-green-400' : 'text-red-400'
        ]">
          {{ totalScore === 0 ? '✓ 平衡' : totalScore }}
        </span>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3">
        <button
          @click="resetScores"
          class="flex-1 h-12 rounded-full secondary-glass-btn flex items-center justify-center"
        >
          <span class="text-white/60 font-medium">重置</span>
        </button>
        <button
          @click="handleConfirm"
          :disabled="totalScore !== 0"
          class="flex-[2] h-12 rounded-full primary-gold-btn flex items-center justify-center disabled:opacity-40"
        >
          <span class="font-display font-bold text-bg-dark">确认录入</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRoomStore } from '../stores/room'

const props = defineProps({
  players: { type: Array, required: true },
})

const emit = defineEmits(['close', 'confirm'])
const roomStore = useRoomStore()

const scores = reactive({})
props.players.forEach(p => { scores[p.player_id] = 0 })

const roundNumber = computed(() => roomStore.currentRound + 1)
const totalScore = computed(() => Object.values(scores).reduce((sum, v) => sum + v, 0))

function getStep() {
  return roomStore.room?.base_multiplier || 1
}

function adjustScore(playerId, amount) {
  scores[playerId] = (scores[playerId] || 0) + amount
}

function resetScores() {
  props.players.forEach(p => { scores[p.player_id] = 0 })
}

function handleConfirm() {
  if (totalScore.value !== 0) return
  emit('confirm', { ...scores })
}
</script>
