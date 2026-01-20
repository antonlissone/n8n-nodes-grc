import type { ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class Sai360GrcOAuth2Api implements ICredentialType {
    name: string;
    extends: string[];
    icon: {
        readonly light: "file:sai360logo.svg";
        readonly dark: "file:sai360logo.dark.svg";
    };
    displayName: string;
    documentationUrl: string;
    properties: INodeProperties[];
}
