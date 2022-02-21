import AWS from 'aws-sdk';
import commonMiddleware from './lib/commonMiddleware';
import createError from 'http-errors';
import getActionsSchema from './lib/schema/getAuctionSchema';
import validator from '@middy/validator';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  const {status} = event.queryStringParameters;
  let auction;
  const params = {
    TableName : process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeValues: {
            ':status': status,
        },
        ExpressionAttributeNames: {
            '#status': 'status',
        },
  };

  try{
    const result =  await dynamodb.query(params).promise();

    auction = result.Items;
  }
  catch(error){
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ auction }),
  };
}

export const handler = commonMiddleware(getAuctions)
.use(
  validator({
    inputSchema: getActionsSchema,
    ajvOptions: {
      useDefaults: true,
      strict: false,
    },
  }
  )
);


