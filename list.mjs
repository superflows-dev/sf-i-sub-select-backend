import { TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';

export const processList = async (event) => {
    
    console.log('event', event);
    
    // if(AUTH_ENABLE) {
    
    //     if((event["headers"]["Authorization"]) == null) {
    //         return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    //     }
        
    //     if((event["headers"]["Authorization"].split(" ")[1]) == null) {
    //         return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    //     }
        
    //     var hAscii = Buffer.from((event["headers"]["Authorization"].split(" ")[1] + ""), 'base64').toString('ascii');
        
    //     if(hAscii.split(":")[1] == null) {
    //         return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    //     }
        
    //     const email = hAscii.split(":")[0];
    //     const accessToken = hAscii.split(":")[1];
        
    //     if(email == "" || !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
    //         return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
    //     }
        
    //     if(accessToken.length < 5) {
    //         return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
    //     }
        
    //     const authResult = await processAuthenticate(event["headers"]["Authorization"]);
        
    //     if(!authResult.result) {
    //         return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
    //     }
        
    // }
    
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
  
    var scanParams = {
        TableName: TABLE,
        ExpressionAttributeValues: {
            ':fk1': {S: fk}
        },
        ExpressionAttributeNames: {
            '#fk1': "fk"
        },
        KeyConditionExpression: '#fk1 = :fk1',
    }
    
    var resultItems = []
  
    async function ddbQuery () {
        try {
            const data = await ddbClient.send (new QueryCommand(scanParams));
            resultItems = resultItems.concat((data.Items))
            if(data.LastEvaluatedKey != null) {
                scanParams.ExclusiveStartKey = data.LastEvaluatedKey;
                await ddbQuery();
            }
        } catch (err) {
            console.log(err);
            return err;
        }
    };
    
    const resultQ = await ddbQuery();
    
    // unmarshall the records
  
    var unmarshalledItems = [];
  
    for(var i = 0; i < resultItems.length; i++) {
        var item = {};
        for(var j = 0; j < Object.keys(resultItems[i]).length; j++) {
            item[Object.keys(resultItems[i])[j]] = resultItems[i][Object.keys(resultItems[i])[j]][Object.keys(resultItems[i][Object.keys(resultItems[i])[j]])[0]];
        }
        unmarshalledItems.push(item);
    }
    
    const response = {statusCode: 200, body: {result: true, data: {values: unmarshalledItems}}};
    return response;
    

}