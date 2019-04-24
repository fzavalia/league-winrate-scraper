const axios = require('axios').default
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const champs = require('./champs.json')
const datefns = require('date-fns')

const baseUrl = 'https://www.leagueofgraphs.com/es/rankings/summoners/'

const logCurrentScrapedChamp = (champ, res) => {
    console.log('Scraping ' + champ)
    return res
}

const getWinPercentage = res =>
    Promise.resolve(cheerio.load(res))
        .then($ => $('.data_table > tbody').children().map((_, e) => $(e).children('td:nth-child(4)').text()).toArray())

const scrapChamp = champ =>
    axios.get(baseUrl + champ)
        .then(res => res.data)
        .then(res => logCurrentScrapedChamp(champ, res))
        .then(res => getWinPercentage(res))
        .then(res => res.map(x => x.toString()))
        .then(res => res.map(x => x.match(/\d.?\.\d/)))
        .then(res => res.filter(x => x != null))
        .then(res => res.map(x => x[0]))
        .then(res => res.map(parseFloat))
        .then(res => res.reduce((acc, next) => acc + next, 0) / res.length)
        .then(res => ([champ, res.toFixed(2)]))

const requests = champs.map(scrapChamp)

const resultsFolderPath = path.resolve(__dirname, 'results')

const createResultsFolder = () => {
    if (!fs.existsSync(resultsFolderPath)) {
        fs.mkdirSync(resultsFolderPath)
    }
}

const storeResults = res =>
    fs.writeFileSync(
        path.resolve(resultsFolderPath, datefns.format(new Date(), 'YYYY-MM-DD') + '.csv'),
        res.map(pair => pair.join(',')).join('\n')
    )

console.log('Scraping... \n')

Promise.all(requests)
    .then(res => {
        createResultsFolder()
        storeResults(res)
    })
    .then(() => console.log('\nScraping complete!'))
    .catch(console.error)