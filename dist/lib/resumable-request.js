"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const Request = require("request");
class ResumableRequest {
    constructor(_reqOptions, _maxRetries) {
        this._reqOptions = _reqOptions;
        this._maxRetries = _maxRetries;
        this._through = new stream_1.PassThrough();
        this._through
            .on("end", () => this._cleanUp())
            .on("error", () => this._through.end());
        this._bytesRead = 0;
        this._bytesReadOnError = 0;
        this._contentLength = 0;
        this._retries = 0;
        // Adding time to _reqOptions, it important. Read here
        // https://www.npmjs.com/package/request#timeouts
        this._reqOptions.timeout = this._reqOptions.timeout || 15000;
    }
    _resumableRequest() {
        this._reqOptions.headers = this._reqOptions.headers || {};
        this._reqOptions.headers.range = `bytes=${this._bytesRead}-`;
        Request(this._reqOptions)
            .on("response", (resp) => {
            if (resp.statusCode >= 400) {
                this._through.emit("error", new Error(`${resp.statusCode} - ${resp.statusMessage}`));
            }
            else if (this._contentLength == 0) {
                this._contentLength = parseInt(resp.headers["content-length"]);
            }
        })
            .on("data", (data) => this._bytesRead += data.length)
            .on("error", (error) => this._resumeOrEnd(error))
            .on("end", () => this._resumeOrEnd())
            .pipe(this._through, { end: false });
    }
    _resumeOrEnd(error) {
        if (this._retries >= this._maxRetries) {
            this._through.emit("error", new Error("Max Retries Reached!"));
        }
        else if ((error ? error.code : false)) {
            // Only resume on following cases
            if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ESOCKETTIMEDOUT"].indexOf(error.code) > -1) {
                // Only increase retries when bytesRead don't change on successive error
                if (this._bytesRead === this._bytesReadOnError) {
                    this._retries += 1;
                }
                else {
                    this._bytesReadOnError = this._bytesRead;
                    this._retries = 1;
                }
                this._resumableRequest();
            }
            else {
                // This is throw other errors
                this._through.emit("error", error);
            }
        }
        else if (this._bytesRead == this._contentLength) {
            this._through.end();
        }
        else if (this._bytesRead < this._contentLength) {
            this._resumableRequest();
        }
        else if (this._bytesRead > this._contentLength) {
            this._through.emit("error", new Error("Weird, Received more bytes than content length"));
        }
        else {
            this._through.emit("error", new Error("Sorry, This error case is not covered. Refer resumable-request.js"));
        }
    }
    _cleanUp() {
        this._bytesRead = null;
        this._bytesReadOnError = null;
        this._contentLength = null;
        this._retries = null;
        this._through = null;
    }
    getStream() {
        this._resumableRequest();
        return this._through;
    }
}
exports.ResumableRequest = ResumableRequest;
//# sourceMappingURL=resumable-request.js.map