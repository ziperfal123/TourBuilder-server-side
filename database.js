/*** Data base connection */
const   consts      = require('./consts'),
        mongoose    = require('mongoose'),
        options     = {
                        autoReconnect: true,
                        useNewUrlParser: true,
                        useCreateIndex: true
                      }

mongoose.connect(consts.MLAB_KEY, options).then(
    () => {
        console.log("Successfully connected to Mlab")
    },
    err => {
        console.log(`Connection to Mlab failed: ${err}`)
    }
)