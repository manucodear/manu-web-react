import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import qs from "qs";
import cors from "cors";

dotenv.config();

const port = process.env.PORT;

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',  // Allow requests from this origin
    methods: ['GET', 'POST'],         // Allow these methods
    allowedHeaders: ['Content-Type'], // Allow this header
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/auth/token', async (req: Request, res: Response) => {
    const { type, refreshToken } = req.body;
    console.log(`/auth/token with: ${type} as parameter`)
    let tokenRequestBody = '';
    let authorizationUri: string | undefined = '';
    let requestConfig: AxiosRequestConfig<string> | undefined = undefined;

    switch (type) {
        case "Microsoft": {
            if (!refreshToken) {
                return res.status(400).send('Refresh token not provided');
            }
            // Retrieve values from environment variables
            const clientId = process.env.MS_CLIENT_ID;
            const clientSecret = process.env.MS_CLIENT_SECRET;
            const scope = process.env.MS_SCOPE;
            authorizationUri = process.env.MS_TOKEN_URI;
            tokenRequestBody = qs.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
                scope: scope
            });
            requestConfig = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };
            break;
        }
    }

    try {
        console.log('Request: ', tokenRequestBody);
        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post(
            authorizationUri as string,
            tokenRequestBody, requestConfig
        );

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        console.log('access_token retrieved!', tokenResponse.data);

        // Return the access token
        res.json({ access_token, refresh_token, expires_in });
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', error.response?.data); // Logs response error details
            res.status(500).json({ error: 'Axios request failed', details: error.response?.data });
        } else if (error instanceof Error) {
            console.error('Error exchanging authorization code:', error.message);
            res.status(500).json({ error: error.message });
        } else {
            console.error('Unexpected error:', error);
            res.status(500).json({ error: 'Unexpected error occurred' });
        }
    }
});

app.post('/auth/callback/:type', async (req: Request, res: Response) => {
    const { type } = req.params;
    let tokenRequestBody = '';
    let authorizationUri: string | undefined = '';

    let requestConfig: AxiosRequestConfig<string> | undefined = undefined;
    console.log(`/auth/callback with: ${type} as parameter`)

    switch (type) {
        case "X": {
            const { code, codeVerifier } = req.body; // Extract code and code_verifier from the request body
            if (!code || !codeVerifier) {
                return res.status(400).send('Authorization code not provided');
            }
            // Retrieve values from environment variables
            const clientId = process.env.X_CLIENT_ID;
            const redirectUri = `${process.env.REDIRECT_URI}/X`;
            authorizationUri = process.env.X_TOKEN_URI;
            tokenRequestBody = qs.stringify({
                client_id: clientId,
                code: code as string,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
                code_verifier: codeVerifier
            });
            requestConfig = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };
            break;
        }
        case "Microsoft": {
            const { code } = req.body; // Extract code and code_verifier from the request body
            console.log('body:', req.body);
            if (!code) {
                return res.status(400).send('Authorization code not provided');
            }
            // Retrieve values from environment variables
            const clientId = process.env.MS_CLIENT_ID;
            const clientSecret = process.env.MS_CLIENT_SECRET;
            const redirectUri = `${process.env.REDIRECT_URI}/Microsoft`;
            const scope = process.env.MS_SCOPE;
            authorizationUri = process.env.MS_TOKEN_URI;
            tokenRequestBody = qs.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code as string,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
                scope: scope
            });
            requestConfig = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };
            break;
        }
        case "Reddit": {
            const { code } = req.body; // Extract code and code_verifier from the request body
            console.log('code:', code);
            const clientId = process.env.REDDIT_CLIENT_ID;
            const clientSecret = process.env.REDDIT_CLIENT_SECRET;
            const redirectUri = `${process.env.REDIRECT_URI}/Reddit`;
            authorizationUri = process.env.REDDIT_TOKEN_URI;
            tokenRequestBody = qs.stringify({
                code: code as string,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            });
            const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
            requestConfig = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${basicAuth}`
                }
            };
            break;
        }
    }
    try {
        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post(
            authorizationUri as string,
            tokenRequestBody, requestConfig
        );

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        console.log('access_token retrieved!', tokenResponse.data);

        // Return the access token
        res.json({ access_token, refresh_token, expires_in });
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', error.response?.data); // Logs response error details
            res.status(500).json({ error: 'Axios request failed', details: error.response?.data });
        } else if (error instanceof Error) {
            console.error('Error exchanging authorization code:', error.message);
            res.status(500).json({ error: error.message });
        } else {
            console.error('Unexpected error:', error);
            res.status(500).json({ error: 'Unexpected error occurred' });
        }
    }
});

// Start the server using the port from the .env file
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
