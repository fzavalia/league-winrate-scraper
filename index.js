const axios = require('axios').default
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const champs = require('./champs.json').slice(0, 5)

const baseUrl = 'https://www.leagueofgraphs.com/es/rankings/summoners/'

const getWinPercentage = res =>
    Promise.resolve(cheerio.load(res))
        .then($ => $('.data_table > tbody').children().map((_, e) => $(e).children('td:nth-child(4)').text()).toArray())

const makeRequest = champ =>
    axios.get(baseUrl + champ)
        .then(res => res.data)
        .then(getWinPercentage)
        .then(res => res.map(x => x.toString()))
        .then(res => res.map(x => x.match(/\d.?\.\d/)))
        .then(res => res.filter(x => x != null))
        .then(res => res.map(x => x[0]))
        .then(res => res.map(parseFloat))
        .then(res => res.reduce((acc, next) => acc + next, 0) / res.length)
        .then(res => ({ champ, mean: res }))

const requests = champs.map(makeRequest)

Promise.all(requests)
    .then(res => {
        const writePath = path.resolve(__dirname, 'data')
        if (!fs.existsSync(writePath)) {
            fs.mkdirSync(writePath)
        }
        fs.writeFileSync(
            path.resolve(writePath, new Date().toDateString()),
            JSON.stringify(res, null, 2)
        )
    })
    .catch(console.error)