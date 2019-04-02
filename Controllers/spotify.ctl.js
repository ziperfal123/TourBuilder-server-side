const request   = require('request'),     // module for sending requests for an external API'S
      consts    = require('../consts')
var   errHandler = require('../errorHandler'), // This object will return when there are requests errors
      token     = null,     // spotify secret key
      query     = null      // query object for spotify api

var authOptions = {  // Spotify Authentication -- token is the key for all spotify quries
    url: 'https://accounts.spotify.com/api/token',     // Authentication route from spotify API
    headers: {
        'Authorization': 'Basic ' + (Buffer.from(consts.SpotifyClient + ':' + consts.SpotiftSecret).toString('base64'))
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
}
      
request.post(authOptions, (error, response, body) => { // sending authentication request to spotify
    if (!error && response.statusCode === 200) {
        token = body.access_token;
        query = {
            url: '',
            headers: {
              'Authorization': 'Bearer ' + token
            },
            json: true
          }
    }
})


module.exports = {
    async getAlbumsByBandId(req,res) { // return all albums of a band from spotify api
         query.url = `https://api.spotify.com/v1/artists/${req.query.bandId}/albums`
          await request.get(query, (error, response) => {
            if(error || response.body.error) {
                res.json(errHandler(404, "Failed", "Can not get all albums by band ID from spotify API"))
                return
            }
            var albumsJson = {
                albums: []
            }
            var i = 0
            if(!response.body.items.length) {
                res.json(errHandler(404, "Failed", `No albums for ${req.query.bandId} band`))
                return
            }
            response.body.items.forEach(element => { // iterate all band's albums
                var albumObj = {
                    albumName: element.name,
                    albumId: element.id,
                    albumImg: element.images[1].url    // album image (300*300) if we want 64*64 =>[2], 640*640 =>[0]
                }
                albumsJson.albums.push(albumObj)
            })
            res.json(albumsJson) // return albums json
          })
    },

    async getSongsByAlbumId(req, res) { // return all songs by albumId
        query.url = `https://api.spotify.com/v1/albums/${req.query.albumId}/tracks`
        await request.get(query, (error, response) => {
            if(error || response.body.error) {
                res.json(errHandler(404,"Failed", "Can not get all songs by album ID from spotify API"))
                return
            }
            var songsJson = {
                songs: []
            }
            var i = 0
            if(!response.body.items.length) {
                res.json(errObject(404,`No songs in album ${req.query.albumId}`))
                return
            }
            response.body.items.forEach(element => { // iterate all album's songs
                var songObj = {
                    songName: element.name,
                    songId: element.id,
                    songAlbum: req.query.albumId
                }
                songsJson.songs.push(songObj)
            })
            res.json(songsJson) // return songs json
          })
    },

    async getSongDetailsById(req,res) { // return song name by its spotify Id
        query.url = `https://api.spotify.com/v1/tracks/${req.query.songId}`
        await request.get(query, (error, response) => {
            if(error || response.body.error) {
                res.json(errHandler(404, "Failed", "Can not get song details by song ID from spotify API"))
                return
            }
            res.json({"songName": response.body.name, "songAlbum": response.body.album.name})
        })
    }
}