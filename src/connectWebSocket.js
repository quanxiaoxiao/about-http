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

module.exports = ({
  url: href,
  logger,
  ...other
}, req, socket) => {
  if (!/^wss?:\/\/.+/.test(href)) {
    if (logger && logger.error) {
      logger.error(`web socket url: ${href}, invalid`);
    }
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
    if (logger && logger.error) {
      logger.error(error);
    }
    if (!socket.destroyed) {
      socket.destroy();
    }
  }

  function handleSocketError(error) {
    if (logger && logger.error) {
      logger.error(error);
    }
    proxyReq.off('upgrade', handleProxyReqUpgrade);
    proxyReq.off('response', handleProxyReqResponse);
    proxyReq.abort();
  }

  function handleProxyReqUpgrade(proxyRes, proxySocket) {
    proxyReq.off('response', handleProxyReqResponse);
    if (!socket.destroyed) {
      proxyRes.on('error', () => {
        if (!socket.destroyed) {
          socket.destroy();
        }
      });
      proxyReq.on('error', () => {
        if (!socket.destroyed) {
          socket.destroy();
        }
      });
      proxyReq.off('error', handleProxyReqError);
      socket.off('error', handleSocketError);
      socket.on('error', (error) => {
        if (logger && logger.error) {
          logger.error(error);
        }
        if (!proxySocket.destroyed) {
          proxySocket.destroy();
        }
      });
      proxySocket.on('error', (error) => {
        if (logger && logger.error) {
          logger.error(error);
        }
        if (socket.destroyed) {
          socket.destroy();
        }
      });
      socket.write(createHttpHeader('HTTP/1.1 101 Switching Protocols', proxyRes.headers));
      if (!socket.destroyed) {
        proxySocket.pipe(socket);
        socket.pipe(proxySocket);
      } else {
        proxySocket.destroy();
      }
    } else {
      proxySocket.destroy();
    }
  }

  function handleProxyReqResponse(proxyRes) {
    socket.off('error', handleSocketError);
    if (socket.destroyed) {
      proxyRes.destroy();
    } else if (!proxyRes.upgrade) {
      socket.once('error', () => {});
      socket.write(createHttpHeader(`HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}`, proxyRes.headers));
      proxyRes.pipe(socket);
    }
  }

  proxyReq.once('error', handleProxyReqError);
  proxyReq.once('upgrade', handleProxyReqUpgrade);
  proxyReq.once('response', handleProxyReqResponse);

  socket.once('error', handleSocketError);

  proxyReq.end();
};
