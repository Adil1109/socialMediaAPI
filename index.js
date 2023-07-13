const path = require('path');
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/images', express.static(path.join(__dirname, 'images')));

console.log(process.env.NODE_ENV);

const authRouter = require('./routers/authRouter');
const usersRouter = require('./routers/usersRouter');
const postsRouter = require('./routers/postsRouter');
const commentsRouter = require('./routers/commentsRouter');

mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log('DB Connected!');
	})
	.catch((err) => {
		console.log(err);
	});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);

app.get('/', (req, res) => {
	res.json({ name: 'Adil' });
});

app.listen(process.env.PORT, () => {
	console.log('App listening on port 8000');
});
