import { useEffect, useState, useMemo, useRef } from 'react';
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

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the current floor using native DOM methods
    useEffect(() => {
        if (!mapData) return;

        // Use a slight timeout to ensure DOM has painted the scroll area
        setTimeout(() => {
            const floorElement = document.querySelector(`.map-floor[data-floor="${floor}"]`);
            if (floorElement) {
                floorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 50);
    }, [mapData, floor]);

    const availableNodes = useMemo(() => {
        if (!mapData) return [];
        if (currentNodeId === null) {
            // First floor choices
            return mapData.nodes.filter(n => n.y === floor);
        }
        const currentNode = mapData.nodes.find(n => n.id === currentNodeId);
        if (!currentNode) return [];
        // Available choices are connected nodes on the current floor
        return mapData.nodes.filter(n => n.y === floor && currentNode.connections.includes(n.id));
    }, [mapData, floor, currentNodeId]);

    const handleNodeClick = (node: MapNode) => {
        if (!availableNodes.some(an => an.id === node.id)) return; // Can only click valid connected paths

        console.log("Traveling to node:", node.type);
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

    // Group nodes by Y coordinate (floor)
    const floorsMap = mapData.nodes.reduce<{ [key: number]: MapNode[] }>((acc, node) => {
        if (!acc[node.y]) acc[node.y] = [];
        acc[node.y].push(node);
        return acc;
    }, {});

    const sortedFloors = Object.keys(floorsMap).map(Number).sort((a, b) => b - a); // Top to bottom

    return (
        <div className="map-view-container" ref={scrollContainerRef}>
            <div className="map-scroll-area">

                {/* SVG for drawing connecting dots */}
                <svg className="map-connections">
                    {mapData.nodes.map(node =>
                        node.connections.map(targetId => {
                            const target = mapData.nodes.find(n => n.id === targetId);
                            if (!target) return null;

                            const startX = `${node.x * 100}%`;
                            const startY = `calc(${100 - (node.y / 10 * 100)}% - 30px)`; // Center of the 60px row

                            const endX = `${target.x * 100}%`;
                            const endY = `calc(${100 - (target.y / 10 * 100)}% - 30px)`;

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
                    <div key={y} data-floor={y} className="map-floor" style={{ bottom: `${(y / 10) * 100}%` }}>
                        {floorsMap[y].map(node => (
                            <div
                                key={node.id}
                                className={`map-node ${availableNodes.some(an => an.id === node.id) ? 'available' : ''} ${node.y < floor || node.id === currentNodeId ? 'completed' : ''}`}
                                style={{ left: `${node.x * 100}%` }}
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
