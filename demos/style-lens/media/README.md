# Style Lens diagnostic walkthrough

[Play or download the 30-second video](demo.mp4).

This silent 1280 × 720 video is edited from actual diagnostic browser screenshots captured by pointer interaction with the current app. It continuously identifies the patched Ink 0.19 runtime and that it is not Studio/device footage. It is a screenshot walkthrough, not a continuous screen recording. This is a **Sample/setup** walkthrough. Bundled advice is labelled Sample; Live stops at Setup needed. No photo was sent and no provider result is shown.

Original 1280 × 720 screenshots are preserved in [video-source/assets/captures](video-source/assets/captures/). Only the 480 × 352 app area is cropped and enlarged; captions are outside it. [Capture timestamps](capture-log.json), [SHA-256 hashes and source binding](provenance.json), and [shot timing](video-source/shots.json) make the edit inspectable. Source/runtime evidence is recorded in [verification/results.json](../../../verification/results.json).

The [Studio/device capture plan](capture-plan.md) remains pending. This video does not satisfy those evidence gates or establish Live provider support.

## Edit and render

From the repository root (Node.js 22+):

```sh
cd demos/style-lens/media/video-source
node prepare.mjs
npx --yes hyperframes@0.8.186 check . --json
npx --yes hyperframes@0.8.186 preview --background
npx --yes hyperframes@0.8.186 render . --output ../demo.mp4 --fps 30 --quality delivery --workers 1
```

`prepare.mjs` downloads pinned GSAP 3.14.2 and checks its SHA-256 before writing. GSAP is excluded from Git and remains subject to its [upstream standard license](https://gsap.com/standard-license); its original license header is retained. HyperFrames may download its browser and Inter fonts on first use. These are video-production dependencies, not AIUI app dependencies. No credentials are required. Native rendering can differ across browsers/operating systems, so byte-identical MP4 output is not promised.

Edit the actual scene HTML in `video-source/compositions/`; `shots.json` documents the timing. See [review notes](video-source/REVIEW.md) for checks and accepted limitations.
