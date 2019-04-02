const   users         = require('../Models/usersModel'), // all database models
        votes         = require('../Models/votesModel'),
        shows         = require('../Models/showsModel'),
        emailValidator= require("email-validator"),
        googleMaps    = require("./googleMaps.ctl"),
        consts      = require('../consts'),
        sumOfShows    = 7,
        sumOfSongs    = 10,
        showDates     = ["01/01/2019", "06/01/2019", "11/01/2019", "16/01/2019", "21/01/2019", "26/01/2019", "01/02/2019"]
var     errorHandler      = require('../errorHandler')

module.exports = {
    
    async saveForm(req, res) {
        // Check mail address correctness
        if(!req.body.userEmail || !emailValidator.validate(req.body.userEmail)) {
            res.json(errorHandler(404, "Failed", "Bad user email input"))
            return
        }
        if(req.body.songs.length != 10) { // check that user send 10 songs
            res.json(errorHandler(404, "Failed", "Songs list should consists of 10 songs"))
            return
        }
        if(!req.body.capital || !req.body.countryCode) {
            res.json(errorHandler(404, "Failed", "CountryCode/capital city are missing"))
            return
        }
        // check if user is already vote
        await users.findOne({userEmail: req.body.userEmail}, async (err, docFindOne) => {
            if(err) {
                res.json(errorHandler(404, `Failed", "There is a problem with fetching users data from the DB: ${err}`))
                return
            }
            else if(docFindOne) { // if already in users means this user is already vote
                    res.json(errorHandler(404, "Failed", "This user is already voted, access denied"))
                    return 
                }
                 else { // if not we create new user and save his vote
                     await users.create({
                        userEmail: req.body.userEmail,
                        countryCode: req.body.countryCode
                     }, 
                     (err) => {
                        if(err) {
                            res.json(errorHandler(404, "Failed", `Create new user request faild: ${err}`))
                            return
                        }
                     })
                     // and then check if country is already in database
                     await votes.findOne({countryCode: req.body.countryCode}, async (err, docFindOne) => {
                        if(err) {
                            res.json(errorHandler(404, "Failed", `${err}`))
                            return
                        }
                        else if(docFindOne) { // check if country is already in database then only update counters
                                // update songs counter
                                req.body.songs.forEach(element => {
                                    var isFound = false
                                    docFindOne.songs.forEach(item => {
                                        if(element.songId == item.songId) { // means that song already pick in this country
                                            ++item.counter // increment song counter and pass to the next song
                                            isFound= true
                                            return
                                        }
                                    })
                                    if(!isFound) {//if a song is not picked yet in this country then we create it and add it to the songs list
                                        var songObj = {
                                                songId: element.songId,
                                                counter: 1
                                            }
                                        docFindOne.songs.push(songObj)
                                    }
                                })
                                await votes.updateOne({countryCode: req.body.countryCode}, {$set: {votesCounter: ++docFindOne.votesCounter, songs: docFindOne.songs}}, {}, (err,result) => {
                                    if(err) {
                                        res.json(errorHandler(404, "Failed", `Update request faild: ${err}`))
                                        return
                                    }
                                })
                            }
                            else { // means country not in the database then we create new country ans initialize counters
                                var songsArray = new Array
                                req.body.songs.forEach(element => {
                                     var songObject = {
                                         songId: element.songId,
                                         counter: 1
                                     }
                                     songsArray.push(songObject)
                                })
                                await votes.create({
                                    countryCode: req.body.countryCode,
                                    capital: req.body.capital,
                                    songs: songsArray,
                                    votesCounter: 1
                                }, 
                                (err) => {
                                    if(err) {
                                        res.json(errorHandler(404, "Failed", `Create votes request faild: ${err}`))
                                        return
                                    }
                                })
                            }
                     })
                     res.json({statusCode: 200, Message: "Success"})
                 }
        })
    },

    async createShows(req,res) {
        var showid = 1
        var i = 0
        //find the top 7 voted countries
        await votes.find().sort({votesCounter: -1}).limit(sumOfShows).exec(async (err,result) => {
            if(err){
                res.json(errorHandler(404, "Failed", `${err}`));
                return;
            }
            else if(result) { // if there is countries to iterate
                var countriesArray = new Array
                result.forEach(element => { // insert all countries in array for sending fpr googleMaps api
                    var countryObj = {
                        "code":element.countryCode,
                        "capital":element.capital
                    }
                    countriesArray.push(countryObj)
                })
                googleMaps.createRouteOfCountries(countriesArray, (orderedCountriesArray) => { // sending all top countries for calculate geo-wise route for the tour
                    console.log(orderedCountriesArray)
                    result.forEach(element => {
                        var ArraySongId = new Array;
                        result.forEach(country => { // finding the country which belongs to the correct songs list
                            if(country.countryCode == orderedCountriesArray[i]) {
                                //Extract the top 10 songs for each country
                                var topvalues=country.songs.sort((a,b)=> b.counter-a.counter).slice(0,sumOfSongs);
                                topvalues.forEach(element => {
                                    var oneSong = {
                                    songId: element.songId
                                    }
                                    ArraySongId.push(oneSong);
                                })
                            }
                        })
                        shows.create({ // creating new show with all calculated details
                                showId: showid++,
                                countryCode: orderedCountriesArray[i],
                                date: showDates[i++],
                                songs: ArraySongId
                            },
                            (err) => {
                                if(err) {
                                    res.json(errorHandler(404, "Failed", `Create new show request failed: ${err}`));
                                    return;
                                }
                            })
                    }) 
                })
            }
            else { // in case there were no any votes there are no countries to make a show
                res.json({StatusCode: 201, Message: "Success", Comment: "There are no countries to make a show"})
                return
            }
        })
        res.json({statusCode: 200, Message: "Success"});
    },

    async getAllShows(req,res) {
        await shows.find({}, (err, doc) => {
            if(err) {
                res.json(errorHandler(404, "Failed", `No shows in the database: ${err}`))
                return
            }
            res.json(doc)
        })
    },

    async removeShow(req,res) {
        if(req.body.secretKey != consts.bandSecretKey) {
            res.json(errorHandler(404, "Failed", "Error on the band secret key, only the band can remove shows from the tour"))
            return
        }
        if(req.body.removeAll == "true") {
            await shows.deleteMany({}, (err, doc) => {
                if(err) {
                    res.json(errorHandler(404, "Failed", `${err}`))
                    return
                }
                if(!doc.n) {
                    res.json(errorHandler(404, "Failed", "Nothing to delete"))
                    return
                }
                else
                    res.json({StatusCode: 200, Message: "Success"})
            })
            return
        }
        await shows.deleteOne({showId: req.body.showId}, (err, doc) => {
            if(err) {
                res.json(errorHandler(404, "Failed", `${err}`))
                return
            }
            if(!doc.n) {
                res.json(errorHandler(404, "Failed", "Nothing to delete"))
                return
            }
            else
                res.json({StatusCode: 200, Message: "Success"})
        })
    },

    showApi(req,res) {
        res.redirect("https://documenter.getpostman.com/view/5691767/RztfvrM3");
    },

    errFunc(req,res) {
        res.json(errorHandler(404, "Failed", "This route is not available"))
    }
}