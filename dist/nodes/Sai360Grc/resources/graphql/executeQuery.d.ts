import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';
export declare function extractVariablesFromQuery(query: string): string[];
export declare const graphqlExecuteQueryDescription: INodeProperties[];
export declare function execute(this: IExecuteFunctions, index: number): Promise<import("n8n-workflow").NodeExecutionWithMetadata[]>;
