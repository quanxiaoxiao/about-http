const http = require('http');
const https = require('https');
const url = require('url');

module.exports = (href) => {
  if (!/^https?:\/\/\w+/.test(href)) {
    return null;
  }
  const parser = url.parse(href);
  const result = {
    schema: parser.protocol === 'https:' ? https : http,
    port: parser.port // eslint-disable-line
      ? parseInt(parser.port, 10)
      : (parser.protocol === 'https:' ? 443 : 80),
    path: parser.path,
    hostname: parser.hostname,
  };
  return result;
};
