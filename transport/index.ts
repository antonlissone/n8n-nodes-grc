import type {
	IHttpRequestOptions,
	IHttpRequestMethods,
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

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
	const result = await SAI360ApiRequestWithDetails.call(
		this,
		method,
		endpoint,
		body,
		qs,
		optionsOverrides,
	);
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
		throw new Error(
			'No SAI360 credentials found. Please set either Basic Auth or OAuth2 credentials.',
		);
	}

	const baseUrl = credentials.baseUrl as string;
	const finalURL = `${baseUrl}${endpoint}`;

	// Build base request headers
	// Only default to Accept: application/json if json mode is not explicitly disabled
	const baseHeaders: IDataObject = {
		...(optionsOverrides.json !== false ? { Accept: 'application/json' } : {}),
		...((optionsOverrides.headers as IDataObject) || {}),
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
	const isEmptyBody =
		!body ||
		(typeof body === 'object' && Object.keys(body).length === 0) ||
		(typeof body === 'string' && body.length === 0);
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
					safeHeaders[key] = value
						.filter((v) => typeof v === 'string' || typeof v === 'number')
						.join(', ');
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

	// Centralised error surfacing: convert any 4xx/5xx response into a NodeApiError so
	// n8n's executions panel renders the HTTP status, structured response, and any
	// SAI360-specific error/warning messages. Set `suppressErrorThrow: true` in
	// `optionsOverrides` to opt out (used by SAI360GetLog to avoid recursion when
	// fetching diagnostics during an error path).
	const throwOnHttpError = async (details: HttpRequestDetails): Promise<HttpRequestDetails> => {
		if (!details.response.isError) return details;
		if (optionsOverrides.suppressErrorThrow) return details;

		const statusCode = details.response.statusCode ?? 0;
		const responseBody = details.response.body;

		// Build a human-readable description: SAI360 message arrays first, then raw body.
		const saiMessages = parseSai360Messages(responseBody);
		const rawBody =
			typeof responseBody === 'string'
				? responseBody
				: responseBody !== null && responseBody !== undefined
					? JSON.stringify(responseBody)
					: '';
		const descriptionParts: string[] = [];
		if (saiMessages) descriptionParts.push(saiMessages);
		else if (rawBody) descriptionParts.push(rawBody);

		// For XML POSTs (e.g. saveXml), the response body is rarely informative — fetch
		// /api/log for the real failure detail and append it to the description.
		const requestContentType = String(
			(details.request.headers?.['Content-Type'] as string) ??
				(details.request.headers?.['content-type'] as string) ??
				'',
		).toLowerCase();
		const isXmlPost = method === 'POST' && requestContentType.includes('xml');
		if (isXmlPost) {
			const apiLog = await SAI360GetLog.call(this);
			if (apiLog && apiLog !== 'Unable to retrieve error log') {
				descriptionParts.push(`API Log:\n${apiLog}`);
			}
		}

		const errorPayload: IDataObject = {
			statusCode,
			body: responseBody as IDataObject | string | null,
			headers: details.response.headers,
		};

		throw new NodeApiError(this.getNode(), errorPayload as JsonObject, {
			message: `SAI360 request failed (${statusCode}) ${method} ${finalURL}`,
			description: descriptionParts.join('\n\n') || undefined,
			httpCode: String(statusCode),
		});
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
		const isOauthEmptyBody =
			!body ||
			(typeof body === 'object' && Object.keys(body).length === 0) ||
			(typeof body === 'string' && body.length === 0);
		if (isOauthEmptyBody) {
			delete oauthOptions.body;
		}

		// httpRequestWithAuthentication will automatically attach the OAuth2 token
		const fullResponse = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'sai360GrcOAuth2Api',
			oauthOptions,
		)) as IDataObject;

		// Note: OAuth2 headers may be modified by n8n, we capture what we can
		return await throwOnHttpError(
			buildDetails(
				{ ...oauthHeaders, Authorization: 'Bearer [OAUTH2_TOKEN]' },
				body && Object.keys(body).length > 0 ? body : undefined,
				fullResponse,
			),
		);
	}

	if (authentication === 'basic') {
		// Session-based auth (bwise-session) is handled by the credential class:
		//   - preAuthentication() in Sai360GrcBasicApi.credentials.ts logs in to /api/login
		//     and returns { sessionId } when sessionId is empty or expired.
		//   - authenticate (generic) injects the bwise-session header on every request.
		//   - On a 401, n8n automatically calls preAuthentication() again and retries once.
		//
		// We deliberately do NOT pass `ignoreHttpStatusErrors: true` here, because
		// httpRequestWithAuthentication only triggers the re-auth/retry flow when the
		// underlying request throws. We catch HTTP errors ourselves below and rebuild
		// the HttpRequestDetails object to preserve the response shape downstream
		// consumers expect (statusCode + isError instead of thrown exceptions).
		const basicOptions: IHttpRequestOptions = { ...options };
		delete basicOptions.ignoreHttpStatusErrors;

		// The bwise-session header is injected by the credential's `authenticate` block;
		// we only show a placeholder in the details we return for logging/debugging.
		const requestHeaders: IDataObject = {
			...baseHeaders,
			'bwise-session': '[SESSION]',
		};

		try {
			const fullResponse = (await this.helpers.httpRequestWithAuthentication.call(
				this,
				'sai360GrcBasicApi',
				basicOptions,
			)) as IDataObject;

			return await throwOnHttpError(
				buildDetails(
					requestHeaders,
					body && Object.keys(body).length > 0 ? body : undefined,
					fullResponse,
				),
			);
		} catch (err: unknown) {
			// Re-throw NodeApiErrors raised by throwOnHttpError unchanged so the n8n UI
			// keeps the structured payload we built.
			if (err instanceof NodeApiError) throw err;

			// Otherwise httpRequestWithAuthentication threw a low-level transport error
			// (network failure, or a 4xx/5xx that escaped because we removed
			// ignoreHttpStatusErrors). Reconstruct an HttpRequestDetails and run it
			// through throwOnHttpError so the failure surfaces with a consistent shape.
			const error = err as {
				statusCode?: number;
				httpCode?: string;
				cause?: { response?: { status?: number; headers?: unknown; data?: unknown } };
				response?: { status?: number; headers?: unknown; body?: unknown; data?: unknown };
				message?: string;
			};

			const statusCode =
				error.statusCode ??
				error.response?.status ??
				error.cause?.response?.status ??
				(error.httpCode ? Number(error.httpCode) : undefined);

			// Not an HTTP error we can map — re-throw the original.
			if (!statusCode) throw err;

			const responseBody =
				error.response?.body ?? error.response?.data ?? error.cause?.response?.data ?? error.message;
			const responseHeaders = error.response?.headers ?? error.cause?.response?.headers;

			return await throwOnHttpError(
				buildDetails(
					requestHeaders,
					body && Object.keys(body).length > 0 ? body : undefined,
					{
						statusCode,
						headers: responseHeaders as IDataObject | undefined,
						body: responseBody,
					},
				),
			);
		}
	}

	throw new Error(`Unsupported auth type: ${authentication}`);
}

/**
 * Fetches the SAI360 API log for debugging/error details.
 * Returns parsed messages or the raw response.
 */
export async function SAI360GetLog(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions,
): Promise<string> {
	try {
		// suppressErrorThrow: GET /api/log is itself called from inside the error path.
		// We never want it to raise — return an empty marker on failure so the caller
		// can decide whether to mention it in the user-facing description.
		const logResponse = await SAI360ApiRequestWithDetails.call(
			this,
			'GET',
			'/api/log',
			{},
			{},
			{ suppressErrorThrow: true },
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
