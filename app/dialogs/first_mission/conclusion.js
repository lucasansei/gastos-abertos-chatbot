/* global bot:true builder:true chatBase:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

const emoji = require('node-emoji');

const library = new builder.Library('firstMissionConclusion');

bot.library(require('../second_mission/assign'));

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const texts = require('../../misc/speeches_utils/big-texts');
const saveSession = require('../../misc/save_session');
const errorLog = require('../../misc/send_log');

const User = require('../../server/schema/models').user;
const UserMission = require('../../server/schema/models').user_mission;
const Notification = require('../../server/schema/models').notification;

const answers = {
	transparencyPortalExists: '',
	transparencyPortalURL: '',
	transparencyPortalHasFinancialData: '',
	transparencyPortalAllowsFinancialDataDownload: '',
	transparencyPortalFinancialDataFormats: '',
	transparencyPortalHasContractsData: '',
	transparencyPortalHasBiddingsData: '',
	transparencyPortalHasBiddingProcessData: '',
};

const Yes = 'Sim';
const No = 'Não';
const MoreInformations = 'Detalhes da missão';
const nextMission = 'Ir para a próxima missão';
const WelcomeBack = 'Beleza!';

let user;

library.dialog('/', [
	(session, args) => {
		saveSession.updateSession(session.userData.userid, session);
		session.sendTyping();
		[user] = [args.user];

		builder.Prompts.choice(
			session,
			'Pelo o que vi aqui você está na primeira missão, vamos concluí-la?',
			[Yes, No, MoreInformations],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case Yes:
				session.beginDialog('/transparencyPortalExists');
				break;
			case No:
				session.send(`Okay! Estarei te esperando para mandarmos ver nessa tarefa! ${emoji.get('sunglasses')}`);
				session.replaceDialog('*:/promptButtons');
				break;
			default: // MoreInformations
				session.send(texts.first_mission.details);
				session.beginDialog('/conclusionPromptAfterMoreDetails');
				break;
			}
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/conclusionPromptAfterMoreDetails', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session);
		session.sendTyping();
		builder.Prompts.choice(
			session,
			`Vamos concluir nossa primeira missão juntos? ${emoji.get('slightly_smiling_face')}`,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case Yes:
				session.replaceDialog('/transparencyPortalExists');
				break;
			default: // No
				session.send(`Okay! Estarei te esperando para mandarmos ver nessa tarefa! ${emoji.get('sunglasses')}`);
				session.replaceDialog('*:/promptButtons');
				break;
			}
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/transparencyPortalExists', [
	(session) => {
		User.findOne({
			attributes: ['state', 'id'],
			where: { fb_id: session.userData.userid },
		}).then((userData) => {
			session.userData.state = userData.state;
			session.userData.id = userData.id;
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error finding user (getting state) => ${err}`);
		});

		saveSession.updateSession(session.userData.userid, session);
		session.sendTyping();
		session.send(`Agora vamos avaliar o portal de transparêcia no seu município! ${emoji.get('slightly_smiling_face')}`);
		session.send("Caso você queira deixar para outra hora, basta digitar 'começar' e eu te levarei para o início.");
		builder.Prompts.choice(
			session,
			'Há um portal para transparência orçamentária na cidade, mantido oficialmente pela prefeitura? ',
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		session.sendTyping();
		if (args.response) {
			switch (args.response.entity) {
			case Yes:
				answers.transparencyPortalExists = 1;
				session.replaceDialog('/transparencyPortalURL');
				break;
			default: // No
				answers.transparencyPortalExists = 0;

				// Neste caso o fluxo de conclusão se finaliza pois as próximas perguntas não farão sentido
				session.replaceDialog('/userUpdate');
				break;
			}
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/transparencyPortalURL', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session, { answers, user });
		answers.transparencyPortalURL = ''; // reseting value, in case the user cancels the dialog and retries
		session.sendTyping();
		builder.Prompts.text(session, 'Qual é a URL(link) do portal?\n\nExemplo de uma URL: https://gastosabertos.org/');
	},
	(session) => {
		answers.transparencyPortalURL = session.message.text; // comes from customAction
		session.replaceDialog('/transparencyPortalHasFinancialData');
	},
]).customAction({
	matches: /^[\s\S]*/, // override main customAction at app.js
	onSelectAction: (session) => {
		if (/^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^come[cç]ar/i.test(session.message.text)) {
			session.replaceDialog(session.userData.session); // cancel option
		} else {
			session.userData.userDoubt = session.message.text;
			session.endDialog();
		}
	},
});

library.dialog('/transparencyPortalHasFinancialData', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session, { answers, user });
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Há dados sobre a execução orçamentária disponível no portal de transparência? ',
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Yes:
			answers.transparencyPortalHasFinancialData = 1;
			session.replaceDialog('/transparencyPortalAllowsFinancialDataDownload');
			break;
		default: // No
			answers.transparencyPortalHasFinancialData = 0;
			session.replaceDialog('/transparencyPortalHasContractsData');
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/transparencyPortalAllowsFinancialDataDownload', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session, { answers, user });
		answers.transparencyPortalFinancialDataFormats = ''; // reseting value, in case the user cancels the dialog and retries
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'É possível realizar download dos dados orçamentários? ',
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Yes:
			answers.transparencyPortalAllowsFinancialDataDownload = 1;
			session.replaceDialog('/transparencyPortalFinancialDataFormats');
			break;
		default: // No
			answers.transparencyPortalAllowsFinancialDataDownload = 0;
			session.replaceDialog('/transparencyPortalHasContractsData');
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/transparencyPortalFinancialDataFormats', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session, { answers, user });
		session.sendTyping();
		builder.Prompts.text(session, 'Você saberia dizer, qual o formato que estes arquivos estão ? Ex.: CSV, XLS, XML.');
	},
	(session) => {
		// session.message.text = comes from customAction
		answers.transparencyPortalFinancialDataFormats = session.message.text;
		session.replaceDialog('/transparencyPortalHasContractsData');
	},
]).customAction({
	matches: /^[\s\S]*/, // override main customAction at app.js
	onSelectAction: (session) => {
		if (/^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^come[cç]ar/i.test(session.message.text)) {
			session.replaceDialog(session.userData.session); // cancel option
		} else {
			session.userData.userDoubt = session.message.text;
			session.endDialog();
		}
	},
});

