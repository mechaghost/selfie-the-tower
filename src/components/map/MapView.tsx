import { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MapNode, MapData } from '../../core/mapModels';
import { generateMap } from '../../core/mapGenerator';
import { Skull, Tent, Store, Swords } from 'lucide-react';
import './MapView.css';

export function MapView() {
    const { seed, floor, currentNodeId } = useGameStore();
    const [mapData, setMapData] = useState<MapData | null>(null);

    useEffect(() => {
        if (seed) {
            setMapData(generateMap(seed));
        }
    }, [seed]);



    // Fix #8: Floor 1 combat nodes are the first clickable; after that use connections
    const availableNodes = useMemo(() => {
        if (!mapData) return [];
        if (currentNodeId === null) {
            // First pick: show all floor 1 combat nodes (skip Start floor)
            return mapData.nodes.filter(n => n.y === 1);
        }
        const currentNode = mapData.nodes.find(n => n.id === currentNodeId);
        if (!currentNode) return [];
        return mapData.nodes.filter(n => currentNode.connections.includes(n.id));
    }, [mapData, currentNodeId]);

    const handleNodeClick = (node: MapNode) => {
        if (!availableNodes.some(an => an.id === node.id)) return; // Can only click valid connected paths

        useGameStore.getState().advanceFloor(node);
    };

    if (!mapData) return <div className="map-loading">Generating Spire...</div>;

    const renderIcon = (type: string) => {
        switch (type) {
            case 'Combat': return <Swords size={20} className="node-icon combat" />;
            case 'Elite': return <Skull size={24} className="node-icon elite" />;
            case 'Rest': return <Tent size={24} className="node-icon rest" />;
            case 'Shop': return <Store size={22} className="node-icon shop" />;
            case 'Boss': return <Skull size={32} className="node-icon boss" color="red" />;
            default: return <span className="node-icon unknown">?</span>;
        }
    };

    // Filter out Start nodes (floor 0) — they're structural only, not displayed
    const visibleNodes = mapData.nodes.filter(n => n.type !== 'Start');

    // Group visible nodes by Y coordinate (floor)
    const floorsMap = visibleNodes.reduce<{ [key: number]: MapNode[] }>((acc, node) => {
        if (!acc[node.y]) acc[node.y] = [];
        acc[node.y].push(node);
        return acc;
    }, {});

    // Compute per-floor X offset to center nodes horizontally
    const floorXOffset: Record<number, number> = {};
    for (const [yStr, nodes] of Object.entries(floorsMap)) {
        const y = Number(yStr);
        const xs = nodes.map(n => n.x);
        const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
        floorXOffset[y] = 0.5 - midX;
    }
    const centeredX = (node: MapNode) => (node.x + (floorXOffset[node.y] ?? 0)) * 100;

    const sortedFloors = Object.keys(floorsMap).map(Number).sort((a, b) => b - a); // Top to bottom

    return (
        <div className="map-view-container">
            <div className="map-scroll-area">

                {/* Fix #15: SVG uses numeric percentages instead of calc() which SVG doesn't support */}
                <svg className="map-connections">
                    {visibleNodes.map(node =>
                        node.connections.map(targetId => {
                            const target = mapData.nodes.find(n => n.id === targetId);
                            if (!target) return null;

                            const floorPct = (y: number) => 6 + ((y - 1) / 8) * 84;
                            const startX = `${centeredX(node)}%`;
                            const startY = `${100 - floorPct(node.y)}%`;
                            const endX = `${centeredX(target)}%`;
                            const endY = `${100 - floorPct(target.y)}%`;

                            return (
                                <line
                                    key={`${node.id}-${targetId}`}
                                    x1={startX}
                                    y1={startY}
                                    x2={endX}
                                    y2={endY}
                                    stroke="rgba(255, 255, 255, 0.2)"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                />
                            );
                        })
                    )}
                </svg>

                {sortedFloors.map(y => (
                    <div key={y} data-floor={y} className="map-floor" style={{ bottom: `${6 + ((y - 1) / 8) * 84}%` }}>
                        {floorsMap[y].map(node => (
                            <div
                                key={node.id}
                                className={`map-node ${availableNodes.some(an => an.id === node.id) ? 'available' : ''} ${node.y < floor || node.id === currentNodeId ? 'completed' : ''}`}
                                style={{ left: `${centeredX(node)}%` }}
                                onClick={() => handleNodeClick(node)}
                            >
                                <div className="node-circle">
                                    {renderIcon(node.type)}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

            </div>
        </div>
    );
}
