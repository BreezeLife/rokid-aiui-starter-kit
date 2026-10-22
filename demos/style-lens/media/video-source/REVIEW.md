# Video review

Reviewed on 2026-10-23 with HyperFrames 0.8.186, Node 26.8.2, HeadlessChrome 152.0.7977.30, macOS arm64 and Apple M1 Pro/ANGLE Metal.

- HyperFrames lint: zero findings.
- Browser check: passed; no runtime, layout or contrast errors or warnings.
- Craft: silence is intentional, as requested. There are no reading-time or text-size warnings.
- Inspected the full-resolution opening, contact sheets covering every captured state, representative cut seams, and 360px phone sheets. These are horizontal demos; for small players, use full-screen to read the app's fine UI labels.
- Decoded the delivered MP4 at 0.3s, 15s and 29.9s plus 20s (Setup needed). Captions, actual UI states and the disclosure remain visible, with no clipping or blank sample.
- ffprobe: H.264, yuv420p, 1280 × 720, 30fps, 900 frames, exactly 30.000000s, no audio stream.

Rendering used hard cuts and static screenshot holds. This is not a real-time screen recording, and no intermediate timer values, pointer movement, camera footage or provider result was generated. All source captures remain in `assets/captures/`; the app/runtime source binding and output SHA-256 are in [provenance.json](../provenance.json).

Commands (from this directory):

```sh
node prepare.mjs
npx --yes hyperframes@0.8.186 check . --json
npx --yes hyperframes@0.8.186 snapshot . --review --json
npx --yes hyperframes@0.8.186 render . --output ../demo.mp4 --fps 30 --quality delivery --workers 1
ffprobe -v error -show_entries format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate,pix_fmt,nb_frames -of json ../demo.mp4
```
