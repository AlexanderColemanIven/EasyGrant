# Senior Design Project
## EasyGrant

### Running the app
The `PATH` variables are all now setup for the Docker App, if you want to
run this code locally you must change the paths found in `test-connect.js`, `sqlnet.ora`, and
set your `TNS_ADMIN` env variable. 
 ## How to Run the React code with Docker:
1) Copy the `dev` script in `package.json` to the `start` script
2) `cd` into the `ezgrant` directory, NOT `EasyGrant` yes its confusing ill fix it later
3) Build using:
   ```
   docker buildx build --platform linux/amd64 --pull -t oraclelinux7-instantclient:12.2 .
   ```
5) Run
   ```
   docker run -p 8080:8080 -ti oraclelinux7-instantclient:12.2
   ```
   or
   ```
   docker run -p 8080:8080 -ti --rm oraclelinux7-instantclient:12.2
   ```
   (saves space on ur computer)
## How to Run the Database code with Docker:
1) Ensure the `start` script in `package.json` is `node ./src/test-connect.js`
2) `cd` into the `ezgrant` directory, NOT `EasyGrant` yes its confusing ill fix it later
3) Build using:
   ```
   docker buildx build --platform linux/amd64 --pull -t oraclelinux7-instantclient:12.2 .
   ```
4) Run
   ```
   docker run -ti oraclelinux7-instantclient:12.2
   ```
   or
   ```
   docker run -ti --rm oraclelinux7-instantclient:12.2
   ```
   (saves space on ur computer)
## How to Run the React/Database code *Locally*:
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
2) Find `src/test-connect.js`
  - Change
    ```
    require('dotenv').config({path : '../app/build-resource/wallet/.env'});
    ```
    to:
    ```
    require('dotenv').config({path : '../ezgrant/build-resource/wallet/.env'});
    ```
3) Download the Oracle Instant Client Library for your OS here: [https://www.oracle.com/cis/database/technologies/instant-client/downloads.html](https://www.oracle.com/cis/database/technologies/instant-client/downloads.html)
  - Place the UNZIPPED file into your `Downloads` folder if on Macos, Place it in `C:\\Oracle\[HERE]` if on Windows
4) Run `npm i` to install node_modules
5) In the `ezgrant` directory run `npm run start`

## Prerequisites [IMPORTANT]
- Have Docker installed on your computer
- Make sure you have space on your computer to build
  - Each time you build the codebase it will be nearly 1.5 Gigs!
  - Unless you run the code locally (which you might want to setup)
  - You can and SHOULD delete containers after running the code
you have to build each time you make a change
- You may need to run `npm i docker` if on Macos and may need to add docker to your `PATH` if on Windows


