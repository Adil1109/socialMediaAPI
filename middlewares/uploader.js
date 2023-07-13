const path = require('path');
const fs = require('fs');

const multer = require('multer');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const storePath =
			file.fieldname === 'post-picture'
				? './images/post-pictures'
				: file.fieldname === 'profile-picture'
				? './images/profile-pictures'
				: './images/cover-pictures';

		fs.access(storePath, fs.constants.F_OK, (err) => {
			if (!err) {
				cb(null, storePath);
			} else if (err) {
				fs.mkdir(storePath, { recursive: true }, (error) => {
					if (!error) {
						cb(null, storePath);
					} else {
						cb(new Error('Something went wrong in creating upload folder!'));
					}
				});
			}
		});
	},
	filename: (req, file, cb) => {
		const fileExt = path.extname(file.originalname);
		const fileName =
			file.originalname
				.replace(fileExt, '')
				.toLowerCase()
				.split(' ')
				.join('-') +
			'-' +
			Date.now();
		cb(null, fileName + fileExt);
	},
});

const uploader = multer({
	storage: storage,
	limits: {
		fileSize: 2000000, // 2mb
	},
	fileFilter: (req, file, cb) => {
		if (
			file.fieldname === 'profile-picture' ||
			file.fieldname === 'cover-picture'
		) {
			if (
				file.mimetype === 'image/png' ||
				file.mimetype === 'image/jpg' ||
				file.mimetype === 'image/jpeg'
			) {
				cb(null, true);
			} else {
				cb(new Error('Only png, jgp and jpeg photos are allowed!'));
			}
		} else if (file.fieldname === 'post-picture') {
			if (
				file.mimetype === 'image/png' ||
				file.mimetype === 'image/jpg' ||
				file.mimetype === 'image/jpeg' ||
				file.mimetype === 'image/gif'
			) {
				cb(null, true);
			} else {
				cb(new Error('Only png, jgp, jpeg and gifs are allowed!'));
			}
		} else {
			new Error('Something went wrong!');
		}
	},
});

module.exports = uploader;
