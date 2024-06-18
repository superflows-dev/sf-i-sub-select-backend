import { TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand, ENTITY_NAME } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processManageChange } from './managechange.mjs';

export const processUpdate = async (event) => {
    
    console.log('event', event);
    
    //if(AUTH_ENABLE) {
    
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
        
        if(!authResult.result || !authResult.admin) {
          return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
        }

        const userId = authResult.userId;
        
    //}
    
    var id = "";
    var name = "";
    var fk = "";
    
    try {
        id = JSON.parse(event.body).id.trim();
        name = JSON.parse(event.body).name.trim();
        fk = JSON.parse(event.body).fk.trim();
    } catch (e) {
      const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
      processAddLog(userId, 'update', event, response, response.statusCode)
      return response;
    }
    
    if(id == null || id == "" || id.length < 3) {
      const response = {statusCode: 400, body: {result: false, error: "Id not valid!"}}
      processAddLog(userId, 'update', event, response, response.statusCode)
      return response;
    }
    
    if(name == null || name == "" || name.length < 3) {
      const response = {statusCode: 400, body: {result: false, error: "Name not valid!"}}
      processAddLog(userId, 'update', event, response, response.statusCode)
      return response;
    }

    if(fk == null || fk == "" || fk.length < 3) {
      const response = {statusCode: 400, body: {result: false, error: "Foreign key not valid!"}}
      return response;
    }
    
    var getParams = {
      TableName: TABLE,
      Key: {
        fk: { S: fk },
        id: { S: id },
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
        processAddLog(userId, 'update', event, response, response.statusCode)
        return response;
    }

    var oldName = resultGet.Item.name;
    
    var updateParams = {
      TableName: TABLE,
      Key: {
        fk: { S: fk },
        id: { S: id },
      },
      UpdateExpression: "set #name1 = :name1",
      ExpressionAttributeValues: {
          ":name1": { S: name },
      },
      ExpressionAttributeNames: {
          "#name1": "name",
      }
    };
    
    const ddbUpdate = async () => {
        try {
          const data = await ddbClient.send(new UpdateItemCommand(updateParams));
          return data;
        } catch (err) {
          return err;
        }
    };
    
    var resultUpdate = await ddbUpdate();

    await processManageChange(event["headers"]["Authorization"], 
    { 
            changedEntity: ENTITY_NAME,
            changedEntityId: id,
            changedEntityOldName: oldName.S,
            changedEntityNewName: name
        }
    );
    
    const response = {statusCode: 200, body: {result: true}};
    processAddLog(userId, 'update', event, response, response.statusCode)
    return response;
    

}