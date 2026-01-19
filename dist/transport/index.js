"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAI360ApiRequest = SAI360ApiRequest;
exports.SAI360ApiLogin = SAI360ApiLogin;
async function SAI360ApiRequest(method, endpoint, body = {}, qs = {}, headers = {}, optionsOverrides = { json: true }) {
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
    const options = {
        method,
        url: finalURL,
        body,
        qs,
        json: true,
        ...optionsOverrides,
    };
    if (!body || Object.keys(body).length === 0) {
        delete options.body;
    }
    if (authentication === 'oauth2') {
        console.log('Making OAuth2 request to', finalURL);
        const oauthOptions = {
            method,
            url: finalURL,
            body,
            qs,
            json: true,
            ...optionsOverrides,
        };
        if (!body || Object.keys(body).length === 0) {
            delete oauthOptions.body;
        }
        console.log('OAuth2 Options:', JSON.stringify(oauthOptions));
        const response = await this.helpers.requestWithAuthentication.call(this, 'sai360GrcOAuth2Api', oauthOptions);
        return response;
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
        options.headers = {
            ...options.headers,
            'bwise-session': sessionId,
        };
        try {
            return await this.helpers.httpRequest(options);
        }
        catch (err) {
            if (err.statusCode === 401 || err.statusCode === 403) {
                delete staticData.sessionId;
                const loginResponse = await SAI360ApiLogin.call(this, baseUrl, credentials.username, credentials.password);
                sessionId = (_b = loginResponse.sessionid) !== null && _b !== void 0 ? _b : loginResponse.token;
                if (!sessionId)
                    throw new Error('SAI360 login retry failed');
                staticData.sessionId = sessionId;
                options.headers['bwise-session'] = sessionId;
                return await this.helpers.httpRequest(options);
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
//# sourceMappingURL=index.js.map