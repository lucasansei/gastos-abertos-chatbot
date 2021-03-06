const emoji = require('node-emoji');

module.exports = {
	choice:
				[
					`Desculpe-me ${emoji.get('dizzy_face').repeat(2)}, não entendi o que você digitou, pois, por enquanto, ` +
					'eu não conheço muitas palavras, você pode digitar \'cancelar\' para voltar ou selecionar uma das opções abaixo:',
				],
	choiceIntent:
				[
					`Desculpe-me ${emoji.get('dizzy_face').repeat(2)}, não entendi o que você digitou, pois, por enquanto, ` +
					'eu não conheço muitas palavras, você pode digitar \'cancelar\' para voltar ou selecionar uma das opções abaixo:',
					// `Desculpe-me ${emoji.get('dizzy_face').repeat(2)}, não entendi o que você digitou, pois, por enquanto, ` +
					// 'eu não conheço muitas palavras, tente termos como \'ajuda\', \'inscrição\' e \'missão\' ou selecione uma das opções abaixo:',
				],
	request:
				[
					`Desculpe-me ${emoji.get('dizzy_face').repeat(2)}, não entendi o que você digitou. Por favor, utilize ` +
					'os botões \'Sim\' e \'Não\', para responder: ',
				],
	email:
				[
					`${emoji.get('thinking_face').repeat(3)} Hummm. Não entendi o e-mail que você digitou. O e-mail deve ter o seguinte formato: exemplo@exemplo.com.`,
				],
	date:
				[
					`${emoji.get('thinking_face').repeat(3)} Hummm. Não entendi a data que você digitou. Não se esqueça que ela deve ter o seguinte formato: 01/01/2000.`,
				],
	state:
				[
					`${emoji.get('thinking_face').repeat(3)} Hummm. Não entendi o estado que você digitou. Digite apenas a sigla como, por exemplo, a sigla do estado.` +
					' onde eu fui criado: SP',
				],
	about:
				[
					`${emoji.get('thinking_face').repeat(2)} Hummm. Não entendi a sua dúvida. Escolha um dos tópicos abaixo ` +
					'para maiores informações ou digite \'cancelar\' para voltar',
				],
	addAdmin:
				[
					`Por favor, tome muito cuidado pois esse é um procedimento importante. Escolha uma das opções utilizando '+
					'os botões. O último botão cancela o processo.`,
				],

};
