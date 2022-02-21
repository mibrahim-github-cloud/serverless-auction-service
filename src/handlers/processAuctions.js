import { closeAuctions } from './lib/closeAuctions';
import { getEndedAuctions } from './lib/getEndedAuctions';
import createError from 'http-errors';

async function processAuctions(event, context){
    try{
        const auctionsToClose = await getEndedAuctions();
        const closePromise = auctionsToClose.map(auction => closeAuctions(auction));
        await Promise.all(closePromise);

        return {closed : auctionsToClose.length};
    }
   catch(error){
       console.error(error);
       throw new createError.InternalServerError(error);
   }


}

export const handler = processAuctions;