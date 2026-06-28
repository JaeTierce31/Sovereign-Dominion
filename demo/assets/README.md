# Demo audio

The demo's optional music toggle (🎵 in the run row) plays a local track from
this folder. The track is **not bundled** — drop your own file here so the repo
stays free of third-party audio.

## To enable

Place an MP3 at:

```
demo/assets/dont-tell-your-dreams.mp3
```

(Any audio the file references is loaded `preload="none"` and only plays on an
explicit click — never autoplays. If the file is absent, the toggle is a no-op
and the rest of the demo is unaffected.)

To use a different filename, update the `<source src="...">` inside
`#demo-track` in `demo/index.html`.
