/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

const library = new builder.Library('sendMessage');

const User = require('./server/schema/models').user;
const Request = require('request');

const writeMsg = 'Escrever Mensagem';
const imageMsg = 'Mensagem com Imagem';
const testMessage = 'Mensagem Teste(Temporário)';
const goBack = 'Voltar para o menu';
const Confirm = 'Enviar';
const Negate = 'Não enviar/Voltar';
// const keepMessage = 'Continue mandando';
// const stopMessage = 'Parar';

let messageText; // custom message text
let imageUrl; // desired image url
let msgCount; // counts number of messages sent
// let userDialog; // user's last active dialog

// function startProactiveImage(user, customMessage, customImage) {
// 	try {
// 		msgCount += 1;
// 		const image = new builder.Message().address(user.address);
// 		image.addAttachment({
// 			contentType: 'image/jpeg',
// 			contentUrl: customImage,
// 		});
// 		const textMessage = new builder.Message().address(user.address);
// 		textMessage.text(customMessage);
// 		textMessage.textLocale('pt-BR');
// 		bot.send(image);
// 		bot.send(textMessage);
// 	} catch (err) {
// 		console.log(`Erro ao enviar mensagem: ${err}`);
// 	} finally {
// 		bot.beginDialog(user.address, '*:/confirm', { userDialogo: user.session.dialogName, usefulData: user.session.usefulData });
// 	}
// }
//
// function startProactiveDialog(user, customMessage) {
// 	try {
// 		msgCount += 1;
// 		const textMessage = new builder.Message().address(user.address);
// 		textMessage.text(customMessage);
// 		textMessage.textLocale('pt-BR');
// 		bot.send(textMessage);
// 	} catch (err) {
// 		console.log(`Erro ao enviar mensagem: ${err}`);
// 	}
// 	console.log(`${user.name} vai para ${user.session.dialogName}\n\n`);
// 	bot.beginDialog(user.address, '*:/confirm', { userDialogo: user.session.dialogName, usefulData: user.session.usefulData });
// }
//
// bot.dialog('/confirm', [
// 	(session, args) => {
// 		session.userData.dialogName = args.userDialogo;
// 		session.userData.usefulData = args.usefulData;
// 		builder.Prompts.choice(
// 			session, 'Você pode desativar mensagens automáticas como a de cima no menu de Informações.', 'Ok',
// 			{
// 				listStyle: builder.ListStyle.button,
// 			} // eslint-disable-line comma-dangle
// 		);
// 	},
// 	(session) => {
// 		const { dialogName } = session.userData; // it seems that doing this is necessary because
// 		const { usefulData } = session.userData; // session.dialogName adds '*:' at replaceDialog
// 		session.send('Voltando pro fluxo normal...');
// 		session.replaceDialog(dialogName, { usefulData });
// 	},
// ]);

library.dialog('/', [
	(session) => {
		msgCount = 0;
		builder.Prompts.choice(
			session, 'Este é o menu para mandarmos mensagens aos usuários!\n\nEscolha uma opção, digite o texto desejado, inclua uma imagem(se for o caso), ' +
			' vizualise como fica a mensagem e confirme. Você não receberá a mensagem.',
			[writeMsg, imageMsg, goBack],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: 'Por favor, utilize os botões',
				promptAfterAction: false,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case writeMsg:
				session.beginDialog('/askText');
				break;
			case imageMsg:
				session.beginDialog('/askImage');
				break;
			case testMessage:
				session.beginDialog('/sendingMessage');
				break;
			default: // goBack
				session.endDialog();
				break;
			}
		}
	},
	(session) => {
		session.endDialog();
	},
]);


library.dialog('/askImage', [ // asks user for text and image URL
	(session) => {
		builder.Prompts.text(session, 'Aqui enviaremos uma imagem seguida de uma mensagem de texto logo abaixo.' +
		'\n\nDigite a mensagem de texto desejada:');
	},
	(session, args) => {
		messageText = args.response;
		builder.Prompts.text(session, 'Digite a URL da imagem desejada.' +
		'\n\nLembre-se: ela deve estar online e acessível a todos. Cuidado com o tamanho. Pode ser GIF.' +
		'\n\nExemplo: https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png');
	},

	(session, args) => {
		session.send('Sua mensagem aparecerá da seguinte forma para os usuários:');
		imageUrl = args.response;
		session.send({
			attachments: [
				{
					contentType: 'image/jpeg',
					contentUrl: imageUrl,
				},
			],
		});
		session.send(messageText);
		builder.Prompts.choice(
			session, 'Deseja enviar essa mensagem?',
			[Confirm, Negate],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: 'Por favor, utilize os botões',
				promptAfterAction: false,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Confirm:
				session.beginDialog('/sendingImage', { messageText, imageUrl });
				break;
			default: // Negate
				session.replaceDialog('/');
				break;
			}
		}
	},
]);

