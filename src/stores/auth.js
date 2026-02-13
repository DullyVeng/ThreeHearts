import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const profile = ref(null)
    const loading = ref(true)

    const isAuthenticated = computed(() => !!user.value)
    const userId = computed(() => user.value?.id)

    // 初始化：检查现有会话或执行匿名登录
    async function initialize() {
        loading.value = true
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                user.value = session.user
                await fetchProfile()
            } else {
                await signInAnonymously()
            }
        } catch (error) {
            console.error('Auth init error:', error)
        } finally {
            loading.value = false
        }

        // 监听认证状态变化
        supabase.auth.onAuthStateChange((event, session) => {
            user.value = session?.user ?? null
            if (session?.user) {
                fetchProfile()
            }
        })
    }

    // 匿名登录
    async function signInAnonymously() {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) {
            console.error('Anonymous sign-in error:', error)
            return
        }
        user.value = data.user
        await fetchProfile()
    }

    // 获取用户资料
    async function fetchProfile() {
        if (!user.value) return
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.value.id)
            .single()

        if (error) {
            console.error('Fetch profile error:', error)
            return
        }
        profile.value = data
    }

    // 更新昵称
    async function updateNickname(nickname) {
        if (!user.value) return
        const { data, error } = await supabase
            .from('profiles')
            .update({ nickname, updated_at: new Date().toISOString() })
            .eq('id', user.value.id)
            .select()
            .single()

        if (error) {
            console.error('Update nickname error:', error)
            return false
        }
        profile.value = data
        return true
    }

    // 更新头像
    async function updateAvatar(avatarUrl) {
        if (!user.value) return
        const { data, error } = await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
            .eq('id', user.value.id)
            .select()
            .single()

        if (error) {
            console.error('Update avatar error:', error)
            return false
        }
        profile.value = data
        return true
    }

    return {
        user,
        profile,
        loading,
        isAuthenticated,
        userId,
        initialize,
        fetchProfile,
        updateNickname,
        updateAvatar,
    }
})
