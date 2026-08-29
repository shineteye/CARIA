# 📚 PathFinder Ghana (Caria)

**An AI-powered career and academic guidance platform for Ghanaian students**

---

## 🎯 What It Does

PathFinder Ghana helps students navigate the Ghanaian education system by providing personalized academic roadmaps from JHS through BECE, SHS, WASSCE, and into university and career — weighted by what actually matters to each student, whether that's passion, money, or a balance of both.

**Students get clear answers to:**
- What subjects should I take?
- What grades do I need?
- Which schools and programmes fit my situation?
- How do I get from here to my career, given my finances and what I care about?

---

## 🚀 Features

- **Account & Profile** — register/login (JWT), with a persisted profile (interests, strengths, finances, motivation, etc.)
- **Chat-Driven Onboarding** — a 12-question guided quiz that builds a student profile
- **AI Personal Guide** — an LLM-generated (Groq / Llama 3.3) roadmap after onboarding, plus ongoing conversational advice
- **Scored Career Matching** — careers ranked by fit (interests/strengths) and money (salary, demand, affordability), weighted by the student's own passion-vs-money motivation
- **Compare Tool** — side-by-side comparison of 2–3 careers: fit score, money score, salary range, tuition tier, cutoffs, university options
- **Career Explorer** — browse and filter career paths, personalized once logged in

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios
- **Backend:** Node.js, Express 5, MongoDB (Mongoose), JWT auth
- **AI:** Groq SDK (`llama-3.3-70b-versatile`)
- **Deployment:** Vercel (frontend + backend as separate services)

---

## 📁 Project Structure

```
CARIA/
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── models/           (User, Session, Message, shared profileSchema)
│   ├── controllers/      (auth, profile, session, chat, career)
│   ├── routes/
│   ├── middleware/       (JWT auth, error handler)
│   ├── services/         (onboardingService, matchingService)
│   └── data/             (career/school/university JSON knowledge base)
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── components/
        ├── hooks/
        ├── pages/         (Landing, Auth, Chat, Explore, Compare, NotFound)
        └── services/api.js
```

---

## 🏃 Getting Started

### Backend

```bash
cd backend
npm install
# create a .env with MONGO_URI, JWT_SECRET, GROQ_API_KEY
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🎨 Design System

- **Colors:** Navy, Gold, Cream
- **Typography:** Clean, modern, student-friendly
- **Vibe:** Professional, warm, Ghanaian-inspired

---

## 🔮 Future Improvements

- [ ] Real tuition and cost-of-living dataset (current tuition tiers are approximate)
- [ ] Expand cutoff/school data beyond Greater Accra & Central Region
- [ ] Mobile app version
- [ ] Password reset / email verification

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📄 License

MIT

---

**Start your journey today → [caria-ghana.vercel.app](https://caria-ghana.vercel.app)**
