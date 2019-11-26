/* eslint no-use-before-define: 0 */
const http = require('http');
const https = require('https');
const url = require('url');
const _ = require('lodash');

const createHttpHeader = (line, headers) => `${Object.keys(headers).reduce((head, key) => {
  const value = headers[key];
  if (!Array.isArray(value)) {
    head.push(`${key}: ${value}`);
    return head;
  }
  for (let i = 0; i < value.length; i++) {
    head.push(`${key}: ${value[i]}`);
  }
  return head;
}, [line]).join('\r\n')}\r\n\r\n`;

module.exports = ({ url: href, ...other }, req, socket) => {
  if (!/^wss?:\/\/w+/.test(href)) {
    console.error('web socket url invalid');
    socket.destroy();
    return;
  }
  const parser = url.parse(href);
  const { schema, ...options } = {
    hostname: parser.hostname,
    schema: parser.protocol === 'wss:' ? https : http,
    port: parser.port // eslint-disable-line
      ? parseInt(parser.port, 10)
      : (parser.protocol === 'wss:' ? 443 : 80),
    path: parser.path,
  };

  socket.setTimeout(0);
  socket.setNoDelay(true);
  socket.setKeepAlive(true, 0);

  const proxyReq = schema.request({
    ...options,
    method: 'GET',
    headers: _.omit(req.headers, ['host', 'referer']),
    ...other,
  });

  function handleProxyReqError(error) {
    console.error(error);
    proxyReq.off('response', handleProxyReqResponse);
    proxyReq.off('upgrade', handleProxyReqUpgrade);
    proxyReq.abort();
    socket.destroy();
  }

  function handleProxyReqResponse(proxyRes) {
    proxyReq.off('error', handleProxyReqError);
    if (!proxyRes.upgrade) {
      socket.on('error', () => {});
      socket.write(createHttpHeader(`HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}`, proxyRes.headers));
      proxyRes.pipe(socket);
    }
  }

  function handleProxyReqUpgrade(proxyRes, proxySocket) {
    proxyRes.off('response', handleProxyReqResponse);
    proxyReq.off('error', handleProxyReqError);
    socket.once('error', () => {
      proxySocket.end();
    });
    proxySocket.once('error', () => {
      socket.end();
    });
    socket.write(createHttpHeader('HTTP/1.1 101 Switching Protocols', proxyRes.headers));
    proxySocket.pipe(socket).pipe(proxySocket);
  }

  proxyReq.once('error', handleProxyReqError);
  proxyReq.once('response', handleProxyReqResponse);
  proxyReq.once('upgrade', handleProxyReqUpgrade);

  proxyReq.end();
};
