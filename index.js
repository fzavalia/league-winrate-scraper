const axios = require('axios').default
const cheerio = require('cheerio')
const datefns = require('date-fns')
const fs = require('fs')
const path = require('path')
const champs = require('./champs.json')

const baseUrl = 'https://www.leagueofgraphs.com/es/rankings/summoners/'

const resultsFolderPath = path.resolve(__dirname, 'results')

const requests = champs.map(champ => axios.get(baseUrl + champ).then(res => handleChampionPageResponse(res, champ)))

console.log('Scraping... \n')

Promise.all(requests)
    .then(res => {
        createResultsFolder()
        storeResults(res)
    })
    .then(() => console.log('\nScraping complete!'))
    .catch(console.error)

function handleChampionPageResponse(res, champ) {

    console.log('Scraping ' + champ)

    const percentageContainers = getPercentageContainers(res.data)
    const percentages = getPercentages(percentageContainers)
    const total = percentages.reduce((acc, next) => acc + next, 0)
    const mean = (total / percentages.length).toFixed(2)

    return [champ, mean]
}

function getPercentageContainers(html) {

    const $ = cheerio.load(html)

    return $('.data_table > tbody')
        .children()
        .map((_, element) => $(element).children('td:nth-child(4)').text())
        .toArray()
}

function getPercentages(percentageContainers) {
    return percentageContainers
        .map(element => element.toString())
        .map(elementAsString => elementAsString.match(/\d.?\.\d/))
        .filter(percentageMatch => percentageMatch != null)
        .map(percentageMatch => percentageMatch[0])
        .map(percentageAsString => parseFloat(percentageAsString))
}

function createResultsFolder() {
    if (!fs.existsSync(resultsFolderPath)) {
        fs.mkdirSync(resultsFolderPath)
    }
}

function storeResults(res) {

    const resultFileName = path.resolve(resultsFolderPath, datefns.format(new Date(), 'YYYY-MM-DD') + '.csv')
    const resultAsCsv = res.map(pair => pair.join(',')).join('\n')

    fs.writeFileSync(resultFileName, resultAsCsv)

    console.log('\nResults stored in ' + resultFileName)
}
