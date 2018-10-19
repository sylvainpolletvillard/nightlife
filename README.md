# nightlife
# nightlife

nightlife detects users location and calculates sunrise and sunset time at their location, to apply a different style at night time.

If user location can not be retrieved, it is assumed that the night goes from 6pm to 6am, local time.

## Install

```html
<!-- inside your <head> -->
<script defer src="unpkg.com/nightlife/dist/nightlife.js"></script>
```

## Night mode CSS

If you want a default basic night theme, you can use this one: it inverts the lightness of all colors except for images and videos.

```html
<link rel="stylesheet" href="unpkg.com/nightlife/dist/nightlife.css" />
```

If you want your own styles at night time, use this media query:

```css
@media (prefers-color-scheme: dark) {
    /* these styles will apply at night time
       or if user explicitely asks for a dark color scheme */
    body {
        background-color: black;
    }
}
```

This media query is currently not supported on most browsers, so you will also have to use this : [css-prefers-color-scheme](https://www.npmjs.com/package/css-prefers-color-scheme)

## API

```js
nightlife.on("init", function(){
    console.log(
        `nightlife is now initialized.`,
        `It's ${nightlife.isNight ? 'night' : 'day'}.`,
        `Today, sun rises at ${nightlife.sunrise.toLocaleTimeString()}
            and sets at ${nightlife.sunset.toLocaleTimeString()}`
    )
});

nightlife.on("sunrise", () => console.log(`A new day has risen.`))
nightlife.on("sunset", () => console.log(`Night has fallen.`))
```