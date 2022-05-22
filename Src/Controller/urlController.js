const urlModel = require('../Model/urlModel')
const shortid = require('shortid')
const redis = require('redis')
const { promisify } = require("util");


//Connect to redis
const redisClient = redis.createClient(
    10269,
    "redis-10269.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("YLY1q832YZYVk5eRkQouNN03ycLQbLVD", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


//---------------------------Valiadtions-----------------------------------------//
//request body validation
const isValidRequest = function (request) {
    return (Object.keys(request).length > 0)
}
//value validation
const isValidValue = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    if (typeof value === 'number' && value.toString().trim().length === 0) return false
    return true
}
const isValidUrl = function (url) {
    const urlRegex = /(http|https|ftp):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/
    return urlRegex.test(url)
}

//---------------------------------------------------Shorten Url API-----------------------------------------------------------------//
const shortenUrl = async (req, res) => {
    try {
        let longUrl = req.body.longUrl

        //Url Validations
        if (!isValidRequest(req.body))
            return res.status(400).send({ status: false, message: "No input by user" })
        if (!isValidValue(longUrl))
            return res.status(400).send({ status: false, message: "longUrl is required." })

        if (!isValidUrl(longUrl))
            return res.status(400).send({ status: false, message: "Long Url is invalid." })


        let url = longUrl.trim();
        if (!(url.includes('.'))) {
            return res.status(400).send({ status: false, msg: "Invalid longurl" })
        }
        const alreadyExistUrl = await urlModel.findOne({ longUrl: url })
        if (alreadyExistUrl)
            return res.status(200).send({ status: true, message: "url is already exist", data: alreadyExistUrl })

        //   creating url
        let baseUrl = "http://localhost:3000"
        let urlCode = shortid.generate().toLowerCase();
        let shortUrl = baseUrl + '/' + urlCode;

        const generateUrl = { longUrl: url, shortUrl: shortUrl, urlCode: urlCode }

        //Set cache the newly created url
        if (generateUrl) {
            await urlModel.create(generateUrl)
            await SET_ASYNC(`${generateUrl}`, JSON.stringify(longUrl))
            // }
            return res.status(201).send({ status: true, message: "Short url Successfully created", data: generateUrl })
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//---------------------------------------------------Get Url API-----------------------------------------------------------------//
const getUrl = async (req, res) => {
    try {
            const urlCode = req.params.urlCode

            let cachedUrlCode = await GET_ASYNC(`${urlCode}`)

            if (cachedUrlCode) {

                let parseUrl = JSON.parse(cachedUrlCode)
                let cachedLongUrl = parseUrl.longUrl
                return res.status(302).redirect(cachedLongUrl)
            }
            let findUrlcode = await urlModel.findOne({ urlCode:urlCode })

            if (!findUrlcode) return res.status(404).send({ status: false, message: "URL code not found" })

            await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrlcode))

            return res.status(302).redirect(findUrlcode.longUrl)

        }
     catch (err) {
                return res.status(500).send({ status: false, message: err.message })
            }
        }

        module.exports = { shortenUrl, getUrl }