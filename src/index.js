const connect = require('./connect');
const forward = require('./forward');
const fetchData = require('./fetchData');
const receiveData = require('./receiveData');
const receiveJSON = require('./receiveJSON');
const connectWebSocket = require('./connectWebSocket');

module.exports = {
  httpConnect: connect,
  httpForward: forward,
  fetchData,
  receiveData,
  receiveJSON,
  webSocketConnect: connectWebSocket,
};
