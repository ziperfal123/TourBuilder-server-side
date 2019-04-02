const getJson       =   require('get-json'),
      consts        =   require('../consts')
var   errorHandler  =   require('../errorHandler')


module.exports = {
    // ..  returns all countries and their flags img ..
    async fetchCountriesList(req , res) { 
        await getJson(`https://restcountries.eu/rest/v2/region/europe?fields=name;alpha2Code;flag;capital` , (err ,JsonResponse) => {
            if (err) {
                res.json(errorHandler(404, "Failed", "Can not get all countries"))
                return
            }
                var jsonObj = {
                    countries: null
                }
                jsonObj.countries = JsonResponse
                res.json(jsonObj)
        })
    },

    /*
    NOTICE - general assumption in this function implementation:
    the first (=[0]) Country in the 'countriesJson' is the origin! (=the first show location in the tour..)
    */
    // ..  Calculates and returns the shortest geo-wise route of countries ..
    createRouteOfCountries(countriesJson, callback) {
        countriesJson = normalizeCitiesWith2Words(countriesJson);  // normalization of cities names with the format "word word" into the format "word+word" so they could be passed to the queryString.
        var numOfCountries = Object.keys(countriesJson).length;
        var finalRoute = new Array;
        var urlGoogleMaps = "";
        //  .. Checking all the cases. list of countries can contain 1-7 countries. the number of parameters are changing accordingly ..
        switch (numOfCountries){
            case 1:
                finalRoute.push(countriesJson[0].code)
                callback(finalRoute)
                return
            
            case 2:
                finalRoute.push(countriesJson[0].code)
                finalRoute.push(countriesJson[1].code)
                callback(finalRoute)
                return
            
            case 3:
                urlGoogleMaps =    `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${countriesJson[0].capital},${countriesJson[0].code}|${countriesJson[1].capital},${countriesJson[1].code}|${countriesJson[2].capital},${countriesJson[2].code}
                                    &destinations=${countriesJson[0].capital},${countriesJson[0].code}|${countriesJson[1].capital},${countriesJson[1].code}|${countriesJson[2].capital},${countriesJson[2].code}&key=${consts.googleKey}`;
                break;

            case 4:
                urlGoogleMaps =    `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${countriesJson[0].capital},${countriesJson[0].code}|${countriesJson[1].capital},${countriesJson[1].code}|${countriesJson[2].capital},${countriesJson[2].code}|${countriesJson[3].capital},${countriesJson[3].code}
                                    &destinations=${countriesJson[0].capital},${countriesJson[0].code}|${countriesJson[1].capital},${countriesJson[1].code}|${countriesJson[2].capital},${countriesJson[2].code}|${countriesJson[3].capital},${countriesJson[3].code}&key=${consts.googleKey}`;
                break;

            case 5:
                urlGoogleMaps =    `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${countriesJson[0].capital},${countriesJson[0].code}|${countriesJson[1].capital},${countriesJson[1].code}|${countriesJson[2].capital},${countriesJson[2].code}|${countriesJson[3].capital},${countriesJson[3].code}|${countriesJson[4].capital},${countriesJson[4].code}
                                    &destinations=${countriesJson[0].capital},${countriesJson[0].code}|${countriesJson[1].capital},${countriesJson[1].code}|${countriesJson[2].capital},${countriesJson[2].code}|${countriesJson[3].capital},${countriesJson[3].code}|${countriesJson[4].capital},${countriesJson[4].code}&key=${consts.googleKey}`;
                break;

            case 6:
                urlGoogleMaps =    `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${countriesJson[0].capital},${countriesJson[0].code}|${countriesJson[1].capital},${countriesJson[1].code}|${countriesJson[2].capital},${countriesJson[2].code}|${countriesJson[3].capital},${countriesJson[3].code}|${countriesJson[4].capital},${countriesJson[4].code}|${countriesJson[5].capital},${countriesJson[5].code}
                                    &destinations=${countriesJson[0].capital},${countriesJson[0].code}|${countriesJson[1].capital},${countriesJson[1].code}|${countriesJson[2].capital},${countriesJson[2].code}|${countriesJson[3].capital},${countriesJson[3].code}|${countriesJson[4].capital},${countriesJson[4].code}|${countriesJson[5].capital},${countriesJson[5].code}&key=${consts.googleKey}`;
                break;

            case 7:
                urlGoogleMaps =    `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${countriesJson[0].capital},${countriesJson[0].code}|${countriesJson[1].capital},${countriesJson[1].code}|${countriesJson[2].capital},${countriesJson[2].code}|${countriesJson[3].capital},${countriesJson[3].code}|${countriesJson[4].capital},${countriesJson[4].code}|${countriesJson[5].capital},${countriesJson[5].code}|${countriesJson[6].capital},${countriesJson[6].code}
                                    &destinations=${countriesJson[0].capital},${countriesJson[0].code}|${countriesJson[1].capital},${countriesJson[1].code}|${countriesJson[2].capital},${countriesJson[2].code}|${countriesJson[3].capital},${countriesJson[3].code}|${countriesJson[4].capital},${countriesJson[4].code}|${countriesJson[5].capital},${countriesJson[5].code}|${countriesJson[6].capital},${countriesJson[6].code}&key=${consts.googleKey}`;
                break;
        }
        getJson(urlGoogleMaps , (err , response) => {   
            finalRoute = calculateRoute(response , numOfCountries);
            callback(finalRoute);
        });
    }
}


