<script def>
{
  "navigationBarTitleText": "Style Lens",
  "description": "Open Style Lens in full screen. Start with labeled sample advice; the user can explicitly select Live and capture a garment photo after configuring a backend.",
  "schema": {
    "data": {
      "type": "object",
      "properties": {
        "occasion": { "type": "string", "enum": ["work", "weekend", "evening"], "default": "work" }
      }
    }
  }
}
</script>

<script setup>
import { CONFIG } from '../../config.js';
import { OCCASIONS, LABELS, SAMPLES } from '../../data/samples.js';
import { encodeBase64, normalizeAdvice, liveConfigError } from '../../lib/advice.js';

function stopTracks(stream) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try { track.stop(); } catch (_) { /* Continue releasing the remaining tracks. */ }
  }
}

export default {
  data: {
    mode: 'sample', modeLabel: 'SAMPLE', occasion: 'work', occasionLabel: 'Work',
    status: 'Example: blue shirt', detail: 'Bundled ideas. No camera or AI request.',
    suggestions: SAMPLES.work, busy: false, focusedAction: '', actionLabel: 'Capture & send'
  },

  onLoad(query) {
    this._visible = false;
    this._operation = null;
    const validObject = query === undefined || query === null || (typeof query === 'object' && !Array.isArray(query));
    const supplied = validObject && query ? query.occasion : undefined;
    const valid = validObject && (supplied === undefined || OCCASIONS.includes(supplied));
    const occasion = valid && supplied !== undefined ? supplied : 'work';
    this.setData({ occasion, occasionLabel: LABELS[occasion], suggestions: SAMPLES[occasion],
      detail: valid ? 'Bundled ideas. No camera or AI request.' : 'Unknown occasion. Showing Work sample.' });
  },
  onShow() { this._visible = true; },
  onHide() {
    this._visible = false;
    this._cancel('Paused. Capture again, or use Sample.');
  },
  onUnload() {
    this._visible = false;
    this._cancel('', false);
  },

  selectWork() { this._selectOccasion('work'); },
  selectWeekend() { this._selectOccasion('weekend'); },
  selectEvening() { this._selectOccasion('evening'); },
  _selectOccasion(occasion) {
    if (this.data.busy || !OCCASIONS.includes(occasion)) return;
    this.setData({ occasion, occasionLabel: LABELS[occasion], focusedAction: '',
      suggestions: this.data.mode === 'sample' ? SAMPLES[occasion] : [],
      status: this.data.mode === 'sample' ? 'Example: blue shirt' : 'Ready to capture',
      detail: this.data.mode === 'sample' ? 'Bundled ideas. No camera or AI request.' : 'One photo + occasion go to your backend and AI provider.',
      actionLabel: 'Capture & send' });
  },
  useSample() {
    this._cancel('', false);
    this.setData({ mode: 'sample', modeLabel: 'SAMPLE', busy: false, focusedAction: '',
      status: 'Example: blue shirt', detail: 'Bundled ideas. No camera or AI request.',
      suggestions: SAMPLES[this.data.occasion], actionLabel: 'Capture & send' });
  },
  useLive() {
    if (this.data.busy) return;
    const error = liveConfigError(CONFIG);
    this.setData({ mode: 'live', modeLabel: 'LIVE', suggestions: [], focusedAction: '',
      status: error ? 'Setup needed' : 'Ready to capture',
      detail: error || 'One photo + occasion go to your backend and AI provider.', actionLabel: 'Capture & send' });
  },
  cancelCapture() { this._cancel('Cancelled. Capture again, or use Sample.'); },

  _release(operation) {
    if (operation.timer !== null) clearTimeout(operation.timer);
    operation.timer = null;
    if (operation.signal) { try { operation.signal.abort(); } catch (_) {} }
    stopTracks(operation.stream);
    operation.stream = null;
  },
  _cancel(message, render = true) {
    const operation = this._operation;
    this._operation = null;
    if (!operation) return;
    this._release(operation);
    if (render) this.setData({ busy: false, status: 'Capture stopped', detail: message,
      focusedAction: '', actionLabel: 'Retry' });
  },
  _current(operation) { return this._operation === operation && this._visible; },

  async captureAndSend() {
    if (!this._visible || this.data.mode !== 'live' || this.data.busy) return;
    const error = liveConfigError(CONFIG);
    if (error) { this.setData({ status: 'Setup needed', detail: error }); return; }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function' || typeof ImageCapture !== 'function' ||
        typeof fetch !== 'function' || typeof AbortSignal !== 'function') {
      this.setData({ status: 'Live unavailable', detail: 'This host has no supported camera or network. Use Sample.' });
      return;
    }
    const operation = { stream: null, signal: null, timer: null };
    this._operation = operation;
    this.setData({ busy: true, suggestions: [], status: 'Frame one garment',
      detail: 'Confirm the system camera preview to send this photo.', focusedAction: '' });
    operation.timer = setTimeout(() => {
      if (this._operation !== operation) return;
      this._cancel('Timed out. Check the connection, then Retry or Sample.');
    }, CONFIG.timeoutMs);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      if (!this._current(operation)) { stopTracks(stream); return; }
      operation.stream = stream;
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error('CAMERA_UNAVAILABLE');
      const capture = new ImageCapture(track);
      const photo = await capture.takePhoto({ quality: 'normal', mode: 'telephoto', enableSystemPreview: true });
      stopTracks(operation.stream);
      operation.stream = null;
      if (!this._current(operation)) return;
      if (!photo || !['image/jpeg', 'image/png'].includes(photo.type) ||
          photo.size < 1 || photo.size > CONFIG.maxImageBytes) throw new Error('PHOTO_SIZE');
      const bytes = await photo.arrayBuffer();
      if (!this._current(operation)) return;
      // AIUI 0.19 documents a directly constructible AbortSignal with abort().
      operation.signal = new AbortSignal();
      this.setData({ status: 'Getting style ideas', detail: 'Sending this photo and occasion. Cancel is available.' });
      const response = await fetch(CONFIG.backendUrl, {
        method: 'POST', timeout: CONFIG.timeoutMs, signal: operation.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CONFIG.teamToken },
        body: JSON.stringify({ occasion: this.data.occasion, mimeType: photo.type, imageBase64: encodeBase64(bytes) })
      });
      if (!this._current(operation)) return;
      if (!response.ok) throw new Error(response.status === 401 ? 'TEAM_TOKEN' : 'BACKEND');
      const advice = normalizeAdvice(await response.json());
      if (!this._current(operation)) return;
      if (!advice) throw new Error('BAD_ADVICE');
      this._operation = null;
      this._release(operation);
      this.setData({ busy: false, suggestions: advice, status: 'AI style ideas',
        detail: 'Suggestions for this photo. Review them yourself.', actionLabel: 'New photo', focusedAction: '' });
    } catch (cause) {
      if (!this._current(operation)) return;
      this._operation = null;
      this._release(operation);
      const message = cause && cause.message;
      let detail = 'Camera or request failed. Retry, or use Sample.';
      if (cause && (cause.name === 'NotAllowedError' || cause.name === 'SecurityError')) detail = 'Camera access denied. Enable permission or use Sample.';
      if (message === 'PHOTO_SIZE') detail = 'Use a JPEG/PNG photo up to 4 MB. Retry or Sample.';
      if (message === 'TEAM_TOKEN') detail = 'Team token expired or invalid. Ask the organizer, or use Sample.';
      if (message === 'BACKEND') detail = 'Backend unavailable. Check setup, then Retry or Sample.';
      if (message === 'BAD_ADVICE') detail = 'Unexpected advice format. Retry, or use Sample.';
      this.setData({ busy: false, status: 'Could not finish', detail, actionLabel: 'Retry', focusedAction: '' });
    }
  },
  focusWork() { this.setData({ focusedAction: 'work' }); },
  focusWeekend() { this.setData({ focusedAction: 'weekend' }); },
  focusEvening() { this.setData({ focusedAction: 'evening' }); },
  focusLive() { this.setData({ focusedAction: 'live' }); },
  focusSample() { this.setData({ focusedAction: 'sample' }); },
  focusCapture() { this.setData({ focusedAction: 'capture' }); },
  focusCancel() { this.setData({ focusedAction: 'cancel' }); },
  blurAction() { this.setData({ focusedAction: '' }); }
};
</script>

