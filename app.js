const SpotifyWebApi = require('spotify-web-api-node');
const refresh = require('spotify-refresh');
const bodyParser = require('body-parser');
const express = require('express');

let app = express();
let clientId = '';
let clientSecret = '';
let refreshToken = '';
let deviceId = '';
let queue = [];
let EOS = false;
let loop = 0;
let duration = 0;

app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

let spotifyApi = new SpotifyWebApi({
	clientId: clientId,
	clientSecret: clientSecret,
});

function tokenRefresh() {
	refresh(refreshToken, clientId, clientSecret, function (err, res, body) {
		if (err) return
		console.log(body.access_token);
		spotifyApi.setAccessToken(body.access_token);
	});
}

setInterval(tokenRefresh, 30000);

app.post('/', function (req, res) {
	let input = req.body.text;
	console.log(input);
	if (isNaN(input)) {
		searchSong(input);
		res.send("added " + input + " to the queue");
	} else {
		changeVolume(input);
		res.send("volume changed to: " + input);
		console.log("vol: " + input)
	}
});

function changeVolume(vol) {
	spotifyApi.setVolume(vol);
}

function playSong(trackUri) {
	spotifyApi.play({
		uris: trackUri,
		device_id: deviceId
	});
}

function searchSong(searchQuery) {
	spotifyApi.searchTracks(searchQuery, {limit: 1})
		.then(function (data) {
			let trackUri = data.body.tracks.items[0].uri;
			let duration = data.body.tracks.items[0].duration_ms;
			// console.log(duration)

			queue.push(trackUri);
			if(!EOS) {
				playSong(queue);
			}
			
			setTimeout(songTimer, duration);
		});
}

function songTimer() {
	console.log("removed");
	console.log(queue)
	queue.splice(0, 1);
	console.log(queue)
	EOS = true;
	playSong(queue);
}

// setTimeout(songTimer, duration)


function findDevice() {
	spotifyApi.getMyDevices().then(function (data) {
		let deviceList = data.body.devices;
		for (let device of deviceList) {
			if (device.name == "Stuart's Echo") {
				deviceId = device.id;
			} else {
				//do nothing
			}
		}
	});
}
findDevice();
tokenRefresh();
spotifyApi.pause()
module.exports = app;