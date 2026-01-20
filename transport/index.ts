import type {
	IHttpRequestOptions,
	IHttpRequestMethods,
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
} from 'n8n-workflow';

/**
 * Unified SAI360 API request helper.
 * Automatically handles Basic Auth (session) or OAuth2 credentials.
 */
export async function SAI360ApiRequest(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	optionsOverrides: IDataObject = { json: true },
) {
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

	const options: IHttpRequestOptions = {
		method,
		url: finalURL,
		body,
		qs,
		json: true,
		...optionsOverrides,
	};

	// Remove empty body
	if (!body || Object.keys(body).length === 0) {
		delete options.body;
	}

	// =========================
	// AUTH SWITCH
	// =========================
	if (authentication === 'oauth2') {
		// only pass body, qs, method, url
		const oauthOptions: IHttpRequestOptions = {
			method,
			url: finalURL,
			body,
			qs,
			json: true,
			...optionsOverrides,
		};

		// Remove empty body
		if (!body || Object.keys(body).length === 0) {
			delete oauthOptions.body;
		}

		// httpRequestWithAuthentication will automatically attach the OAuth2 token
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'sai360GrcOAuth2Api',
			oauthOptions,
		);

		return response;
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
		options.headers = {
			...options.headers,
			'bwise-session': sessionId,
		};

		// Make the request
		try {
			return await this.helpers.httpRequest!(options);
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
				options.headers['bwise-session'] = sessionId;

				return await this.helpers.httpRequest!(options);
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
