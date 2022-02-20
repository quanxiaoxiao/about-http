import http from 'http';
import net from 'net';
import test from 'ava'; // eslint-disable-line import/no-unresolved
import receiveData from '../src/receiveData.mjs';

test.cb('receive success', (t) => {
  const port = 6001;
  const server = http.createServer(async (req) => {
    const data = await receiveData(req);
    t.is(data.toString(), 'sss');
    t.end();
    setTimeout(() => {
      server.close();
    }, 1000);
  });

  server.listen(port, () => {
    const socket = net.createConnection({
      hostname: 'localhost',
      port,
    });
    socket.on('connect', () => {
      socket.write(Buffer.concat([
        Buffer.from('POST / HTTP/1.1\r\n'),
        Buffer.from('Content-Length:3\r\n\r\n'),
      ]));
      socket.end(Buffer.from('sss'));
    });
  });
});

test.cb('receive fail1', (t) => {
  const port = 6003;
  t.plan(1);
  const server = http.createServer(async (req) => {
    try {
      await receiveData(req);
      t.fail();
    } catch (error) {
      t.pass();
    }
    t.end();
    setTimeout(() => {
      server.close();
    }, 1000);
  });

  server.listen(port, () => {
    const socket = net.createConnection({
      hostname: 'localhost',
      port,
    });
    socket.on('connect', () => {
      socket.write(Buffer.concat([
        Buffer.from('POST / HTTP/1.1\r\n'),
        Buffer.from('Content-Length:3\r\n\r\n'),
      ]));
      socket.end(Buffer.from('ss'));
    });
  });
});

test.cb('receive fail2', (t) => {
  const port = 6004;
  t.plan(1);
  const server = http.createServer(async (req) => {
    try {
      await receiveData(req);
      t.fail();
    } catch (error) {
      t.pass();
    }
    t.end();
    setTimeout(() => {
      server.close();
    }, 1000);
  });

  server.listen(port, () => {
    const socket = net.createConnection({
      hostname: 'localhost',
      port,
    });
    socket.on('connect', () => {
      socket.write(Buffer.concat([
        Buffer.from('POST / HTTP/1.1\r\n'),
        Buffer.from('Content-Length:3\r\n\r\n'),
      ]));
      socket.end();
    });
  });
});

test.cb('receive success2', (t) => {
  const port = 6005;
  t.plan(1);
  const server = http.createServer(async (req) => {
    try {
      const buf = await receiveData(req);
      t.is(buf.length, 0);
    } catch (error) {
      t.fail();
    }
    t.end();
    setTimeout(() => {
      server.close();
    }, 1000);
  });

  server.listen(port, () => {
    const socket = net.createConnection({
      hostname: 'localhost',
      port,
    });
    socket.on('connect', () => {
      socket.write(Buffer.concat([
        Buffer.from('POST / HTTP/1.1\r\n'),
        Buffer.from('Content-Length:0\r\n\r\n'),
      ]));
      socket.end();
    });
  });
});

test.cb('receive success3', (t) => {
  const port = 6006;
  t.plan(1);
  const server = http.createServer(async (req) => {
    try {
      const buf = await receiveData(req);
      t.is(buf.toString(), 'quan');
    } catch (error) {
      t.fail();
    }
    t.end();
    setTimeout(() => {
      server.close();
    }, 1000);
  });

  server.listen(port, () => {
    const socket = net.createConnection({
      hostname: 'localhost',
      port,
    });
    socket.on('connect', () => {
      socket.write(Buffer.concat([
        Buffer.from('POST / HTTP/1.1\r\n'),
        Buffer.from('Content-Length:4\r\n\r\n'),
      ]));
      socket.write('qua');
      setTimeout(() => {
        socket.write('n');
      }, 500);
    });
  });
});

test.cb('receive fail by limit', (t) => {
  const port = 6007;
  t.plan(1);
  const limitSize = 5;
  const server = http.createServer(async (req) => {
    try {
      await receiveData(req, limitSize);
      t.fail();
    } catch (error) {
      t.pass();
    }
    t.end();
    setTimeout(() => {
      server.close();
    }, 1000);
  });

  server.listen(port, () => {
    const socket = net.createConnection({
      hostname: 'localhost',
      port,
    });
    socket.on('connect', () => {
      socket.write(Buffer.concat([
        Buffer.from('POST / HTTP/1.1\r\n'),
        Buffer.from('Content-Length:10\r\n\r\n'),
      ]));
      socket.write('quan');
      setTimeout(() => {
        socket.end('666666');
      }, 500);
    });
  });
});

test.cb('receive success4', (t) => {
  const port = 6008;
  t.plan(1);
  const server = http.createServer(async (req) => {
    try {
      const buf = await receiveData(req);
      t.is(buf.toString(), 'quan');
    } catch (error) {
      t.fail();
    }
    t.end();
    setTimeout(() => {
      server.close();
    }, 1000);
  });

  server.listen(port, () => {
    const socket = net.createConnection({
      hostname: 'localhost',
      port,
    });
    socket.on('connect', () => {
      socket.write(Buffer.concat([
        Buffer.from('POST / HTTP/1.1\r\n'),
        Buffer.from('Transfer-Encoding:chunked\r\n\r\n'),
      ]));
      socket.write('1\r\n');
      socket.write('q\r\n');
      socket.write('3\r\n');
      socket.write('uan\r\n');
      setTimeout(() => {
        socket.write('0\r\n\r\n');
      }, 500);
    });
  });
});

test.cb('receive fail', (t) => {
  const port = 6009;
  t.plan(1);
  const server = http.createServer(async (req) => {
    try {
      await receiveData(req);
      t.fail();
    } catch (error) {
      t.pass();
    }
    t.end();
    setTimeout(() => {
      server.close();
    }, 1000);
  });

  server.listen(port, () => {
    const socket = net.createConnection({
      hostname: 'localhost',
      port,
    });
    socket.on('connect', () => {
      socket.write(Buffer.concat([
        Buffer.from('POST / HTTP/1.1\r\n'),
        Buffer.from('Transfer-Encoding:chunked\r\n\r\n'),
      ]));
      socket.write('1\r\n');
      socket.write('q\r\n');
      socket.write('3\r\n');
      socket.write('uan\r\n');
      setTimeout(() => {
        socket.end();
      }, 500);
    });
  });
});
