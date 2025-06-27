import { Node, Relationship } from "@neo4j-nvl/base";
import { RecordShape } from "neo4j-driver";

const colorPalette = [
  "#68BDF6", // Neo4j blue for Publications
  "#6DCE9E", // Neo4j green for Years
  "#FFD86E", // Neo4j yellow for Languages
  "#DE9BF9", // Neo4j purple for Authors
  "#FB95AF", // Neo4j pink for Publishers
  "#FF7E79", // Neo4j red
  "#4C8EDA", // Darker blue
  "#57C7E3", // Cyan
  "#F79767", // Orange
  "#C990C0", // Light purple
  "#D8C7AE", // Beige
  "#579380", // Teal
];

const typeColorMap = new Map([
  ["Publication", "#68BDF6"], // Neo4j signature blue
  ["Year", "#6DCE9E"],        // Neo4j green
  ["Language", "#FFD86E"],    // Neo4j yellow
  ["Author", "#DE9BF9"],      // Neo4j purple
  ["Publisher", "#FB95AF"],   // Neo4j pink
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
    const displayType = nodeType ||  "Unknown";
    const nodeColor = getUniqueColorForType(displayType) || "#999";
    
    const styledNode = {
      ...node,
      color: nodeColor,
      // Neo4j style captions - show main property as primary caption
      captions: node.caption 
        ? [{ value: node.caption, fontSize: "12px", color: "#333" }] 
        : [{ value: displayType, fontSize: "11px", color: "#666" }],
      size: getNodeSize(displayType, node),
      selected: node.selected ?? false,
      activated: node.activated ?? false,
      pinned: false,
      // Neo4j style borders and shadows
      borderWidth: node.selected ? 3 : (node.activated ? 2 : 1),
      borderColor: node.selected ? "#333" : (node.activated ? darkenColor(nodeColor, 0.3) : darkenColor(nodeColor, 0.2)),
      // Add subtle shadow for depth
      shadowColor: "rgba(0,0,0,0.15)",
      shadowBlur: 4,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      // Text styling
      fontSize: 12,
      fontFamily: "system-ui, -apple-system, sans-serif",
      textColor: "#333",
      textOutlineColor: "rgba(255,255,255,0.8)",
      textOutlineWidth: 1,
    };

    return styledNode;
  });

  const styledRelationships = data.relationships.map((rel) => {
    const relType = rel?.type || "RELATED";
    
    return {
      ...rel,
      captions: [{ 
        value: relType, 
        fontSize: "10px", 
        color: "#666",
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: "2px 4px",
        borderRadius: "3px"
      }],
      width: 2,
      color: "#999",
      // Neo4j style relationship arrows
      arrowColor: "#999",
      arrowSize: 8,
      // Subtle styling for better visibility
      opacity: 0.8,
      // Curve relationships slightly for better aesthetics
      curvature: 0.1,
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
    "Publication": 40,  // Larger for main entities
    "Author": 32,       // Medium for important entities
    "Publisher": 35,    // Medium-large
    "Year": 25,         // Smaller for attributes
    "Language": 25,     // Smaller for attributes
  };

  // Add some variation based on node importance or connections
  const baseSize = baseSizes[type] || 30;
  
  // You could add logic here to vary size based on node properties
  // For example: number of connections, importance score, etc.
  
  return baseSize;
};

// Helper function to darken a color for borders
const darkenColor = (color: string, factor: number): string => {
  // Simple color darkening - convert hex to RGB, darken, convert back
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor)));
  const g = Math.max(0, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor)));
  const b = Math.max(0, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor)));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Export for use in other components
export { typeColorMap };
