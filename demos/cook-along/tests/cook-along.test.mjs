import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const pageSource = readFileSync(new URL('../app/pages/index.ink', import.meta.url), 'utf8');
const recipesSource = readFileSync(new URL('../app/lib/recipes.js', import.meta.url), 'utf8');
const setup = pageSource.match(/<script setup>([\s\S]*?)<\/script>/)[1];

// Execute the shipped setup and recipe module with a small Page host shim.
// This validates behavior, not the Ink renderer or physical touchpad.
function mount(query) {
  let now = 1_000_000;
  let nextId = 1;
  let networkCalls = 0;
  const timers = new Map();
  const writes = [];
  const sandbox = {
    Date: class extends Date { static now() { return now; } },
    setInterval(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearInterval(id) { timers.delete(id); },
    fetch() { networkCalls += 1; throw new Error('Cook Along must stay offline'); }
  };
  vm.createContext(sandbox);
  assert.match(setup, /import \{ recipes \} from '\.\.\/lib\/recipes\.js';/);
  const executable = recipesSource.replace('export const recipes', 'const recipes') + '\n' +
    setup.replace(/import \{ recipes \} from '\.\.\/lib\/recipes\.js';/, '')
      .replace('export default {', 'globalThis.page = {');
  vm.runInContext(executable, sandbox, { filename: 'shipped-cook-along-setup.js' });
  const page = sandbox.page;
  page.data = JSON.parse(JSON.stringify(page.data));
  page.setData = function (patch, callback) {
    writes.push(patch);
    Object.assign(this.data, patch);
    if (callback) callback();
  };
  page.onLoad(query);
  page.onShow();
  return { page, timers, writes,
    get networkCalls() { return networkCalls; },
    advance(ms, tick = true) {
      now += ms;
      if (tick) for (const { callback } of [...timers.values()]) callback();
    }
  };
}

function button(action, recipe) {
  return { currentTarget: { attributes: { 'data-action': action, 'data-recipe': recipe } } };
}

test('first open exposes two local presets and invalid inputs recover to selection', () => {
  const initial = mount();
  assert.equal(initial.page.data.screen, 'select');
  assert.deepEqual(initial.page.data.recipes.map(recipe => recipe.id), ['coffee', 'pasta']);
  assert.equal(initial.timers.size, 0);
  for (const invalid of ['coffee', [], { recipe: 1 }, { recipe: 'missing' }, { recipe: {} }]) {
    const { page } = mount(invalid);
    assert.equal(page.data.screen, 'select');
    assert.ok(page.data.notice);
    page.chooseRecipe(button('coffee', 'coffee'));
    assert.equal(page.data.recipeId, 'coffee');
    assert.equal(page.data.stepNumber, 1);
  }
});

test('recipe button uses the documented attributes payload, rejects a stale or missing id', () => {
  const { page } = mount();
  page.chooseRecipe({});
  assert.equal(page.data.screen, 'select');
  assert.ok(page.data.notice);
  page.chooseRecipe(button('pasta', 'pasta'));
  assert.equal(page.data.recipeTitle, 'Tomato pasta');
  assert.equal(page.data.screen, 'step');
  assert.equal(page.data.notice, '');
});

test('each preset completes and supports previous step, restart, and recipe selection', () => {
  for (const recipe of ['coffee', 'pasta']) {
    const { page, timers } = mount({ recipe });
    assert.equal(page.data.stepNumber, 1);
    page.previousStep();
    assert.equal(page.data.stepNumber, 1);
    page.nextStep();
    page.previousStep();
    assert.equal(page.data.stepNumber, 1);
    for (let index = 0; index < page.data.stepCount; index += 1) page.nextStep();
    assert.equal(page.data.screen, 'done');
    assert.equal(timers.size, 0);
    page.nextStep();
    assert.equal(page.data.screen, 'done');
    page.restartRecipe();
    assert.equal(page.data.screen, 'step');
    assert.equal(page.data.stepNumber, 1);
    page.showRecipes();
    assert.equal(page.data.screen, 'select');
    assert.equal(page.data.recipeId, '');
  }
});

test('timer uses clock deadlines, pauses precisely, resumes and resets without duplicates', () => {
  const host = mount({ recipe: 'coffee' });
  const { page, timers } = host;
  page.toggleTimer();
  assert.equal(timers.size, 0); // first step has no timer
  page.nextStep();
  assert.equal(page.data.displayTime, '00:30');
  page.toggleTimer();
  assert.equal(page.data.timerState, 'running');
  assert.equal(timers.size, 1);
  page.onShow();
  assert.equal(timers.size, 1);
  host.advance(3750, false); // delayed callbacks must not cause drift
  page.toggleTimer();
  assert.equal(page.data.timerState, 'paused');
  assert.equal(page.data.remainingMs, 26250);
  assert.equal(page.data.displayTime, '00:27');
  assert.equal(timers.size, 0);
  host.advance(90_000);
  assert.equal(page.data.remainingMs, 26250);
  page.toggleTimer();
  host.advance(1250);
  assert.equal(page.data.displayTime, '00:25');
  assert.equal(page.data.remainingMs, 25000);
  page.resetTimer();
  assert.equal(page.data.timerState, 'idle');
  assert.equal(page.data.displayTime, '00:30');
  assert.equal(page.data.deadlineMs, 0);
  assert.equal(timers.size, 0);
});

test('expiry stops work without advancing a step; restart timer starts a full duration', () => {
  const host = mount({ recipe: 'coffee' });
  const { page, timers } = host;
  page.nextStep();
  page.toggleTimer();
  host.advance(80_000);
  assert.equal(page.data.timerState, 'finished');
  assert.equal(page.data.displayTime, '00:00');
  assert.equal(page.data.stepNumber, 2);
  assert.equal(timers.size, 0);
  page.toggleTimer();
  assert.equal(page.data.timerState, 'running');
  assert.equal(page.data.remainingMs, 30000);
  assert.equal(timers.size, 1);
});

test('hidden Page stops callbacks and reconciles an elapsed deadline when shown', () => {
  const host = mount({ recipe: 'coffee' });
  const { page, timers, writes } = host;
  page.nextStep();
  page.toggleTimer();
  host.advance(5000);
  page.onHide();
  assert.equal(timers.size, 0);
  const count = writes.length;
  host.advance(10_000);
  assert.equal(writes.length, count);
  page.nextStep();
  assert.equal(page.data.stepNumber, 2);
  page.onShow();
  assert.equal(page.data.remainingMs, 15000);
  assert.equal(timers.size, 1);
  page.onHide();
  host.advance(30_000);
  page.onShow();
  assert.equal(page.data.timerState, 'finished');
  assert.equal(timers.size, 0);
});

test('a paused timer remains paused across hide/show', () => {
  const host = mount({ recipe: 'coffee' });
  const { page } = host;
  page.nextStep();
  page.toggleTimer();
  host.advance(2000);
  page.toggleTimer();
  page.onHide();
  host.advance(60_000);
  page.onShow();
  assert.equal(page.data.timerState, 'paused');
  assert.equal(page.data.remainingMs, 28000);
  assert.equal(host.timers.size, 0);
});

test('step navigation and recipe reset cancel the old countdown', () => {
  const host = mount({ recipe: 'coffee' });
  const { page, timers } = host;
  page.nextStep();
  page.toggleTimer();
  host.advance(2000);
  page.nextStep();
  assert.equal(page.data.stepNumber, 3);
  assert.equal(page.data.timerState, 'idle');
  assert.equal(page.data.remainingMs, 90000);
  assert.equal(timers.size, 0);
  page.previousStep();
  assert.equal(page.data.remainingMs, 30000);
  page.toggleTimer();
  page.restartRecipe();
  assert.equal(page.data.stepNumber, 1);
  assert.equal(page.data.timerState, 'none');
  assert.equal(timers.size, 0);
});

test('unload cancels work and all stale callbacks/actions leave the disposed Page unchanged', () => {
  const host = mount({ recipe: 'coffee' });
  const { page, timers, writes } = host;
  page.nextStep();
  page.toggleTimer();
  const staleCallback = [...timers.values()][0].callback;
  page.onUnload();
  const writeCount = writes.length;
  assert.equal(timers.size, 0);
  staleCallback();
  host.advance(90_000);
  page.onShow();
  page.toggleTimer();
  page.resetTimer();
  page.nextStep();
  page.previousStep();
  page.restartRecipe();
  page.showRecipes();
  page.chooseRecipe(button('pasta', 'pasta'));
  page.onHostFocus();
  page.onActionFocus(button('next'));
  assert.equal(writes.length, writeCount);
  assert.equal(timers.size, 0);
  assert.equal(mount().page.data.screen, 'select');
});

test('focus feedback follows real button identity while native host keys remain available', () => {
  const { page } = mount();
  page.onHostFocus();
  assert.equal(page.data.hostFocused, true);
  page.onActionFocus(button('coffee'));
  assert.equal(page.data.focusedAction, 'coffee');
  page.onActionFocus(button('pasta'));
  page.onActionBlur(button('coffee'));
  assert.equal(page.data.focusedAction, 'pasta');
  page.onActionBlur(button('pasta'));
  assert.equal(page.data.focusedAction, '');
  page.onActionFocus(button('coffee'));
  page.onHostBlur();
  assert.equal(page.data.hostFocused, false);
  assert.equal(page.data.focusedAction, '');
  assert.equal(page.onKeyUp, undefined);
  assert.equal(page.onKeyDown, undefined);
});

test('every markup tap/focus/blur handler resolves to shipped Page logic', () => {
  const { page } = mount();
  const names = [...pageSource.matchAll(/bind(?:tap|focus|blur)="([^"]+)"/g)].map(match => match[1]);
  for (const name of new Set(names)) assert.equal(typeof page[name], 'function', name);
  assert.ok(names.includes('resetTimer'));
  assert.ok(names.includes('previousStep'));
  assert.ok(names.includes('restartRecipe'));
});

test('all presets fit the content contract and timers are bounded; no external API occurs', () => {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(recipesSource.replace('export const recipes', 'globalThis.recipes'), sandbox);
  const ids = new Set();
  for (const recipe of sandbox.recipes) {
    assert.match(recipe.id, /^[a-z][a-z0-9-]*$/);
    assert.ok(!ids.has(recipe.id));
    ids.add(recipe.id);
    assert.ok(recipe.title.length <= 30);
    assert.ok(recipe.steps.length > 0);
    for (const step of recipe.steps) {
      assert.ok(step.title.length <= 30);
      assert.ok(step.instruction.length > 0 && step.instruction.length <= 110);
      assert.ok(Number.isInteger(step.timerSeconds) && step.timerSeconds >= 0 && step.timerSeconds <= 3600);
    }
    const host = mount({ recipe: recipe.id });
    while (host.page.data.screen !== 'done') {
      host.page.toggleTimer();
      host.advance(3_600_000);
      host.page.nextStep();
    }
    assert.equal(host.networkCalls, 0);
  }
  assert.doesNotMatch(setup + recipesSource, /\b(fetch|XMLHttpRequest|WebSocket|SpeechRecognition|getUserMedia)\s*\(/);
  const manifest = JSON.parse(readFileSync(new URL('../app/app.json', import.meta.url), 'utf8'));
  assert.equal(manifest.permissions, undefined);
});
