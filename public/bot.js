import TelegramBot from "node-telegram-bot-api";
import MessageCount from "./models/messageCounter.js";
import fs from "fs"
import stream from "stream";
const token = '7011795908:AAF_tGq2CZ588EmBD8HiGgJuDODmexVpCcQ';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
	try {
		const chatId = msg.chat.id;
		const userId = msg.from.id;
		const chatMember = await bot.getChatMember(chatId, userId);

		if (chatId !== -1001958153442 || msg.text === "/money" || msg.text === "/money@statistics_forze_bot") return

		let userInfo = await MessageCount.findOne({ chatId, userId });

		if (!userInfo) {
			userInfo = new MessageCount({ chatId, userId, userName: chatMember.user.first_name, login: msg.from.username });
		}

		if (msg.photo && msg.caption === "/change_photo") {
			if (userInfo.point > 10) {
				changePhoto(userInfo, chatId, msg)
			} else {
				bot.sendMessage(chatId, `Для зміни фото на балансі потрібно мати 10 FRZC`);
			}
		}

		userInfo.totalCount++;
		userInfo.point = userInfo.totalCount / 1000
		await userInfo.save();

		if (chatMember.status === "administrator" || chatMember.status === "creator") return

		if (userInfo.subscribe && new Date(userInfo.subscribeTime) > new Date()) {
			bot.restrictChatMember(chatId, userId, {
				can_send_messages: true,
				can_send_audios: true,
				can_send_documents: true,
				can_send_photos: true,
				can_send_videos: true,
				can_send_video_notes: true,
				can_send_voice_notes: true,
				can_send_polls: true,
				can_send_other_messages: true,
				can_add_web_page_previews: true,
				can_change_info: true,
				can_invite_users: true,
				can_pin_messages: false
			});
		} else {
			bot.restrictChatMember(chatId, userId, {
				can_send_messages: true,
				can_send_audios: false,
				can_send_documents: false,
				can_send_photos: false,
				can_send_videos: false,
				can_send_video_notes: false,
				can_send_voice_notes: false,
				can_send_polls: true,
				can_send_other_messages: false,
				can_add_web_page_previews: true,
				can_change_info: true,
				can_invite_users: true,
				can_pin_messages: false
			});
		}

	} catch (error) {
		console.error('Помилка при оновленні лічильника повідомлень:', error);
	}
});

bot.onText(/\/balance/, async (msg) => {
	try {
		const chatId = msg.chat.id;
		const userId = msg.from.id;

		if (chatId !== -1001958153442) {
			bot.sendMessage(chatId, `Ти маєш бути підписаний на Terroristy, щоб заробляти forzecoin!\nhttps://t.me/terraria_forze`);
		}

		let totalMoney = await MessageCount.findOne({ chatId, userId });

		if (!totalMoney) return bot.sendMessage(chatId, 'У вас пустий баланс!\nПишіть будь-яке смс щоб почати заробляти!');

		bot.sendMessage(chatId, `${msg.from.first_name} має: \n${totalMoney.point} FRZC`);
	} catch (error) {
		console.error('Помилка при отриманні інформації про групу:', error);
		bot.sendMessage(chatId, 'Виникла помилка при отриманні інформації про групу.');
	}
});

bot.onText(/\/top_balance/, async (msg) => {
	try {
		const chatId = msg.chat.id;

		if (chatId !== -1001958153442) {
			bot.sendMessage(chatId, `Ти маєш бути підписаний на Terroristy, щоб заробляти forzecoin!\nhttps://t.me/terraria_forze`);
		}

		let allUsers = await MessageCount.find();

		if (!allUsers) return bot.sendMessage(chatId, 'Щось пішло не так, спробуй пізніше...');

		let message = ""

		allUsers.sort((a, b) => b.point - a.point)

		allUsers.forEach((user, index) => {
			let name = user.userName.length > 12 ? user.userName.slice(0, 12) + "..." : user.userName;
			let username = user.login && user.login.startsWith("@") ? user.login : `@${user.login}`;
			message += `${index + 1}. <a href="https://t.me/${username}">${name}</a> - ${user.point} FRZC\n`;
		});

		bot.sendMessage(chatId, `<b>Статистика балансів FRZC</b>\n\n${message}`, { parse_mode: "HTML" });
	} catch (error) {
		console.error('Помилка при отриманні інформації про групу:', error);
	}
});

bot.onText(/\/subscribe/, async (msg) => {
	const chatId = msg.chat.id;
	const userId = msg.from.id;

	console.log(userId)

	let userInfo = await MessageCount.findOne({ chatId, userId });

	if (!userInfo.subscribe) return bot.sendMessage(chatId, "Ваша підписка неактивна!\n\nЩоб надсилати будь який медіа контент потрібно активувати підписку!\n\nЦе можна зробити командою:\n/buy_subscribe\n\nВартість підписки 1 FRZC, тривалість 1 місяць");

	bot.sendMessage(chatId, "Ваша підписка активна до\n" + formatDateAndTime(userInfo.subscribeTime));
});

bot.onText(/\/buy_subscribe/, async (msg) => {
	const chatId = msg.chat.id;
	const userId = msg.from.id;

	let userInfo = await MessageCount.findOne({ chatId, userId });

	if (userInfo.subscribe) return bot.sendMessage(chatId, "Ваша підписка уже активна!\n\nВона діє до:\n" + formatDateAndTime(userInfo.subscribeTime));

	if (userInfo.point < 1) return bot.sendMessage(chatId, "У вас недостатньо FRZC на балансі!");

	userInfo.point -= 1
	userInfo.totalCount -= 1000
	const currentDate = new Date();
	currentDate.setDate(currentDate.getDate() + 30);
	userInfo.subscribeTime = currentDate
	userInfo.subscribe = true
	await userInfo.save();

	bot.sendMessage(chatId, "Дякую що купили нашу підписку!\n\nВона діє до:\n" + formatDateAndTime(userInfo.subscribeTime));
});

