import connect from './connect.mjs';
import forward from './forward.mjs';
import fetchData from './fetchData.mjs';
import receiveData from './receiveData.mjs';
import receiveJSON from './receiveJSON.mjs';
import connectWebSocket from './connectWebSocket.mjs';

export default {
  httpConnect: connect,
  httpForward: forward,
  fetchData,
  receiveData,
  receiveJSON,
  webSocketConnect: connectWebSocket,
};
