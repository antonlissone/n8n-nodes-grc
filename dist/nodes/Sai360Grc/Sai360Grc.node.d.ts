import { type INodeType, type INodeTypeDescription, type IExecuteFunctions, type ILoadOptionsFunctions, type ResourceMapperFields } from 'n8n-workflow';
export declare class Sai360Grc implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getDatastores(this: ILoadOptionsFunctions): Promise<{
                name: string;
                value: string;
                description: string;
            }[]>;
            getTables(this: ILoadOptionsFunctions): Promise<{
                name: string;
                value: string;
                description: string;
            }[]>;
            getTableFieldsForLookup(this: ILoadOptionsFunctions): Promise<{
                name: string;
                value: string;
                description: string;
            }[]>;
        };
        resourceMapping: {
            getTableAttributes(this: ILoadOptionsFunctions): Promise<ResourceMapperFields>;
        };
    };
    execute(this: IExecuteFunctions): Promise<import("n8n-workflow").INodeExecutionData[][]>;
}
