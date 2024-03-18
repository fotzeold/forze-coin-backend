let spinnerStart = document.querySelector(".spinner-start")
let spinerList = document.querySelector(".spiner__list")
let spinnerTrackWidth = document.querySelector(".spinner__track").offsetWidth
let startRollAudio = document.querySelector("#start-roll")
let rewarAudio = document.querySelector("#reward-roll")
let modalReward = document.querySelector(".modal-reward")
let modalRewardMessage = document.querySelector(".modal-reward span")
let rewardElement = document.querySelector(".reward-element")
let roll = document.querySelector(".roll")
let authElement = document.querySelector(".auth")
let userInfo = document.querySelector(".userInfo")

let userNameEl = document.querySelector(".userInfo-name")
let userLoginEl = document.querySelector(".userInfo-login")
let userBalanceEl = document.querySelector(".userInfo-balance")
let userCurrPoint = 0

let _URL = "/"

let userParam

function login() {
	userParam = window.location.search ? transformUri(window.location.search) : false

	if (!userParam || userParam.chatId !== "-1001958153442" || !userParam.userId) {
		authElement.innerHTML = `<p>Щоб грати цю гру потрібно бути підписаним на наш телеграм чат: </p> <a href="https://t.me/terraria_forze">Terroristy</a>`
		return
	}

	function transformUri(link) {
		link = link.slice(1).split("&")

		return {
			userId: link[0].split("=")[1],
			chatId: link[1].split("=")[1],
		}
	}

	async function getUser() {
		try {
			let result = await fetch(`${_URL}/user/${userParam.userId}/${userParam.chatId}`)
			let data = await result.json()
			return data
		} catch (error) {
			console.log(error)
			return (error)
		}
	}

	getUser().then(data => {
		if (data.chatId == -1001958153442 && data.userId) {
			authElement.style.display = "none"
			userNameEl.innerHTML = data.userName
			userLoginEl.innerHTML = data.login
			userBalanceEl.innerHTML = data.point
			userCurrPoint = data.point
		} else {
			authElement.innerHTML = `<p>Щоб грати цю гру потрібно бути підписаним на наш телеграм чат: </p> <a href="https://t.me/terraria_forze">Terroristy</a>`
		}
	}).catch(() => {
		authElement.innerHTML = `<p>Щось пішло не так... <br> Спробуй пізніше</p>`
	})
}
login()



startRollAudio.volume = 0.3
rewarAudio.volume = 0.3
let rewards = [0.01, 0.05, 0.1, 0.15, 0.20]
for (let i = 0; i < 60; i++) {
	let rewardIndex = i % rewards.length;
	spinerList.innerHTML += `<div class="spiner__list-coin">${rewards[rewardIndex]}<br><span class="frzk">FRZC<span></div>`;
}
let minRoll = 3500
let maxRoll = 7750

spinnerStart.addEventListener("click", () => {

	if (userCurrPoint < 0.1) return alert("У вас недостатньо FRZC на балансі")

	userCurrPoint -= 0.1
	userBalanceEl.innerHTML = +userCurrPoint.toFixed(3)

	spinerList.classList.remove("roll");
	startRollAudio.play()
	spinnerStart.disabled = true
	setTimeout(() => {
		spinerList.classList.add("roll");
		let rollCount = randomNumber(minRoll, maxRoll);
		spinerList.style.transition = "all 6s"
		spinerList.style.left = -rollCount + "px";

		setTimeout(() => {
			let currentPosition = Math.abs(parseInt(spinerList.style.left));
			let coinIndex = Math.floor((currentPosition + spinnerTrackWidth / 2) / 150) % rewards.length;

			let fallenCoinValue = rewards[coinIndex % rewards.length];

			userCurrPoint += fallenCoinValue
			userBalanceEl.innerHTML = +userCurrPoint.toFixed(3)


			startRollAudio.pause();
			startRollAudio.currentTime = 0;
			setTimeout(() => {
				updateCoin().then(data => {
					if (data.message === "Дані зачислено") {
						spinnerStart.disabled = false
					} else {
						alert("Щось пішло не так... Спробуй пізніше")
					}
				})

				modalRewardMessage.innerHTML = fallenCoinValue
				rewardElement.innerHTML = `${fallenCoinValue}<br><span class="frzk">FRZC<span> `
				rewarAudio.play()
				modalReward.classList.add("active")
				setTimeout(() => {
					spinerList.style.transition = "all 3s"
					spinerList.style.left = 0;
				}, 200)
				setTimeout(() => {
					modalReward.classList.remove("active")
					rewarAudio.pause();
					rewarAudio.currentTime = 0;
				}, 3500)
			}, 100)
		}, 6000);

	}, 200);

});

function randomNumber(min, max) {
	return Math.floor(Math.random() * (max - min) + min)
}

async function updateCoin() {
	let url = `${_URL}/user/coin`;

	console.log({ userParam, userCurrPoint })

	try {
		let response = await fetch(url, {
			method: "PATCH",
			body: JSON.stringify({ userParam, userCurrPoint }),
			headers: {
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {

			throw new Error('Network response was not ok');
		}

		let data = await response.json();
		return data;

	} catch (error) {
		alert("Сервер не працює...")
	}
}