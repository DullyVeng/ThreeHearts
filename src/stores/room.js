import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useRoomStore = defineStore('room', () => {
    const room = ref(null)
    const players = ref([])
    const rounds = ref([])
    const loading = ref(false)
    const channel = ref(null)

    const roomCode = computed(() => room.value?.room_code)
    const isHost = computed(() => {
        const userId = supabase.auth.getUser()?.data?.user?.id
        return room.value?.host_id === userId
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
            .eq('status', 'waiting')
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
                current_score: 0,
                is_ready: false,
                seat_index: seatIndex,
            })
            .select()
            .single()

        if (error) {
            console.error('Join room error:', error)
            return false
        }
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
                const { data } = await supabase
                    .from('rounds')
                    .select('*')
                    .eq('room_id', roomId)
                    .order('round_number', { ascending: true })
                rounds.value = data || []
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

        channel.value.subscribe()
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

        await supabase
            .from('rooms')
            .update({ status: 'playing' })
            .eq('id', room.value.id)

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
    }

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
        reset,
    }
})
