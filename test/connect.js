const net = require('net');
const test = require('ava');
const connect = require('../src/connect');

test.before((t) => {
  const server = net.createServer((socket) => {
    socket.once('data', (chunk) => {
      const rows = chunk.toString().split('\r\n');
      const [method, pathname] = rows[0].split(/\s+/);
      if (method === 'GET') {
        if (pathname === '/test1') {
          socket.write(Buffer.concat([
            Buffer.from('HTTP/1.1 200 OK\r\n'),
            Buffer.from('Content-Length: 0\r\n\r\n'),
          ]));
        }
        if (pathname === '/test2') {
          socket.end(Buffer.concat([
            Buffer.from('HTTP/1.1 200 OK\r\n'),
            Buffer.from('Content-Length: 3\r\n\r\n'),
            Buffer.from('dd'),
          ]));
        }
        if (pathname === '/test3') {
          socket.write(Buffer.concat([
            Buffer.from('HTTP/1.1 200 OK\r\n'),
            Buffer.from('Content-Length: 3\r\n\r\n'),
            Buffer.from('dd'),
          ]));
          setTimeout(() => {
            socket.write('d');
          }, 1000);
        }
        if (pathname === '/test4') {
          socket.write(Buffer.concat([
            Buffer.from('HTTP/1.1 200 OK\r\n'),
          ]));
          setTimeout(() => {
            socket.end();
          }, 1000);
        }
        if (pathname === '/test5') {
          socket.write(Buffer.concat([
            Buffer.from('HTTP/1.1 200 OK\r\n'),
          ]));
          setTimeout(() => {
            socket.write(Buffer.from('Content-Length: 0\r\n\r\n'));
          }, 1000);
        }
        if (pathname === '/test6') {
          socket.write(Buffer.concat([
            Buffer.from('HTTP/1.1 200 OK\r\n'),
            Buffer.from('Content-Length: 2\r\n\r\n'),
          ]));
          setTimeout(() => {
            socket.end(Buffer.from('a'));
          }, 1000);
        }
        if (pathname === '/test7') {
          socket.write(Buffer.concat([
            Buffer.from('HTTP/1.1 200 OK\r\n'),
            Buffer.from('Content-Length: 2\r\n\r\n'),
          ]));
          setTimeout(() => {
            socket.end();
          }, 1000);
        }
        if (pathname === '/abort2') {
          socket.write(Buffer.concat([
            Buffer.from('HTTP/1.1 200 OK\r\n'),
            Buffer.from('Content-Length: 2\r\n\r\n'),
          ]));
          setTimeout(() => {
            socket.on('error', () => {});
            socket.write('aa');
          }, 1000);
        }
        if (pathname === '/abort3') {
          socket.write(Buffer.concat([
            Buffer.from('HTTP/1.1 200 OK\r\n'),
            Buffer.from('Content-Length: 2\r\n\r\n'),
            Buffer.from('a'),
          ]));
          setTimeout(() => {
            socket.on('error', () => {});
            socket.write('a');
          }, 1000);
        }
      }
    });
  });
  server.listen(3334);
  t.context.server = server;
});

test.after((t) => {
  t.context.server.close();
});

test.cb('connect', (t) => {
  t.plan(1);
  connect({
    hostname: 'localhost',
    port: 3333,
  }, {
    onError: () => {
      t.pass();
    },
    onResponse: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
  });
  setTimeout(() => {
    t.end();
  }, 2000);
});

test.cb('connect1', (t) => {
  t.plan(2);
  connect({
    hostname: 'localhost',
    port: 3334,
    path: '/test1',
  }, {
    onError: () => {
      t.fail();
    },
    onResponse: () => {
      t.pass();
    },
    onData: () => {
      t.fail();
    },
    onEnd: () => {
      t.pass();
    },
    onClose: () => {
      t.fail();
    },
  });
  setTimeout(() => {
    t.end();
  }, 2000);
});

test.cb('connect2', (t) => {
  t.plan(3);
  connect({
    hostname: 'localhost',
    port: 3334,
    path: '/test2',
  }, {
    onError: () => {
      t.fail();
    },
    onResponse: () => {
      t.pass();
    },
    onData: () => {
      t.pass();
    },
    onEnd: () => {
      t.fail();
    },
    onClose: () => {
      t.pass();
    },
  });
  setTimeout(() => {
    t.end();
  }, 2000);
});

