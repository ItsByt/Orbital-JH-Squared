import { create } from "zustand";
import { supabase } from "@/services/supabase";

export type FontSizePairing = "small" | "regular" | "large";
export type FontFamilyOption = "sans" | "mono" | "bahnschrift" | "atkinson" | "inter" | "lexend";

interface SettingsState {
    startHour: number;
    endHour: number;
    cardFontSize: FontSizePairing;
    cardFontFamily: FontFamilyOption;
    isSyncing: boolean;

    // Actions
    setTimeRange: (start: number, end: number) => Promise<void>;
    setCardFontSize: (size: FontSizePairing) => Promise<void>;
    setCardFontFamily: (font: FontFamilyOption) => Promise<void>;

    // DB Hydration & Reset
    hydrateSettings: (dbSettings: {
        startHour: number;
        endHour: number;
        cardFontSize: FontSizePairing;
        cardFontFamily: FontFamilyOption;
    }) => void;
    resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    startHour: 8,
    endHour: 22,
    cardFontSize: "regular",
    cardFontFamily: "sans",
    isSyncing: false,

    setTimeRange: async (start, end) => {
        if (start >= end) return;

        // Grab current state to ensure full object sync
        const { cardFontSize, cardFontFamily } = get();

        set({ startHour: start, endHour: end, isSyncing: true });

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            await supabase.from("accessibilities").upsert({
                id: user.id,
                start_hour: start,
                end_hour: end,
                card_font_size: cardFontSize,
                card_font_family: cardFontFamily,
            });
        }
        set({ isSyncing: false });
    },

    setCardFontSize: async (size) => {
        const { startHour, endHour, cardFontFamily } = get();
        set({ cardFontSize: size, isSyncing: true });

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            await supabase.from("accessibilities").upsert({
                id: user.id,
                start_hour: startHour,
                end_hour: endHour,
                card_font_size: size,
                card_font_family: cardFontFamily,
            });
        }
        set({ isSyncing: false });
    },

    setCardFontFamily: async (font) => {
        const { startHour, endHour, cardFontSize } = get();
        set({ cardFontFamily: font, isSyncing: true });

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            await supabase.from("accessibilities").upsert({
                id: user.id,
                start_hour: startHour,
                end_hour: endHour,
                card_font_size: cardFontSize,
                card_font_family: font,
            });
        }
        set({ isSyncing: false });
    },

    hydrateSettings: (dbSettings) => set({ ...dbSettings }),

    resetSettings: () =>
        set({
            startHour: 8,
            endHour: 22,
            cardFontSize: "regular",
            cardFontFamily: "sans",
        }),
}));
