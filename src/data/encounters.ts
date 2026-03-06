import { Encounter } from '../core/mapModels';

export const ENCOUNTER_POOLS: Record<string, Encounter[]> = {
    act1_easy: [
        {
            id: 'jaw_worm_easy',
            name: 'Jaw Worm',
            enemyIds: ['jaw_worm']
        },
        {
            id: '4_jaw_worms',
            name: 'Worm Horde',
            enemyIds: ['jaw_worm', 'jaw_worm', 'jaw_worm', 'jaw_worm']
        }
    ],
    act1_elite: [
        {
            id: 'gremlin_nob_elite',
            name: 'Gremlin Nob',
            enemyIds: ['gremlin_nob']
        }
    ]
};
