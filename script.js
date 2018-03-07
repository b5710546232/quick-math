let UUID
let NAME

if (sessionStorage.getItem('UUID')) {
    UUID = sessionStorage.getItem('UUID')
    NAME = sessionStorage.getItem('NAME')
}

const EMPTY = {
    TEXT: '\u00A0'
}
let ws
main()

/** regis submit answer function to element */
Array.from(document.getElementById("answer-list").children).map((childElm, index) => {
    childElm.setAttribute("onclick", `submitAnswer(${index})`)
})

document.getElementById("input-name").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        submitName()
    }
})

document.getElementById("playagain-btn").addEventListener('click', (event) => {
    hideElement('rank-table-container')
    showElement("form-submit")
    document.getElementById("hud-people").innerHTML = ""
    document.getElementById("hud-score").innerHTML = ""
})


setElementText("validate-text", EMPTY.TEXT)
function main() {
    let host = "quickmath.safesuk.me"
    ws = new WebSocket(`ws://${host}`)
    showElement("general-text")
    ws.onopen = function () {
        console.log('websocket is connected ...')
        hideElement("general-text")
        let data = {
            UUID: "",
            NAME: ""
        }
        if (UUID != undefined && NAME != undefined) {
            data = {
                UUID: UUID,
                NAME: NAME
            }
        }
        sendMessage(ws, "check.status", data)
    }
    ws.onmessage = function (ev) {
        console.log('receive message in client', ev.data)
        let msg = JSON.parse(ev.data)
        if (msg.hasOwnProperty('event') && msg.hasOwnProperty('data')) {
            handleOnMessage(msg)
        }
    }
    ws.onerror = function (error) {
        console.log(error)
    }
    ws.onclose = function (ev) {
        console.log('oncolse')
    }
}

function handleOnMessage(msg) {
    console.log(msg)
    if (msg.event === 'game.form') {
        if (msg.data.isInGame) {
            showElement("general-text")
            setElementText("general-text", "Waiting for people...")
            setElementText("hud-name", `Name: ${NAME}`)
            sendMessage(ws, "connected", "")
        } else {
            showFormSubmit()
        }
    }
    if (msg.event === 'game.wait') {
        showElement('general-text')
        hideElement('form-submit')
        let data = msg.data
        let nextSendTime = data.nextMatchTime
        let startTime = data.startTime
        let totalSec = nextSendTime - startTime / 1000
        let frame = 100
        let currentTime = startTime
        let interval = setInterval(() => {
            currentTime += frame
            let time = (nextSendTime - currentTime) / 1000
            if (time < 0) {
                showElement('form-submit')
                hideElement('general-text')
                clearInterval(interval)
            }
            // console.log('Next match will be start in ',nextSendTime,time)
            setElementText('general-text', `Next match will be start in ${time.toFixed(1)}sec.`)
        }, frame)
    }
    if (msg.event === 'connected') {
        console.log('connected')
        if (UUID) {
            sendMessage(ws, "get.UUID", {
                "method": 'CHECK',
                "UUID": UUID,
                "NAME": NAME
            })
        }
        else {
            sendMessage(ws, "get.UUID", {
                "method": 'NEW',
                "NAME": NAME
            })
        }
        setElementText("general-text", "Waiting for people...")

    }

    if (msg.event === 'get.UUID') {
        console.log('send get.ready')
        UUID = msg.data.UUID
        sessionStorage.setItem('UUID', UUID)
        sendMessage(ws, "get.ready", {
            uuid: UUID
        })
    }

    if (msg.event === 'ready.countdown') {
        setElementText("hud-score", `Score: ${0}`)
        setElementText("hud-people", `People: ${msg.data.people}`)
        setElementText("general-text", `Game will start in ${msg.data.timeLeft}`)
    }
    if (msg.event === 'get.question') {
        if (msg.data) {
            setUpQuestion(msg.data)
        }
    }

    if (msg.event === 'game.end') {
        hideElement("question-answer")
        hideElement("form-submit")
        showElement("general-text")
        setElementText("general-text", "Game end")
        setTimeout(() => {
            hideElement('general-text')
            showElement('rank-table-container')
            createRankTable(msg.data)
        }, 1000)
    }
    if (msg.event === 'get.score.byUUID') {
        setElementText("hud-score", `Score: ${msg.data.score}`)
    }

    if (msg.event === "get.result") {
        hideElement("question-answer")
        hideElement("form-submit")
        showElement("general-text")
        let text = "Wrong!"
        if (msg.data.isAnswerCorrect) {
            text = "Your answer is correct!"
        }
        setElementText("general-text", text)
        setElementText("hud-score", `Score: ${msg.data.score}`)
        setElementText("hud-people", `People: ${msg.data.people}`)
        setElementText("hud-name", `Name: ${NAME}`)
    }

}

