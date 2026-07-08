# Node.js Fundamentals

## What is Node.js?
Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside of a web browser

## How does Node.js differ from running JavaScript in the browser?
Browser JS is sandboxed, interacting with the DOM and window elements to manage UI layouts. Node operates directly at the operating system level, enabling file system interaction, system metrics calculation, and port routing without a document interface.

## What is the V8 engine, and how does Node use it?
The V8 engine is Google’s open-source high-performance runtime engine written in C++ that compiles human JavaScript into native machine code. Node wraps system-level bindings around it to leverage this speed for server environments.

## What are some key use cases for Node.js?
Key use cases include RESTful Web APIs, command-line automation scripts (CLIs), and low-latency data stream workers.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.
CommonJS maps scopes using 'require()' and 'module.exports' executed at runtime. ES Modules use static 'import' and 'export' statements parsed before compilation.

**CommonJS (default in Node.js):**
```js
// mathUtils.js (Exporting)
function add(a, b) {
    return a + b;
}
module.exports = { add };

// app.js (Importing)
const { add } = require('./mathUtils');
console.log(add(5, 10)); //  15
```

**ES Modules (supported in modern Node.js):**
```js
// mathUtils.js (Exporting)
export function add(a, b) {
    return a + b;
}

// app.js (Importing)
import { add } from './mathUtils.js';
console.log(add(5, 10)); //  15
``` 