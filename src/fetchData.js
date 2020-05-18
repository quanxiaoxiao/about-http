const createError = require('http-errors');
const _ = require('lodash');
const httpConnect = require('./connect');
const hrefParser = require('./hrefParser');

module.exports = (options) => new Promise((resolve, reject) => {
  const hrefOptions = hrefParser(options.url);
  const state = {
    completed: false,
  };
  if (!hrefOptions) {
    reject(createError(500, 'url invalid'));
  } else {
    const bufList = [];
    let size = 0;
    const connect = httpConnect(_.omit({
      ...hrefOptions,
      ...options,
    }, ['match', 'url', 'logger']), {
      onError: (err) => {
        if (options.logger && options.logger.error) {
          options.logger.error(err);
        }
        if (!state.completed) {
          state.completed = true;
          reject(createError(err.statusCode || err.status || 502));
        }
      },
      onResponse: (res) => {
        if (options.match && !options.match(res.statusCode, res.headers)) {
          connect();
          if (!state.completed) {
            state.completed = true;
            reject(createError(400));
          }
        }
      },
      onData: (chunk) => {
        bufList.push(chunk);
        size += chunk.length;
      },
      onEnd: () => {
        if (!state.completed) {
          state.completed = true;
          resolve(Buffer.concat(bufList, size));
        }
      },
      onClose: () => {
        if (!state.completed) {
          state.completed = true;
          reject(createError(500));
        }
      },
    });
  }
});
