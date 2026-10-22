<script def>
{
  "navigationBarTitleText": "Cook Along",
  "description": "Show local recipes one step at a time, with optional visual timers. No external API is used after opening.",
  "schema": {
    "data": {
      "type": "object",
      "properties": {
        "recipe": {
          "type": "string",
          "enum": ["coffee", "pasta"],
          "description": "Optional preset. Omit to show the recipe selector."
        }
      }
    }
  }
}
</script>

<script setup>
import { recipes } from '../lib/recipes.js';

function timeLabel(milliseconds) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' +
    String(seconds % 60).padStart(2, '0');
}

function attribute(event, key) {
  // AIUI's official 0.19 sample uses currentTarget.attributes for data-*.
  const attributes = event && event.currentTarget && event.currentTarget.attributes;
  return attributes ? attributes[key] : undefined;
}

export default {
  data: {
    screen: 'select',
    recipes: recipes.map(recipe => ({ id: recipe.id, title: recipe.title, summary: recipe.summary })),
    recipeId: '',
    recipeTitle: '',
    stepIndex: 0,
    stepNumber: 1,
    stepCount: 0,
    stepTitle: '',
    instruction: '',
    isLastStep: false,
    timerState: 'none',
    totalMs: 0,
    remainingMs: 0,
    deadlineMs: 0,
    displayTime: '00:00',
    timerLabel: '',
    timerButton: 'Start timer',
    focusedAction: '',
    hostFocused: false,
    notice: ''
  },

  onLoad(query) {
    this._refreshId = null;
    this._visible = false;
    this._disposed = false;
    const input = query == null ? {} : query;
    if (typeof input !== 'object' || Array.isArray(input)) {
      this.setData({ notice: 'Choose a recipe below.' });
      return;
    }
    if (input.recipe === undefined) return;
    const recipe = recipes.find(item => item.id === input.recipe);
    if (!recipe) {
      this.setData({ notice: 'Recipe unavailable. Choose one below.' });
      return;
    }
    this._openRecipe(recipe);
  },

  onShow() {
    if (this._disposed) return;
    this._visible = true;
    this._syncTimer();
    this._startRefresh();
  },

  onHide() {
    this._syncTimer();
    this._visible = false;
    this._stopRefresh();
    this.setData({ focusedAction: '', hostFocused: false });
  },

  onUnload() {
    this._visible = false;
    this._disposed = true;
    this._stopRefresh();
    this._recipe = null;
  },

  onHostFocus() {
    if (!this._disposed) this.setData({ hostFocused: true });
  },

  onHostBlur() {
    if (!this._disposed) this.setData({ hostFocused: false, focusedAction: '' });
  },

  onActionFocus(event) {
    if (!this._canInteract()) return;
    this.setData({ focusedAction: attribute(event, 'data-action') || '' });
  },

  onActionBlur(event) {
    if (this._disposed) return;
    if (attribute(event, 'data-action') === this.data.focusedAction) {
      this.setData({ focusedAction: '' });
    }
  },

  chooseRecipe(event) {
    if (!this._canInteract()) return;
    const id = attribute(event, 'data-recipe');
    const recipe = recipes.find(item => item.id === id);
    if (!recipe) {
      this.setData({ notice: 'Recipe unavailable. Choose one below.' });
      return;
    }
    this._openRecipe(recipe);
  },

  nextStep() {
    if (!this._canInteract() || this.data.screen !== 'step') return;
    if (this.data.isLastStep) {
      this._stopRefresh();
      this.setData({ screen: 'done', timerState: 'none', deadlineMs: 0, focusedAction: '' });
      return;
    }
    this._loadStep(this.data.stepIndex + 1);
  },

  previousStep() {
    if (!this._canInteract() || this.data.screen !== 'step' || this.data.stepIndex < 1) return;
    this._loadStep(this.data.stepIndex - 1);
  },

  restartRecipe() {
    if (!this._canInteract() || !this._recipe) return;
    this._loadStep(0);
  },

  showRecipes() {
    if (!this._canInteract()) return;
    this._stopRefresh();
    this._recipe = null;
    this.setData({ screen: 'select', recipeId: '', recipeTitle: '', timerState: 'none',
      totalMs: 0, remainingMs: 0, deadlineMs: 0, focusedAction: '', notice: '' });
  },

  toggleTimer() {
    if (!this._canInteract() || this.data.screen !== 'step' || this.data.totalMs <= 0) return;
    if (this.data.timerState === 'running') {
      this._syncTimer();
      if (this.data.timerState !== 'running') return;
      this._stopRefresh();
      this.setData({ timerState: 'paused', deadlineMs: 0, timerLabel: 'Paused', timerButton: 'Resume' });
      return;
    }
    const remainingMs = this.data.timerState === 'paused' ? this.data.remainingMs : this.data.totalMs;
    this.setData({ timerState: 'running', remainingMs, deadlineMs: Date.now() + remainingMs,
      displayTime: timeLabel(remainingMs), timerLabel: 'Counting down', timerButton: 'Pause' });
    this._startRefresh();
  },

  resetTimer() {
    if (!this._canInteract() || this.data.screen !== 'step' || this.data.totalMs <= 0) return;
    this._stopRefresh();
    this.setData({ timerState: 'idle', remainingMs: this.data.totalMs, deadlineMs: 0,
      displayTime: timeLabel(this.data.totalMs), timerLabel: 'Optional timer', timerButton: 'Start timer' });
  },

  _canInteract() {
    return this._visible && !this._disposed;
  },

  _openRecipe(recipe) {
    this._recipe = recipe;
    this.setData({ recipeId: recipe.id, recipeTitle: recipe.title, stepCount: recipe.steps.length, notice: '' });
    this._loadStep(0);
  },

  _loadStep(index) {
    this._stopRefresh();
    const step = this._recipe.steps[index];
    const totalMs = step.timerSeconds * 1000;
    this.setData({ screen: 'step', stepIndex: index, stepNumber: index + 1,
      stepTitle: step.title, instruction: step.instruction, isLastStep: index === this._recipe.steps.length - 1,
      totalMs, remainingMs: totalMs, deadlineMs: 0, displayTime: timeLabel(totalMs),
      timerState: totalMs > 0 ? 'idle' : 'none', timerLabel: 'Optional timer', timerButton: 'Start timer',
      focusedAction: '' });
  },

  _startRefresh() {
    if (!this._visible || this._disposed || this.data.timerState !== 'running' || this._refreshId !== null) return;
    this._refreshId = setInterval(() => {
      if (this._visible && !this._disposed) this._syncTimer();
    }, 500);
  },

  _stopRefresh() {
    if (this._refreshId !== null && this._refreshId !== undefined) clearInterval(this._refreshId);
    this._refreshId = null;
  },

  _syncTimer() {
    if (this._disposed || this.data.timerState !== 'running') return;
    const remainingMs = Math.max(0, Math.min(this.data.totalMs, this.data.deadlineMs - Date.now()));
    if (remainingMs === 0) {
      this._stopRefresh();
      this.setData({ timerState: 'finished', remainingMs: 0, deadlineMs: 0, displayTime: '00:00',
        timerLabel: 'Time is up · check your step', timerButton: 'Restart timer' });
      return;
    }
    this.setData({ remainingMs, displayTime: timeLabel(remainingMs) });
  }
};
</script>

