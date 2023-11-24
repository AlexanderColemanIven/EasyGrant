const websiteList = require('./resources/website-list');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const ora = require('ora');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const Listr = require('listr');
const bluebird = require("bluebird");
const dbServices = require("../database_communication/database-services");
const path = require('path');
const { BLOB } = require('oracledb');
require('dotenv').config({path : path.resolve(__dirname, '../build-resource/wallet/.env')});
const { delay, withBrowser, withPage } = require('./async-services');
const { findNumPagesArtistCommunities, 
    scrapeArtistCommunities, 
    scrapeArtistCommunitiesSubLink, 
    scrapeArtistCommunitiesAppLink } = require('./artist-communities');

const { scrapeCreative, findNumPagesLostCreative } = require('./for-the-lost-creative');

async function getArtistCommunityGrants(pageNumber){
    let grants = await scrapeArtistCommunities(pageNumber);
    grants = await scrapeArtistCommunitiesSubLink(grants);
    grants = await scrapeArtistCommunitiesAppLink(grants);
    return grants;
}

async function scrapeInParallel(numPages, workerFunction) {
    const startPerformance = performance.now();
    const numWorkers = os.cpus().length;
    console.log('\x1b[36m', `Initializing ${numWorkers} threads...`);
    const totalPages = numPages;
  
    if (isMainThread) {
      const tasks = [];
      const combinedResults = [];
  
      for (let i = 0; i < numWorkers; i++) {
        const startPage = Math.floor(i * (totalPages / numWorkers));
        const endPage = Math.floor((i + 1) * (totalPages / numWorkers));
        const adj = i + 1 < numWorkers ? 1 : 0;
        const workMessage =
          endPage - startPage > 1
            ? `Worker ${i + 1} scraping pages ${startPage}-${endPage - adj}`
            : `Worker ${i + 1} scraping page ${startPage}`;
        tasks.push({
          title: workMessage,
          task: () => runWorker(startPage, endPage, combinedResults, workerFunction),
        });
      }
      const listr = new Listr(tasks, { concurrent: true });
      await listr.run();
      const endPerformance = performance.now();
      const executionTime = endPerformance - startPerformance;
      const seconds = Math.floor(executionTime / 1000);
      const milliseconds = executionTime % 1000;
      const spinner = ora('Finishing...').start();
      spinner.color = 'yellow';
      delay(1000);
      if (combinedResults.flat().flat().length > 0) {
        spinner.succeed(`Grants collected: ${combinedResults.flat().flat().length} in ${seconds}:${milliseconds} seconds`);
        delay(1000);
      } else {
        spinner.fail('Error while scraping');
        delay(1000);
      }
  
      const flattenedResults = combinedResults.flat();
      return flattenedResults.flat();
    }
  }
  
  async function runWorker(startPage, endPage, combinedResults, workerFunction) {
    return new Promise(async (resolve) => {
      const workerResults = [];
      for (let pageNumber = startPage; pageNumber < endPage; pageNumber++) {
        let result = await workerFunction(pageNumber);
        workerResults.push(result);
      }
      combinedResults.push(workerResults);
      resolve(workerResults);
    });
  }

const newGrantOpportunity = {
    name: 'New Opportunity',
    location: 'Some Location',
    link: 'https://example.com',
    amount: '10000',
    about: 'Description of the opportunity',
    free: 'Y',
    eligibility: ['Criteria1', 'Criteria2', 'Criteria3'],
    deadline: '2023-12-31'
};
async function test(){
    await dbServices.initialize();
    await dbServices.insertGrantOpportunity(newGrantOpportunity);
}

/*
findNumPagesArtistCommunities().then(async (numPages) => {
    scrapeInParallel(numPages, getArtistCommunityGrants).then(async (grants) => {
        await dbServices.initialize();
        for(const grant of grants){
            const newGrantOpportunity = {
                name: grant.title,
                location: grant.location,
                link: grant.link,
                amount: grant.amount,
                about: grant.description,
                free: grant.free,
                eligibility: grant.eligibility,
                deadline: grant.deadline
              };
            await dbServices.insertGrantOpportunity(newGrantOpportunity);
        }
      });

})
*/

async function runScraping() {
    try {
        const numPages = await findNumPagesLostCreative();
        const results = [];

        scrapeInParallel(numPages, scrapeCreative).then((r) =>{
            console.log(r);
        })
    } catch (error) {
        console.error('Error:', error);
    }
}

runScraping();

