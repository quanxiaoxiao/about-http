import https from 'https';
import http from 'http';
import test from 'ava'; // eslint-disable-line import/no-unresolved
import parser from '../src/hrefParser.mjs';

test('href parser', (t) => {
  t.is(parser('http://www.baidu.com:65535').port, 65535);
  t.throws(() => {
    parser('www.baidu.com');
  });
  t.throws(() => {
    parser();
  });
  t.throws(() => {
    parser('http://www.baidu.com:0');
  });
  t.throws(() => {
    parser('http://www.baidu.com:65536');
  });
  t.deepEqual(parser('https://www.baidu.com'), {
    schema: https,
    port: 443,
    hostname: 'www.baidu.com',
    path: '/',
  });
  t.deepEqual(parser('http://www.baidu.com'), {
    schema: http,
    port: 80,
    hostname: 'www.baidu.com',
    path: '/',
  });
  t.deepEqual(parser('http://localhost:3099/visual'), {
    schema: http,
    port: 3099,
    hostname: 'localhost',
    path: '/visual',
  });
  t.deepEqual(parser('http://192.168.0.111:3000?name=quan'), {
    schema: http,
    port: 3000,
    hostname: '192.168.0.111',
    path: '/?name=quan',
  });
  t.deepEqual(parser('http://www.baidu.com:8822'), {
    schema: http,
    port: 8822,
    hostname: 'www.baidu.com',
    path: '/',
  });
  t.throws(() => {
    parser('httpd://www.baidu.com:8822');
  });
  t.throws(() => {
    parser('httpd://www.baidu.com');
  });
  t.deepEqual(parser('http://www.baidu.com/aaa/bbb/ccc'), {
    schema: http,
    port: 80,
    hostname: 'www.baidu.com',
    path: '/aaa/bbb/ccc',
  });
  t.deepEqual(parser('http://www.baidu.com/aaa/bbb/ccc?name=quan'), {
    schema: http,
    port: 80,
    hostname: 'www.baidu.com',
    path: '/aaa/bbb/ccc?name=quan',
  });
});
