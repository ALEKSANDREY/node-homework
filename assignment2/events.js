const EventEmitter = require("events");
const emitter = new EventEmitter();

// Exactly one listener for the "time" event
emitter.on("time", (message) => {
    console.log("Time received:", message);
});

// Export the emitter for testing suite
module.exports = emitter;

// Run only when file is executed directly
if (require.main === module) {
    setInterval(() => {
        const currentTime = new Date().toString();
        emitter.emit("time", currentTime);
    }, 5000);
}