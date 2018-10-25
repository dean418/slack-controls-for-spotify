const SpotifyWebApi = require('spotify-web-api-node');
const refresh = require('spotify-refresh');
const bodyParser = require('body-parser');
const express = require('express');

let app = express();

let clientId = '<clientID>';
let clientSecret = '<client secret>';
let refreshToken = '<refresh token>';
let deviceId = '';
let error = false;


app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

let spotifyApi = new SpotifyWebApi({
	clientId: clientId,
	clientSecret: clientSecret,
});

function tokenRefresh() {
	refresh(refreshToken, clientId, clientSecret, function(err, res, body){
	if (err) return
	spotifyApi.setAccessToken(body.access_token);
	});
}

setInterval(tokenRefresh, 3400000)

// when the app recieves data
app.post('/', function(req, res) {
	let input = req.body.text;

	/*if the input was a number, change volume, otherwise,
	try to find a song using the users input*/
	if(typeof(parseInt(input, 10))) {
		changeVolume(parseInt(input, 10));
		res.send('Changed volume to: ' + input)
	} else {
		searchSong(req.body.text);
		if (error) {
			res.send("could not find " + input);
		} else {
			res.send("now playing: " + input);
		}
	}
});

function changeVolume(vol) {
	spotifyApi.changeVolume(vol);
}

function playSong(trackUri) {
	spotifyApi.play({
		uris: [trackUri],
		device_id: deviceId
	});
}

function searchSong(searchQuery) {
	spotifyApi.searchTracks(searchQuery, {limit: 1})
	.then(function(data) {
		let trackUri = data.body.tracks.items[0].uri;
		playSong(trackUri);
	}), function(err) {
		console.log(err);
		error = true;
	}
}

function findDevice() {
	spotifyApi.getMyDevices().then(function(data) {
		let deviceList = data.body.devices;

		for(let device of deviceList) {
			if(device.name == '<device name>') {
				deviceId = device.id;
			} else {
				// do nothing
			}
		}
	});
}

tokenRefresh();
findDevice();

module.exports = app;