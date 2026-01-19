import { ICredentialType, INodeProperties, ICredentialTestRequest } from 'n8n-workflow';

export class Sai360GrcBasicApi implements ICredentialType {
	name = 'sai360GrcBasicApi';
	displayName = 'SAI360 GRC API (Basic Auth)';
	documentationUrl = '';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://customer.sai360.net/bwise',
			required: true,
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			default: '',
			typeOptions: { password: true },
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			baseURL: '={{ $credentials.baseUrl }}',
			url: '/api/login',
			body: {
				username: '={{ $credentials.username }}',
				password: '={{ $credentials.password }}',
			},
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			json: false,
		},
	};
}
