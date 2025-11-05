# 🎫 AI-Powered Ticket Classification & Response System

Automatically groups customer support tickets by intent using **Google Gemini API**, assigns priority, and generates **AI-based response templates**.  
Includes a live analytics dashboard built with **Chart.js** for trend and category visualization.

---

## 🚀 Features
- Semantic grouping of tickets via Gemini AI  
- Automatic priority classification (High / Medium / Low)  
- AI-generated professional responses  
- Interactive analytics dashboard (Chart.js)  
- Show/Hide toggle for API key visibility  
- Lightweight HTML, CSS, and JS architecture (no backend required)

---

## 🧠 System Flow

User Tickets → Gemini API → JSON Classification → Frontend UI → Analytics Dashboard


**Diagram:**


[User Input] → [Frontend Script] → [Gemini API]
↓
[Clustered JSON + AI Responses] → [Visualization & Insights]


---

## ⚙️ Setup Instructions

### 🧩 1. Clone Project
```bash
git clone https://github.com/yourusername/ai-ticket-system.git
cd ai-ticket-system
```

🧱 2. Run Locally

Open index.html in your browser

```
npm install
npm run dev
```
🔑 Gemini API Configuration

Go to Google AI Studio

Create a Gemini API Key

Paste the key into the Configuration section of the app

Use the Show/Hide button to toggle visibility

📡 API Request Example

Endpoint
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY
Content-Type: application/json
```
```
Request Body

{
  "contents": [{
    "parts": [{
      "text": "You are an expert AI system for customer support ticket analysis. \
Analyze and group the following tickets based on their meaning and intent. \
For each group, provide a descriptive category name, assign a priority (High, Medium, Low), \
and generate a short professional response template (3-4 sentences). \
Return output strictly in JSON array format as shown below: \
[ \
  { \
    \"category\": \"Category Name\", \
    \"priority\": \"High/Medium/Low\", \
    \"tickets\": [\"ticket text 1\", \"ticket text 2\"], \
    \"response\": \"AI-generated response\" \
  } \
] \
Tickets: \
1. I forgot my password, how to reset it? \
2. I can't log in, as password is incorrect. \
3. How to see leave balance?"
    }]
  }]
}
```

Expected Response
```
[
  {
    "category": "Password Reset & Login Issues",
    "priority": "High",
    "tickets": [
      "I forgot my password, how to reset it?",
      "I can't log in, as password is incorrect."
    ],
    "response": "You can reset your password by selecting 'Forgot Password' on the login page..."
  },
  {
    "category": "Leave Management Queries",
    "priority": "Low",
    "tickets": ["How to see leave balance?"],
    "response": "You can view your remaining leave balance in the HR portal under 'Leave Summary'..."
  }
]
```
📊 Frontend Flow

User enters tickets manually or selects preloaded ones.

Clicks “Analyze”.

Frontend sends tickets to Gemini API.

Gemini returns structured JSON with categories, priorities, and responses.

UI dynamically renders clustered tickets and charts.
