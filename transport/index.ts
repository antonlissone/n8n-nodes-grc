import type {
	IHttpRequestOptions,
	IHttpRequestMethods,
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
} from 'n8n-workflow';

export interface HttpRequestDetails {
	request: {
		method: IHttpRequestMethods;
		url: string;
		headers: IDataObject;
		body?: IDataObject | string;
	};
	response: {
		statusCode?: number;
		headers?: IDataObject;
		body: unknown;
		isError?: boolean;
	};
}

/**
 * Unified SAI360 API request helper.
 * Automatically handles Basic Auth (session) or OAuth2 credentials.
 */
export async function SAI360ApiRequest(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject | string = {},
	qs: IDataObject = {},
	optionsOverrides: IDataObject = { json: true },
) {
	const result = await SAI360ApiRequestWithDetails.call(this, method, endpoint, body, qs, optionsOverrides);
	return result.response.body;
}

/**
 * SAI360 API request that returns full HTTP details (headers, status, etc.)
 */
export async function SAI360ApiRequestWithDetails(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject | string = {},
	qs: IDataObject = {},
	optionsOverrides: IDataObject = { json: true },
): Promise<HttpRequestDetails> {
	// Try to get either Basic or OAuth2 credentials
	const basicCreds = await this.getCredentials('sai360GrcBasicApi').catch(() => undefined);
	const oauthCreds = await this.getCredentials('sai360GrcOAuth2Api').catch(() => undefined);

	let credentials: IDataObject;
	let authentication: 'basic' | 'oauth2';

	if (basicCreds) {
		credentials = basicCreds;
		authentication = 'basic';
	} else if (oauthCreds) {
		credentials = oauthCreds;
		authentication = 'oauth2';
	} else {
		throw new Error('No SAI360 credentials found. Please set either Basic Auth or OAuth2 credentials.');
	}

	const baseUrl = credentials.baseUrl as string;
	const finalURL = `${baseUrl}${endpoint}`;

	// Build base request headers
	// Only default to Accept: application/json if json mode is not explicitly disabled
	const baseHeaders: IDataObject = {
		...(optionsOverrides.json !== false ? { 'Accept': 'application/json' } : {}),
		...(optionsOverrides.headers as IDataObject || {}),
	};

	const options: IHttpRequestOptions = {
		method,
		url: finalURL,
		body,
		qs,
		json: true,
		returnFullResponse: true, // Get full response with headers and status
		ignoreHttpStatusErrors: true, // Don't throw on 4xx/5xx - capture the response
		...optionsOverrides,
		headers: baseHeaders,
	};

	// Remove empty body (handle both object and string)
	const isEmptyBody = !body || (typeof body === 'object' && Object.keys(body).length === 0) || (typeof body === 'string' && body.length === 0);
	if (isEmptyBody) {
		delete options.body;
	}

	// Helper to safely extract headers (avoid circular references)
	const safeExtractHeaders = (headers: unknown): IDataObject | undefined => {
		if (!headers || typeof headers !== 'object') return undefined;
		try {
			// Only extract simple key-value pairs from headers
			const safeHeaders: IDataObject = {};
			for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
				if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
					safeHeaders[key] = value;
				} else if (Array.isArray(value)) {
					safeHeaders[key] = value.filter(v => typeof v === 'string' || typeof v === 'number').join(', ');
				}
			}
			return Object.keys(safeHeaders).length > 0 ? safeHeaders : undefined;
		} catch {
			return undefined;
		}
	};

	// Helper to build HttpRequestDetails from response
	const buildDetails = (
		requestHeaders: IDataObject,
		requestBody: IDataObject | string | undefined,
		fullResponse: IDataObject,
	): HttpRequestDetails => {
		const statusCode = fullResponse.statusCode as number | undefined;
		const isError = statusCode ? statusCode >= 400 : false;
		return {
			request: {
				method,
				url: finalURL,
				headers: requestHeaders,
				body: requestBody,
			},
			response: {
				statusCode,
				headers: safeExtractHeaders(fullResponse.headers),
				body: fullResponse.body,
				isError,
			},
		};
	};

	// =========================
	// AUTH SWITCH
	// =========================
	if (authentication === 'oauth2') {
		const oauthHeaders: IDataObject = { ...baseHeaders };

		const oauthOptions: IHttpRequestOptions = {
			method,
			url: finalURL,
			body,
			qs,
			json: true,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true, // Don't throw on 4xx/5xx - capture the response
			...optionsOverrides,
			headers: oauthHeaders,
		};

		// Remove empty body (handle both object and string)
		const isOauthEmptyBody = !body || (typeof body === 'object' && Object.keys(body).length === 0) || (typeof body === 'string' && body.length === 0);
		if (isOauthEmptyBody) {
			delete oauthOptions.body;
		}

		// httpRequestWithAuthentication will automatically attach the OAuth2 token
		const fullResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'sai360GrcOAuth2Api',
			oauthOptions,
		) as IDataObject;

		// Note: OAuth2 headers may be modified by n8n, we capture what we can
		return buildDetails(
			{ ...oauthHeaders, Authorization: 'Bearer [OAUTH2_TOKEN]' },
			body && Object.keys(body).length > 0 ? body : undefined,
			fullResponse,
		);
	}

	if (authentication === 'basic') {
		// Get workflow-level static data
		const staticData = this.getWorkflowStaticData('global') as IDataObject;

		// Reuse sessionId if exists
		let sessionId = staticData.sessionId as string | undefined;

		if (!sessionId) {
			// No session → login
			const loginResponse = await SAI360ApiLogin.call(
				this,
				baseUrl,
				credentials.username as string,
				credentials.password as string,
			) as IDataObject;

			sessionId = (loginResponse.sessionid as string) ?? (loginResponse.token as string);

			if (!sessionId) {
				throw new Error('SAI360 login did not return a sessionId or token');
			}

			// Store it in workflow-level static data
			staticData.sessionId = sessionId;
		}

		// Add session header
		const requestHeaders: IDataObject = {
			...baseHeaders,
			'bwise-session': sessionId,
		};
		options.headers = requestHeaders;

		// Make the request
		try {
			const fullResponse = await this.helpers.httpRequest!(options) as IDataObject;
			return buildDetails(
				requestHeaders,
				body && Object.keys(body).length > 0 ? body : undefined,
				fullResponse,
			);
		} catch (err: unknown) {
			const error = err as { statusCode?: number };
			// Retry once if session expired
			if (error.statusCode === 401 || error.statusCode === 403) {
				delete staticData.sessionId;

				const loginResponse = await SAI360ApiLogin.call(
					this,
					baseUrl,
					credentials.username as string,
					credentials.password as string,
				) as IDataObject;

				sessionId = (loginResponse.sessionid as string) ?? (loginResponse.token as string);
				if (!sessionId) throw new Error('SAI360 login retry failed');

				staticData.sessionId = sessionId;
				const retryHeaders: IDataObject = {
					...baseHeaders,
					'bwise-session': sessionId,
				};
				options.headers = retryHeaders;

				const fullResponse = await this.helpers.httpRequest!(options) as IDataObject;
				return buildDetails(
					retryHeaders,
					body && Object.keys(body).length > 0 ? body : undefined,
					fullResponse,
				);
			}

			throw err;
		}
	}

	throw new Error(`Unsupported auth type: ${authentication}`);
}

