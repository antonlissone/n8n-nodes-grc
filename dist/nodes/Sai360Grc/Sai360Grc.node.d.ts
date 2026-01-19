import { type INodeType, type INodeTypeDescription, type IExecuteFunctions } from 'n8n-workflow';
export declare class Sai360Grc implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<import("n8n-workflow").INodeExecutionData[][]>;
}
