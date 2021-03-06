/* global builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */
// A menu for admins to add users to groups

const library = new builder.Library('removeGroup');
const retryPrompts = require('../misc/speeches_utils/retry-prompts');

const User = require('../server/schema/models').user;

const Confirm = 'Remover';
const Cancel = 'Cancelar/Voltar';

let userName = ''; // fb_name to search for => later, this var stores selected user
let userGroup = ''; // group to add user in
let lastIndex = 0;
const arrayName = []; // data from users found using userName
const arrayGroup = []; // store groups from the users above

function removeDuplicatesBy(keyFn, array) {
	const mySet = new Set();
	return array.filter((x) => {
		const key = keyFn(x);
		const isNew = !mySet.has(key);
		if (isNew) mySet.add(key);
		return isNew;
	});
}

library.dialog('/', [
	(session) => {
		arrayName.length = 0; // empty array
		session.send('Esse é o menu para remover usuários que pertencem a algum grupo especial, ' +
		'tirando-lhes a permissão de mandar mensagens diretas. Seu grupo voltará a ser \'Cidadão\'.');
		builder.Prompts.text(session, 'Digite o nome do usuario a ser removido para iniciarmos a pesquisa.');
	},
	(session, args, next) => {
		userName = session.userData.userInput; // comes from customAction

		User.findAndCountAll({ // list all users with desired like = fb_name
			attributes: ['fb_name', 'group'],
			order: [['updatedAt', 'DESC']], // order by last recorded interation with bot
			limit: 7,
			where: {
				fb_name: {
					$iLike: `%${userName}%`, // case insensitive
				},
				fb_id: { // excludes whoever is adding admin
					$ne: session.userData.userid,
				},
			},
		}).then((listUser) => {
			const listNoDupes = removeDuplicatesBy(x => x.fb_id, listUser.rows);

			if (listNoDupes.length === 0) {
				session.send('Não foi encontrado nenhum usuário com esse nome!');
				session.endDialog();
			} else {
				session.send(`Encontrei ${listNoDupes.length} usuário(s).`);
				listNoDupes.forEach((element) => {
					arrayName.push(element.dataValues.fb_name);
					arrayGroup.push(element.dataValues.group);
				});
				next();
			}
		}).catch((err) => {
			session.send(`Ocorreu um erro ao pesquisar usuários => ${err}`);
			session.endDialog();
		});
	},
	(session) => {
		arrayName.push(Cancel); // adds Cancel button
		lastIndex = arrayName.length;
		builder.Prompts.choice(
			session, 'Clique no nome completo desejado abaixo. Os nomes estão ordenados na ordem de ' +
			'quem interagiu com o bot mais recentemente(limitando a 7 opções). Você poderá cancelar com a última opção. ', arrayName,
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.addAdmin,
				maxRetries: 10,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		session.sendTyping();
		// changed the role of variable below, now it stores the name of user selected
		userName = result.response.entity;
		if (result.response) {
			if (result.response.index === (lastIndex - 1)) { // check if user chose 'Cancel'
				session.endDialog();
			} else {
				userGroup = arrayGroup[result.response.index];
				builder.Prompts.choice(
					session, `Deseja remover ${userName} do grupo ${userGroup}? Ele perderá o direito de mandar mensagens diretas para o usuário.`,
					[Confirm, Cancel],
					{
						listStyle: builder.ListStyle.button,
						retryPrompt: retryPrompts.addAdmin,
						maxRetries: 10,
					} // eslint-disable-line comma-dangle
				);
			}
		} else {
			session.send('Obs. Parece que a opção não foi selecionada corretamente. Tente novamente.');
			session.endDialog();
		}
	},
	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Confirm:
				User.update({
					group: 'Cidadão',
					sendMessage: false,
				}, {
					where: {
						fb_name: {
							$eq: userName,
						},
					},
				}).then(() => {
					session.send(`Sucesso! ${userName} não pode mais enviar mensagens!`);
				}).catch((err) => {
					session.send(`Não foi possível remover ${result.response.entity} de ${userGroup} => ${err}`);
				}).finally(() => {
					session.endDialog();
				});
				break;
			default: // Cancel
				session.endDialog();
				break;
			}
		}
	},
]).customAction({
	matches: /^[\s\S]*/, // override main customAction at app.js
	onSelectAction: (session) => {
		if (/^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^come[cç]ar/i.test(session.message.text)) {
			session.replaceDialog(session.userData.session); // cancel option
		} else {
			session.userData.userInput = session.message.text;
			session.endDialog();
		}
	},
});

module.exports = library;
