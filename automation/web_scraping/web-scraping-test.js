//const websiteList = require('./resources/website-list');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const ora = require('ora');
//const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const Listr = require('listr');
const { link } = require('fs');
const { performance } = require('perf_hooks');
const { findChrome } = require('find-chrome-bin');


async function findNumPages(){
    const chromeInfo = await findChrome();
    console.log(chromeInfo);

    const spinner = ora('Finding last page...').start();
    spinner.color = 'red';
    delay(1000);

    const browser = await puppeteer.launch({
        executablePath: 'google-chrome-stable',
        args: [
            '--headless',
            '--no-sandbox',
            '--disable-gpu',
            '--remote-debugging-port=3000'
        ]
    });
    let i = 0;
    let foundEnd = false;

    try{
        const page = await browser.newPage();
        while(!foundEnd){
            spinner.text = `checking page ${i}...`
            await page.goto(websiteList[1]+`?page=${i}`).then(async () => {
                const noResidenciesMessage = await page.evaluate(() => {
                    const messageElement = document.querySelector('.view-empty');
                    if (messageElement) {
                      return messageElement.textContent;
                    }
                    return null;
                });
                if (noResidenciesMessage && noResidenciesMessage.includes("No residencies match your criteria.")) {
                    foundEnd = true;
                }
             });
             i++;
        }
    }catch(e){
        console.log(e);
    } finally {
        spinner.color = 'green';
        spinner.succeed(`Final page found at page ${i-1}`);
        delay(1000);
        await browser.close();
    }
    return i-1;
}


async function scrapeArtistCommunities(pageNumber){
    const chromeInfo = await findChrome();
    const grants = [];

    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/lib64/chromium-browser/chromium-browser',
            args: [
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--no-sandbox'
            ]
    });

    try {
        const page = await browser.newPage();
        await page.goto(websiteList[1]+`?page=${pageNumber}`).then(async () => {
            const noResidenciesMessage = await page.evaluate(() => {
                const messageElement = document.querySelector('.view-empty');
                if (messageElement) {
                  return messageElement.textContent;
                }
                return null;
            });
            if (noResidenciesMessage && noResidenciesMessage.includes("No residencies match your criteria.")) {
                console.log("No residencies found for this page.");
                throw new Error("No residencies found for this page."); // Stop the function
            }
            const childContent = await page.$eval('.view-content', e => e.innerHTML);
            const $ = cheerio.load(childContent, null, false);

            
            
            const grantEntries = $('.views-row');
            grantEntries.each(async (idx, grantEntry) => {
                
                const title = $(grantEntry).find('.field--name-title').text();
                const link = `https://artistcommunities.org${$(grantEntry).find('a').attr('href')}`;
                const organization = $(grantEntry).find('.field__item a').text();
                const location = $(grantEntry).find('.field-pseudo-field--pseudo-residency-region').text();
                const description = $(grantEntry).find('.field--name-field-residency-description').text();
                const applicationType = $(grantEntry).find('.field--name-field-application-type .field__item').text();
                grants.push({
                'title':title, 
                'location':location,
                'link':null,
                'amount':null,
                'description':description,
                'free':'Y',
                'eligibility':null,
                'deadline':null,
                'internalLink':link, 
                'appLink':null,
                'organization':organization, 
                'applicationType':applicationType,
                });
            });

            for (const grant of grants) {
                const linkedPage = await browser.newPage();
            
                try {
                    await linkedPage.goto(`${grant.internalLink}`);
                    const linkedContent = await linkedPage.content();
                    const linked$ = cheerio.load(linkedContent);

                    const linkedDescription = linked$('.field--name-field-discipline').text();

                    const stipend = linked$('.field--name-field-artist-stipend .field--name-field-amount').text();

                    const residencyFee = linked$('.ield--name-field-residency-fees .field--name-field-amount').text();

                    const appFee = linked$('.field--name-field-application-fee .field--name-field-amount').text();

                    if(appFee){
                        const fee = parseFloat(appFee);
                        if(fee > 0){
                            grant.free = 'N';
                        }
                    }else if(residencyFee){
                        const rfee = parseFloat(residencyFee);
                        if(rfee > 0){
                            grant.free = 'N';
                        }
                    }

                    grant.amount = stipend;

                    const appPage = linked$('.open-call-list a').attr('href');

                    grant.appLink = appPage ? appPage: null;

                    const eligibilityArr = linkedDescription.split('\n').map(line => line.trim()).filter(Boolean);

                    if (eligibilityArr.length > 0) {
                        eligibilityArr.shift();
                    }
                    grant.eligibility = eligibilityArr;
                } catch (error) {
                  console.error('Error:', error);
                } finally {
                  await linkedPage.close();
                }

                if(grant.appLink){
                    const appPage = await browser.newPage();
                    try{
                        await appPage.goto(`https://artistcommunities.org${grant.appLink}`);
                        const appContent = await appPage.content();
                        const appLinked$ = cheerio.load(appContent);

                        const dateMatch = appLinked$('.field--name-field-deadline').text().match(/(\w+ \d{1,2}, \d{4})/);
                        const dateMatchBackup = appLinked$('.field--name-field-deadline').text().match(/Deadline\n(.+)/);

                        const deadline = dateMatch ? dateMatch[0] : dateMatchBackup ? dateMatchBackup[0].trim() : null;
                        const link = appLinked$('.field--name-field-application-url a').attr('href');

                        grant.link = link;
                        grant.deadline = deadline;

                        delete grant.internalLink;
                        delete grant.appLink;
                    } catch (error) {
                        console.error('Error:', error);
                    } finally {
                        await appPage.close();
                    }
                }else{
                    grant.link = grant.internalLink;
                    delete grant.internalLink;
                    delete grant.appLink;
                }
            }


            
        })
        
    } catch(err) {  
        console.log(err);
        return [];
    } finally {
        await browser.close();
    }

    return grants;
}


