// Load Tickets

async function loadTickets() {

    const response =
    await fetch("/api/tickets");

    const tickets =
    await response.json();

    const table =
    document.getElementById(
        "ticketTable"
    );

    table.innerHTML = "";

    tickets.forEach(ticket => {

        let prediction = "";

        if(ticket.prediction === "SAFE"){

            prediction =
            "<span class='safe'>✅ SAFE</span>";

        }

        else if(ticket.prediction === "RISK"){

            prediction =
            "<span class='risk'>⚠ RISK</span>";

        }

        else{

            prediction =
            "<span class='breach'>🚨 BREACHED</span>";

        }

        table.innerHTML += `

        <tr onclick="showJustification('${ticket.ticket_no}')">

            <td>${ticket.ticket_no}</td>

            <td>${ticket.status}</td>

            <td>${ticket.remaining_time} hrs</td>

            <td>${prediction}</td>

        </tr>

        `;

    });

}

loadTickets();


// Load Dashboard Stats

async function loadStats(){

    const response =
    await fetch("/api/stats");

    const stats =
    await response.json();

    document.getElementById(
        "safeCount"
    ).innerHTML = stats.safe;

    document.getElementById(
        "riskCount"
    ).innerHTML = stats.risk;

    document.getElementById(
        "breachCount"
    ).innerHTML = stats.breached;

    createChart(stats);

}

loadStats();


// Justification Panel

async function showJustification(ticketNo){

    const response =
    await fetch(
        "/api/justification/" + ticketNo
    );

    const data =
    await response.json();

    document.getElementById(
        "justification"
    ).innerHTML = `

    <b>Ticket :</b> ${data.ticket}
    <br><br>

    <b>Assigned Team :</b>
    ${data.assigned_team}

    <br><br>

    <b>Reason :</b>
    ${data.reason}

    `;

}


// Chart

function createChart(stats){

    const ctx =
    document.getElementById(
        "slaChart"
    );

    new Chart(ctx, {

        type: "bar",

        data: {

            labels: [
                "Safe",
                "Risk",
                "Breached"
            ],

            datasets: [{

                label:
                "Ticket Count",

                data: [
                    stats.safe,
                    stats.risk,
                    stats.breached
                ]

            }]

        }

    });

}


// Chatbot

  async function sendMessage() {

    let input = document.getElementById("message");
    let msg = input.value.trim();

    if (msg === "") return;

    let chat = document.getElementById("chatbox");

    // User Message
    chat.innerHTML += `
        <div class="user">${msg}</div>
    `;

    input.value = "";

    try {

        const response = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: msg
            })

        });

        const data = await response.json();

        // Gemini Reply
        chat.innerHTML += `
            <div class="bot">${data.reply}</div>
        `;

        chat.scrollTop = chat.scrollHeight;

    } catch (error) {

        chat.innerHTML += `
            <div class="bot">
                Error connecting to Gemini AI.
            </div>
        `;

    }

}

// Browser Notification

if(Notification.permission !== "granted"){

    Notification.requestPermission();

}

function notifyUser(title,msg){

    if(Notification.permission === "granted"){

        new Notification(

            title,

            {
                body: msg
            }

        );

    }

}


// Check SLA Alerts

async function checkAlerts(){

    const response =
    await fetch("/api/tickets");

    const tickets =
    await response.json();

    tickets.forEach(ticket => {

        if(ticket.prediction === "RISK"){

            notifyUser(

                "⚠ SLA Risk Alert",

                ticket.ticket_no +
                " is at risk of SLA breach"

            );

        }

        if(ticket.prediction === "BREACHED"){

            notifyUser(

                "🚨 SLA Breached",

                ticket.ticket_no +
                " has breached SLA"

            );

        }

    });

}

checkAlerts();


// Auto Refresh Every 15 Seconds

setInterval(() => {

    loadTickets();

    loadStats();

},15000);