test.cb('connect3', (t) => {
  t.plan(4);
  connect({
    hostname: 'localhost',
    port: 3334,
    path: '/test3',
  }, {
    onError: () => {
      t.fail();
    },
    onResponse: () => {
      t.pass();
    },
    onData: () => {
      t.pass();
    },
    onEnd: () => {
      t.pass();
    },
    onClose: () => {
      t.fail();
    },
  });
  setTimeout(() => {
    t.end();
  }, 2000);
});

test.cb('connect4', (t) => {
  t.plan(1);
  connect({
    hostname: 'localhost',
    port: 3334,
    path: '/test4',
  }, {
    onError: () => {
      t.pass();
    },
    onResponse: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
  });
  setTimeout(() => {
    t.end();
  }, 2000);
});

test.cb('connect5', (t) => {
  t.plan(2);
  connect({
    hostname: 'localhost',
    port: 3334,
    path: '/test5',
  }, {
    onError: () => {
      t.fail();
    },
    onResponse: () => {
      t.pass();
    },
    onData: () => {
      t.fail();
    },
    onEnd: () => {
      t.pass();
    },
    onClose: () => {
      t.fail();
    },
  });
  setTimeout(() => {
    t.end();
  }, 2000);
});

test.cb('connect6', (t) => {
  t.plan(3);
  connect({
    hostname: 'localhost',
    port: 3334,
    path: '/test6',
  }, {
    onError: () => {
      t.fail();
    },
    onResponse: () => {
      t.pass();
    },
    onData: () => {
      t.pass();
    },
    onEnd: () => {
      t.fail();
    },
    onClose: () => {
      t.pass();
    },
  });
  setTimeout(() => {
    t.end();
  }, 2000);
});

test.cb('connect7', (t) => {
  t.plan(2);
  connect({
    hostname: 'localhost',
    port: 3334,
    path: '/test7',
  }, {
    onError: () => {
      t.fail();
    },
    onResponse: () => {
      t.pass();
    },
    onData: () => {
      t.fail();
    },
    onEnd: () => {
      t.pass();
    },
    onClose: () => {
      t.pass();
    },
  });
  setTimeout(() => {
    t.end();
  }, 2000);
});

test.cb('connect abort1', (t) => {
  t.plan(0);
  const cc = connect({
    hostname: 'localhost',
    port: 3334,
    path: '/abort1',
  }, {
    onError: () => {
      t.fail();
    },
    onResponse: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
  });
  setTimeout(() => {
    cc();
  }, 1000);
  setTimeout(() => {
    t.end();
  }, 2000);
});

test.cb('connect abort2', (t) => {
  t.plan(1);
  const cc = connect({
    hostname: 'localhost',
    port: 3334,
    path: '/abort2',
  }, {
    onError: () => {
      t.fail();
    },
    onResponse: () => {
      t.pass();
    },
    onData: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
  });
  setTimeout(() => {
    cc();
  }, 500);
  setTimeout(() => {
    t.end();
  }, 2000);
});

test.cb('connect abort3', (t) => {
  t.plan(2);
  const cc = connect({
    hostname: 'localhost',
    port: 3334,
    path: '/abort3',
  }, {
    onError: () => {
      t.fail();
    },
    onResponse: () => {
      t.pass();
    },
    onData: () => {
      t.pass();
    },
    onEnd: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
  });
  setTimeout(() => {
    cc();
  }, 500);
  setTimeout(() => {
    t.end();
  }, 2000);
});

test('invalid body', (t) => {
  t.throws(() => {
    connect({
      hostname: 'localhost',
      port: 3334,
      path: '/abort3',
      body: 22,
    }, {
      onError: () => {
      },
      onResponse: () => {
      },
      onData: () => {
      },
      onEnd: () => {
      },
      onClose: () => {
      },
    });
  });
});

test('some handler is not bind', (t) => {
  t.throws(() => {
    connect({
      hostname: 'localhost',
      port: 3334,
      path: '/abort3',
      body: null,
    }, {
      onError: () => {
      },
      onEnd: () => {
      },
      onClose: () => {
      },
    });
  });
});
