<template>
  <div class="min-h-screen px-6 py-8">
    <!-- 顶部导航 -->
    <div class="flex items-center mb-8">
      <button @click="$router.back()" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
        <span class="material-icons-round text-white">arrow_back</span>
      </button>
      <h2 class="ml-4 text-xl font-bold gold-text-gradient">创建房间</h2>
    </div>

    <!-- 基础规则 -->
    <div class="glass-card rounded-xl p-6 mb-6">
      <h3 class="text-gold-500 font-bold text-sm uppercase tracking-wider mb-5 flex items-center">
        <span class="material-symbols-outlined mr-2 text-lg">tune</span>
        基础规则
      </h3>

      <!-- 初始分数 -->
      <div class="mb-6">
        <label class="text-white/60 text-sm mb-3 block">初始分数</label>
        <div class="flex gap-3">
          <button
            v-for="score in [100, 200, 500]"
            :key="score"
            @click="settings.initialScore = score"
            :class="[
              'flex-1 h-11 rounded-lg font-bold text-sm transition-all',
              settings.initialScore === score
                ? 'primary-gold-btn text-bg-dark'
                : 'glass-panel text-white/60 hover:text-white'
            ]"
          >
            {{ score }}
          </button>
        </div>
      </div>

      <!-- 底分倍率 -->
      <div>
        <div class="flex justify-between items-center mb-3">
          <label class="text-white/60 text-sm">底分倍率</label>
          <span class="text-gold-500 font-bold text-lg">x{{ settings.baseMultiplier }}</span>
        </div>
        <input
          type="range"
          v-model.number="settings.baseMultiplier"
          min="1"
          max="10"
          step="1"
          class="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-500
                 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-gold-500/30"
        />
        <div class="flex justify-between text-xs text-white/30 mt-1">
          <span>x1</span>
          <span>x10</span>
        </div>
      </div>
    </div>

    <!-- 高级设置 -->
    <div class="glass-card rounded-xl p-6 mb-8">
      <h3 class="text-gold-500 font-bold text-sm uppercase tracking-wider mb-5 flex items-center">
        <span class="material-symbols-outlined mr-2 text-lg">settings</span>
        高级限制
      </h3>

      <!-- 封顶分数 -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <p class="text-white text-sm font-medium">封顶分数</p>
          <p class="text-white/40 text-xs mt-0.5">启用后单局最高不超过限制</p>
        </div>
        <button
          @click="settings.scoreCap = !settings.scoreCap"
          :class="[
            'relative w-12 h-7 rounded-full transition-all duration-300',
            settings.scoreCap ? 'bg-gold-500' : 'bg-white/20'
          ]"
        >
          <div
            :class="[
              'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300',
              settings.scoreCap ? 'left-6' : 'left-1'
            ]"
          ></div>
        </button>
      </div>

      <!-- 支付方式 -->
      <div>
        <p class="text-white text-sm font-medium mb-3">支付方式</p>
        <div class="flex gap-3">
          <button
            v-for="mode in [{ key: 'host', label: '房主支付' }, { key: 'aa', label: 'AA制' }]"
            :key="mode.key"
            @click="settings.paymentMode = mode.key"
            :class="[
              'flex-1 h-10 rounded-lg text-sm font-medium transition-all',
              settings.paymentMode === mode.key
                ? 'primary-gold-btn text-bg-dark'
                : 'glass-panel text-white/60'
            ]"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 确认创建按钮 -->
    <button
      @click="handleCreate"
      :disabled="creating"
      class="w-full h-14 rounded-full primary-gold-btn flex items-center justify-center disabled:opacity-50"
    >
      <span class="material-icons-round text-bg-dark mr-2 text-2xl">check_circle</span>
      <span class="font-display font-bold text-lg text-bg-dark">
        {{ creating ? '创建中...' : '确认创建' }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '../stores/room'

const router = useRouter()
const roomStore = useRoomStore()
const creating = ref(false)

const settings = reactive({
  initialScore: 100,
  baseMultiplier: 1,
  scoreCap: false,
  paymentMode: 'host',
})

async function handleCreate() {
  creating.value = true
  const room = await roomStore.createRoom(settings)
  creating.value = false
  if (room) {
    router.push(`/lobby/${room.id}`)
  }
}
</script>