const delay = ms => new Promise(res => setTimeout(res, ms));


async function scrapeInParallel() {
    const startPerformance = performance.now();
    const numWorkers = os.cpus().length;
    console.log('\x1b[36m', `initializing ${numWorkers} threads...`)
    const totalPages = await findNumPages();

    if (isMainThread) {
        const tasks = [];
        const combinedResults = [];
        
        for (let i = 0; i < numWorkers; i++) {
            const startPage = Math.floor(i * (totalPages / numWorkers));
            const endPage = Math.floor((i + 1) * (totalPages / numWorkers));
            const adj = i + 1 < numWorkers ? 1 : 0;
            const workMessage = endPage-startPage > 1 
            ? `Worker ${i + 1} scraping pages ${startPage}-${endPage-adj}`
            : `Worker ${i + 1} scraping page ${startPage}`;
            tasks.push({
                title: workMessage,
                task: () => runWorker(startPage, endPage, combinedResults),
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
        if(combinedResults.flat().flat().length > 0){
            spinner.succeed(`Grants collected: ${combinedResults.flat().flat().length} in ${seconds}:${milliseconds} seconds`);
            delay(1000);
        }else{
            spinner.fail('Error while scraping');
            delay(1000);
        }

        const flattenedResults = combinedResults.flat();
        return flattenedResults.flat();
    }
  }
  
  async function runWorker(startPage, endPage, combinedResults) {
    return new Promise(async (resolve) => {
    const workerResults = [];
    for (let pageNumber = startPage; pageNumber < endPage; pageNumber++) {
        const result = await scrapeArtistCommunities(pageNumber);
        workerResults.push(result);
    }
    combinedResults.push(workerResults);
    resolve(workerResults);
    });
  }

  async function insertResults(){
    //await dbConnect.initialize();
    scrapeInParallel().then(async (retval) => {
        /*
        const sql = `INSERT INTO YourTableName (NAME, LOCATION, LINK, AMOUNT, ABOUT, FREE, ELIGIBILITY, DEADLINE) VALUES (:name, :location, :link, :amount, :about, :free, :eligibility, :deadline)`;
        for(const grant of retval){
            try{
                const binds = {
                    name: { dir: oracledb.BIND_IN, val: `${grant.name}`, type: oracledb.STRING },
                    location: { dir: oracledb.BIND_IN, val: `${grant.location}`, type: oracledb.STRING },
                    link: { dir: oracledb.BIND_IN, val: `${grant.link}`, type: oracledb.STRING },
                    amount: { dir: oracledb.BIND_IN, val: `${grant.amount}`, type: oracledb.STRING },
                    description: { dir: oracledb.BIND_IN, val: `${grant.description}`, type: oracledb.STRING },
                    free: { dir: oracledb.BIND_IN, val: `${grant.free}`, type: oracledb.STRING },
                    eligibility: { dir: oracledb.BIND_IN, val: `${new oracledb.VArray(grant.eligibility)}`, type: oracledb.STRING },
                    deadline: { dir: oracledb.BIND_IN, val: `${grant.deadline}`, type: oracledb.STRING },
                }
                const options = { outFormat: null };
                await dbConnect.simpleExecute(sql, binds, options);
            }catch(e){
                console.log(`Logging for grant: ${grant}`, e);
            }
        }
        */
       console.log(retval[60]);
    });
  }

insertResults().then((r) => {
    console.log(r);
});