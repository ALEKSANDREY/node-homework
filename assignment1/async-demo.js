const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration
const targetDir = path.join(__dirname, 'sample-files');
const filePath = path.join(targetDir, 'sample.txt');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
}

fs.writeFileSync(filePath, 'Hello, async world!');

// 1. Callback style


fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) return console.log('Callback read failed:', err.message);
    console.log('Callback read:', content);
});

  // Callback hell example (test and leave it in comments):

/*
===================================================================
CALLBACK HELL EXAMPLE:
fs.readFile(filePath, 'utf8', (err, data1) => {
    fs.readFile(filePath, 'utf8', (err, data2) => {
        fs.readFile(filePath, 'utf8', (err, data3) => {
            // Nesting multiple dependent async operations forms a pyramid of doom
        });
    });
});
===================================================================
*/
  // 2. Promise style
function readTextFile(pathString) {
    return new Promise((resolve, reject) => {
        fs.readFile(pathString, 'utf8', (err, content) => {
            if (err) return reject(err);
            resolve(content);
        });
    });
}

readTextFile(filePath)
    .then((content) => {
        console.log('Promise read:', content);
    })
    .catch((err) => console.log('Promise failed:', err.message));

      // 3. Async/Await style
async function runAsyncRead() {
    try {
        const content = await readTextFile(filePath);
        console.log('Async/Await read:', content);
    } catch (err) {
        console.log('Async/Await failed:', err.message);
    }
}
runAsyncRead();