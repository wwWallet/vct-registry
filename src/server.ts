import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import { config } from '../config';
import knexConfig from '../knexfile';
import { auth } from './middleware/auth';
import { knex } from 'knex';
import apiRouter from './routes/api';
import typeMetadataRouter from './routes/typeMetadata';
import dbVctRouter from './routes/db';
import authRouter from './routes/auth';
import { registerReactFrontend } from './reactFrontend';

const { url, port } = config;

export const app = express();

app.use(cors());
app.use(cookieParser());
app.use(
	express.json({
		limit: config.max_vct_size,
	}),
);

export const db = knex(knexConfig);

const publicPath = path.join(__dirname, '../public');

// 1-day immutable cache for images
app.use(
	'/images',
	express.static(path.join(publicPath, 'images'), {
		maxAge: '1d',
		immutable: true,
	}),
);

app.use('/api', apiRouter);
app.use('/auth', authRouter);
app.use('/type-metadata', typeMetadataRouter);
app.use('/vct', auth, dbVctRouter);

registerReactFrontend(app, publicPath);

app.listen(port, () => {
	console.log(`✅ vct-registry server listening at ${url}`);
});