// .. in order to send the every possible type of cities names to the query string as parameters ..
function normalizeCitiesWith2Words(countriesCodeAndCapitalJsonArray) {      
    countriesCodeAndCapitalJsonArray.forEach(countryElem => {
        countryElem.capital = countryElem.capital.replace(/\s+/g, '+')
    });
    return countriesCodeAndCapitalJsonArray;
}



// .. if all the countries already checked --> flag for finish route calculation .. 
function checkIfAllCountryFlagsAreTrue(countriesToCheck) {
    let numOfCountries = countriesToCheck.length;
    let flagsCounter = 0;
    
    countriesToCheck.forEach(country => {
        if (country.alreadyCheckedFlag === true)
            flagsCounter++;
    });

    return (flagsCounter === numOfCountries) ? true : false;     
}



function calculateRoute(countriesJson , numOfCountries) {
    
    // .. Parsing the json and preparing the general variables..
    var countriesStringArray = countriesJson.origin_addresses;
    var theLocalJson = countriesJson;
    var finalRoute1 = new Array;     // initializing the final route array with the origin point in the first place
    finalRoute1.push(countriesStringArray[0])
    var min = 0;
    var countryIndex = 0;
    var loopIterationIndex = 0;
    var breakFlag = false;

    // .. Adding 'alreadyCheckedFlag' flag to the countries ..
    for(let i = 0 ; i < countriesStringArray.length ; i++) {
        for (let j = 0 ; j < countriesStringArray.length ; j++) {
            theLocalJson.rows[i].elements[j]['alreadyCheckedFlag'] = false; 
        }
    }

    while(loopIterationIndex < numOfCountries) {
        min = 0;            // for having a starting minimum value from a country that was not already checked
        breakFlag = false;
        if (loopIterationIndex === 0)
            closestCountryIndex = -1; 

        // .. for having a tmp minimum value (that is != 0 --> in a "selfCountryCase"- this is why using the '40' as a condition). when a first valid distance value will be found- the forEach iterations will stop ..
        theLocalJson.rows[countryIndex].elements.forEach( (elem , index)  => {
            if(elem.distance.value > 40 && elem.alreadyCheckedFlag === false && breakFlag === false) {     
                    min = elem.distance.value;
                    closestCountryIndex = index;
                    breakFlag = true;
                }   
            });

        // .. finding the closest country  ..
        if (checkIfAllCountryFlagsAreTrue(theLocalJson.rows[countryIndex].elements) != true) {      
            (theLocalJson.rows[countryIndex].elements).forEach(function(country , index) {
                if (country.distance.value < min && country.distance.value > 40 && country.alreadyCheckedFlag === false) {
                    min = country.distance.value;
                    closestCountryIndex = index;
                }
            });    
    
            for (let index = 0 ; index < countriesStringArray.length ; index++){
                theLocalJson.rows[index].elements[countryIndex]['alreadyCheckedFlag'] = true;      // "painting" the current country for all the countries
                theLocalJson.rows[index].elements[closestCountryIndex]['alreadyCheckedFlag'] = true;      // "painting" the country that was just found for all the countries
            }

            finalRoute1.push(countriesStringArray[closestCountryIndex]);    
            countryIndex = closestCountryIndex;    // for having the previous country in the next iteration as the main country
        }

        loopIterationIndex++;
    }
    
    return finalRoute1;
}