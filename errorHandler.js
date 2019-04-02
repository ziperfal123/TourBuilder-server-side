errObject  = {   // This object will return in every error request
    statusCode: 0,
    Message: "",
    Comment: ""
}

module.exports = (statusCode, Message, Comment) => {
    errObject.statusCode = statusCode
    errObject.Message = Message
    errObject.Comment = Comment
    return errObject
}