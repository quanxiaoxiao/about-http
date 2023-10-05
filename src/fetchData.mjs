import createError from 'http-errors';
import _ from 'lodash';
import httpConnect from './connect.mjs';
import parseUrl from './parseUrl.mjs';

export default (options) => new Promise((resolve, reject) => {
  const state = {
    completed: false,
  };
  const hrefOptions = parseUrl(options.url);
  const bufList = [];
  let size = 0;
  const connect = httpConnect(_.omit({
    ...hrefOptions,
    ...options,
  }, ['match', 'url']), {
    onError: (err) => {
      if (!state.completed) {
        state.completed = true;
        reject(createError(err.statusCode || err.status || 502));
      }
    },
    onResponse: (res) => {
      if (options.match) {
        try {
          const ret = options.match(res.statusCode, res.headers, res);
          if (ret === false) {
            connect();
            if (!state.completed) {
              state.completed = true;
              reject(createError(400));
            }
          }
        } catch (error) {
          connect();
          if (!state.completed) {
            state.completed = true;
            const message = error.statusCode || error.status ? '' : error.message;
            reject(createError(error.statusCode || error.status || 500, message));
          }
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
        reject(createError(500, 'socket has closed'));
      }
    },
  });
});
