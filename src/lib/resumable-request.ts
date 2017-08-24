import { Options } from "request"
import { PassThrough } from "stream"
import * as Request from "request"
import { RequestResponse } from "request"

export class ResumableRequest {
   private _through: PassThrough
   private _bytesRead: number
   private _bytesReadOnError: number
   private _contentLength: number
   private _retries: number

   constructor(private _reqOptions: Options, private _maxRetries?: number) {
      this._through = new PassThrough()
      this._through
         .on("end", () => this._cleanUp())
         .on("error", () => this._through.end())
      this._bytesRead = 0
      this._bytesReadOnError = 0
      this._contentLength = 0
      this._retries = 0
      // Adding time to _reqOptions, it important. Read here
      // https://www.npmjs.com/package/request#timeouts
      this._reqOptions.timeout = this._reqOptions.timeout || 15000
   }

   private _resumableRequest() {
      this._reqOptions.headers = this._reqOptions.headers || {}
      this._reqOptions.headers.range = `bytes=${this._bytesRead}-`
      Request(this._reqOptions)
         .on("response", (resp: RequestResponse) => {
            if (resp.statusCode >= 400) {
               this._through.emit("error", new Error(`${resp.statusCode} - ${resp.statusMessage}`))
            } else if (this._contentLength == 0) {
               this._contentLength = parseInt(<string>resp.headers["content-length"])
            }
         })
         .on("data", (data: Buffer) => this._bytesRead += data.length)
         .on("error", (error: any) => this._resumeOrEnd(error))
         .on("end", () => this._resumeOrEnd())
         .pipe(this._through, {end: false})
   }

   private _resumeOrEnd(error?: any) {
      if (this._retries >= this._maxRetries) {
         this._through.emit("error", new Error("Max Retries Reached!"))
      } else if ((error ? error.code : false)) {
         // Only resume on following cases
         if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ESOCKETTIMEDOUT"].indexOf(error.code) > -1) {
            // Only increase retries when bytesRead don't change on successive error
            if (this._bytesRead === this._bytesReadOnError) {
               this._retries += 1
            } else {
               this._bytesReadOnError = this._bytesRead
               this._retries = 1
            }
            this._resumableRequest()
         } else {
            // This is throw other errors
            this._through.emit("error", error)
         }
      } else if (this._bytesRead == this._contentLength) {
         this._through.end()
      } else if (this._bytesRead < this._contentLength) {
         this._resumableRequest()
      } else if (this._bytesRead > this._contentLength) { // Just in case
         this._through.emit("error", new Error("Weird, Received more bytes than content length"))
      } else {
         this._through.emit("error", new Error("Sorry, This error case is not covered. Refer resumable-request.js"))
      }
   }

   private _cleanUp() {
      this._bytesRead = null
      this._bytesReadOnError = null
      this._contentLength = null
      this._retries = null
      this._through = null
   }

   public getStream(): PassThrough {
      this._resumableRequest()
      return this._through
   }
}