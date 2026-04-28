import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

export class Sai360GrcBasicApi implements ICredentialType {
	name = 'sai360GrcBasicApi';
	displayName = 'SAI360 GRC API (Basic Auth) API';
	icon = { light: 'file:sai360logo.svg', dark: 'file:sai360logo.dark.svg' } as const;
	documentationUrl = 'https://github.com/antonlissone/n8n-nodes-grc';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL (with context e.g. /bwise if applicable)',
			name: 'baseUrl',
			type: 'string',
			default: 'https://customer.sai360.net',
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
		// Hidden, expirable session token. n8n calls preAuthentication() whenever this
		// field is empty or considered expired (e.g. after a 401), and persists the
		// returned value back to the credential record automatically.
		{
			displayName: 'Session ID',
			name: 'sessionId',
			type: 'hidden',
			typeOptions: {
				expirable: true,
			},
			default: '',
		},
	];

	// Logs in to /api/login (form-urlencoded) and returns the bwise-session token.
	// Only invoked when sessionId is empty or has expired — n8n caches the result
	// on the credential record, so workflows share a single session.
	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

		const body = new URLSearchParams();
		body.append('username', credentials.username as string);
		body.append('password', credentials.password as string);

		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}/api/login`,
			body,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
		})) as { sessionid?: string; token?: string };

		const sessionId = response.sessionid ?? response.token;
		if (!sessionId) {
			throw new Error('SAI360 login did not return a sessionid or token');
		}

		return { sessionId };
	}

	// Inject the bwise-session header on every outgoing request that uses this credential.
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'bwise-session': '={{$credentials.sessionId}}',
			},
		},
	};

	// Hits a lightweight authenticated endpoint to validate credentials.
	// preAuthentication() runs first to obtain a fresh session token.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/versioninfo',
			method: 'GET',
		},
	};
}
