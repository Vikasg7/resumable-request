import { ResumableRequest } from "../index"

const options = {url: "http://localhost:3000/brokenfile"}
const reqHandle = new ResumableRequest(options)
reqHandle.getStream()
   .pipe(process.stdout)