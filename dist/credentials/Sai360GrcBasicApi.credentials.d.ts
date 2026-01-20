import { ICredentialType, INodeProperties, ICredentialTestRequest } from 'n8n-workflow';
export declare class Sai360GrcBasicApi implements ICredentialType {
    name: string;
    displayName: string;
    icon: {
        readonly light: "file:sai360logo.svg";
        readonly dark: "file:sai360logo.dark.svg";
    };
    documentationUrl: string;
    properties: INodeProperties[];
    test: ICredentialTestRequest;
}
