import { MapNode, NodeType, MapData } from './mapModels';
import { RNG } from './rng';

const MAP_WIDTH = 4;
const MAP_HEIGHT = 10;

interface MapGenerationConfig {
    paths: number;
    eliteChance: number;
    shopChance: number;
    restChance: number;
    unknownChance: number;
}

const DEFAULT_CONFIG: MapGenerationConfig = {
    paths: 3,
    eliteChance: 0.16,
    shopChance: 0.05,
    restChance: 0.12,
    unknownChance: 0.22,
};

export function generateMap(seed: string, config = DEFAULT_CONFIG): MapData {
    const rng = new RNG(seed);
    const nodes: MapNode[] = [];
    const grid: (MapNode | null)[][] = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(null));

    // Floor 0: Start nodes
    const startXs = rng.shuffle(Array.from({ length: MAP_WIDTH }, (_, i) => i)).slice(0, config.paths);

    startXs.forEach(x => {
        const node = createNode(rng, x, 0, 'Start');
        grid[0][x] = node;
        nodes.push(node);
    });

    // Generate middle floors
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
        const isEliteFloor = y >= 4; // Elites only appear after floor 4

        grid[y - 1].forEach((parent, x) => {
            if (!parent) return;

            // Determine number of children (1-3)
            const numChildren = rng.randomElement([1, 1, 1, 2, 2, 3]);
            const possibleMoves = [-1, 0, 1].filter(dx => {
                const nx = x + dx;
                return nx >= 0 && nx < MAP_WIDTH;
            });
            const validMoves = rng.shuffle(possibleMoves).slice(0, numChildren);

            validMoves.forEach(dx => {
                const childX = x + dx;

                let childNode = grid[y][childX];
                if (!childNode) {
                    const type = determineNodeType(rng, config, isEliteFloor, y);
                    childNode = createNode(rng, childX, y, type);
                    grid[y][childX] = childNode;
                    nodes.push(childNode);
                }

                if (!parent.connections.includes(childNode.id)) {
                    // Check path crossing
                    const crossObstruction = checkForCrossing(grid, x, childX, y - 1);
                    if (!crossObstruction) {
                        parent.connections.push(childNode.id);
                    }
                }
            });
        });
    }

    // Floor 14: Rest Site before Boss
    grid[MAP_HEIGHT - 2].forEach((parent, x) => {
        if (!parent) return;
        const type = 'Rest';
        let childNode = grid[MAP_HEIGHT - 1][x];
        if (!childNode) {
            childNode = createNode(rng, x, MAP_HEIGHT - 1, type);
            grid[MAP_HEIGHT - 1][x] = childNode;
            nodes.push(childNode);
        }
        parent.connections.push(childNode.id);
    });

    // Floor 15: The Boss
    const bossNode = createNode(rng, Math.floor(MAP_WIDTH / 2), MAP_HEIGHT - 1, 'Boss');
    nodes.push(bossNode);
    grid[MAP_HEIGHT - 2].forEach((parent) => {
        if (!parent) return;
        parent.connections.push(bossNode.id);
    });

    // Cleanup orphaned nodes (nodes with no parents, except starts)
    const validNodes = pruneOrphans(nodes);

    return { seed, nodes: validNodes };
}

function createNode(rng: RNG, gridX: number, gridY: number, type: NodeType): MapNode {
    // Add slight visual jitter to x position
    const jitter = rng.nextInt(-15, 15) / 100;
    const basePct = gridX / (MAP_WIDTH - 1);

    return {
        id: `node_${gridY}_${gridX}`,
        type,
        x: Math.max(0.05, Math.min(0.95, basePct + jitter)),
        y: gridY,
        connections: []
    };
}

function determineNodeType(rng: RNG, config: MapGenerationConfig, allowElite: boolean, floorIndex: number): NodeType {
    if (floorIndex === 5) return 'Rest'; // Guaranteed rest halfway

    const roll = rng.next();
    let threshold = 0;

    threshold += config.shopChance;
    if (roll < threshold) return 'Shop';

    threshold += allowElite ? config.eliteChance : 0;
    if (roll < threshold) return 'Elite';

    threshold += config.restChance;
    if (roll < threshold) return 'Rest';

    threshold += config.unknownChance;
    if (roll < threshold) return 'Unknown';

    return 'Combat';
}

function checkForCrossing(grid: (MapNode | null)[][], parentX: number, childX: number, parentY: number): boolean {
    if (parentX === childX) return false;

    const isMovingRight = childX > parentX;
    if (isMovingRight) {
        // Parent is Left, child is Right. Did the Right parent go Left?
        const rightParent = grid[parentY][parentX + 1];
        if (rightParent && rightParent.connections.includes(`node_${parentY + 1}_${parentX}`)) {
            return true;
        }
    } else {
        // Parent is Right, child is Left. Did the Left parent go Right?
        const leftParent = grid[parentY][parentX - 1];
        if (leftParent && leftParent.connections.includes(`node_${parentY + 1}_${parentX}`)) {
            return true;
        }
    }
    return false;
}

function pruneOrphans(nodes: MapNode[]): MapNode[] {
    const reachable = new Set<string>();
    const queue = nodes.filter(n => n.y === 0).map(n => n.id);

    while (queue.length > 0) {
        const id = queue.shift()!;
        if (!reachable.has(id)) {
            reachable.add(id);
            const node = nodes.find(n => n.id === id);
            if (node) {
                queue.push(...node.connections);
            }
        }
    }

    // Also prune connections to unreachable nodes just in case
    return nodes.filter(n => reachable.has(n.id)).map(n => ({
        ...n,
        connections: n.connections.filter(cid => reachable.has(cid))
    }));
}
