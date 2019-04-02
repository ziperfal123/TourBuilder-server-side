const   express         = require('express'),
        spotify         = require('./Controllers/spotify.ctl'),
        googleMaps      = require('./Controllers/googleMaps.ctl'),
        tourBuilder     = require('./Controllers/tourBuilder.ctl'),
        bodyParser      = require('body-parser'),
        app             = express(),
        port            = process.env.PORT || 3000

app.use('/', express.static('./public'))
app.use(
    (req,res,next) => {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
        res.set("Content-Type", "application/json")
        next()
})
app.use(bodyParser.urlencoded({
    extended: true
  }))

app.use(bodyParser.json())


/*** All routes */

/***
 * Client should send spotify song id and get back json with songName & songAlbum  as a query string parameter
 * Query string parameter : songId
 * SongId example - 75JFxkI2RXiU7L9VXzMkle
 */
app.get('/getSongDetailsById', spotify.getSongDetailsById)

/*** 
 * Client should send spotify band id and get back json consists of array of all band's albums
 * Query string parameter : bandId
 * Coldplay spotify Id - 4gzpq5DPGxSnKTe4SA8HAU 
*/
app.get('/getAlbumsByBandId', spotify.getAlbumsByBandId)

/*** 
 * Client should send spotify album id and get back json consists of array of all album's songs
 * Query parameter : albumId
 * Coldplay's "Live In Buenos Aires" album id - 19CvkGjYpifkdwgVJSbog2 
*/
app.get('/getSongsByAlbumId', spotify.getSongsByAlbumId)

/***
 * Return all europe countries with their flags image, name, capital and alpha2code(=countryCode 2 letters)
 * No parameters
*/
app.get('/getAllCountries' , googleMaps.fetchCountriesList)

/*** 
 * This route will take care for all forms input and push it correctly into the DB
 * Client should send the following as a body parameters:
 * songs[] - a list of 10 songs (only songId)
 * userEmail
 * countryCode - capital city, country name(full name) --- Jerusalem, Israel
 * capital - (capital city)
 * Please note that if countryCode already exists in DB we're just update it and increment its counter
*/
app.post('/saveForm', tourBuilder.saveForm)

/***
 * This route will scan all users votes and build a tour consists of a CONST number of shows
 * It takes all top "Const number" of countries and will generate the best playlist for each
 * one of them based on the number of votes for each song in that specific country
 * will also build the tour in geo-wise sequence
 * No need to send any parameters
 * Will return success json
*/
app.post('/createShows', tourBuilder.createShows)

/***
 * This route will return an array of all shows from the DB
*/
app.get('/getAllShows', tourBuilder.getAllShows)

/***
 * This route will allow the band to delete one show from the tour
 * Client should send the following parameters:
 * showId to delete from the tour as a body parameter (if removeAll is true then its optional)
 * secretKey - with it only the band can remove shows -- body parameter
 * removeAll - if true remove all shows(optional)
*/
app.delete('/removeShow', tourBuilder.removeShow)

/***
 * Will redirect the Client to the service API
 */
app.get('/api', tourBuilder.showApi)

/***
 * An error json for all other routes
*/
app.all('*', tourBuilder.errFunc)


app.listen(port,() => {
    console.log(`Listening on port: ${port}`)
})