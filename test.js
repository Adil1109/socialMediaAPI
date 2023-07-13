// const fs = require('fs');

// const uploads = './uploads';

// fs.mkdir(uploads, (err) => {
// 	if (!err) {
// 		console.log('created');
// 	} else if (err) {
// 		console.log(err);
// 	}
// });

// fs.rmdir(uploads, { recursive: true }, (err) => {
// 	if (!err) {
// 		console.log('deleted');
// 	} else if (err) {
// 		console.log(err);
// 	}
// });

// fs.access('./utils/test.txt', fs.constants.F_OK, (err) => {
// 	if (err) {
// 		console.log(err);
// 	}
// 	console.log('exists');
// });

const { hash } = require('bcryptjs');

const doHash = (value, saltValue) => {
	const result = hash(value, saltValue);
	return result;
};

async function a() {
	const hashedVal = await doHash('@adil.admin.m', 12);
	console.log(hashedVal);
}

a();
