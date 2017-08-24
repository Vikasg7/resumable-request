/// <reference types="request" />
/// <reference types="node" />
import { Options } from "request";
import { PassThrough } from "stream";
export declare class ResumableRequest {
    private _reqOptions;
    private _maxRetries;
    private _through;
    private _bytesRead;
    private _bytesReadOnError;
    private _contentLength;
    private _retries;
    constructor(_reqOptions: Options, _maxRetries?: number);
    private _resumableRequest();
    private _resumeOrEnd(error?);
    private _cleanUp();
    getStream(): PassThrough;
}
