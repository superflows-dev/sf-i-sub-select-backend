import { TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';

export const processDetail = async (event) => {
    
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
        
    // }
    
    var id = "";
    var fk = "";
    
    try {
        id = JSON.parse(event.body).id.trim();
        fk = JSON.parse(event.body).fk.trim();
    } catch (e) {
      const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
      return response;
    }
    
    if(id == null || id == "" || id.length < 3) {
        const response = {statusCode: 400, body: {result: false, error: "Id not valid!"}}
        return response;
    }

    if(fk == null || fk == "" || fk.length < 3) {
        const response = {statusCode: 400, body: {result: false, error: "Foreign key not valid!"}}
        return response;
    }
    
    var getParams = {
        TableName: TABLE,
        Key: {
          id: { S: id },
          fk: { S: fk },
        },
    };
    
    async function ddbGet () {
        try {
          const data = await ddbClient.send(new GetItemCommand(getParams));
          return data;
        } catch (err) {
          return err;
        }
    };
    
    var resultGet = await ddbGet();
    
    if(resultGet.Item == null) {
        const response = {statusCode: 404, body: {result: false, error: "Record does not exist!"}}
        return response;
    }
    
    
    var unmarshalledItem = {};
    for(var i = 0; i < Object.keys(resultGet.Item).length; i++) {
        unmarshalledItem[Object.keys(resultGet.Item)[i]] = resultGet.Item[Object.keys(resultGet.Item)[i]][Object.keys(resultGet.Item[Object.keys(resultGet.Item)[i]])[0]];
    }
    
    const response = {statusCode: 200, body: {result: true, data: {value: unmarshalledItem}}};
    return response;
    

}