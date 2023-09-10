# Senior Design Project
## EasyGrant

### Running the app
In the `ezgrant` directory run `npm run dev`

### Example POST request with new db config
```
curl -k -X POST -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" --user 'ocid1.credential.oc1..aaaaaaaawu2v6cpmklqmjgawtrqbur6kfum5tkc7xfti477b3slpt6x67j3a:KF>tsoqkh3Iaf+M50(UJ'  https://auth.us-ashburn-1.oraclecloud.com/oauth2/token -d 'grant_type=client_credentials&scope=https://g2751c4161aebe7-ezgrantdatabase.adb.us-ashburn-1.oraclecloudapps.com/ords/admin'
```
