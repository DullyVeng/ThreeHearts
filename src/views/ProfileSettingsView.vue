<template>
  <div class="min-h-screen px-6 py-8">
    <!-- 顶部 -->
    <div class="flex items-center justify-between mb-6">
      <button @click="$router.push('/')" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center">
        <span class="material-icons-round text-white">arrow_back</span>
      </button>
      <h2 class="text-lg font-bold gold-text-gradient">个人设置</h2>
      <div class="w-10"></div>
    </div>

    <!-- 头像展示 -->
    <div class="flex flex-col items-center mb-8">
      <div class="relative">
        <div class="w-24 h-24 avatar-ring flex items-center justify-center bg-bg-dark overflow-hidden">
          <img :src="selectedAvatarUrl" class="w-full h-full object-cover" />
        </div>
        <div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full primary-gold-btn flex items-center justify-center">
          <span class="material-icons-round text-bg-dark text-sm">edit</span>
        </div>
      </div>
    </div>

    <!-- 昵称 -->
    <div class="glass-card rounded-xl p-5 mb-6">
      <label class="text-white/40 text-xs mb-2 block">昵称</label>
      <input
        v-model="nickname"
        type="text"
        maxlength="12"
        placeholder="请输入昵称"
        class="w-full bg-transparent text-white text-lg font-medium border-b border-white/10
               focus:border-gold-500 outline-none pb-2 transition-colors placeholder-white/20"
      />
      <p class="text-white/20 text-xs mt-2 text-right">{{ nickname.length }}/12</p>
    </div>

    <!-- 头像选择 -->
    <div class="glass-card rounded-xl p-5 mb-8">
      <label class="text-white/40 text-xs mb-4 block">选择头像</label>
      <div class="grid grid-cols-4 gap-3">
        <button
          v-for="avatar in avatarOptions"
          :key="avatar.id"
          @click="selectAvatar(avatar)"
          :class="[
            'aspect-square rounded-full overflow-hidden flex items-center justify-center transition-all',
            selectedAvatar === avatar.id
              ? 'ring-2 ring-gold-500 ring-offset-2 ring-offset-bg-dark scale-105'
              : 'opacity-70 hover:opacity-100'
          ]"
        >
          <img :src="`/avatars/${avatar.id}.png`" :alt="avatar.name" class="w-full h-full object-cover" />
        </button>
      </div>
    </div>

    <!-- 保存按钮 -->
    <button
      @click="handleSave"
      :disabled="saving"
      class="w-full h-14 rounded-full primary-gold-btn flex items-center justify-center disabled:opacity-50"
    >
      <span class="material-icons-round text-bg-dark mr-2 text-xl">check</span>
      <span class="font-display font-bold text-lg text-bg-dark">
        {{ saving ? '保存中...' : '保存设置' }}
      </span>
    </button>

    <!-- 保存成功提示 -->
    <transition name="fade">
      <div v-if="saved" class="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg z-50">
        ✓ 保存成功
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const nickname = ref('')
const selectedAvatar = ref('cat')
const saving = ref(false)
const saved = ref(false)

const avatarOptions = [
  { id: 'cat', name: '猫咪' },
  { id: 'pig', name: '小猪' },
  { id: 'rabbit', name: '兔子' },
  { id: 'fox', name: '狐狸' },
  { id: 'dog', name: '柴犬' },
  { id: 'bear', name: '小熊' },
  { id: 'chick', name: '小鸡' },
  { id: 'panda', name: '熊猫' },
  { id: 'mouse', name: '老鼠' },
]

const selectedAvatarUrl = computed(() => {
  return `/avatars/${selectedAvatar.value}.png`
})

function selectAvatar(avatar) {
  selectedAvatar.value = avatar.id
}

async function handleSave() {
  saving.value = true
  const nicknameOk = await authStore.updateNickname(nickname.value || '新玩家')
  const avatarOk = await authStore.updateAvatar(`/avatars/${selectedAvatar.value}.png`)
  saving.value = false
  if (nicknameOk && avatarOk) {
    saved.value = true
    setTimeout(() => saved.value = false, 2000)
  }
}

onMounted(() => {
  if (authStore.profile) {
    nickname.value = authStore.profile.nickname || ''
    // 从 avatar_url 还原选中状态
    const match = authStore.profile.avatar_url?.match(/\/avatars\/(\w+)\.png/)
    if (match) selectedAvatar.value = match[1]
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
