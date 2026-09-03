const app = require('./app');
const server = app.server;

module.exports = server;
module.exports.server = server;
module.exports.app = app;