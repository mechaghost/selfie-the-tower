import { Encounter } from '../core/mapModels';

export const ENCOUNTER_POOLS: Record<string, Encounter[]> = {
    act1_easy: [
        // Solo easy
        {
            id: 'alley_rat_solo',
            name: 'Alley Rat',
            enemyIds: ['alley_rat']
        },
        {
            id: 'stray_voltage_solo',
            name: 'Stray Voltage',
            enemyIds: ['stray_voltage']
        },
        {
            id: 'dumpster_crawler_solo',
            name: 'Dumpster Crawler',
            enemyIds: ['dumpster_crawler']
        },
        // Packs
        {
            id: 'rat_pack',
            name: 'Rat Pack',
            enemyIds: ['alley_rat', 'alley_rat', 'alley_rat']
        },
        {
            id: 'imp_duo',
            name: 'Graffiti Imps',
            enemyIds: ['graffiti_imp', 'graffiti_imp']
        },
        {
            id: 'ghost_and_rat',
            name: 'Haunted Alley',
            enemyIds: ['taxi_ghost', 'alley_rat']
        },
        // Medium singles
        {
            id: 'neon_junkie_solo',
            name: 'Neon Junkie',
            enemyIds: ['neon_junkie']
        },
        {
            id: 'smoke_specter_solo',
            name: 'Smoke Specter',
            enemyIds: ['smoke_specter']
        },
        {
            id: 'manhole_mimic_solo',
            name: 'Manhole Mimic',
            enemyIds: ['manhole_mimic']
        },
        // Mixed groups
        {
            id: 'street_ambush',
            name: 'Street Ambush',
            enemyIds: ['graffiti_imp', 'alley_rat', 'stray_voltage']
        },
        {
            id: 'specter_pair',
            name: 'Spectral Fog',
            enemyIds: ['smoke_specter', 'taxi_ghost']
        },
    ],

    act1_elite: [
        {
            id: 'circuit_breaker_elite',
            name: 'Circuit Breaker',
            enemyIds: ['circuit_breaker']
        },
        {
            id: 'neon_yakuza_elite',
            name: 'Neon Yakuza',
            enemyIds: ['neon_yakuza']
        },
        {
            id: 'chrome_bouncer_elite',
            name: 'Chrome Bouncer',
            enemyIds: ['chrome_bouncer']
        },
        // Tough medium combos
        {
            id: 'brute_squad',
            name: 'Brute Squad',
            enemyIds: ['boombox_brute', 'neon_wraith']
        },
        {
            id: 'underground_nest',
            name: 'Underground Nest',
            enemyIds: ['sewer_slime', 'fire_escape_spider', 'fire_escape_spider']
        },
    ],

    act1_boss: [
        {
            id: 'the_billboard_boss',
            name: 'The Billboard',
            enemyIds: ['the_billboard']
        },
        {
            id: 'subway_wyrm_boss',
            name: 'Subway Wyrm',
            enemyIds: ['subway_wyrm']
        },
        {
            id: 'dj_phantom_boss',
            name: 'DJ Phantom',
            enemyIds: ['dj_phantom']
        },
    ]
};
