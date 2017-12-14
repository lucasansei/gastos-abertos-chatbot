/* global  bot:true */

bot.library(require('./game-sign-up'));
bot.library(require('./contact'));

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const builder = require('botbuilder');

const library = new builder.Library('gastosAbertosInformation');

const gastosAbertosCicles = 'O que é um ciclo';
const secondGastosAbertosCicle = '2º Ciclo ';
const gameSignUp = 'Inscrição 2º Ciclo';
const firstGastosAbertosCicleResults = 'Resultados 1º Ciclo';
const contact = 'Entrar em contato';
const reset = 'Voltar ao início';
const yes = 'Sim, vamos lá!';
const no = 'Não';

library.dialog('/', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'A equipe do Gastos Abertos tem o objetivo de conectar cidadãos com o orçamento público.' +
			'\n\nAcreditamos na mobilização e na educação cidadã sobre transparência nos municípios brasileiros.' +
			'\n\n\nQuer conhecer mais sobre:',
			[gastosAbertosCicles, secondGastosAbertosCicle, gameSignUp,
				firstGastosAbertosCicleResults, contact, reset],
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
			case secondGastosAbertosCicle:
				session.replaceDialog('/secondGastosAbertosCicle');
				break;
			case gameSignUp:
				session.replaceDialog('/gameSignUpConfirmation');
				break;
			case firstGastosAbertosCicleResults:
				session.replaceDialog('/firstGastosAbertosCicleResults');
				break;
			case gastosAbertosCicles:
				session.replaceDialog('/gastosAbertosCicles');
				break;
			case contact:
				session.beginDialog('contact:/');
				break;
			default: // reset
				session.endDialog();
				session.replaceDialog('/welcomeBack');
				break;
			}
		}
	},
]);

library.dialog('/gastosAbertosCicles', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Um ciclo do Gastos Abertos é um período onde recrutamos várias pessoas para tornarem-se lideranças regionais do Gastos Abertos e como líderes damos missões para essas pessoas.\n\n\nEssas missões impactarão a transparência no município que o líder representa.\n\n\nSerá bem legal se você participar disto conosco!',
			[gameSignUp, secondGastosAbertosCicle, firstGastosAbertosCicleResults, contact, reset],
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
			case secondGastosAbertosCicle:
				session.replaceDialog('/secondGastosAbertosCicle');
				break;
			case firstGastosAbertosCicleResults:
				session.replaceDialog('/firstGastosAbertosCicleResults');
				break;
			case gameSignUp:
				session.replaceDialog('/gameSignUpConfirmation');
				break;
			case contact:
				session.beginDialog('contact:/');
				break;
			default: // reset
				session.endDialog();
				session.replaceDialog('/welcomeBack');
				break;
			}
		}
	},
]);


library.dialog('/secondGastosAbertosCicle', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Neste 2º ciclo, queremos replicar a execução do Gastos Abertos em diferentes municípios, aprimorar a metodologia, ampliar o número de lideranças formadas e portais de transparência avaliados.\n\n\nEspero por você em nessa nova jornada',
			[gameSignUp, firstGastosAbertosCicleResults, gastosAbertosCicles, contact, reset],
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
			case firstGastosAbertosCicleResults:
				session.replaceDialog('/firstGastosAbertosCicleResults');
				break;
			case gameSignUp:
				session.replaceDialog('/gameSignUpConfirmation');
				break;
			case contact:
				session.beginDialog('contact:/');
				break;
			case secondGastosAbertosCicle:
				session.replaceDialog('/secondGastosAbertosCicle');
				break;
			case gastosAbertosCicles:
				session.replaceDialog('/gastosAbertosCicles');
				break;
			default: // reset
				session.endDialog();
				session.replaceDialog('/welcomeBack');
				break;
			}
		}
	},
]);

library.dialog('/firstGastosAbertosCicleResults', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'No primeiro ciclo do gastos Abertos (2016-2017), tivemos 181 lideranças inscritas, 150 municípios atendidos,' +
			'75 portais de transparência avaliados, 25 pedidos realizados, 3 dados públicos de orçamento abertos e 1 carta compromisso assinada.' +
			'\n\n\nPara o segundo ciclo, queremos atender mais municípios e formar novas lideranças.',
			[gameSignUp, contact, secondGastosAbertosCicle, gastosAbertosCicles, reset],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		if (result.response) {
			session.sendTyping();
			switch (result.response.entity) {
			case gameSignUp:
				session.replaceDialog('/gameSignUpConfirmation');
				break;
			case contact:
				session.beginDialog('contact:/');
				break;
			case gastosAbertosCicles:
				session.replaceDialog('/gastosAbertosCicles');
				break;
			case secondGastosAbertosCicle:
				session.replaceDialog('/secondGastosAbertosCicle');
				break;
			default: // reset
				session.endDialog();
				session.replaceDialog('/welcomeBack');
				break;
			}
		}
	},
]);

library.dialog('/gameSignUpConfirmation', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Uhu! Seja bem vindo ao time.\n\n\nSerei seu agente virtual em todas as missões.' +
			'\n\n\nCom Guaxi, missão dada é missão cumprida.\nVamos começar?',
			[yes, no],
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
			case yes:
				session.beginDialog('gameSignUp:/');
				break;
			default: // no
				session.replaceDialog('/gameSignUpDeclined');
				break;
			}
		}
	},
]);

library.dialog('/gameSignUpDeclined', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Ok! Posso te ajudar com alguma informação sobre',
			[secondGastosAbertosCicle, firstGastosAbertosCicleResults,
				gastosAbertosCicles, contact, reset],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		if (result.response) {
			session.sendTyping();
			switch (result.response.entity) {
			case secondGastosAbertosCicle:
				session.replaceDialog('/secondGastosAbertosCicle');
				break;
			case firstGastosAbertosCicleResults:
				session.replaceDialog('/firstGastosAbertosCicleResults');
				break;
			case contact:
				session.beginDialog('contact:/');
				break;
			default: // reset
				session.endDialog();
				session.replaceDialog('/welcomeBack');
				break;
			}
		}
	},
]);

module.exports = library;
