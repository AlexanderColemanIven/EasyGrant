# Senior Design Project
## EasyGrant

### Running the app
The `PATH` variables are all now setup for the Docker App, if you want to
run this code locally you must change the paths found in `test-connect.js`, `sqlnet.ora`, and
set your `TNS_ADMIN` env variable if using custom paths. 
 ## How to run the code with Docker:
1) Copy the `dev` script in `package.json` to the `start` script
2) `cd` into the `ezgrant` directory
3) Build using:
   ```
   docker buildx build --platform linux/amd64 --pull -t ezgrants .
   ```
5) Run
   ```
   docker run -p 8080:8080 -ti ezgrants
   ```
   or
   ```
   docker run -p 8080:8080 -ti --rm ezgrants
   ```
   (saves space on your computer)
   
## How to run the React/Database code *Locally*:
1) Find `build-resources/wallet/sqlnet.ora`
  - Change
    ```
    WALLET_LOCATION = (SOURCE = (METHOD = file) (METHOD_DATA = (DIRECTORY="../app/build-resource/wallet")))
    ```
    to:
    ```
    WALLET_LOCATION = (SOURCE = (METHOD = file) (METHOD_DATA = (DIRECTORY="../ezgrant/build-resource/wallet")))
    ```
  - Change
    ```
    SSL_SERVER_DN_MATCH=no
    ```
    to
    ```
    SSL_SERVER_DN_MATCH=yes
    ```
2) Find `src/services/database-services.js`
  - Change
    ```
    require('dotenv').config({path : '../../app/build-resource/wallet/.env'});
    ```
    to:
    ```
    require('dotenv').config({path : '../../ezgrant/build-resource/wallet/.env'});
    ```
3) Download the Oracle Instant Client Library for your OS here: [https://www.oracle.com/cis/database/technologies/instant-client/downloads.html](https://www.oracle.com/cis/database/technologies/instant-client/downloads.html)
  - MacOS: Place the UNZIPPED file into your `Downloads` folder (expects: `/Downloads/instantclient_19_8`)
    - Rosetta is required to run Intel x86 Oracle Instant Client library
  - Windows: Place it in `C:\\Oracle\[HERE]`  (expects: `C:\\oracle\\instantclient_19_17`)
  - If you want to place your instant-client lib in a different location you must update your `PATH` variables accordingly
4) Run `npm i` to install node_modules
5) In the `ezgrant` directory run `npm run start`

## Prerequisites [IMPORTANT]
- Have Docker installed on your computer
- Have Rosetta installed (if running locally on M1)
- Have nodejs installed (if running locally)
- Have npm installed (if running locally)
- Make sure you have space on your computer to build
  - Each time you build the codebase it will be nearly 1.5 GB!
  - Unless you run the code locally (which you might want to setup)
  - You can and SHOULD delete containers after running the code as you have to build each time you make a change (not needed if using `--rm` flag in your run command)
- You may need to run `npm i docker` if on Macos