<page>
<view class="shell">
  <view class="topline">
    <text class="title">Style Lens</text>
    <text class="mode">{{modeLabel}} · {{occasionLabel}}</text>
  </view>
  <view ink:if="{{!busy}}" class="occasions">
    <button class="action {{focusedAction === 'work' ? 'focused' : ''}}" bindtap="selectWork" bindfocus="focusWork" bindblur="blurAction">{{occasion === 'work' ? '• Work' : 'Work'}}</button>
    <button class="action {{focusedAction === 'weekend' ? 'focused' : ''}}" bindtap="selectWeekend" bindfocus="focusWeekend" bindblur="blurAction">{{occasion === 'weekend' ? '• Weekend' : 'Weekend'}}</button>
    <button class="action {{focusedAction === 'evening' ? 'focused' : ''}}" bindtap="selectEvening" bindfocus="focusEvening" bindblur="blurAction">{{occasion === 'evening' ? '• Evening' : 'Evening'}}</button>
  </view>
  <view class="content">
    <text class="status">{{status}}</text>
    <text class="detail">{{detail}}</text>
    <view class="advice" ink:for="{{suggestions}}" ink:key="*this">
      <text class="number">{{index + 1}}</text><text class="tip">{{item}}</text>
    </view>
  </view>
  <view class="actions">
    <button ink:if="{{mode === 'sample'}}" class="action {{focusedAction === 'live' ? 'focused' : ''}}" bindtap="useLive" bindfocus="focusLive" bindblur="blurAction">Try Live</button>
    <button ink:if="{{mode === 'live' && !busy}}" class="action {{focusedAction === 'capture' ? 'focused' : ''}}" bindtap="captureAndSend" bindfocus="focusCapture" bindblur="blurAction">{{actionLabel}}</button>
    <button ink:if="{{busy}}" class="action {{focusedAction === 'cancel' ? 'focused' : ''}}" bindtap="cancelCapture" bindfocus="focusCancel" bindblur="blurAction">Cancel</button>
    <button ink:if="{{mode === 'live'}}" class="action {{focusedAction === 'sample' ? 'focused' : ''}}" bindtap="useSample" bindfocus="focusSample" bindblur="blurAction">Use Sample</button>
  </view>
