import { TABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, QueryCommand } from "./globals.mjs";
import { AUTH_ENABLE, ENTITY_NAME, GetObjectCommand, S3_BUCKET_NAME, s3Client, S3_DB_FILE_KEY, PutObjectCommand } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';

export const processList = async (event) => {
    
    console.log('event', event);
    
    // if(AUTH_ENABLE) {
    
    if((event["headers"]["Authorization"]) == null) {
        return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    }
    
    if((event["headers"]["Authorization"].split(" ")[1]) == null) {
        return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    }
    
    var hAscii = Buffer.from((event["headers"]["Authorization"].split(" ")[1] + ""), 'base64').toString('ascii');
    
    if(hAscii.split(":")[1] == null) {
        return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    }
    
    const email = hAscii.split(":")[0];
    const accessToken = hAscii.split(":")[1];
    
    if(email == "" || !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
    }
    
    if(accessToken.length < 5) {
        return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
    }
    
    const authResult = await processAuthenticate(event["headers"]["Authorization"]);
    
    if(!authResult.result) {
        return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
    }
    
    // scan records

    var fk = "";

    try {
        fk = JSON.parse(event.body).fk.trim();
    } catch (e) {
      const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
      return response;
    }
    
    if(fk == null || fk == "" || fk.length < 3) {
      const response = {statusCode: 400, body: {result: false, error: "Foreign key not valid!"}}
      return response;
    }
    
    var command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: S3_DB_FILE_KEY,
    });
    
    var jsonData = {};
    
    try {
        const response = await s3Client.send(command);
        const s3ResponseStream = response.Body;
        const chunks = []
        for await (const chunk of s3ResponseStream) {
            chunks.push(chunk)
        }
        const responseBuffer = Buffer.concat(chunks)
        jsonData = JSON.parse(responseBuffer.toString());
    } catch (err) {
        console.log("db read",err); 
    }
  
    var unmarshalledItems = [];
    
    for(let key of Object.keys(jsonData)){
        if(jsonData[key].fk == fk){
            let item = {'id':key}
            for(let subkey of Object.keys(jsonData[key])){
                item[subkey] = jsonData[key][subkey]
            }
            unmarshalledItems.push(item);
        }
    }
    
    const response = {statusCode: 200, body: {result: true, data: {values: unmarshalledItems}}};
    return response;
    

}