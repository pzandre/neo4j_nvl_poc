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

interface ConnectParams {
  query: string;
  parameters: Record<string, any>;
}

export const connect = async (
  params: ConnectParams
): Promise<{
  recordObjectMap: Map<string, RecordShape>;
  nodes: Node[];
  relationships: Relationship[];
} | undefined> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();

    if (!data.data?.nodes) {
      throw new Error('Invalid API response: missing nodes data');
    }

    const recordObjectMap = new Map<string, RecordShape>();
    
    const nodes: Node[] = data.data.nodes.map(node => {
      const record = {
        id: node.id,
        color: node.color,
        caption: node.caption,
        type: node.type,
        activated: node.activated ?? false,
        selected: node.selected ?? false,
      };
      recordObjectMap.set(node.id, record);
      return record as Node;
    });

    const relationships: Relationship[] = data.data.relationships?.map(rel => ({
      id: rel.id,
      from: rel.from,
      to: rel.to,
      type: rel.type,
    })) ?? [];

    return {
      recordObjectMap,
      nodes,
      relationships,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw err;
    }
    
    throw new Error('Unknown error occurred while fetching data');
  }
};