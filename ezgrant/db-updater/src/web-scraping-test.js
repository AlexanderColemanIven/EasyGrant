const websiteList = require('../resources/website-list');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const ora = require('ora');


async function scrapeArtistCommunities(pageNumber){
    const grants = [];

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox'],
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
                grants.push({'title':title, 
                'link':null,
                'internalLink':link, 
                'appLink':null,
                'organization':organization, 
                'location':location,
                'description':description,
                'applicationType':applicationType,
                'deadline':null,
                'eligibility':null
                });
            });

            for (const grant of grants) {
                const linkedPage = await browser.newPage();
            
                try {
                    await linkedPage.goto(`${grant.internalLink}`);
                    const linkedContent = await linkedPage.content();
                    const linked$ = cheerio.load(linkedContent);

                    const linkedDescription = linked$('.field--name-field-discipline').text();

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

const startScraping = async () => {
    const spinner = ora('Scraping in progress...').start();
    spinner.color = 'blue';
    let pageNumber = 0;
    let noResidenciesFound = false;
    let allGrants = [];
    await delay(1000);
    while (!noResidenciesFound) {
        spinner.color = 'yellow';
	    spinner.text = `searching page ${pageNumber}...`;
      try {
        const grants = await scrapeArtistCommunities(pageNumber);
        if (grants.length === 0) {
          noResidenciesFound = true;
          spinner.succeed('Scraping completed. No residencies found.');
        } else {
            spinner.color = 'green';
            spinner.text = 'removing cat videos...'
            await delay(1000);
          allGrants = allGrants.concat(grants);
          pageNumber++;
        }
      } catch (error) {
        if (error.message === "No residencies found for this page.") {
          noResidenciesFound = true;
          spinner.succeed('Scraping completed. No residencies found.');
        } else {
          spinner.fail('Error while scraping.');
          console.error("Error while scraping:", error);
        }
      }
    }
    spinner.color = 'green';
    spinner.text = 'finishing...'
    delay(1000);
    spinner.succeed("Scraping completed.")
    console.log("All scraped grants:", allGrants);
};

const delay = ms => new Promise(res => setTimeout(res, ms));


startScraping();