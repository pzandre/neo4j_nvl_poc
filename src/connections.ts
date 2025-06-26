import { Node, Relationship } from "@neo4j-nvl/base";
import { API_KEY, API_TOKEN, API_URL } from "./config";

interface ApiResponse {
  data: {
    nodes: Array<{
      id: string;
      color: string;
      caption: string;
      type: string;
      selected: boolean;
      activated: boolean;
    }>;
    relationships?: Array<{
      id: string;
      to: string;
      from: string;
      type: string;
    }>;
  }
}

interface RecordShape {
  [key: string]: any;
}

export const connect = async (
  params = {}
): Promise<{
  recordObjectMap: Map<string, RecordShape>;
  nodes: Node[];
  relationships: Relationship[];
} | undefined> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Authorization': API_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse = await response.json();

    const recordObjectMap = new Map<string, RecordShape>();
    
    const nodes: Node[] = data.data.nodes.map(node => {
      const record = {
        id: node.id,
        color: node.color,
        caption: node.caption,
        type: node.type,
        activated: node.activated,
        selected: node.selected,
      };
      recordObjectMap.set(node.id, record);
      return record as Node;
    });

    const relationships: Relationship[] = data.data.relationships?.map(rel => ({
      id: rel.id,
      from: rel.from,
      to: rel.to,
      type: rel.type,
    })) || [];

    return {
      recordObjectMap,
      nodes,
      relationships,
    };
  } catch (err) {
    console.error(`API connection error\n${err}`);
  }
};