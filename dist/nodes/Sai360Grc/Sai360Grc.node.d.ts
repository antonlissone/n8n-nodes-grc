import { type INodeType, type INodeTypeDescription, type IExecuteFunctions, type ILoadOptionsFunctions } from 'n8n-workflow';
export declare class Sai360Grc implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getDatastores(this: ILoadOptionsFunctions): Promise<{
                name: string;
                value: string;
                description: string;
            }[]>;
        };
    };
    execute(this: IExecuteFunctions): Promise<import("n8n-workflow").INodeExecutionData[][]>;
}
