const connect = require('./connect');
const forward = require('./forward');
const fetchData = require('./fetchData');
const receiveData = require('./receiveData');
const receiveJSON = require('./receiveJSON');

module.exports = {
  httpConnect: connect,
  httpForward: forward,
  fetchData,
  receiveData,
  receiveJSON,
};