<page>
  <view class="shell">
  <view class="topline"><text class="brand">COOK ALONG</text><text class="mode">LOCAL RECIPES</text></view>
  <view ink:if="{{screen === 'select'}}" class="content selector">
    <text class="title">What are we making?</text>
    <text class="description">Pick a recipe. Follow one step at a time.</text>
    <text ink:if="{{notice}}" class="notice">{{notice}}</text>
    <button ink:for="{{recipes}}" ink:key="id" class="recipe-button {{focusedAction === item.id ? 'focused' : ''}}"
      data-recipe="{{item.id}}" data-action="{{item.id}}" bindtap="chooseRecipe" bindfocus="onActionFocus" bindblur="onActionBlur">
      <text class="recipe-name">{{item.title}}</text><text class="description">{{item.summary}}</text>
    </button>
    <text class="hint">Select a button with the touchpad, or tap it.</text>
  </view>
  <view ink:if="{{screen === 'step'}}" class="content">
    <view class="step-meta"><text>{{recipeTitle}}</text><text>{{stepNumber}} / {{stepCount}}</text></view>
    <text class="title">{{stepTitle}}</text>
    <text class="instruction">{{instruction}}</text>
    <view ink:if="{{timerState !== 'none'}}" class="timer">
      <view class="timer-top"><text class="time">{{displayTime}}</text><text class="timer-label">{{timerLabel}}</text></view>
      <view class="actions timer-actions">
        <button class="action {{focusedAction === 'timer' ? 'focused' : ''}}" data-action="timer" bindtap="toggleTimer" bindfocus="onActionFocus" bindblur="onActionBlur">{{timerButton}}</button>
        <button class="action {{focusedAction === 'reset' ? 'focused' : ''}}" data-action="reset" bindtap="resetTimer" bindfocus="onActionFocus" bindblur="onActionBlur">Reset timer</button>
      </view>
    </view>
    <view class="actions navigation">
      <button ink:if="{{stepIndex > 0}}" class="action {{focusedAction === 'back' ? 'focused' : ''}}" data-action="back" bindtap="previousStep" bindfocus="onActionFocus" bindblur="onActionBlur">Back</button>
      <button class="action primary {{focusedAction === 'next' ? 'focused' : ''}}" data-action="next" bindtap="nextStep" bindfocus="onActionFocus" bindblur="onActionBlur">{{isLastStep ? 'Finish' : 'Next step'}}</button>
      <button class="action {{focusedAction === 'recipes' ? 'focused' : ''}}" data-action="recipes" bindtap="showRecipes" bindfocus="onActionFocus" bindblur="onActionBlur">Recipes</button>
      <button class="action {{focusedAction === 'restart' ? 'focused' : ''}}" data-action="restart" bindtap="restartRecipe" bindfocus="onActionFocus" bindblur="onActionBlur">Restart</button>
    </view>
    <text class="hint">Next / Back clears the step timer. No background alarm.</text>
  </view>
  <view ink:if="{{screen === 'done'}}" class="content complete">
    <text class="step-meta">{{recipeTitle}}</text>
    <text class="title">All steps complete.</text>
    <text class="instruction">Enjoy what you made.</text>
    <view class="actions">
      <button class="action primary {{focusedAction === 'recipes' ? 'focused' : ''}}" data-action="recipes" bindtap="showRecipes" bindfocus="onActionFocus" bindblur="onActionBlur">Choose a recipe</button>
      <button class="action {{focusedAction === 'restart' ? 'focused' : ''}}" data-action="restart" bindtap="restartRecipe" bindfocus="onActionFocus" bindblur="onActionBlur">Make it again</button>
    </view>
  </view>
  </view>
