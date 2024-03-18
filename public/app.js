import 'dotenv/config'
import express from "express"
import mongoose from 'mongoose'
import bot from './bot.js'
import MessageCount from "./models/messageCounter.js"
import cors from "cors"

const app = express()

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
    origin: ["https://fotzeold.github.io"]
}))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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


