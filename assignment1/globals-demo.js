// Log __dirname and __filename


// Log process ID and platform


// Attach a custom property to global and log it
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);
console.log('Process ID:', process.pid);
console.log('Platform:', process.platform);

global.myCustomVar = 'Hello, global!';
console.log('Custom global variable:', global.myCustomVar);