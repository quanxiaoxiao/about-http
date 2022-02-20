import createError from 'http-errors';
import { omit } from 'lodash';
import httpConnect from './connect.mjs';
import hrefParser from './hrefParser.mjs';

export default (options) => new Promise((resolve, reject) => {
  const state = {
    completed: false,
  };
  const hrefOptions = hrefParser(options.url);
  const bufList = [];
  let size = 0;
  const connect = httpConnect(omit({
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
          const ret = options.match(res.statusCode, res.headers);
          if (!ret) {
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
            reject(createError(500, error.message));
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