/**
 * Performs login for Basic Auth credential.
 */
export async function SAI360ApiLogin(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions,
	baseUrl: string,
	username: string,
	password: string,
) {
	const finalURL = `${baseUrl}/api/login`;

	const body = new URLSearchParams();
	body.append('username', username);
	body.append('password', password);

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: finalURL,
		body: body as unknown as IDataObject,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json',
		},
		json: false,
	};

	return await this.helpers.httpRequest!(options);
}

/**
 * Fetches the SAI360 API log for debugging/error details.
 * Returns parsed messages or the raw response.
 */
export async function SAI360GetLog(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions,
): Promise<string> {
	try {
		const logResponse = await SAI360ApiRequestWithDetails.call(
			this,
			'GET',
			'/api/log',
			{},
			{},
			{},
		);
		return parseSai360Messages(logResponse.response.body);
	} catch {
		return 'Unable to retrieve error log';
	}
}

/**
 * Helper to parse SAI360 JSON API response messages.
 * Private - used internally by SAI360GetLog.
 */
function parseSai360Messages(body: unknown): string {
	if (!body) return '';

	// If it's an object (JSON response), try to extract message arrays
	if (typeof body === 'object') {
		const saiResponse = body as IDataObject;
		const messages: string[] = [];

		// Extract messages from SAI360 JSON response structure
		const messageTypes = ['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'];
		for (const type of messageTypes) {
			const typeMessages = saiResponse[type] as string[] | undefined;
			if (typeMessages && Array.isArray(typeMessages) && typeMessages.length > 0) {
				messages.push(`${type}: ${typeMessages.join('; ')}`);
			}
		}

		if (messages.length > 0) {
			return messages.join('\n');
		}

		// Fallback to JSON stringify
		return JSON.stringify(body);
	}

	// If it's a string (possibly XML), return as-is
	return String(body);
}
