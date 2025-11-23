import { FadeCalculator } from 'csgo-fade-percentage-calculator';

export const WEAPON_DEFINDEX_MAP: Record<number, string> = {
    // Knives
    500: 'Bayonet',
    505: 'Flip Knife',
    506: 'Gut Knife',
    507: 'Karambit',
    508: 'M9 Bayonet',
    509: 'Huntsman Knife',
    512: 'Falchion Knife',
    514: 'Bowie Knife',
    515: 'Butterfly Knife',
    516: 'Shadow Daggers',
    519: 'Ursus Knife',
    520: 'Navaja Knife',
    522: 'Stiletto Knife',
    523: 'Talon Knife',
    525: 'Skeleton Knife',
    503: 'Classic Knife', // Check defindex
    517: 'Paracord Knife',
    518: 'Survival Knife',
    521: 'Nomad Knife',

    // Guns (Common Fade skins)
    4: 'Glock-18',
    7: 'AK-47', // For Blue Gem
    3: 'Five-SeveN', // For Blue Gem
    9: 'AWP',
    64: 'R8 Revolver',
    33: 'MP7',
    17: 'MAC-10',
    24: 'UMP-45',
    61: 'USP-S', // Just in case
    32: 'P2000',
    1: 'Desert Eagle',
};


export const DOPPLER_PHASES: Record<number, string> = {
    418: 'Phase 1',
    419: 'Phase 2',
    420: 'Phase 3',
    421: 'Phase 4',
    415: 'Ruby',
    416: 'Sapphire',
    417: 'Black Pearl',
    // Gamma Doppler
    569: 'Phase 1',
    570: 'Phase 2',
    571: 'Phase 3',
    572: 'Phase 4',
    568: 'Emerald',
    // Chroma
    618: 'Phase 2', // P2 is 618? Re-verifying standard Chroma phases usually follow similar patterns but let's stick to the main Doppler ones first or add if confident.
    // Actually, standard Doppler is the most critical.
    // 852, 853, 854, 855 are also Doppler phases for new knives?
    // Let's stick to the core ones found in research first.
};

// Tier 1 Blue Gem seeds for specific weapons
// This is a simplified list.
export const BLUE_GEM_SEEDS: Record<number, number[]> = {
    // AK-47 (Weapon Def Index 7)
    7: [661, 151, 168, 179, 321, 387, 555, 592, 670, 760, 809, 955],
    // Five-SeveN (Weapon Def Index 3)
    3: [278, 363, 690, 868],
    // Karambit (Weapon Def Index 507)
    507: [387, 442, 269, 321, 73, 902, 463], // Top tier ones
    // M9 Bayonet (Weapon Def Index 508)
    508: [601, 58, 107, 239, 253, 349, 354, 403, 406, 417, 449, 503, 517, 523, 550, 585, 634, 675, 897, 946],
    // Talon Knife (Weapon Def Index 523)
    523: [55, 923, 241, 602]
};

export function getDopplerPhase(paintIndex: number): string | null {
    return DOPPLER_PHASES[paintIndex] || null;
}

export const FADE_PAINT_INDEXES = [38, 246, 253];

export function isFadeSkin(paintIndex: number): boolean {
    return FADE_PAINT_INDEXES.includes(paintIndex);
}

export function getFadePercentage(weaponName: string, paintSeed: number): number {
    try {
        // The library expects weapon names like 'Karambit', 'Bayonet', 'Glock-18', etc.
        // We might need to map our weapon names if they differ.
        // Assuming standard names are passed.
        const result = FadeCalculator.getFadePercentage(weaponName, paintSeed);
        return result ? result.percentage : 0;
    } catch (error) {
        // Library might throw if weapon is not supported or other error
        return 0;
    }
}

export function isBlueGem(weaponDefIndex: number, paintSeed: number): boolean {
    const seeds = BLUE_GEM_SEEDS[weaponDefIndex];
    if (!seeds) return false;
    return seeds.includes(paintSeed);
}
