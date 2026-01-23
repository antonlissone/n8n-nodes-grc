import type { IHttpRequestMethods, IDataObject, IExecuteFunctions, IExecuteSingleFunctions, ILoadOptionsFunctions, IPollFunctions } from 'n8n-workflow';
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
export declare function SAI360ApiRequest(this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions, method: IHttpRequestMethods, endpoint: string, body?: IDataObject | string, qs?: IDataObject, optionsOverrides?: IDataObject): Promise<unknown>;
export declare function SAI360ApiRequestWithDetails(this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions, method: IHttpRequestMethods, endpoint: string, body?: IDataObject | string, qs?: IDataObject, optionsOverrides?: IDataObject): Promise<HttpRequestDetails>;
export declare function SAI360ApiLogin(this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions, baseUrl: string, username: string, password: string): Promise<any>;
export declare function SAI360GetLog(this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions): Promise<string>;
