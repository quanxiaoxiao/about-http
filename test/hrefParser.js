import test from 'ava';
import https from 'https';
import http from 'http';
import parser from '../src/hrefParser';

test('href parser', (t) => {
  t.is(parser('www.baidu.com'), null);
  t.is(parser(), null);
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
  t.is(parser('httpd://www.baidu.com:8822'), null);
  t.is(parser('httpd://www.baidu.com'), null);
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
