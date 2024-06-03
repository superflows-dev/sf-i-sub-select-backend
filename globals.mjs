const REGION = "AWS_REGION"; //e.g. "us-east-1"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CloudSearchDomainClient, UploadDocumentsCommand, SearchCommand } from "@aws-sdk/client-cloudsearch-domain";
import { ScanCommand, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

const ddbClient = new DynamoDBClient({ region: REGION });

const TABLE = "DB_TABLE_NAME";
const LOG_TABLE = "DB_LOG_TABLE_NAME";

const AUTH_ENABLE = AWS_ENABLE_AUTH;
const AUTH_REGION = "AWS_AUTH_REGION";
const AUTH_API = "AWS_AUTH_API";
const AUTH_STAGE = "test";

const PRESERVE_LOGS_DAYS = 3;

const SEARCH_ENDPOINT_HOST = "AWS_SEARCH_ENDPOINT.execute-api.us-east-1.amazonaws.com";
const SEARCH_ENDPOINT_PATH = "/test";

export { 
    REGION,
    ScanCommand, 
    GetItemCommand, 
    PutItemCommand, 
    UpdateItemCommand,
    DeleteItemCommand,
    QueryCommand,
    ddbClient,
    TABLE, 
    LOG_TABLE,
    AUTH_ENABLE, 
    AUTH_REGION, 
    AUTH_API, 
    AUTH_STAGE,
    PRESERVE_LOGS_DAYS,
    CloudSearchDomainClient,
    UploadDocumentsCommand,
    SearchCommand,
    SEARCH_ENDPOINT_HOST,
    SEARCH_ENDPOINT_PATH
};