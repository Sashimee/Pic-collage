import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WorkspaceState {
  panelVisibility: Record<string, boolean>
  panelSizes: Record<string, number>
  activeTab: string | null

  togglePanel: (panelId: string) => void
  setPanelWidth: (panelId: string, width: number) => void
  setActiveTab: (tab: string | null) => void
  saveWorkspace: (name: string) => void
  loadWorkspace: (name: string) => void
  resetWorkspace: () => void
  applyPreset: (presetId: string) => void
}

const DEFAULT_SIDE_PANEL_WIDTH = 336 // 21rem = 336px

const initialState = {
  panelVisibility: {} as Record<string, boolean>,
  panelSizes: { side: DEFAULT_SIDE_PANEL_WIDTH } as Record<string, number>,
  activeTab: 'photos' as string | null,
}

const STORAGE_KEY = 'pic-collage-workspace'

export const useWorkspace = create<
  WorkspaceState,
  [['zustand/persist', unknown]]
>(
  persist(
    (set, get) => ({
      ...initialState,

      togglePanel: (panelId) =>
        set((s) => ({
          panelVisibility: {
            ...s.panelVisibility,
            [panelId]: s.panelVisibility[panelId] === false ? true : false,
          },
        })),

      setPanelWidth: (panelId, width) =>
        set((s) => ({
          panelSizes: {
            ...s.panelSizes,
            [panelId]: Math.max(200, Math.min(600, width)),
          },
        })),

      setActiveTab: (tab) => set({ activeTab: tab }),

      saveWorkspace: (name) => {
        const s = get()
        const payload = JSON.stringify({
          panelVisibility: s.panelVisibility,
          panelSizes: s.panelSizes,
          activeTab: s.activeTab,
        })
        localStorage.setItem(`${STORAGE_KEY}:named:${name}`, payload)
      },

      loadWorkspace: (name) => {
        const raw = localStorage.getItem(`${STORAGE_KEY}:named:${name}`)
        if (!raw) return
        try {
          const parsed = JSON.parse(raw)
          set({
            panelVisibility: parsed.panelVisibility ?? {},
            panelSizes: parsed.panelSizes ?? { side: DEFAULT_SIDE_PANEL_WIDTH },
            activeTab: parsed.activeTab ?? 'photos',
          })
        } catch {
          /* ignore corrupt workspace */
        }
      },

      resetWorkspace: () =>
        set({
          panelVisibility: {},
          panelSizes: { side: DEFAULT_SIDE_PANEL_WIDTH },
          activeTab: 'photos',
        }),

      applyPreset: (presetId: string) => {
        const presets: Record<string, Partial<WorkspaceState>> = {
          editing: { panelVisibility: {}, activeTab: 'photos' },
          review: {
            panelVisibility: { layers: false, history: false, animation: false },
            activeTab: null,
          },
          minimal: {
            panelVisibility: Object.fromEntries(
              ['photos','layout','text','draw','stickers','bg','filters','layers','history','animation'].map((id) => [id, false])
            ),
            activeTab: null,
          },
        }
        const p = presets[presetId]
        if (p) set({ ...p, panelSizes: { side: DEFAULT_SIDE_PANEL_WIDTH } })
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        panelVisibility: state.panelVisibility,
        panelSizes: state.panelSizes,
        activeTab: state.activeTab,
      }),
    },
  ),
)
