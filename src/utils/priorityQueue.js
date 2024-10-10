const moment = require("moment-timezone");

export default class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(reminder) {
    this.queue.push(reminder);
    this.sort();
  }

  dequeue() {
    return this.queue.shift();
  }

  sort() {
    this.queue.sort((a, b) => {
      const dateA = moment.tz(a.deliveryDateTime, a.timeZone);
      const dateB = moment.tz(b.deliveryDateTime, b.timeZone);
      return dateA.valueOf() - dateB.valueOf();
    });
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  peek() {
    return this.queue[0];
  }
}
