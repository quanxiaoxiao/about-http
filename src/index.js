const connect = require('./connect');
const forward = require('./forward');
const fetchData = require('./fetchData');

module.exports = {
  httpConnect: connect,
  httpForward: forward,
  fetchData,
};
