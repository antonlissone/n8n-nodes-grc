import { ICredentialType, INodeProperties, ICredentialTestRequest } from 'n8n-workflow';
export declare class Sai360GrcBasicApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    properties: INodeProperties[];
    test: ICredentialTestRequest;
}
