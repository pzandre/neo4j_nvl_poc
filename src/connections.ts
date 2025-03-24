import neo4j, { Driver, RecordShape } from "neo4j-driver";
import { URI, USER, PASSWORD } from "./creds";
import { Node, nvlResultTransformer, Relationship } from "@neo4j-nvl/base";

export const connect = async (
  query: string,
  param = {}
): Promise<
  | {
      recordObjectMap: Map<string, RecordShape>;
      nodes: Node[];
      relationships: Relationship[];
    }
  | undefined
> => {
  try {
    const driver: Driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
    return await driver.executeQuery(query, param, {
      resultTransformer: nvlResultTransformer,
    });
  } catch (err) {
    console.error(`Connection error\n${err}.`);
  }
};