bot.onText(/\/frzk_info/, async (msg) => {
	let text = `Привіт я ForzeCoinBot з моєю допомогою ти можеш заробляти FRZC (валюта чату), та купляти за неї наступні привілегії:\n\n - Віп підписку - 1 FRZC (діє 30 днів та дає можливість надсилати гіфки та стікери у чат);\n - Змінити фото групи - 10 FRZC (дає можливість за одноразову плату міняти фото групи);\n\nНа даний момент доступні такі команди, пишемо починаючи з "/":\n\n - balance - перевірка балансу\n - subscribe - статус підписки\n - buy_subscribe - купити підписку\n - top_balances - топ балансів\n - change_photo - прикріпляємо як коментар до фото яке має стати авою групи\n\nМій творець завжди відкритий до нових ідей, тому якщо у вас така зявилась то пишіть сюди - @forzeoldgg`

	bot.sendMessage(msg.chat.id, text);
});

bot.onText(/\/transfer/, async (msg) => {

	const msgText = msg.text
	const chatId = msg.chat.id;
	const userId = msg.from.id;

	let partsMsgText = msgText.split(" ")

	if (partsMsgText.length < 3) return bot.sendMessage(chatId, `Для відправки FRZC потрібно написати\n/transfer кількість @користувач`);

	let transferCoin = +partsMsgText[1]

	if (isNaN(transferCoin)) return bot.sendMessage(chatId, `Не коректно вказано суму переводу!`);
	let userToTransfer = partsMsgText[2].slice(1)

	try {
		let firstUser = await MessageCount.findOne({ userId });
		let secondUser = await MessageCount.findOne({ login: userToTransfer });

		if (firstUser.point < transferCoin) return bot.sendMessage(chatId, `У вас недостатньо FRZC на балансі!`);
		if (!secondUser) return bot.sendMessage(chatId, `В ${userToTransfer}</a> ще немає гаманця`);

		firstUser.point -= transferCoin
		firstUser.totalCount -= transferCoin * 1000
		await firstUser.save()
		
		secondUser.point += transferCoin
		secondUser.totalCount += transferCoin * 1000
		await secondUser.save()

		bot.sendMessage(chatId, `Ви успішно перевели ${secondUser.userName} - ${transferCoin} FRZC`);
	} catch (error) {
		bot.sendMessage(chatId, `Щось пішло не так...`);
	}
});

bot.onText(/\/play_game/, (msg) => {
	const chatId = msg.chat.id;
	const userId = msg.from.id;
	const gameUrl = `https://fotzeold.github.io/frzc-spinner?userId=${userId}&chatId=${chatId}`;

	const options = {
		reply_markup: {
			inline_keyboard: [
				[{ text: 'Почати гру', url: gameUrl }]
			]
		}
	};

	bot.sendMessage(userId, "Натисніть почати, щоб грати у FRZC рулетку, не пересилайте це смс нікому, щоб не втратити ваші FRZC!", options)
		.then(() => bot.sendMessage(chatId, "Посилання на гру я надіслав Вам у приватні повідомлення!"))
		.catch(() => bot.sendMessage(chatId, "Тобі потрібно почати зі мною приватний діалог щоб я зміг тобі надіслати посилання на гру!"))
});

function formatDateAndTime(dateTimeString) {
	const dateObject = new Date(dateTimeString);
	const kievTime = new Date(dateObject.getTime() + (3 * 60 * 60 * 1000));

	const day = kievTime.getDate();
	const month = kievTime.getMonth() + 1;
	const year = kievTime.getFullYear();
	const hours = kievTime.getHours();
	const minutes = kievTime.getMinutes();

	const formattedDate = `${day < 10 ? '0' : ''}${day}.${month < 10 ? '0' : ''}${month}.${year}`;
	const formattedTime = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}`;

	return `${formattedDate} - ${formattedTime}`;
}

function changePhoto(userInfo, chatId, msg) {
	userInfo.point -= 10
	userInfo.totalCount -= 10000
	const photoId = msg.photo[msg.photo.length - 1].file_id;
	const url = `https://api.telegram.org/bot${bot.token}/getFile?file_id=${photoId}`;

	fetch(url)
		.then((response) => response.json())
		.then((data) => {
			const file_path = data.result.file_path;
			const photoUrl = `https://api.telegram.org/file/bot${bot.token}/${file_path}`;

			fetch(photoUrl)
				.then((response) => {
					const dest = fs.createWriteStream('photo.jpg');
					const pipeline = stream.pipeline(response.body, dest, (err) => {
						if (err) {
							console.error('Помилка при зміні фото:', err);
						} else {
							bot.setChatPhoto(chatId, 'photo.jpg')
								.then(() => {
									console.log('Фото було успішно змінено.');
								})
								.catch((error) => {
									console.error('Помилка при зміні фото:', error);
								});
						}
					});
				})
				.catch((error) => {
					console.error('Помилка при завантаженні фото:', error);
				});
		})
		.catch((error) => {
			console.error('Помилка при отриманні інформації про файл:', error);
		});
}



export default bot