</view>
</page>

<style>
.shell { width: 100%; min-height: 100%; padding: 10px 16px; box-sizing: border-box; color: #b8ffc3; background-color: #000000; opacity: 0.84; }
.shell:host-focus { opacity: 1; }
.topline, .occasions, .actions, .advice { display: flex; flex-direction: row; align-items: center; }
.topline { justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid rgba(64,255,94,0.3); }
.title { font-size: 20px; line-height: 24px; }
.mode { font-size: 14px; line-height: 18px; color: #40ff5e; }
.occasions { margin-top: 6px; }
.content { display: flex; flex-direction: column; margin-top: 8px; }
.status { font-size: 18px; line-height: 21px; }
.detail { margin-top: 3px; margin-bottom: 4px; font-size: 14px; line-height: 17px; }
.advice { margin-top: 4px; align-items: flex-start; }
.number { width: 24px; flex-shrink: 0; font-size: 17px; line-height: 21px; color: #40ff5e; }
.tip { flex: 1; font-size: 17px; line-height: 21px; }
.actions { margin-top: 10px; }
.action { margin-right: 8px; padding: 4px 10px; border: 1px solid rgba(64,255,94,0.55); border-radius: 4px; color: #b8ffc3; background-color: rgba(64,255,94,0.08); font-size: 16px; line-height: 18px; }
.focused { border: 2px solid #40ff5e; background-color: rgba(64,255,94,0.12); }
</style>
