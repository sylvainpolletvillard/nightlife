const SolarCalc = require("solar-calc");
const prefersColorScheme = require("css-prefers-color-scheme").default;

const NAME = "nightlife";
const error = message => { throw new Error(`[${NAME}] ${message}`) }
const log = message => console.log(`[${NAME}] ${message}`)

const nightlife = {
    calcSunriseAndSunset() {
        return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject))
            .then(({ coords: { latitude, longitude } }) => {
                return new SolarCalc(new Date(), latitude, longitude);
            })
            .catch(err => {
                console.error(`Can't detect night time based on location, fallback to hour-based detection`, err)

                let sunrise = new Date();
                sunrise.setHours(6, 0, 0, 0);

                let sunset = new Date();
                sunset.setHours(18, 0, 0, 0);

                return { sunrise, sunset }
            })
    },

    toggleNightMode() {
        return nightlife.calcSunriseAndSunset()
            .then(({ sunrise, sunset }) => {
                const isNight = Date.now() > sunset || Date.now() < sunrise;
                prefersColorScheme(isNight ? 'dark' : 'light');
                Object.assign(nightlife, { isNight, sunrise, sunset });
                clearTimeout(nightlife.timeout);

                if (isNight) {
                    if (sunrise < Date.now()) sunrise.setDate(sunrise.getDate() + 1);
                    nightlife.timeout = setTimeout(() => {
                        log(`A new day has risen`)
                        nightlife.listeners.sunrise.forEach(cb => cb())
                        nightlife.toggleNightMode()
                    }, sunrise.getTime() - Date.now());
                } else {
                    if (sunset < Date.now()) sunset.setDate(sunset.getDate() + 1);
                    nightlife.timeout = setTimeout(() => {
                        log(`Night has fallen`)
                        nightlife.listeners.sunset.forEach(cb => cb())
                        nightlife.toggleNightMode();
                    }, sunset.getTime() - Date.now());
                }

                return isNight
            })
    },

    listeners: { init: [], sunrise: [], sunset: [] },
    on(event, cb) {
        if (!this.listeners.hasOwnProperty(event)) error(`Unknown event: ${event}`);
        nightlife.listeners[event].push(cb);
    }
}

nightlife.toggleNightMode().then(() => nightlife.listeners.init.forEach(cb => cb()));
window.nightlife = nightlife;