library.dialog('/transparencyPortalHasContractsData', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session, { answers, user });
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Os contratos assinados com a prefeitura estão disponíveis no portal de transparência? ',
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Yes:
			answers.transparencyPortalHasContractsData = 1;
			break;
		default: // No
			answers.transparencyPortalHasContractsData = 0;
			break;
		}
		session.replaceDialog('/transparencyPortalHasBiddingsData');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/transparencyPortalHasBiddingsData', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session, { answers, user });
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'As licitações são divulgadas no portal de transparência da cidade? ',
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Yes:
			answers.transparencyPortalHasBiddingsData = 1;
			break;
		default: // No
			answers.transparencyPortalHasBiddingsData = 0;
			break;
		}
		session.replaceDialog('/transparencyPortalHasBiddingProcessData');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/transparencyPortalHasBiddingProcessData', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session, { answers, user });
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'É possível acompanhar o status do processo licitatório pelo portal de transparência? ',
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Yes:
			answers.transparencyPortalHasBiddingProcessData = 1;
			break;
		default: // No
			answers.transparencyPortalHasBiddingProcessData = 0;
			break;
		}
		session.replaceDialog('/userUpdate');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/userUpdate', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session, { answers, User });
		const msg = new builder.Message(session);
		msg.sourceEvent({
			facebook: {
				attachment: {
					type: 'template',
					payload: {
						template_type: 'generic',
						elements: [{
							title: 'Olá! Eu sou o Guaxi!',
							subtitle: 'O chatbot mais transparente e engajado da internet! Venha conversar comigo!',
							image_url: 'https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png',
							item_url: 'http://m.me/gastosabertos',
							buttons: [{
								type: 'element_share',
							}],
						}],
					},
				},
			},
		});

		session.send('Uhuuu! Concluímos nossa primeira missão! ' +
			`\n\nEu disse que formariamos uma boa equipe! ${emoji.get('sunglasses')} ${emoji.get('clap').repeat(2)}`);
		chatBase.MessageHandled('User-Ends-Portal-Avaliation', 'User finished first mission');

		User.count({
			where: {
				state: session.userData.state,
			},
		}).then((count) => {
			if (count < 10 && count !== 1) {
				session.send(`E eu vou te dar uma tarefa extra ${emoji.get('grinning')} ${emoji.get('sunglasses')}` +
					`\n\nAtualmente há ${count} líderes no seu estado. Vamos aumentar este número para 10 líderes?`);
				session.send('Para alcançar esse número pedimos que você convide seus amigos para participar desse nosso segundo ciclo do Gastos Abertos!');
				if (session.message.address.channelId === 'facebook') {
					session.send(msg);
				}
			} else if (count < 10 && count === 1) {
				session.send(`E eu vou te dar uma tarefa extra ${emoji.get('grinning')} ${emoji.get('sunglasses')}` +
					'\n\nAtualmente há apenas você de líder no seu estado. Vamos aumentar este número para 10 líderes?');
				session.send('Compartilhe isto com os seus amigos! Assim nós teremos mais força para incentivar a transparência em seu estado!');
				if (session.message.address.channelId === 'facebook') {
					session.send(msg);
				}
			}
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error finding user => ${err}`);
			session.send(`Você já pode começar sua segunda missão. Basta gerar um pedido de acesso a informação! ${emoji.get('grinning').repeat(2)}`);
			session.replaceDialog('*:/promptButtons');
		});

		UserMission.update({
			completed: true,
			metadata: answers,
		}, {
			where: {
				user_id: session.userData.id,
				mission_id: 1,
				completed: false,
			},
			returning: true,
			raw: true,
		}).then((missionData) => {
			console.log(`Mission ${missionData[1][0].id} Updated!`);
			Notification.update({
			}, {
				where: {
					userID: missionData[1][0].user_id,
					missionID: missionData[1][0].id,
				},
			}).then(() => {
				console.log('Notification Updated! This message will not be sent!');
			}).catch((err) => {
				errorLog.storeErrorLog(session, `Couldn't update Notification 1 => ${err}`);
			});

			builder.Prompts.choice(
				session,
				`Se quiser, você já pode começar a segunda missão. Ou fazer uma pausa e continuar mais tarde. ${emoji.get('grinning').repeat(2)}`,
				[nextMission, WelcomeBack],
				{
					listStyle: builder.ListStyle.button,
					retryPrompt: retryPrompts.choice,
				} // eslint-disable-line comma-dangle
			);
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error updating userMission => ${err}`);
			session.send(`Você já pode começar sua segunda missão. Basta gerar um pedido de acesso a informação! ${emoji.get('grinning').repeat(2)}`);
			session.replaceDialog('*:/promptButtons');
		});
	},

	(session, args) => {
		switch (args.response.entity) {
		case nextMission:
			session.replaceDialog('secondMissionAssign:/assign');
			break;
		default: // WelcomeBack
			session.replaceDialog('*:/getStarted');
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

module.exports = library;
