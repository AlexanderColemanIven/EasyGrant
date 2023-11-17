const websiteList = require('./resources/website-list');
const cheerio = require('cheerio');
const path = require('path');
require('dotenv').config({path : path.resolve(__dirname, '../build-resource/wallet/.env')});

const { delay, withBrowser, withPage } = require('./async-services');

const CONCURRENCY = 10;
const OUTERCONTAINER = 'E6jjcn';
const INNERCONTAINER = 'VM7gjN';
const LISTITEM = 'Zc7IjY';
const SUBLISTITEM = 'comp-l4yhfowz';
const TITLE = 'comp-l4yhgcz4';
const DEADLINE = 'comp-l4yicrun';
const LOCATION = 'comp-l4yigzb8';
const ABOUT = 'comp-lbfkw9yq';
const ABOUTEXPAND = 'CollapsibleTextcomponent2568482278__text-wrapper';
const LINK = 'comp-ldd66x5z';
async function findNumPagesLostCreative() {
    return new Promise(async (resolve) => {
        await withBrowser(async (browser) => {
            await withPage(browser)(async (page) => {
                await page.goto(`https://www.forthelostcreative.com`, { waitUntil: 'domcontentloaded' });
                let randomDelay = Math.floor(Math.random() * 2000) + 1000; // Avoid rate limiting
                await page.waitForTimeout(randomDelay);
                await page.waitForSelector('#SITE_CONTAINER');
                await page.waitForSelector(`.${OUTERCONTAINER} .${INNERCONTAINER} .${LISTITEM} .${SUBLISTITEM} .${TITLE} .font_0 .wixui-rich-text__text`);
                const pageButtons = await page.$$('.Pagination670306077__root .PaginationStrip206008318__pageStripInner .PaginationStrip206008318__pageButton');
                resolve(pageButtons.length);
            });
        });
    });
}

module.exports.findNumPagesLostCreative = findNumPagesLostCreative;

async function goToPage(page, pageNumber) {
    // Find the current page number
    let currentPage = await page.$eval('.wixui-pagination__current-page', (element) => parseInt(element.textContent, 10));
    console.log(currentPage);

    // Change page via button selector
    try{
        const selector = `.Pagination670306077__root .PaginationStrip206008318__pageStripInner .PaginationStrip206008318__pageButton[aria-label="Page ${pageNumber}"]`;
        await page.evaluate((selector) => {
            document.querySelector(selector).click();
        }, selector);
        await page.waitForTimeout(3000); // Adjust the delay as needed
        await page.waitForSelector('.wixui-pagination__current-page');

        // Optionally, you can wait for specific content on the new page to ensure it has loaded
        await page.waitForSelector('.E6jjcn .VM7gjN');
    } catch(e){
        //do nothing
    }
}

async function scrapeCreative(pageNumber) {
    return new Promise(async (resolve) => {
        try {
            await withBrowser(async (browser) => {
                await withPage(browser)(async (page) => {
                    await page.goto(`https://www.forthelostcreative.com`, { waitUntil: 'domcontentloaded' });
                    let randomDelay = Math.floor(Math.random() * 2000) + 1000; // Avoid rate limiting
                    await page.waitForTimeout(randomDelay);
                    await page.waitForSelector('#SITE_CONTAINER');
                    await page.waitForSelector(`.${OUTERCONTAINER} .${INNERCONTAINER} .${LISTITEM} .${SUBLISTITEM} .${TITLE} .font_0 .wixui-rich-text__text`);
                    await goToPage(page, pageNumber + 1);
                    const htmlContent = await page.content();
                    const $ = cheerio.load(htmlContent);

                    const listContainer = $('.E6jjcn .VM7gjN');
                    randomDelay = Math.floor(Math.random() * 2000) + 1000; // Avoid rate limiting
                    await page.waitForTimeout(randomDelay);

                    const grantsArray = [];

                    // Iterate over each item in the list and extract the text
                    listContainer.find(`.${LISTITEM} .${SUBLISTITEM}`).each((index, element) => {
                        const title = $(element).find(`.${TITLE} .font_0 .wixui-rich-text__text`).text();
                        const deadline = $(element).find(`.${DEADLINE} h2`).text();
                        const location = $(element).find(`.${LOCATION} h2`).text();
                        const about = $(element).find(`.${ABOUT} .${ABOUTEXPAND}`).text().replace(/\+/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                        const linkContainer = $(element).find(`.${LINK}`);
                        const link = linkContainer.find('a').attr('href');

                        const grantObject = {
                            title: title,
                            deadline: deadline,
                            location: location,
                            about: about,
                            link: link
                        };

                        if (!grantObject.title.includes('Heading')) {
                            grantsArray.push(grantObject);
                        }
                    });
                    resolve(grantsArray);
                });
            });
        } catch (error) {
            console.error('Error in scrapeCreative:', error);
            resolve([]); // Resolve with an empty array in case of an error
        }
    });
}
module.exports.scrapeCreative = scrapeCreative;