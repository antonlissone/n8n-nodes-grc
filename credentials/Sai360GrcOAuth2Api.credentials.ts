import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class Sai360GrcOAuth2Api implements ICredentialType {
	name = 'sai360GrcOAuth2Api';

	extends = ['oAuth2Api'];

	icon = { light: 'file:sai360logo.svg', dark: 'file:sai360logo.dark.svg' } as const;

	displayName = 'SAI360 GRC OAuth2 API';

	// Link to your community node's README
	documentationUrl = 'https://github.com/org/@sai360/-grc?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://customer.sai360.net/bwise',
			required: true,
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'string',
			default: 'https://customer.sai360.net/bwise/api/oauth2/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'string',
			default: 'https://customer.sai360.net/bwise/api/oauth2/token',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			default: '',
			typeOptions: { password: true },
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'offline_access',
		},
	];
}