function setUpQuestion(data) {
    let nextSendTime = new Date(data.nextSendTime).getTime()
    let startTime = data.startTime
    let totalSec = (new Date(data.nextSendTime).getTime() - startTime) / 1000
    let frame = 100
    let time = (data.nextSendTime - startTime) / 1000
    document.getElementById('inner-bar').style.width = (time * 100 / totalSec).toFixed(2) + '%'
    document.getElementById('inner-bar').classList.add('progress-transition')
    document.getElementById('inner-bar').classList.remove('yellow-bg')
    document.getElementById('inner-bar').classList.remove('red-bg')
    let currentTime = startTime
    let interval = setInterval(() => {
        currentTime += frame
        // console.log((nextSendTime - currentTime) / 1000)
        let condition = (nextSendTime - currentTime) / 1000
        if (condition < 0) {
            document.getElementById('inner-bar').classList.remove('progress-transition')
            clearInterval(interval)
        }
        else {
            let time = (nextSendTime - currentTime) / 1000
            document.getElementById('inner-bar').style.width = (time * 100 / totalSec).toFixed(2) + '%'
            let percent = time * 100 / totalSec
            if (percent < 40) {
                // yelow
                document.getElementById('inner-bar').classList.add('yellow-bg')
            }
            if (percent < 20) {
                //red
                document.getElementById('inner-bar').classList.remove('yellow-bg')
                document.getElementById('inner-bar').classList.add('red-bg')
            }


            setElementText('text-bar', `${time.toFixed(1)} sec.`)
        }
        // console.log(width)
    }, frame)
    hideElement('form-submit')
    document.getElementById('question-img').classList.remove('question-img')
    hideElement("general-text")
    hideElement('question-text')
    hideElement('question-img')
    console.log('initgame', data)
    CURRENT_QUESTION = data
    let currentQuestion = CURRENT_QUESTION
    showElement("question-answer")

    if(currentQuestion.questionType==='text'){
        showElement('question-text')
        setElementText("question-text", currentQuestion.question)    
    }
    else if(currentQuestion.questionType==='image'){
        showElement('question-img')
        document.getElementById('question-img').classList.add('question-img')
        document.getElementById('question-img').style = `background:url('${currentQuestion.question}');`
    }

    setElementText("hud-people", `People: ${data.people}`)
    setElementText("hud-name", `Name: ${NAME}`)
    setElementText("question-number", `Question# ${currentQuestion.question_number}`)
    // if no score to show ask score
    if (document.getElementById('hud-score').textContent.length <= 0) {
        sendMessage(ws, 'get.score.byUUID', { UUID: UUID })
    }

    currentQuestion.choices.map((item, index) => {
        setElementText(`choice-${index}`, `${index + 1}).  ${item}`)
    })
}

function createRankTable(data) {
    let header = `<tr class="table-header" ><th>#Rank</th><th>Name</th><th>Score</th></tr>`
    let body = ``
    let list = data.sort((a, b) => b.score - a.score)
    list.map((item, index) => {
        console.log(item)
        if (item.UUID === UUID && item.NAME === NAME) {
            body += `<tr class="primary-blue-color" ><td>${index + 1}</td><td>${item.NAME}</td><td>${item.score}</td></tr>`
        }
        else {
            body += `<tr><td>${index + 1}</td><td>${item.NAME}</td><td>${item.score}</td></tr>`
        }
    })
    document.getElementById('table').innerHTML = header + body
}

function clearRankTable() {
    document.getElementById('table').innerHTML = ''
}
function showFormSubmit() {
    let elmID = 'form-submit'
    showElement(elmID)
}

function showElement(elmID) {
    document.getElementById(elmID).classList.remove("display-none")
}
function hideElement(elmID) {
    document.getElementById(elmID).classList.add("display-none")
}

function setElementText(elmID, text) {
    document.getElementById(elmID).textContent = text
}

function validateSubmitData(name) {
    let elmID = "validate-text"
    let validateText = document.getElementById(elmID)
    let inputText = document.getElementById("input-name")
    if (name.length <= 0) {
        validateText.textContent = "* Please insert your name"
        inputText.focus()
        throw ('error')
    }
    setElementText("validate-text", EMPTY.TEXT)
}

function submitAnswer(index) {
    console.log('choice index ', index)
    hideElement("question-answer")
    showElement("general-text")
    setElementText("general-text", `Your choice is #${index + 1}: ${CURRENT_QUESTION.choices[index]}`)
    let data = {
        NAME: NAME,
        UUID: UUID,
        choiceIndex: index
    }
    sendMessage(ws, 'game.answer', data)
}
function playAgain() {
    hideElement("form-submit")
    showElement("general-text")
    setElementText("general-text", "Ready")
}

document.getElementById("submit-btn").addEventListener("click", function (event) {
    submitName()
})

function submitName() {
    let name = document.getElementById('input-name').value
    console.log(name)
    validateSubmitData(name)
    playAgain()
    NAME = name
    sessionStorage.setItem('NAME', NAME)
    setElementText("hud-name", `Name: ${NAME}`)
    sendMessage(ws, "connected", "")
}

/** uitls function  */
function requestJSON(method, url) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {

            resolve(JSON.parse(xhr.response))

        }
        xhr.onerror = function () {
            reject(JSON.parse(xhr.response))
        }

        xhr.send();
    })
}

function sendMessage(ws, event = "event", data = "hello") {
    let jsonData = {
        "event": event,
        "data": data
    }
    ws.send(JSON.stringify(jsonData))
}

function deleteAllChildNode(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}
/** end uitls function  */