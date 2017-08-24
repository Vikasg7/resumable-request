"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const options = { url: "http://localhost:3000/brokenfile" };
const reqHandle = new index_1.ResumableRequest(options);
reqHandle.getStream()
    .pipe(process.stdout);
//# sourceMappingURL=test.js.map