const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
		pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
	},
});

module.exports = transport;

// const mailOptions = {
// 	from: 'adanodemailer@gmail.com',
// 	to: 'mdadilhossain2006@gmail.com',
// 	subject: 'Otp',
// 	text: '000000',
// };

// transport.sendMail(mailOptions, function (error, info) {
// 	if (error) {
// 		console.log(error);
// 	} else {
// 		console.log('email sent');
// 	}
// });
