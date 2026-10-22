import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { encodeBase64, normalizeAdvice, liveConfigError } from '../app/lib/advice.js';
import { OCCASIONS, LABELS, SAMPLES } from '../app/data/samples.js';
import { CONFIG } from '../app/config.js';

const source = readFileSync(new URL('../app/pages/index/index.ink', import.meta.url), 'utf8')
  .match(/<script setup>([\s\S]*?)<\/script>/)[1]
  .replace(/^import .*;\n/gm, '').replace('export default', 'definition =');
const configured = { ...CONFIG, backendUrl: 'https://style.example/api/style', teamToken: 't'.repeat(32) };
const png = new Blob([Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0])], { type: 'image/png' });
const good = { suggestions: ['Try charcoal trousers.', 'Add a simple jacket.'] };
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
const flush = () => new Promise(resolve => setImmediate(resolve));

function harness(options = {}) {
  let stops = 0, captures = 0, requests = 0, lastRequest;
  const stream = { getTracks: () => [{ stop: () => stops++ }], getVideoTracks: () => [{}] };
  const timers = new Map();
  let nextTimer = 1;
  const signals = [];
  const sandbox = {
    CONFIG: options.config || configured, OCCASIONS, LABELS, SAMPLES, encodeBase64, normalizeAdvice, liveConfigError,
    URL, Uint8Array,
    navigator: { mediaDevices: { getUserMedia: options.media || (async constraints => {
      assert.equal(constraints.audio, false); return stream;
    }) } },
    ImageCapture: class { async takePhoto(settings) {
      captures++; assert.equal(settings.enableSystemPreview, true); assert.equal(settings.mode, 'telephoto');
      return options.photo ? options.photo() : png;
    } },
    AbortSignal: class { constructor() { this.aborted = false; signals.push(this); } abort() { this.aborted = true; } },
    fetch: async (url, init) => { requests++; lastRequest = {url, init}; return options.fetch ? options.fetch(url,init) : {ok:true,json:async()=>good}; },
    setTimeout(fn) { const id=nextTimer++; timers.set(id,fn); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  vm.runInNewContext(source, sandbox);
  const page = sandbox.definition;
  page.data = JSON.parse(JSON.stringify(page.data));
  const updates = [];
  page.setData = patch => { updates.push(patch); Object.assign(page.data, patch); };
  page.onLoad(options.query); page.onShow();
  return {page, stream, timers, updates, signals, sandbox,
    stats: () => ({stops,captures,requests,lastRequest})};
}

test('Sample is the default: occasion changes and even capture action make no request', async () => {
  const h=harness({config:CONFIG});
  assert.equal(h.page.data.mode, 'sample');
  assert.match(h.page.data.detail, /No camera/);
  h.page.selectWeekend();
  assert.deepEqual(h.page.data.suggestions, SAMPLES.weekend);
  await h.page.captureAndSend();
  assert.deepEqual(h.stats(), {stops:0,captures:0,requests:0,lastRequest:undefined});
});
test('missing/invalid query recover to Work; valid occasion is honored', () => {
  assert.equal(harness({query:{occasion:'evening'}}).page.data.occasion, 'evening');
  for (const query of [{occasion:'bad'}, {occasion:42}, [], 'work']) {
    const {page}=harness({query}); assert.equal(page.data.occasion,'work'); assert.match(page.data.detail,/Unknown occasion/);
  }
});
test('Live must be explicitly selected and configured before opening a camera', async () => {
  const h=harness({config:CONFIG}); h.page.useLive(); await h.page.captureAndSend();
  assert.equal(h.page.data.status, 'Setup needed'); assert.equal(h.stats().captures,0);
  assert.notEqual(liveConfigError({...configured,backendUrl:'http://localhost/api/style'}),'');
  assert.notEqual(liveConfigError({...configured,teamToken:'provider-key'}),'');
});
test('Live sends captured bytes with bearer token and stops camera before request', async () => {
  const h=harness({fetch:async()=>{
    assert.equal(h.stats().stops,1); return {ok:true,json:async()=>good};
  }});
  h.page.useLive(); await h.page.captureAndSend();
  assert.equal(h.page.data.status, 'AI style ideas'); assert.equal(h.page.data.busy,false);
  assert.deepEqual(h.page.data.suggestions, good.suggestions);
  const body=JSON.parse(h.stats().lastRequest.init.body);
  assert.equal(body.occasion,'work'); assert.equal(body.mimeType,'image/png');
  assert.equal(body.imageBase64,Buffer.from(await png.arrayBuffer()).toString('base64'));
  assert.equal(h.stats().lastRequest.init.headers.Authorization, 'Bearer '+configured.teamToken);
  assert.equal(h.timers.size,0); assert.equal(h.signals[0].aborted,true);
});
test('denied and unavailable camera give usable Sample recovery without a request', async () => {
  const denied = new Error('denied'); denied.name='NotAllowedError';
  const h=harness({media:async()=>{throw denied;}}); h.page.useLive(); await h.page.captureAndSend();
  assert.match(h.page.data.detail,/denied/); assert.equal(h.stats().requests,0);
  h.page.useSample(); assert.equal(h.page.data.mode,'sample');
  const unavailable=harness(); unavailable.sandbox.navigator={}; unavailable.page.useLive(); await unavailable.page.captureAndSend();
  assert.equal(unavailable.page.data.status,'Live unavailable');
});
test('capture rejection and oversized image stop tracks and clear timers', async () => {
  for (const photo of [async()=>{throw new Error('capture failed');}, async()=>({type:'image/jpeg',size:4194305})]) {
    const h=harness({photo}); h.page.useLive(); await h.page.captureAndSend();
    assert.equal(h.stats().stops,1); assert.equal(h.stats().requests,0); assert.equal(h.timers.size,0); assert.equal(h.page.data.busy,false);
  }
});
test('timeout before permission resolves releases a late stream without sending', async () => {
  const pending=deferred(); const h=harness({media:()=>pending.promise}); h.page.useLive();
  const work=h.page.captureAndSend(); [...h.timers.values()][0]();
  assert.match(h.page.data.detail,/Timed out/); pending.resolve(h.stream); await work;
  assert.equal(h.stats().stops,1); assert.equal(h.stats().captures,0); assert.equal(h.stats().requests,0);
});
test('Cancel during capture stops tracks and prevents late upload', async () => {
  const photo=deferred(); const h=harness({photo:()=>photo.promise}); h.page.useLive();
  const work=h.page.captureAndSend(); await flush(); h.page.cancelCapture(); photo.resolve(png); await work;
  assert.equal(h.stats().stops,1); assert.equal(h.stats().requests,0); assert.equal(h.timers.size,0);
});
test('hide aborts network, reopen permits retry, stale response cannot replace newer advice', async () => {
  const response=deferred(); let count=0;
  const h=harness({fetch:()=>++count===1?response.promise:Promise.resolve({ok:true,json:async()=>({suggestions:['New advice.']})})});
  h.page.useLive(); const old=h.page.captureAndSend(); await flush(); h.page.onHide();
  assert.equal(h.signals[0].aborted,true); assert.equal(h.timers.size,0);
  h.page.onShow(); await h.page.captureAndSend();
  response.resolve({ok:true,json:async()=>good}); await old;
  assert.deepEqual(h.page.data.suggestions,['New advice.']);
});
test('unload and Sample while loading suppress every late state update', async () => {
  for (const action of ['onUnload','useSample']) {
    const response=deferred(); const h=harness({fetch:()=>response.promise}); h.page.useLive();
    const work=h.page.captureAndSend(); await flush(); h.page[action](); const count=h.updates.length;
    response.resolve({ok:true,json:async()=>good}); await work;
    assert.equal(h.updates.length,count); assert.equal(h.signals[0].aborted,true); assert.equal(h.timers.size,0);
  }
});
test('invalid server reply and expired token yield a retry path', async () => {
  for (const response of [{ok:true,json:async()=>({suggestions:['x'.repeat(73)]})},{ok:false,status:401}]) {
    const h=harness({fetch:async()=>response}); h.page.useLive(); await h.page.captureAndSend();
    assert.equal(h.page.data.actionLabel,'Retry'); assert.equal(h.page.data.busy,false); assert.equal(h.page.data.suggestions.length,0);
  }
});
test('base64 encoding handles padding and multiple chunks; advice is bounded', () => {
  for (const length of [0,1,2,3,9,8192,50000]) {
    const bytes=Uint8Array.from({length},(_,i)=>i%256);
    assert.equal(encodeBase64(bytes.buffer),Buffer.from(bytes).toString('base64'));
  }
  assert.equal(normalizeAdvice({suggestions:['a','b','c','d']}),null);
  assert.equal(normalizeAdvice({suggestions:['one\ntwo']}),null);
  assert.equal(normalizeAdvice({suggestions:[]}),null);
  assert.equal(normalizeAdvice({suggestions:['same','same']}),null);
});
