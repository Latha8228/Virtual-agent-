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

function sendMessage(){

    let input =
    document.getElementById(
        "message"
    );

    let msg =
    input.value;

    if(msg === "")
    return;

    let chat =
    document.getElementById(
        "chatbox"
    );

    chat.innerHTML +=

    `<div class="user">
        ${msg}
    </div>`;

    let reply = "";

    let query =
    msg.toLowerCase();

    if(query.includes("sla")){

        reply =
        "I continuously monitor tickets and calculate remaining SLA time.";

    }

    else if(query.includes("risk")){

        reply =
        "Risk means ticket is close to breaching SLA.";

    }

    else if(query.includes("breach")){

        reply =
        "Breach occurs when remaining SLA time reaches 0 before resolution.";

    }

    else if(query.includes("why")){

        reply =
        "Possible reasons include delayed engineer response, approvals pending, resource shortage, or unresolved incidents.";

    }

    else if(query.includes("timeline")){

        reply =
        "Timeline: Created → Assigned → Investigation → Monitoring → Resolution";

    }

    else if(query.includes("ticket")){

        reply =
        "Click any ticket row to view justification details.";

    }

    else{

        reply =
        "I can help with SLA Status, Risk Prediction, Breach Justification, Analytics and Timeline.";

    }

    chat.innerHTML +=

    `<div class="bot">
        ${reply}
    </div>`;

    chat.scrollTop =
    chat.scrollHeight;

    input.value = "";

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