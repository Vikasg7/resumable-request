import { createServer, Server } from "http"
import { statSync, createReadStream } from "graceful-fs"

export class BrokenServer {
   private _fileSize: number
   private _brokenSize: number 
   private _filePath: string
   private _server: Server
   private _port: number

   constructor() {
      this._filePath = process.argv[2]
      this._fileSize = statSync(this._filePath).size
      this._brokenSize = 20000 // in bytes
      this._port = 3000
   }

   public startServer() {
      this._server = createServer((req, res) => {
         if (req.url.includes("fullfile")) {
            res.setHeader("Content-Length", this._fileSize + "")            
            createReadStream(this._filePath).pipe(res)
         } else if (req.url.includes("brokenfile")) {
            const start = parseInt((<string>req.headers.range).match(/.*\=(\d*)-\d*/)[1])
            res.setHeader("Content-Length", this._fileSize + "")
            createReadStream(this._filePath, {start: start, end: start + this._brokenSize}).pipe(res)
         } else {
            res.writeHead(200, {"Content-type": "text/html"})
            res.end(`
               <a href="./fullfile.gz">Stream full .gz file</a><br>
               <a href="./brokenfile.gz">Stream broken .gz file</a>
            `)
         }
      })
      this._server.listen(this._port, () => console.log(`Server started on port ${this._port}`))
   }
}

new BrokenServer().startServer()