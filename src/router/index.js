import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/HomeView.vue'),
    },
    {
        path: '/create',
        name: 'RoomSettings',
        component: () => import('../views/RoomSettingsView.vue'),
    },
    {
        path: '/join',
        name: 'JoinRoom',
        component: () => import('../views/JoinRoomView.vue'),
    },
    {
        path: '/lobby/:roomId',
        name: 'Lobby',
        component: () => import('../views/LobbyView.vue'),
        props: true,
    },
    {
        path: '/game/:roomId',
        name: 'ScoringDashboard',
        component: () => import('../views/ScoringDashboardView.vue'),
        props: true,
    },
    {
        path: '/settlement/:roomId',
        name: 'FinalSettlement',
        component: () => import('../views/FinalSettlementView.vue'),
        props: true,
    },
    {
        path: '/history',
        name: 'MatchHistory',
        component: () => import('../views/MatchHistoryView.vue'),
    },
    {
        path: '/profile',
        name: 'ProfileSettings',
        component: () => import('../views/ProfileSettingsView.vue'),
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router
