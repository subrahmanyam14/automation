const SSE = require("express-sse");

class SSEManager {
  constructor() {
    this.sse = new SSE();
  }

  getSSE() {
    return this.sse;
  }

  sendUpdate(data, event = "update") {
    this.sse.send(data, event);
  }
}

module.exports = new SSEManager();
