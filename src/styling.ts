import { Node, Relationship } from "@neo4j-nvl/base";
import { RecordShape } from "neo4j-driver";

const colorPalette = [
  "#FFDF81",
  "#C990C0",
  "#F79767",
  "#56C7E4",
  "#F16767",
  "#D8C7AE",
  "#8DCC93",
  "#ECB4C9",
  "#4D8DDA",
  "#FFC354",
  "#DA7294",
  "#579380",
];

const labelColorMap = new Map();
let colorIndex = 0;

export const getUniqueColorForLabel = (label: string) => {
  if (!labelColorMap.has(label)) {
    const color = colorPalette[colorIndex % colorPalette.length];
    labelColorMap.set(label, color);
    colorIndex++;
  }
  return labelColorMap.get(label);
};

const getAvgLatLon = (data: {
  nodes: Node[];
  relationships: Relationship[];
  recordObjectMap: Map<string, RecordShape>;
}) => {
  let totalX = 0;
  let totalY = 0;
  let count = 0;

  data.nodes.forEach((node) => {
    const originalNode = data.recordObjectMap.get(node.id);
    if (originalNode?.properties.latitude !== undefined) {
      totalX += originalNode.properties.latitude;
      totalY += originalNode.properties.longitude;
      count++;
    }
  });

  const avgLat = totalX / count;
  const avgLon = totalY / count;
  return { avgLon, avgLat };
};

const positionByLatLon = (
  originalNode: RecordShape,
  id: string,
  avgLat: number,
  avgLon: number
) => {
  const scale = 250000;

  return {
    id,
    x: (originalNode.properties.longitude - avgLon) * scale,
    y: -(originalNode.properties.latitude - avgLat) * scale,
  };
};

export const styleGraph = (
  data: {
    nodes: Node[];
    relationships: Relationship[];
    recordObjectMap: Map<string, RecordShape>;
  },
  label = ""
): {
  styledNodes: Node[];
  styledRelationships: Relationship[];
  positions: { id: string; x: number; y: number }[];
} => {
  const positions: { id: string; x: number; y: number }[] = [];
  const { avgLon, avgLat } = getAvgLatLon(data);

  const styledNodes: Node[] = data.nodes.map((node, i) => {
    const originalNode = data.recordObjectMap.get(node.id);
    const newNode = {
      ...node,
      color: getUniqueColorForLabel(originalNode?.labels[0]),
      captions: Object.values(originalNode?.properties).map((value) => ({
        value: value?.toString(),
      })),
    };

    if (
      originalNode?.properties.latitude !== undefined &&
      label === "Location"
    ) {
      newNode.pinned = true;
      newNode.selected = true;
      newNode.size = 50;
      positions.push(
        positionByLatLon(originalNode, newNode.id, avgLat, avgLon)
      );
    }

    if (originalNode?.properties.call_duration !== undefined) {
      newNode.size = originalNode.properties.call_duration.toNumber();
    }
    return newNode;
  });

  const styledRelationships = data.relationships.map((rel) => {
    const originalRelationship = data.recordObjectMap.get(rel.id);
    return {
      ...rel,
      captions: [{ value: originalRelationship?.type }],
    };
  });

  return { styledNodes, styledRelationships, positions };
};
