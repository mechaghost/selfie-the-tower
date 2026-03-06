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
    // AND cleanup dead ends (nodes that cannot reach the boss)
    const validNodes = pruneOrphansAndDeadEnds(nodes);

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

    for (let x = 0; x < MAP_WIDTH; x++) {
        if (x === parentX) continue;
        const otherParent = grid[parentY][x];
        if (!otherParent) continue;

        for (const connId of otherParent.connections) {
            const match = connId.match(/node_\d+_(\d+)/);
            if (match) {
                const otherChildX = parseInt(match[1], 10);

                // Crossing Math:
                // If Parent A is left of Parent B (parentX < x)
                // And Child A is right of or equal to Child B (childX >= otherChildX)
                // Then the lines cross.
                // Equal coordinates count as a crossing if the parents weren't equal (which we checked above)
                if (parentX < x && childX >= otherChildX) return true;
                if (parentX > x && childX <= otherChildX) return true;
            }
        }
    }

    return false;
}

function pruneOrphansAndDeadEnds(nodes: MapNode[]): MapNode[] {
    // 1. Find all nodes reachable from the Start (Floor 0)
    const reachableFromStart = new Set<string>();
    const forwardQueue = nodes.filter(n => n.y === 0).map(n => n.id);

    while (forwardQueue.length > 0) {
        const id = forwardQueue.shift()!;
        if (!reachableFromStart.has(id)) {
            reachableFromStart.add(id);
            const node = nodes.find(n => n.id === id);
            if (node) {
                forwardQueue.push(...node.connections);
            }
        }
    }

    // 2. Find all nodes that can reach the Boss (Floor MAP_HEIGHT - 1)
    // We do this by building a reverse adjacency list
    const parentsOf: Record<string, string[]> = {};
    nodes.forEach(n => {
        n.connections.forEach(childId => {
            if (!parentsOf[childId]) parentsOf[childId] = [];
            parentsOf[childId].push(n.id);
        });
    });

    const canReachBoss = new Set<string>();
    const bossNodes = nodes.filter(n => n.y === MAP_HEIGHT - 1);
    const backwardQueue = bossNodes.map(n => n.id);

    while (backwardQueue.length > 0) {
        const id = backwardQueue.shift()!;
        if (!canReachBoss.has(id)) {
            canReachBoss.add(id);
            if (parentsOf[id]) {
                backwardQueue.push(...parentsOf[id]);
            }
        }
    }

    // A valid node must be reachable from Start AND be able to reach the Boss.
    const validSet = new Set<string>();
    nodes.forEach(n => {
        if (reachableFromStart.has(n.id) && canReachBoss.has(n.id)) {
            validSet.add(n.id);
        }
    });

    // 3. Rebuild the node list, filtering nodes and their connections
    return nodes.filter(n => validSet.has(n.id)).map(n => ({
        ...n,
        connections: n.connections.filter(cid => validSet.has(cid))
    }));
}
