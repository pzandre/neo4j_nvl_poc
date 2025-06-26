import { Node, Relationship } from "@neo4j-nvl/base";
import { RecordShape } from "neo4j-driver";

export const styleGraph = (
  data: {
    nodes: Node[];
    relationships: Relationship[];
    recordObjectMap: Map<string, RecordShape>;
  }
): {
  styledNodes: Node[];
  styledRelationships: Relationship[];
  positions: { id: string; x: number; y: number }[];
} => {
  const positions: { id: string; x: number; y: number }[] = [];
  const styledNodes: Node[] = data.nodes.map((node) => {
    return {
      ...node,
      captions: node.caption ? [{ value: node.caption }] : [],
    };
  });

  const styledRelationships = data.relationships.map((rel) => {
    return {
      ...rel,
      captions: [{ value: rel?.type }],
      width: 7,
    };
  });

  return { styledNodes, styledRelationships, positions };
};