</page>

<style>
.shell { width: 100%; min-height: 100%; padding: 12px 16px; box-sizing: border-box; background-color: #000000; color: #b8ffc3; }
.topline, .step-meta, .timer-top, .actions { display: flex; flex-direction: row; align-items: center; }
.topline { justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(64, 255, 94, 0.32); }
.brand, .mode { font-size: 11px; line-height: 16px; color: rgba(184, 255, 195, 0.8); }
.content { display: flex; flex-direction: column; padding-top: 10px; }
.step-meta { justify-content: space-between; font-size: 12px; line-height: 18px; color: rgba(184, 255, 195, 0.82); }
.title { font-size: 24px; line-height: 30px; margin-top: 5px; margin-bottom: 5px; }
.instruction { font-size: 16px; line-height: 22px; }
.description { font-size: 13px; line-height: 18px; color: rgba(184, 255, 195, 0.82); }
.notice { font-size: 13px; line-height: 18px; margin-top: 5px; }
.recipe-button { display: flex; flex-direction: column; align-items: flex-start; width: 100%; padding: 10px 12px; margin-top: 12px; border: 1px solid rgba(64, 255, 94, 0.55); border-radius: 4px; color: #b8ffc3; background-color: rgba(64, 255, 94, 0.05); }
.recipe-name { font-size: 19px; line-height: 24px; }
.timer { display: flex; flex-direction: column; margin-top: 5px; }
.time { font-size: 36px; line-height: 42px; }
.timer-label { margin-left: 12px; font-size: 12px; line-height: 16px; }
.actions { flex-wrap: wrap; }
.action { padding: 7px 10px; margin-right: 6px; margin-top: 6px; border: 1px solid rgba(64, 255, 94, 0.55); border-radius: 4px; background-color: rgba(64, 255, 94, 0.05); color: #b8ffc3; font-size: 14px; line-height: 18px; }
.primary { border-color: #40ff5e; }
.focused { border: 2px solid #40ff5e; background-color: rgba(64, 255, 94, 0.12); color: #40ff5e; }
.hint { margin-top: 9px; font-size: 11px; line-height: 15px; color: rgba(184, 255, 195, 0.78); }
.complete { padding-top: 32px; }
@media (target: _current) {
  .shell { padding: 10px 16px; }
  .mode { display: none; }
  .title { font-size: 21px; line-height: 26px; }
  .instruction { font-size: 15px; line-height: 20px; }
  .recipe-button { margin-top: 8px; padding: 7px 10px; }
  .time { font-size: 30px; line-height: 36px; }
  .action { padding: 5px 8px; }
}
</style>
