const _ = require('lodash');
const httpConnect = require('./connect');
const hrefParser = require('./hrefParser');

module.exports = (options) => new Promise((resolve, reject) => {
  const hrefOptions = hrefParser(options.url);
  if (!hrefOptions) {
    const error = new Error('parse href error');
    error.statusCode = 500;
    reject(error);
  } else {
    const bufList = [];
    let size = 0;
    const connect = httpConnect(_.omit({
      ...hrefOptions,
      ...options,
    }, ['match', 'url']), {
      onError: (err) => {
        console.error(err);
        const error = new Error();
        error.statusCode = 502;
        reject(error);
      },
      onResponse: (res) => {
        if (options.match && !options.match(res.statusCode, res.headers)) {
          connect();
          const error = new Error('not match');
          error.statusCode = res.statusCode;
          reject(error);
        }
      },
      onData: (chunk) => {
        bufList.push(chunk);
        size += chunk.length;
      },
      onEnd: () => {
        resolve(Buffer.concat(bufList, size));
      },
      onClose: () => {
        const error = new Error();
        error.statusCode = 500;
        reject(error);
      },
    });
  }
});
