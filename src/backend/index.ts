import express, { Express, Request, Response } from 'express';
import { crawler } from './crawler';
import path from 'path';
import cors from 'cors';
import { statusCodes } from '../constants/statusCodes';

const app: Express = express();
const port = 3000;

app.use(cors());

app.get( "/scrape", async ( request: Request, response: Response ) => {
    const productName = request.query.product as string;

    if ( !productName ) {
        return response.status( statusCodes.BAD_REQUEST ).json( { error: 'Favor fornecer um nome de produto valido' } );
    }

    try {
        const result = await crawler( productName );
        response.json( result );
    } catch ( error ) {
        response.status( statusCodes.INTERNAL_SERVER_ERROR ).json( error );
    }
});

app.use( express.static( path.join( __dirname, "..", "frontend", "public" ) ) );

app.get( "*", ( request: Request, response: Response ) => {
    response.sendFile( path.join( __dirname, "..", "frontend", "public", "index.html" ) );
} );

app.get( "/", ( request: Request, response: Response ) => {
    response.send( 'Servidor Express rodando com sucesso!' );
});

app.listen( port, () => {
    console.log( `Servidor rodando em http://localhost:${port}` );
});
