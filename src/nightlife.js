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
				let { sunrise: tomorrowSunrise, sunset: tomorrowSunset } = new SolarCalc(tomorrow, latitude, longitude);

				return { sunrise, sunset, tomorrowSunrise, tomorrowSunset }
			})
			.catch(err => {
				console.error(`Can't detect night time based on location, fallback to hour-based detection`, err)

				let sunrise = new Date(today)
				sunrise.setHours(6, 0, 0, 0)
				let sunset = new Date(today)
				sunset.setHours(18, 0, 0, 0)
				let tomorrowSunrise = new Date(tomorrow)
				tomorrowSunrise.setHours(6, 0, 0, 0)
				let tomorrowSunset = new Date(tomorrow);
				tomorrowSunset.setHours(18, 0, 0, 0)

				return { sunrise, sunset, tomorrowSunrise, tomorrowSunset }
			})
	},

	autoApplyNightMode(forcedMode) {
		return nightlife.calcSunriseAndSunset().then(({ sunrise, sunset, tomorrowSunrise, tomorrowSunset }) => {
			let isNight = Date.now() > sunset || Date.now() < sunrise
			if (forcedMode !== undefined) isNight = forcedMode
			Object.assign(nightlife, { isNight, sunrise, sunset, tomorrowSunrise, tomorrowSunset })
			return nightlife.toggleNightMode(isNight)
		})
	},

	toggleNightMode(isNight) {
		if (isNight === undefined) isNight = !nightlife.isNight

		prefersColorScheme(isNight ? "dark" : "light")
		nightlife.isNight = isNight
		clearTimeout(nightlife.timeout)

		let now = Date.now();

		if (isNight) {
			let nextSunrise = now < nightlife.sunrise ? nightlife.sunrise : nightlife.tomorrowSunrise;
			nightlife.timeout = setTimeout(() => {
				log(`A new day has risen`)
				nightlife
					.autoApplyNightMode(false)
					.then(() => nightlife.listeners.sunrise.forEach(cb => cb()))
			}, nextSunrise.getTime() - Date.now())
		} else {
			let nextSunset = now < nightlife.sunset ? nightlife.sunset : nightlife.tomorrowSunset;
			nightlife.timeout = setTimeout(() => {
				log(`Night has fallen`)
				nightlife
					.autoApplyNightMode(true)
					.then(() => nightlife.listeners.sunset.forEach(cb => cb()))
			}, nextSunset.getTime() - Date.now())
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
