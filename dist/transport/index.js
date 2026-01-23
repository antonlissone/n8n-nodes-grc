"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAI360ApiRequest = SAI360ApiRequest;
exports.SAI360ApiRequestWithDetails = SAI360ApiRequestWithDetails;
exports.SAI360ApiLogin = SAI360ApiLogin;
exports.SAI360GetLog = SAI360GetLog;
async function SAI360ApiRequest(method, endpoint, body = {}, qs = {}, optionsOverrides = { json: true }) {
    const result = await SAI360ApiRequestWithDetails.call(this, method, endpoint, body, qs, optionsOverrides);
    return result.response.body;
}
async function SAI360ApiRequestWithDetails(method, endpoint, body = {}, qs = {}, optionsOverrides = { json: true }) {
    var _a, _b;
    const basicCreds = await this.getCredentials('sai360GrcBasicApi').catch(() => undefined);
    const oauthCreds = await this.getCredentials('sai360GrcOAuth2Api').catch(() => undefined);
    let credentials;
    let authentication;
    if (basicCreds) {
        credentials = basicCreds;
        authentication = 'basic';
    }
    else if (oauthCreds) {
        credentials = oauthCreds;
        authentication = 'oauth2';
    }
    else {
        throw new Error('No SAI360 credentials found. Please set either Basic Auth or OAuth2 credentials.');
    }
    const baseUrl = credentials.baseUrl;
    const finalURL = `${baseUrl}${endpoint}`;
    const baseHeaders = {
        ...(optionsOverrides.json !== false ? { 'Accept': 'application/json' } : {}),
        ...(optionsOverrides.headers || {}),
    };
    const options = {
        method,
        url: finalURL,
        body,
        qs,
        json: true,
        returnFullResponse: true,
        ignoreHttpStatusErrors: true,
        ...optionsOverrides,
        headers: baseHeaders,
    };
    const isEmptyBody = !body || (typeof body === 'object' && Object.keys(body).length === 0) || (typeof body === 'string' && body.length === 0);
    if (isEmptyBody) {
        delete options.body;
    }
    const safeExtractHeaders = (headers) => {
        if (!headers || typeof headers !== 'object')
            return undefined;
        try {
            const safeHeaders = {};
            for (const [key, value] of Object.entries(headers)) {
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                    safeHeaders[key] = value;
                }
                else if (Array.isArray(value)) {
                    safeHeaders[key] = value.filter(v => typeof v === 'string' || typeof v === 'number').join(', ');
                }
            }
            return Object.keys(safeHeaders).length > 0 ? safeHeaders : undefined;
        }
        catch {
            return undefined;
        }
    };
    const buildDetails = (requestHeaders, requestBody, fullResponse) => {
        const statusCode = fullResponse.statusCode;
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
    if (authentication === 'oauth2') {
        const oauthHeaders = { ...baseHeaders };
        const oauthOptions = {
            method,
            url: finalURL,
            body,
            qs,
            json: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            ...optionsOverrides,
            headers: oauthHeaders,
        };
        const isOauthEmptyBody = !body || (typeof body === 'object' && Object.keys(body).length === 0) || (typeof body === 'string' && body.length === 0);
        if (isOauthEmptyBody) {
            delete oauthOptions.body;
        }
        const fullResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'sai360GrcOAuth2Api', oauthOptions);
        return buildDetails({ ...oauthHeaders, Authorization: 'Bearer [OAUTH2_TOKEN]' }, body && Object.keys(body).length > 0 ? body : undefined, fullResponse);
    }
    if (authentication === 'basic') {
        const staticData = this.getWorkflowStaticData('global');
        let sessionId = staticData.sessionId;
        if (!sessionId) {
            const loginResponse = await SAI360ApiLogin.call(this, baseUrl, credentials.username, credentials.password);
            sessionId = (_a = loginResponse.sessionid) !== null && _a !== void 0 ? _a : loginResponse.token;
            if (!sessionId) {
                throw new Error('SAI360 login did not return a sessionId or token');
            }
            staticData.sessionId = sessionId;
        }
        const requestHeaders = {
            ...baseHeaders,
            'bwise-session': sessionId,
        };
        options.headers = requestHeaders;
        try {
            const fullResponse = await this.helpers.httpRequest(options);
            return buildDetails(requestHeaders, body && Object.keys(body).length > 0 ? body : undefined, fullResponse);
        }
        catch (err) {
            const error = err;
            if (error.statusCode === 401 || error.statusCode === 403) {
                delete staticData.sessionId;
                const loginResponse = await SAI360ApiLogin.call(this, baseUrl, credentials.username, credentials.password);
                sessionId = (_b = loginResponse.sessionid) !== null && _b !== void 0 ? _b : loginResponse.token;
                if (!sessionId)
                    throw new Error('SAI360 login retry failed');
                staticData.sessionId = sessionId;
                const retryHeaders = {
                    ...baseHeaders,
                    'bwise-session': sessionId,
                };
                options.headers = retryHeaders;
                const fullResponse = await this.helpers.httpRequest(options);
                return buildDetails(retryHeaders, body && Object.keys(body).length > 0 ? body : undefined, fullResponse);
            }
            throw err;
        }
    }
    throw new Error(`Unsupported auth type: ${authentication}`);
}
async function SAI360ApiLogin(baseUrl, username, password) {
    const finalURL = `${baseUrl}/api/login`;
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);
    const options = {
        method: 'POST',
        url: finalURL,
        body: body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        json: false,
    };
    return await this.helpers.httpRequest(options);
}
async function SAI360GetLog() {
    try {
        const logResponse = await SAI360ApiRequestWithDetails.call(this, 'GET', '/api/log', {}, {}, {});
        return parseSai360Messages(logResponse.response.body);
    }
    catch {
        return 'Unable to retrieve error log';
    }
}
function parseSai360Messages(body) {
    if (!body)
        return '';
    if (typeof body === 'object') {
        const saiResponse = body;
        const messages = [];
        const messageTypes = ['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'];
        for (const type of messageTypes) {
            const typeMessages = saiResponse[type];
            if (typeMessages && Array.isArray(typeMessages) && typeMessages.length > 0) {
                messages.push(`${type}: ${typeMessages.join('; ')}`);
            }
        }
        if (messages.length > 0) {
            return messages.join('\n');
        }
        return JSON.stringify(body);
    }
    return String(body);
}
//# sourceMappingURL=index.js.map