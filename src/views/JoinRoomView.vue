<template>
  <div class="min-h-screen px-6 py-8 flex flex-col">
    <!-- 顶部导航 -->
    <div class="flex items-center mb-8">
      <button @click="$router.back()" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
        <span class="material-icons-round text-white">arrow_back</span>
      </button>
      <h2 class="ml-4 text-xl font-bold gold-text-gradient">加入房间</h2>
    </div>

    <!-- 装饰红桃 -->
    <div class="flex-1 flex flex-col items-center justify-center relative">
      <svg width="120" height="120" viewBox="0 0 100 100" class="absolute opacity-5 -top-4">
        <path d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C40 5 48 12 50 18 C52 12 60 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z" fill="#f4252f" />
      </svg>

      <!-- 输入框 -->
      <p class="text-white/60 text-sm mb-6 tracking-wider">请输入四位房间号</p>
      <div class="flex gap-3 mb-10">
        <div
          v-for="(digit, i) in 4"
          :key="i"
          :class="[
            'w-14 h-16 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200',
            code[i]
              ? 'glass-card text-gold-500 border-gold-500/50'
              : 'glass-panel text-white/20'
          ]"
        >
          {{ code[i] || '·' }}
        </div>
      </div>

      <!-- 数字键盘 -->
      <div class="grid grid-cols-3 gap-3 w-full max-w-xs">
        <button
          v-for="num in [1,2,3,4,5,6,7,8,9]"
          :key="num"
          @click="appendDigit(num)"
          class="h-14 rounded-xl glass-panel text-white text-xl font-bold hover:bg-white/10 active:scale-95 transition-all"
        >
          {{ num }}
        </button>
        <!-- 空白 -->
        <div></div>
        <!-- 0 -->
        <button
          @click="appendDigit(0)"
          class="h-14 rounded-xl glass-panel text-white text-xl font-bold hover:bg-white/10 active:scale-95 transition-all"
        >
          0
        </button>
        <!-- 删除 -->
        <button
          @click="deleteDigit"
          class="h-14 rounded-xl glass-panel text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
        >
          <span class="material-icons-round">backspace</span>
        </button>
      </div>

      <!-- 加入按钮 -->
      <button
        @click="handleJoin"
        :disabled="code.length < 4 || joining"
        class="w-full max-w-xs h-14 rounded-full primary-gold-btn flex items-center justify-center mt-8 disabled:opacity-40"
      >
        <span class="font-display font-bold text-lg text-bg-dark">
          {{ joining ? '加入中...' : '加入房间' }}
        </span>
      </button>

      <!-- 错误提示 -->
      <p v-if="errorMsg" class="text-red-400 text-sm mt-4">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '../stores/room'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const code = ref('')
const joining = ref(false)
const errorMsg = ref('')

// 如果 URL 带有 ?code=XXXX，自动填入房间号
onMounted(() => {
  const queryCode = route.query.code
  if (queryCode && typeof queryCode === 'string' && /^\d{4}$/.test(queryCode)) {
    code.value = queryCode
  }
})

function appendDigit(num) {
  if (code.value.length < 4) {
    code.value += String(num)
  }
}

function deleteDigit() {
  code.value = code.value.slice(0, -1)
  errorMsg.value = ''
}

async function handleJoin() {
  if (code.value.length < 4) return
  joining.value = true
  errorMsg.value = ''

  const room = await roomStore.findRoomByCode(code.value)
  if (!room) {
    errorMsg.value = '未找到该房间，请检查房间号'
    joining.value = false
    return
  }

  const success = await roomStore.joinRoom(room.id)
  joining.value = false
  if (success) {
    // 根据房间状态跳转到对应页面
    if (room.status === 'playing') {
      router.push(`/game/${room.id}`)
    } else {
      router.push(`/lobby/${room.id}`)
    }
  } else {
    errorMsg.value = '加入房间失败，可能已满员'
  }
}
</script>
