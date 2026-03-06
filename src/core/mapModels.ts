export type NodeType = 'Combat' | 'Elite' | 'Rest' | 'Shop' | 'Unknown' | 'Boss' | 'Start';

export interface MapNode {
    id: string;
    type: NodeType;
    x: number; // 0-1 percentage for visual layout horizontally
    y: number; // Represents the "Floor" height (0 is bottom)
    connections: string[]; // IDs of nodes this node can travel to
}

export interface MapData {
    seed: string;
    nodes: MapNode[];
}
