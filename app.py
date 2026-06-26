from flask import Flask, render_template, jsonify, request
import google.generativeai as genai
from dotenv import load_dotenv
import os
import sqlite3

app = Flask(__name__)
load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")
# Database Connection
def get_db_connection():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn

# Create Table
def create_table():
    conn = get_db_connection()

    conn.execute("""
    CREATE TABLE IF NOT EXISTS tickets(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_no TEXT,
        status TEXT,
        remaining_time INTEGER,
        assigned_team TEXT,
        reason TEXT
    )
    """)

    conn.commit()
    conn.close()

# Insert Sample Data
def insert_sample_data():

    conn = get_db_connection()

    count = conn.execute(
        "SELECT COUNT(*) FROM tickets"
    ).fetchone()[0]

    if count == 0:

        sample_tickets = [

            ("INC001","In Progress",5,
             "Network Team",
             "Investigation Ongoing"),

            ("INC002","Open",1,
             "Application Team",
             "Engineer Response Delayed"),

            ("INC003","Assigned",0,
             "Database Team",
             "Resolution Exceeded SLA"),

            ("INC004","Open",8,
             "Cloud Team",
             "Awaiting Logs"),

            ("INC005","In Progress",2,
             "Security Team",
             "Pending Approval")

        ]

        conn.executemany("""
        INSERT INTO tickets
        (
        ticket_no,
        status,
        remaining_time,
        assigned_team,
        reason
        )
        VALUES (?,?,?,?,?)
        """, sample_tickets)

        conn.commit()

    conn.close()

# SLA Logic
def get_prediction(time):

    if time > 2:
        return "SAFE"

    elif time > 0:
        return "RISK"

    else:
        return "BREACHED"

# Home Page
@app.route("/")
def home():
    return render_template("index.html")

# API: Get Tickets
@app.route("/api/tickets")
def tickets():

    conn = get_db_connection()

    rows = conn.execute(
        "SELECT * FROM tickets"
    ).fetchall()

    conn.close()

    result = []

    for row in rows:

        result.append({

            "id": row["id"],
            "ticket_no": row["ticket_no"],
            "status": row["status"],
            "remaining_time": row["remaining_time"],
            "assigned_team": row["assigned_team"],
            "reason": row["reason"],
            "prediction":
            get_prediction(
                row["remaining_time"]
            )

        })

    return jsonify(result)

# Dashboard Summary
@app.route("/api/stats")
def stats():

    conn = get_db_connection()

    rows = conn.execute(
        "SELECT remaining_time FROM tickets"
    ).fetchall()

    conn.close()

    safe = 0
    risk = 0
    breached = 0

    for row in rows:

        status = get_prediction(
            row["remaining_time"]
        )

        if status == "SAFE":
            safe += 1

        elif status == "RISK":
            risk += 1

        else:
            breached += 1

    return jsonify({

        "safe": safe,
        "risk": risk,
        "breached": breached

    })

# Justification API
@app.route("/api/justification/<ticket_no>")
def justification(ticket_no):

    conn = get_db_connection()

    row = conn.execute(
        "SELECT * FROM tickets WHERE ticket_no=?",
        (ticket_no,)
    ).fetchone()

    conn.close()

    if row:

        return jsonify({

            "ticket": row["ticket_no"],
            "reason": row["reason"],
            "assigned_team": row["assigned_team"]

        })

    return jsonify({
        "message": "Ticket Not Found"
    })


# 👇 IKKADA NUNCHI KOTTHA API START

@app.route("/api/chat", methods=["POST"])
def chat():

    data = request.get_json()
    user_question = data.get("message", "")

    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM tickets").fetchall()
    conn.close()

    ticket_data = ""

    for row in rows:
        ticket_data += (
            f"Ticket: {row['ticket_no']}, "
            f"Status: {row['status']}, "
            f"Remaining Time: {row['remaining_time']} hours, "
            f"Assigned Team: {row['assigned_team']}, "
            f"Reason: {row['reason']}\n"
        )

    prompt = f"""
You are an AI Virtual Agent for an SLA Breach Awareness System.

Ticket Data:
{ticket_data}

User Question:
{user_question}
"""

    response = model.generate_content(prompt)

    return jsonify({
        "reply": response.text
    })# Startup
create_table()
insert_sample_data()

if __name__ == "__main__":
    app.run(debug=True)
