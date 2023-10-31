# Senior Design Project
## EasyGrant

![tests](https://github.com/ColeHausman/EasyGrant/actions/workflows/test_ezgrant.yml/badge.svg?branch=main)
![Static Badge](https://img.shields.io/badge/v16%3E%3D-Node?logoColor=%237CFC00&label=Node)
![Static Badge](https://img.shields.io/badge/7--slim-Node?logoColor=%237CFC00&label=oraclelinux&labelColor=%235D3FD3)

 ## Docker build:
1) `cd` into the `ezgrant` directory
2) Build using:
   ```
   docker buildx build --platform linux/amd64 --pull -t ezgrants .
   ```
3) Run
   ```
   docker run -p 8080:8080 -v $(pwd):/app -ti --rm ezgrants
    ```

## Testing
In directory `ezgrant`, with `node_modules` installed run:
```
npm run test
```

## Running the web scraper
In directory `ezgrant`, with `node_modules` installed run:
```
npm i
```

```
node db-updater/src/web-scraping-test.js
```  


## Requirements
- [Oracle Instant Client Library](https://www.oracle.com/cis/database/technologies/instant-client/downloads.html) (already built in docker image)
- Node v16 >=
- npm v9.5 >=
- [Docker](https://www.docker.com/products/docker-desktop/)
## Pushing Code Changes
1) `git checkout -b [branch_name]`, the branch_name should be descriptive of the change being made
2) `git add .`, `git commit -m "[descriptive commit message]`
3) `git push --set-upstream origin [branch_name]`
4) Now go to the GitHub repo and you should see this <img width="923" alt="pullrequest" src="https://github.com/ColeHausman/EasyGrant/assets/55408275/db81082b-ee2c-4fc2-a738-6f723579f497">
5) Click "Compare & Pull Request", this will take you to a PR template I made, fill out the information that is applicable \
for the checkboxes you can place an X between the brackets like so: "[X]"
6) Please wait for someone to review your pull request unless its trivial
7) If your PR for some reason doesnt have a big green box that says "Able To Merge" pls contact Cole
8) Once you merge you should see a button to delete the branch, go ahead and click that
9) You're done!

