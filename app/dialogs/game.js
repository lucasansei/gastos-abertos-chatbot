/* global bot:true builder:true */

bot.library(require('./contact'));
bot.library(require('./information-access-request'));
bot.library(require('./first_mission/conclusion'));
bot.library(require('./first_mission/assign'));
bot.library(require('./second_mission/assign'));
bot.library(require('./second_mission/conclusion'));

const emoji = require('node-emoji');
const retryPrompts = require('../misc/speeches_utils/retry-prompts');

const User = require('../server/schema/models').user;
const UserMission = require('../server/schema/models').user_mission;

const library = new builder.Library('game');

const Yes = 'Sim';
const No = 'Não';
const Contact = 'Entrar em contato';
const Restart = 'Voltar para o início';
const Confirm = 'Por hoje, chega';

let email = '';
let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
let missionUser;

library.dialog('/', [
	(session) => {
		session.send(`Vamos começar o processo de missões. ${emoji.get('slightly_smiling_face').repeat(2)}`);
		session.beginDialog('validators:email', {
			prompt: 'Qual é o e-mail que você utilizou para se cadastrar como líder?',
			retryPrompt: retryPrompts.email,
			maxRetries: 10,
		});
	},
	(session, args) => {
		if (args.resumed) {
			session.sendTyping();
			session.send('Você tentou inserir um e-mail inválido muitas vezes. Tente novamente mais tarde.');
			session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
			return;
		}
		email = args.response;
		session.sendTyping();
		User.count({
			where: {
				email,
			},
		})
			.then((count) => {
				if (count !== 0) {
					session.sendTyping();
					session.beginDialog('/missionStatus');
					return email;
				}
				session.sendTyping();
				session.send(`Hmmm...Não consegui encontrar seu cadastro. ${emoji.get('dizzy_face').repeat(2)}` +
				'\nO e-mail está correto? Por favor, tente novamente. Ou digite \'cancelar\' para retornar ao menu.');
				session.beginDialog('/');
				return undefined;
			});
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/missionStatus', [
	(session) => {
		/*
						Verifica se o usuário está ativo, aprovado e se possui alguma entrada na
						tabela 'user_mission'. Caso ele não tenha nenhuma entrada, está aprovado mas está
						inativo. Devo então iniciar o processo da primeira missão
				*/
		if (session.message.address.channelId === 'facebook') {
			User.findOne({
				where: {
					email,
				//	fb_id: fbId,
				},
			}).then((UserData) => {
				user = UserData.dataValues;
				UserMission.count({
					where: {
						user_id: user.id,
					},
				})
					.then((count) => {
						if (count === 0 && !user.active && user.approved) {
							session.beginDialog(
								'firstMissionAssign:/',
								{
									user,
									user_mission: missionUser,
								} // eslint-disable-line comma-dangle
							);
							return user;
						}
						session.replaceDialog('/currentMission');
						return undefined;
					});
			});
		} else {
			User.findOne({
				where: {
					email,
				},
			}).then((UserData) => {
				user = UserData.dataValues;
				UserMission.count({
					where: {
						user_id: user.id,
					},
				})
					.then((count) => {
						if (count === 0 && !user.active && user.approved) {
							session.beginDialog(
								'firstMissionAssign:/',
								{
									user,
									user_mission: missionUser,
								} // eslint-disable-line comma-dangle
							);
							return user;
						}
						session.replaceDialog('/currentMission');
						return undefined;
					});
			});
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/currentMission', [
	(session) => {
		UserMission.findAll({
			where: {
				user_id: user.id,
			},
		})
			.then((UserMissionData) => {
				missionUser = UserMissionData[UserMissionData.length - 1].dataValues;

				switch (missionUser.mission_id) {
				case 1:
					if (missionUser.completed) {
						session.beginDialog(
							'secondMissionAssign:/',
							{
								user,
								user_mission: missionUser,
							} // eslint-disable-line comma-dangle
						);
					} else {
						session.beginDialog(
							'firstMissionConclusion:/',
							{
								user,
								user_mission: missionUser,
							} // eslint-disable-line comma-dangle
						);
					}
					break;
				default: // 2
					if (missionUser.completed) {
						session.send(`Parabéns! Você concluiu o processo de missões do Gastos Abertos! ${emoji.get('tada').repeat(3)}`);
						session.send('Junte-se a nós no Grupo de Lideranças do Gastos Abertos no WhatsApp do Gastos Abertos.' +
						`Participe dos debates e compartilhe suas experiências conosco. ${emoji.get('slightly_smiling_face').repeat(2)}`);
						session.send('Para entrar, basta acessar o link abaixo do seu celular:' +
						'\n\n https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS');
						builder.Prompts.choice(
							session,
							'Posso te ajudar com mais alguma coisa?',
							[Contact, Restart, Confirm],
							{
								listStyle: builder.ListStyle.button,
								retryPrompt: retryPrompts.choice,
							} // eslint-disable-line comma-dangle
						);
					} else if (missionUser.metadata.request_generated === 0) {
						session.send(`Você está na segunda missão, no entanto, não gerou um pedido de acesso à informação. ${emoji.get('thinking_face').repeat(2)}`);
						session.replaceDialog('/sendToInformationAccessRequest');
					} else {
						session.replaceDialog(
							'secondMissionConclusion:/',
							{
								user,
								user_mission: missionUser,
							} // eslint-disable-line comma-dangle
						);
					}
				}
			});
	},

	(session, args) => {
		switch (args.response.entity) {
		case Confirm:
			session.send('Então, pararemos por aqui. Agradeçemos sua participação.' +
		'\n\nSe quiser conversar comigo novamente, basta me mandar qualquer mensagem.');
			session.send(`Estarei te esperando. ${emoji.get('relaxed').repeat(2)}`);
			session.endConversation();
			break;
		case Restart: // WelcomeBack
			session.endDialog();
			break;
		default: // Contact
			session.beginDialog('contact:/');
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/sendToInformationAccessRequest', [
	(session) => {
		builder.Prompts.choice(
			session,
			'Vamos gerar seu pedido agora?',
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
			session.beginDialog(
				'informationAccessRequest:/',
				{
					user,
					user_mission: missionUser,
				} // eslint-disable-line comma-dangle
			);
			break;
		default: // No
			session.send(`Okay! Eu estarei aqui esperando para começarmos! ${emoji.get('wave').repeat(2)}`);
			session.endDialog();
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

module.exports = library;
