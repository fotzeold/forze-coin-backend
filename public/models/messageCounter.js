import mongoose from "mongoose"
const messageCountSchema = mongoose.Schema({
	chatId: { type: Number, required: true },
	userId: { type: Number, required: true },
	userName: { type: String, required: true },
	login: { type: String },
	totalCount: { type: Number, default: 0 },
	point: { type: Number, default: 0 },
	subscribe: { type: Boolean, default: false },
	subscribeTime: { type: Date, default: "" }
});

const MessageCount = mongoose.model('MessageCount', messageCountSchema);

export default MessageCount
