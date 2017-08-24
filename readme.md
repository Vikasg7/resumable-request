# resumable-request

- ### Intro  
   **resumable-request** is Nodejs request with resume support

- ### Install  
   `npm install git+https://github.com/Vikasg7/resumable-request.git`  

- ### Usage (in TypeScript)  
   ````javascript  
   import { ResumableRequest } from "resumable-request"

   const options = {url: "http://example.com/big.file"}
   const reqHandle = new ResumableRequest(options)
   reqHandle.getStream()
      .pipe(process.stdout)
   ````

- ### Example
   Check the tests folder in src folder for an example.