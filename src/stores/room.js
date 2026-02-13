import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

export const useRoomStore = defineStore('room', () => {
    const room = ref(null)
    const players = ref([])
    const rounds = ref([])
    const loading = ref(false)
    const channel = ref(null)

    const roomCode = computed(() => room.value?.room_code)
    const isHost = computed(() => {
        const authStore = useAuthStore()
        return room.value?.host_id === authStore.userId
    })
    const currentRound = computed(() => rounds.value.length)
    const sortedPlayers = computed(() => {
        return [...players.value].sort((a, b) => b.current_score - a.current_score)
    })

    // 生成 4 位房间号
    function generateRoomCode() {
        return String(Math.floor(1000 + Math.random() * 9000))
    }

    // 创建房间
    async function createRoom(settings) {
        loading.value = true
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const roomCode = generateRoomCode()

            const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .insert({
                    room_code: roomCode,
                    host_id: user.id,
                    initial_score: settings.initialScore,
                    base_multiplier: settings.baseMultiplier,
                    score_cap: settings.scoreCap,
                    payment_mode: settings.paymentMode,
                    status: 'waiting',
                })
                .select()
                .single()

            if (roomError) throw roomError
            room.value = roomData

            // 房主自动加入房间
            await joinRoom(roomData.id)

            return roomData
        } catch (error) {
            console.error('Create room error:', error)
            return null
        } finally {
            loading.value = false
        }
    }

    // 通过房间号查找房间
    async function findRoomByCode(code) {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', code)
            .in('status', ['waiting', 'playing'])
            .single()

        if (error) {
            console.error('Find room error:', error)
            return null
        }
        return data
    }

    // 加入房间
    async function joinRoom(roomId) {
        const { data: { user } } = await supabase.auth.getUser()

        // 先检查是否已有记录（可能之前退出过）
        const { data: existing } = await supabase
            .from('room_players')
            .select('id, is_active')
            .eq('room_id', roomId)
            .eq('player_id', user.id)
            .maybeSingle()

        if (existing) {
            if (!existing.is_active) {
                // 重新激活，继承之前的分数
                await supabase
                    .from('room_players')
                    .update({ is_active: true })
                    .eq('id', existing.id)
            }
            return true
        }

        // 获取房间的 initial_score
        let initialScore = 0
        if (room.value?.initial_score != null) {
            initialScore = room.value.initial_score
        } else {
            const { data: roomData } = await supabase
                .from('rooms')
                .select('initial_score')
                .eq('id', roomId)
                .single()
            initialScore = roomData?.initial_score || 0
        }

        // 先获取当前房间人数确定座位号
        const { data: existingPlayers } = await supabase
            .from('room_players')
            .select('seat_index')
            .eq('room_id', roomId)
            .order('seat_index', { ascending: true })

        const takenSeats = (existingPlayers || []).map(p => p.seat_index)
        let seatIndex = 0
        while (takenSeats.includes(seatIndex)) seatIndex++

        const { data, error } = await supabase
            .from('room_players')
            .insert({
                room_id: roomId,
                player_id: user.id,
                current_score: initialScore,
                is_ready: false,
                seat_index: seatIndex,
            })
            .select()
            .single()

        if (error) {
            console.error('Join room error:', error)
            return false
        }

        // 保存当前房间信息到本地，方便刷新后重连
        localStorage.setItem('currentRoom', JSON.stringify({ id: roomId }))
        return true
    }

    // 加载房间数据
    async function loadRoom(roomId) {
        loading.value = true
        try {
            // 加载房间信息
            const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomId)
                .single()

            if (roomError) throw roomError
            room.value = roomData

            // 加载玩家列表（含 profile 信息）
            const { data: playerData, error: playerError } = await supabase
                .from('room_players')
                .select('*, profiles:player_id(nickname, avatar_url)')
                .eq('room_id', roomId)
                .order('seat_index', { ascending: true })

            if (playerError) throw playerError
            players.value = playerData

            // 加载轮次记录
            const { data: roundData } = await supabase
                .from('rounds')
                .select('*')
                .eq('room_id', roomId)
                .order('round_number', { ascending: true })

            rounds.value = roundData || []

        } catch (error) {
            console.error('Load room error:', error)
        } finally {
            loading.value = false
        }
    }

    // 订阅实时更新
    function subscribeToRoom(roomId) {
        // 防止重复订阅同一房间
        if (channel.value) {
            supabase.removeChannel(channel.value)
            channel.value = null
        }

        channel.value = supabase.channel(`room:${roomId}`)

        // 监听玩家变动
        channel.value.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
            async () => {
                const { data } = await supabase
                    .from('room_players')
                    .select('*, profiles:player_id(nickname, avatar_url)')
                    .eq('room_id', roomId)
                    .order('seat_index', { ascending: true })
                players.value = data || []
            }
        )

        // 监听房间状态变化
        channel.value.on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
            (payload) => {
                room.value = payload.new
            }
        )

        // 监听新的计分轮次
        channel.value.on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'rounds', filter: `room_id=eq.${roomId}` },
            async () => {
                // 刷新轮次数据
                const { data } = await supabase
                    .from('rounds')
                    .select('*')
                    .eq('room_id', roomId)
                    .order('round_number', { ascending: true })
                rounds.value = data || []

                // 同时刷新玩家分数（确保其他玩家能看到最新分数）
                const { data: playerData } = await supabase
                    .from('room_players')
                    .select('*, profiles:player_id(nickname, avatar_url)')
                    .eq('room_id', roomId)
                    .order('seat_index', { ascending: true })
                players.value = playerData || []
            }
        )

        // Broadcast 监听游戏控制消息
        channel.value.on('broadcast', { event: 'game_control' }, (payload) => {
            if (payload.payload.action === 'start_game') {
                room.value = { ...room.value, status: 'playing' }
            } else if (payload.payload.action === 'end_game') {
                room.value = { ...room.value, status: 'finished' }
            }
        })

        channel.value.subscribe(async (status) => {
            console.log(`Realtime channel status: ${status}`)
            if (status === 'SUBSCRIBED') {
                // 连接成功后立即刷新一次数据，防止遗漏
                const { data: playerData } = await supabase
                    .from('room_players')
                    .select('*, profiles:player_id(nickname, avatar_url)')
                    .eq('room_id', roomId)
                    .order('seat_index', { ascending: true })
                players.value = playerData || []

                const { data: roomData } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('id', roomId)
                    .single()
                if (roomData) room.value = roomData
            }
        })
    }

    // 取消订阅
    function unsubscribe() {
        if (channel.value) {
            supabase.removeChannel(channel.value)
            channel.value = null
        }
    }

    // 房主发送"开始游戏"
    async function startGame() {
        if (!room.value) return

        const { data: updatedRoom } = await supabase
            .from('rooms')
            .update({ status: 'playing', started_at: new Date().toISOString() })
            .eq('id', room.value.id)
            .select()
            .single()
        if (updatedRoom) room.value = updatedRoom

        channel.value?.send({
            type: 'broadcast',
            event: 'game_control',
            payload: { action: 'start_game' },
        })
    }

    // 录入一轮分数
    async function recordRound(scores) {
        if (!room.value) return false
        const { data: { user } } = await supabase.auth.getUser()

        const roundNumber = rounds.value.length + 1

        // 插入轮次记录
        const { error: roundError } = await supabase
            .from('rounds')
            .insert({
                room_id: room.value.id,
                round_number: roundNumber,
                scores,
                recorded_by: user.id,
            })

        if (roundError) {
            console.error('Record round error:', roundError)
            return false
        }

        // 更新各玩家总分
        for (const [playerId, score] of Object.entries(scores)) {
            const player = players.value.find(p => p.player_id === playerId)
            if (player) {
                await supabase
                    .from('room_players')
                    .update({ current_score: player.current_score + score })
                    .eq('id', player.id)
            }
        }

        // 刷新本地玩家数据以同步最新分数
        const { data: freshPlayers } = await supabase
            .from('room_players')
            .select('*, profiles:player_id(nickname, avatar_url)')
            .eq('room_id', room.value.id)
            .order('seat_index', { ascending: true })
        players.value = freshPlayers || []

        return true
    }

    // 结束游戏
    async function endGame() {
        if (!room.value) return

        await supabase
            .from('rooms')
            .update({ status: 'finished' })
            .eq('id', room.value.id)

        // 保存对局记录到 matches
        const winner = sortedPlayers.value[0]
        for (const player of players.value) {
            await supabase
                .from('matches')
                .insert({
                    room_id: room.value.id,
                    player_id: player.player_id,
                    final_score: player.current_score,
                    is_winner: player.player_id === winner?.player_id,
                })
        }

        channel.value?.send({
            type: 'broadcast',
            event: 'game_control',
            payload: { action: 'end_game' },
        })

        localStorage.removeItem('currentRoom')
    }

    // 玩家离开房间
    async function leaveRoom() {
        if (!room.value) return
        const authStore = useAuthStore()
        const userId = authStore.userId
        if (!userId) return

        await supabase
            .from('room_players')
            .delete()
            .eq('room_id', room.value.id)
            .eq('player_id', userId)

        localStorage.removeItem('currentRoom')
    }

    // 房主踢人
    async function kickPlayer(playerId) {
        if (!room.value) return
        const { error } = await supabase
            .from('room_players')
            .delete()
            .eq('room_id', room.value.id)
            .eq('player_id', playerId)

        if (error) {
            console.error('Kick player error:', error)
        }
    }

    // 游戏中退出（标记不活跃，保留分数）
    async function leaveGame() {
        if (!room.value) return
        const authStore = useAuthStore()
        const userId = authStore.userId
        if (!userId) return

        // 先标记自己为不活跃
        await supabase
            .from('room_players')
            .update({ is_active: false })
            .eq('room_id', room.value.id)
            .eq('player_id', userId)

        // 检查剩余活跃玩家数：如果自己是最后一个，自动结束房间
        const remainingActive = activePlayers.value.filter(p => p.player_id !== userId)
        if (remainingActive.length === 0) {
            await endGame()
        }

        localStorage.removeItem('currentRoom')
    }

    // 房主解散房间（踢掉所有人，关闭房间）
    async function disbandRoom() {
        if (!room.value) return

        // 删除所有玩家记录
        await supabase
            .from('room_players')
            .delete()
            .eq('room_id', room.value.id)

        // 设置房间状态为 finished
        await supabase
            .from('rooms')
            .update({ status: 'finished' })
            .eq('id', room.value.id)

        localStorage.removeItem('currentRoom')
    }

    // 转交房主并退出
    async function transferHost(newHostId) {
        if (!room.value) return
        const authStore = useAuthStore()

        // 转交房主
        await supabase
            .from('rooms')
            .update({ host_id: newHostId })
            .eq('id', room.value.id)

        // 自己标记为不活跃
        await supabase
            .from('room_players')
            .update({ is_active: false })
            .eq('room_id', room.value.id)
            .eq('player_id', authStore.userId)

        localStorage.removeItem('currentRoom')
    }

    // 活跃玩家
    const activePlayers = computed(() => players.value.filter(p => p.is_active))

    // 清理状态
    function reset() {
        unsubscribe()
        room.value = null
        players.value = []
        rounds.value = []
    }

    return {
        room,
        players,
        activePlayers,
        rounds,
        loading,
        roomCode,
        isHost,
        currentRound,
        sortedPlayers,
        createRoom,
        findRoomByCode,
        joinRoom,
        loadRoom,
        subscribeToRoom,
        unsubscribe,
        startGame,
        recordRound,
        endGame,
        leaveRoom,
        leaveGame,
        disbandRoom,
        transferHost,
        kickPlayer,
        reset,
    }
})
