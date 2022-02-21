import AWS from 'aws-sdk';
import commonMiddleware from './lib/commonMiddleware';
import createError from 'http-errors';
import { getAuctionByID } from './getAuction';
import placeBidSchema from './lib/schema/placeBidSchema';
import validator from '@middy/validator';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const {id} = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  //Validation happening here
  const auction = await getAuctionByID(id);

  if(email == auction.seller){
    throw new createError.Forbidden(`you can't bid your own auction...!`);
  }

  if(email == auction.highestBid.bidder){
    throw new createError.Forbidden(`you are the highest bidder already!....`);
  }

  if(auction.status !=='OPEN'){
    throw new createError.Forbidden(`you can't bid for closed auction....`);
  }

  if(amount<= auction.highestBid.amount){
      throw new createError.Forbidden(`Your bid amount must be higher than "${auction.highestBid.amount}"!`);
  }

  const params = {
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :email',
      ExpressionAttributeValues:{
          ':amount' : amount,
          ':email' : email,
      },
      ReturnValues: 'ALL_NEW',
  };

  let updatedAuction;

  try {
    const result = await dynamodb.update(params).promise();

    updatedAuction = result.Attributes;
  }
  catch(error)
  {
      console.error(error);
      throw new createError.InternalServerError(error);
  }


  return {
    statusCode: 200,
    body: JSON.stringify({ updatedAuction }),
  };
}

export const handler = commonMiddleware(placeBid)
.use(
  validator({
    inputSchema: placeBidSchema,
  }
  )
);


