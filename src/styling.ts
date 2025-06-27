import { Node, Relationship } from "@neo4j-nvl/base";
import { RecordShape } from "neo4j-driver";

const colorPalette = [
  "#4D8DDA", // Blue for Publications
  "#8DCC93", // Green for Years
  "#F79767", // Orange for Languages
  "#C990C0", // Purple for Authors
  "#F16767", // Red for Publishers
  "#FFDF81",
  "#56C7E4",
  "#D8C7AE",
  "#ECB4C9",
  "#FFC354",
  "#DA7294",
  "#579380",
];

const typeColorMap = new Map([
  ["Publication", "#4D8DDA"],
  ["Year", "#8DCC93"],
  ["Language", "#F79767"],
  ["Author", "#C990C0"],
  ["Publisher", "#F16767"],
]);

let colorIndex = 5; // Start after predefined colors

export const getUniqueColorForType = (type: string) => {
  if (typeColorMap.has(type)) {
    return typeColorMap.get(type);
  }
  
  if (!typeColorMap.has(type)) {
    const color = colorPalette[colorIndex % colorPalette.length];
    typeColorMap.set(type, color);
    colorIndex++;
  }
  return typeColorMap.get(type);
};

// Generate more natural, organic positions with better spacing
const generateOrganicPositions = (nodeCount: number, centerX = 0, centerY = 0) => {
  const positions: { id: string; x: number; y: number }[] = [];
  
  if (nodeCount === 1) {
    positions.push({ id: '', x: centerX, y: centerY });
    return positions;
  }

  // Use a combination of force-directed principles and random positioning
  const minDistance = 80; // Minimum distance between nodes
  const maxAttempts = 50; // Maximum attempts to place a node

  for (let i = 0; i < nodeCount; i++) {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < maxAttempts) {
      // Create more natural distribution using polar coordinates with some randomness
      const angle = (i / nodeCount) * 2 * Math.PI + (Math.random() - 0.5) * 0.8;
      const baseRadius = 100 + i * 15; // Gradually increasing radius
      const radiusVariation = (Math.random() - 0.5) * 60; // Add some randomness
      const radius = Math.max(50, baseRadius + radiusVariation);
      
      const x = centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 40;
      const y = centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 40;
      
      // Check if this position conflicts with existing positions
      const hasConflict = positions.some(pos => {
        const distance = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
        return distance < minDistance;
      });
      
      if (!hasConflict || attempts === maxAttempts - 1) {
        positions.push({ id: '', x, y });
        placed = true;
      }
      
      attempts++;
    }
  }
  
  return positions;
};

// Generate positions for expanding nodes around a center node
const generateExpansionPositions = (
  nodeCount: number, 
  centerNode: { x: number; y: number },
  existingPositions: { id: string; x: number; y: number }[] = []
) => {
  const positions: { id: string; x: number; y: number }[] = [];
  const minDistance = 100;
  const expansionRadius = 150;
  
  for (let i = 0; i < nodeCount; i++) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!placed && attempts < maxAttempts) {
      const angle = (i / nodeCount) * 2 * Math.PI + (Math.random() - 0.5) * 1.2;
      const radius = expansionRadius + (Math.random() - 0.5) * 80;
      
      const x = centerNode.x + radius * Math.cos(angle);
      const y = centerNode.y + radius * Math.sin(angle);
      
      // Check conflicts with existing and new positions
      const allPositions = [...existingPositions, ...positions];
      const hasConflict = allPositions.some(pos => {
        const distance = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
        return distance < minDistance;
      });
      
      if (!hasConflict || attempts === maxAttempts - 1) {
        positions.push({ id: '', x, y });
        placed = true;
      }
      
      attempts++;
    }
  }
  
  return positions;
};

export const styleGraph = (
  data: {
    nodes: Node[];
    relationships: Relationship[];
    recordObjectMap: Map<string, RecordShape>;
  },
  expansionCenter?: { x: number; y: number },
  existingPositions?: { id: string; x: number; y: number }[]
): {
  styledNodes: Node[];
  styledRelationships: Relationship[];
  positions: { id: string; x: number; y: number }[];
} => {
  // Generate positions based on whether this is an expansion or initial load
  let initialPositions: { id: string; x: number; y: number }[];
  
  if (expansionCenter && existingPositions) {
    // This is an expansion - position new nodes around the expanded node
    initialPositions = generateExpansionPositions(data.nodes.length, expansionCenter, existingPositions);
  } else {
    // Initial load - use organic positioning
    initialPositions = generateOrganicPositions(data.nodes.length);
  }

  const styledNodes: Node[] = data.nodes.map((node, index) => {
    // Extract type from node ID format (type#___#id)
    const [nodeType] = node.id.split("#___#");
    const displayType = nodeType || node.type || "Unknown";
    
    const styledNode = {
      ...node,
      color: node.color || getUniqueColorForType(displayType),
      captions: node.caption ? [{ value: node.caption }] : [{ value: displayType }],
      size: getNodeSize(displayType, node),
      selected: node.selected ?? false,
      activated: node.activated ?? false,
      // Don't pin nodes to allow for more fluid movement
      pinned: false,
    };

    return styledNode;
  });

  const styledRelationships = data.relationships.map((rel) => {
    return {
      ...rel,
      captions: [{ value: rel?.type || "CONNECTED" }],
      width: 2,
      color: "#666666",
    };
  });

  // Assign positions with some randomness to prevent rigid clustering
  const positions = initialPositions.map((pos, index) => ({
    ...pos,
    id: data.nodes[index]?.id || `node-${index}`,
  }));

  return { styledNodes, styledRelationships, positions };
};

// Helper function to determine node size based on type and properties
const getNodeSize = (type: string, node: Node): number => {
  const baseSizes: Record<string, number> = {
    "Publication": 35,
    "Author": 28,
    "Publisher": 32,
    "Year": 22,
    "Language": 22,
  };

  return baseSizes[type] || 28;
};

// Export for use in other components
export { typeColorMap };
