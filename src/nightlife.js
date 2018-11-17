const SolarCalc = require("solar-calc")
const prefersColorScheme = require("css-prefers-color-scheme").default

const NAME = "nightlife"
const error = message => {
	throw new Error(`[${NAME}] ${message}`)
}
const log = message => console.log(`[${NAME}] ${message}`)

const nightlife = {
	calcSunriseAndSunset() {
		const today = new Date();
		const tomorrow = new Date();
		tomorrow.setDate(today.getDate() + 1);

		return new Promise((resolve, reject) =>
			navigator.geolocation.getCurrentPosition(resolve, reject)
		)
			.then(({ coords: { latitude, longitude } }) => {
				let { sunrise, sunset } = new SolarCalc(today, latitude, longitude);
				let { sunrise: tomorrowSunrise } = new SolarCalc(tomorrow, latitude, longitude);

				return { sunrise, sunset, tomorrowSunrise }
			})
			.catch(err => {
				console.error(`Can't detect night time based on location, fallback to hour-based detection`, err)

				let sunrise = new Date(today).setHours(6, 0, 0, 0)
				let sunset = new Date(today).setHours(18, 0, 0, 0)
				let tomorrowSunrise = new Date(tomorrow).setHours(6, 0, 0, 0)

				return { sunrise, sunset, tomorrowSunrise }
			})
	},

	autoApplyNightMode(forcedMode) {
		return nightlife.calcSunriseAndSunset().then(({ sunrise, sunset, tomorrowSunrise }) => {
			let isNight = Date.now() > sunset || Date.now() < sunrise
			if (forcedMode !== undefined) isNight = forcedMode
			Object.assign(nightlife, { isNight, sunrise, sunset, tomorrowSunrise })
			return nightlife.toggleNightMode(isNight)
		})
	},

	toggleNightMode(isNight) {
		if (isNight === undefined) isNight = !nightlife.isNight

		prefersColorScheme(isNight ? "dark" : "light")
		nightlife.isNight = isNight
		clearTimeout(nightlife.timeout)

		if (isNight) {
			nightlife.timeout = setTimeout(() => {
				log(`A new day has risen`)
				nightlife
					.autoApplyNightMode(false)
					.then(() => nightlife.listeners.sunrise.forEach(cb => cb()))
			}, nightlife.tomorrowSunrise.getTime() - Date.now())
		} else {
			nightlife.timeout = setTimeout(() => {
				log(`Night has fallen`)
				nightlife
					.autoApplyNightMode(true)
					.then(() => nightlife.listeners.sunset.forEach(cb => cb()))
			}, nightlife.sunset.getTime() - Date.now())
		}

		return isNight
	},

	listeners: { init: [], sunrise: [], sunset: [] },
	on(event, cb) {
		if (!this.listeners.hasOwnProperty(event))
			error(`Unknown event: ${event}`)
		nightlife.listeners[event].push(cb)
	}
}

nightlife
	.autoApplyNightMode()
	.then(() => nightlife.listeners.init.forEach(cb => cb()))
window.nightlife = nightlife