function sendImageByFbId(userData, textMsg, UrlImage, pageToken) {
	Request.post({
		uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
		'content-type': 'application/json',
		form: {
			messaging_type: 'UPDATE',
			recipient: {
				id: userData.fb_id,
			},
			message: {
				attachment: {
					type: 'image',
					payload: {
						url: UrlImage,
						is_reusable: true,
					},
				},
			},
		},
	}, (error, response, body) => {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);

		Request.post({
			uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
			'content-type': 'application/json',
			form: {
				messaging_type: 'UPDATE',
				recipient: {
					id: userData.fb_id,
				},
				message: {
					text: textMsg,
					quick_replies: [
						{
							content_type: 'text',
							title: 'Voltar para o início',
							payload: 'reset',
						},
					],
				},
			},
		}, (error2, response2, body2) => {
			console.log('error:', error2);
			console.log('statusCode:', response2 && response2.statusCode);
			console.log('body:', body2);
		});
	});
}

library.dialog('/sendingImage', [ // sends image and text message
	(session, args) => {
		[messageText] = [args.messageText];
		[imageUrl] = [args.imageUrl];
		User.findAll({
			attributes: ['address', 'session', 'fb_id'],
			where: {
				fb_id: { // excludes whoever is sending the direct message
					$ne: session.userData.userid,
				},
			},
		}).then((user) => {
			user.forEach((element) => {
				sendImageByFbId(element.dataValues, messageText, imageUrl, session.userData.pageToken);
				msgCount += 1;
			});
		}).catch((err) => {
			session.send('Ocorreu um erro ao enviar mensagem');
			console.log(`Erro ao enviar mensagem: ${err}`);
		}).finally(() => {
			session.send(`${msgCount} mensagen(s) enviada(s) com sucesso!`);
			session.replaceDialog('/');
		});
	},
]);

library.dialog('/askText', [ // asks user for text message
	(session) => {
		builder.Prompts.text(session, 'Digite a sua mensagem. Ela será enviada a todos os usuários que ' +
		'concordaram em receber mensagens pelo Guaxi.');
	},
	(session, args) => {
		session.send('Sua mensagem aparecerá da seguinte forma para os usuários:');
		messageText = args.response;
		session.send(messageText);
		builder.Prompts.choice(
			session, 'Deseja enviar essa mensagem?',
			[Confirm, Negate],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: 'Por favor, utilize os botões',
				promptAfterAction: false,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Confirm:
				session.beginDialog('/sendingMessage', { messageText });
				break;
			default: // Negate
				session.replaceDialog('/');
				break;
			}
		}
	},
]);

// library.dialog('/sendingMessage', [ // sends text message
// 	(session, args) => {
// 		if (!args) {
// 			messageText = '<<Mensagem proativa de teste>>';
// 		} else {
// 			[messageText] = [args.messageText];
// 		}
// 		User.findAll({
// 			attributes: ['name', 'address', 'session'],
// 			where: {
// 				address: { // search for people that accepted receiving messages(address = not null)
// 					$ne: null,
// 				},
// 				fb_id: { // excludes whoever is sending the direct message
// 					$ne: session.userData.userid,
// 				},
// 			},
// 		}).then((user) => {
// 			user.forEach((element) => {
// 				console.log(`Usuário: ${Object.entries(element.dataValues)}`);
// 				startProactiveDialog(element.dataValues, messageText);
// 			});
// 		}).catch((err) => {
// 			session.send('Ocorreu um erro ao enviar mensagem');
// 			console.log(`Erro ao enviar mensagem: ${err}`);
// 		}).finally(() => {
// 			session.send(`${msgCount} mensagen(s) enviada(s) com sucesso!`);
// 			session.replaceDialog('/');
// 		});
// 	},
// ]);

function sendMessageByFbId(userData, textMsg, pageToken) {
	Request.post({
		uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
		'content-type': 'application/json',
		form: {
			messaging_type: 'UPDATE',
			recipient: {
				id: userData.fb_id,
			},
			message: {
				text: textMsg,
				quick_replies: [
					{
						content_type: 'text',
						title: 'Voltar para o início',
						payload: 'reset',
					},
				],
			},
		},
	}, (error, response, body) => {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);
	});
}

library.dialog('/sendingMessage', [ // sends text message
	(session, args) => {
		if (!args) {
			messageText = '<<Mensagem proativa de teste>>';
		} else {
			[messageText] = [args.messageText];
		}
		User.findAll({
			attributes: ['name', 'address', 'session', 'fb_id'],
			where: {
				fb_id: { // excludes whoever is sending the direct message
					$ne: session.userData.userid,
				},
			},
		}).then((user) => {
			user.forEach((element) => {
				sendMessageByFbId(element.dataValues, messageText, session.userData.pageToken);
				msgCount += 1;
			});
		}).catch((err) => {
			session.send('Ocorreu um erro ao enviar mensagem');
			console.log(`Erro ao enviar mensagem: ${err}`);
		}).finally(() => {
			session.send(`${msgCount} mensagen(s) enviada(s) com sucesso!`);
			session.replaceDialog('/');
		});
	},
]);

module.exports = library;