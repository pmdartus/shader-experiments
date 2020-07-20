## Devlog

### `widow.devicePixelRatio` and multi-screen

The [`window.devicePixelRatio`](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) returns the ratio between physical pixel and CSS pixel on the current display.

Interestingly, The pixel ratio is computed on a per screen basis and not for the entire device. As a concrete example, on a Macbook pro laptop with an non-HDPI external display, `devicePixelRatio` returns `1`, while on the Retina screen it returns `2`. Another fun fact, devicePixelRatio is a getter computed on the fly. Moving the page from one screen to another does update the pixel ratio without reloading the page.