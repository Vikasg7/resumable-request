"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const graceful_fs_1 = require("graceful-fs");
class BrokenServer {
    constructor() {
        this._filePath = process.argv[2];
        this._fileSize = graceful_fs_1.statSync(this._filePath).size;
        this._brokenSize = 20000; // in bytes
        this._port = 3000;
    }
    startServer() {
        this._server = http_1.createServer((req, res) => {
            if (req.url.includes("fullfile")) {
                res.setHeader("Content-Length", this._fileSize + "");
                graceful_fs_1.createReadStream(this._filePath).pipe(res);
            }
            else if (req.url.includes("brokenfile")) {
                const start = parseInt(req.headers.range.match(/.*\=(\d*)-\d*/)[1]);
                res.setHeader("Content-Length", this._fileSize + "");
                graceful_fs_1.createReadStream(this._filePath, { start: start, end: start + this._brokenSize }).pipe(res);
            }
            else {
                res.writeHead(200, { "Content-type": "text/html" });
                res.end(`
               <a href="./fullfile.gz">Stream full .gz file</a><br>
               <a href="./brokenfile.gz">Stream broken .gz file</a>
            `);
            }
        });
        this._server.listen(this._port, () => console.log(`Server started on port ${this._port}`));
    }
}
exports.BrokenServer = BrokenServer;
new BrokenServer().startServer();
//# sourceMappingURL=server.js.map