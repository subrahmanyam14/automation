const EventEmitter = require("events");

class CustomEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
  }

  addClient(client) {
    this.clients.add(client);
  }

  removeClient(client) {
    this.clients.delete(client);
  }

  emit(event, data) {
    super.emit(event, data);
    this.clients.forEach((client) => {
      client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });
  }
}

module.exports = new CustomEventEmitter();
