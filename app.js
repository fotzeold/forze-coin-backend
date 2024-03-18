import 'dotenv/config'
import express from "express"
import mongoose from 'mongoose'
import bot from './bot.js'
import MessageCount from "./models/messageCounter.js"
import cors from "cors"

const app = express()

app.use(cors({
    origin: "https://fotzeold.github.io",
    methods: ["GET", "POST", "PATCH"]
}))

app.options('*', (req, res) => {
    res.status(200).send();
});
app.use(express.json());
app.post(`/webhook/${bot.token}`, (req, res) => {
	bot.processUpdate(req.body);
	res.sendStatus(200);
});

app.get("/user/:userId/:chatId", async (req, res) => {
	const userId = +req.params.userId
	const chatId = +req.params.chatId

	console.log("Hello")

	let userInfo = await MessageCount.findOne({ chatId, userId });

	if (!userInfo) return res.status(404).json({ message: "Not found" });

	return res.status(200).json(userInfo);
})

app.get("/free-coin/:userId/:chatId", async (req, res) => {
    try {
        const userId = +req.params.userId;
        const chatId = +req.params.chatId;

        let userInfo = await MessageCount.findOne({ chatId, userId });
        if (!userInfo) return res.status(404).json({ message: "Not found" });

        let currDate = new Date();
        let currDateMilliseconds = currDate.getTime(); 

        let freeCoinDate = new Date(userInfo.freeCoinTime.year, userInfo.freeCoinTime.month, userInfo.freeCoinTime.day, userInfo.freeCoinTime.hour, userInfo.freeCoinTime.minute, userInfo.freeCoinTime.second);
        let freeCoinDateMilliseconds = freeCoinDate.getTime(); 

        if (currDateMilliseconds - freeCoinDateMilliseconds > 1000 * 60 * 60 * 3) {
            userInfo.freeCoinTime = {
                second: currDate.getSeconds(),
                minute: currDate.getMinutes(),
                hour: currDate.getHours(),
                day: currDate.getDate(),
                month: currDate.getMonth(),
                year: currDate.getFullYear()
            };
            userInfo.point += 0.1;
            userInfo.totalCount += 100;

            await userInfo.save();
            return res.status(200).json({ message: "Бонус отримано!", currDate });
        }

        return res.status(200).json({ message: "Бонус не отримано!" });
    } catch (error) {
        return res.status(404).json({ message: error });
    }
});

app.patch("/user/coin", async (req, res) => {
	try {
		const user = req.body.userParam
		const coin = +req.body.userCurrPoint

		let userInfo = await MessageCount.findOne({ chatId: +user.chatId, userId: +user.userId });

		if (!userInfo) return res.status(404).json({ message: "Not found" });

		userInfo.point = +coin.toFixed(3)
		userInfo.totalCount = Math.ceil(+coin * 1000)

		await userInfo.save()

		return res.status(200).json({ message: "Дані зачислено" });
	} catch (error) {
		return res.status(404).json({ message: error });
	}
})

async function main() {
	await mongoose.connect(process.env.DB_CONNECT + process.env.DB_NAME)
}

main().catch(err => console.log(err))

app.listen(3000, '127.1.2.39', () => {
    console.log('127.1.2.39:3000');
});


