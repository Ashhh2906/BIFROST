<div align="center">

# 🏠 Roommate Finder

### Find a roommate you'll actually get along with.

A web app where students answer a lifestyle questionnaire and get ranked, percentage-based roommate matches with a detailed side-by-side comparison.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![PRs](https://img.shields.io/badge/PRs-welcome-orange)

[Live Demo](#-live-demo) • [Features](#-key-features) • [How It Works](#-how-matching-works) • [Getting Started](#-getting-started) • [Team](#-team)

</div>

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Screenshots](#-screenshots)
- [How Matching Works](#-how-matching-works)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [How We Built It](#-how-we-built-it)
- [Challenges & Learnings](#-challenges--learnings)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🎯 The Problem

Most roommate pairings are random, and a mismatch in daily habits quickly becomes a source of stress:

- One person sleeps at 10 PM, the other studies loudly at 2 AM.
- One keeps things spotless, the other doesn't.
- Nobody talks about expectations until it's too late.

## 💡 Our Solution

**Roommate Finder** replaces guesswork with data. Each student fills in a short lifestyle questionnaire. The app compares answers with every other student, calculates a **compatibility percentage**, shows the **top matches**, and lets you open a **detailed comparison** to see exactly where you align and where you don't.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📝 **Lifestyle Questionnaire** | Questions on sleep schedule, study habits, and cleanliness |
| 📊 **Compatibility Score** | A 0–100% score for every pair of students |
| 🏆 **Top Matches** | Students ranked from best to worst fit |
| 🔍 **Detailed Comparison** | Category-by-category and question-by-question breakdown of two profiles |
| 🎨 **Clean, Responsive UI** | Works on desktop, tablet, and mobile |
| ⚡ **Instant Results** | Matches are calculated as soon as the questionnaire is submitted |

---

## 📸 Screenshots

> Replace these placeholders with real screenshots (store them in a `/screenshots` folder).

| Questionnaire | Top Matches | Detailed Comparison |
|---|---|---|
| ![Questionnaire](screenshots/questionnaire.png) | ![Matches](screenshots/matches.png) | ![Comparison](screenshots/comparison.png) |

---

## 🧠 How Matching Works

### 1. The questionnaire

Questions are grouped into three categories:

| Category | Example questions |
|---|---|
| 🌙 **Sleep schedule** | What time do you usually go to bed? When do you wake up? Are you a light sleeper? |
| 📚 **Study habits** | Do you study at home or elsewhere? Do you need silence? Do you study late at night? |
| 🧹 **Cleanliness** | How often do you clean? How tidy do you keep shared spaces? Dishes: wash right away or later? |

### 2. Scoring each answer

Each question is compared between two students. The closer the answers, the higher the score for that question.

```
question_score = 1 - (|answer_A - answer_B| / max_possible_difference)
```

### 3. Weighting categories

Not every category matters equally for every person, so each category has a weight:

```
category_score = average(question_scores in that category)

compatibility % = Σ (category_score × category_weight) / Σ (category_weight) × 100
```

### 4. Ranking

All students are scored against the current user, sorted from highest to lowest, and the **top matches** are displayed. Selecting a match opens the **detailed comparison** view.

> 📌 Adjust the formula and weights above to match what your code actually does.

---

## 🛠 Tech Stack

> Update this table with the technologies you used.

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript *(or React / Vue / etc.)* |
| Backend | *Node.js / Python / none (client-side only)* |
| Database | *MongoDB / SQLite / Firebase / local JSON* |
| Hosting | *GitHub Pages / Vercel / Netlify* |

---

## 📁 Project Structure

> Update to match your repository.

```
roommate-finder/
├── index.html            # Landing page / questionnaire
├── css/                  # Styles
├── js/
│   ├── questions.js      # Questionnaire data
│   ├── matching.js       # Compatibility algorithm
│   └── app.js            # UI logic
├── data/                 # Sample student profiles
├── screenshots/          # README images
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- A modern web browser
- *(If applicable)* Node.js 18+ and npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/roommate-finder.git

# 2. Go into the project folder
cd roommate-finder

# 3. Install dependencies (if any)
npm install

# 4. Start the app
npm start
```

For a static project, simply open `index.html` in your browser.

---

## 🕹 Usage

1. **Open the app** and start the questionnaire.
2. **Answer all questions** about your sleep, study, and cleanliness habits.
3. **Submit** to see your compatibility percentage with other students.
4. **Browse your top matches**, sorted from best fit down.
5. **Open a match** to see the detailed comparison and decide if they're right for you.

---

## 🔨 How We Built It

1. **Research & planning**: identified the habits that most often cause roommate conflict (sleep, study, cleanliness).
2. **Questionnaire design**: wrote clear, quantifiable questions so answers can be compared numerically.
3. **Matching algorithm**: built a weighted similarity score that returns a percentage.
4. **Results UI**: designed a ranked match list and a side-by-side comparison view.
5. **Testing**: tried different student profiles to confirm that similar people score high and opposite people score low.
6. **Polish & deploy**: improved styling, made it responsive, and published to GitHub.

---

## 🧗 Challenges & Learnings

- **Turning habits into numbers**: converting lifestyle answers into values that can be fairly compared.
- **Weighting fairly**: deciding how much each category should influence the final score.
- **Presenting results clearly**: making a percentage meaningful with a detailed breakdown.
- **Teamwork**: collaborating through Git, branches, and pull requests.

---

## 🔮 Future Improvements

- [ ] User accounts and login
- [ ] Let users set their own category weights
- [ ] More categories (social life, budget, guests, noise)
- [ ] Chat or contact request between matched students
- [ ] Gender, year, and hostel/campus filters
- [ ] Save and edit questionnaire answers
- [ ] Dark mode

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👥 Team

| Name | Role | GitHub |
|---|---|---|
| *Your Name* | *Role* | [@username](https://github.com/username) |
| *Teammate* | *Role* | [@username](https://github.com/username) |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

⭐ **If you found this project useful, give it a star!** ⭐

</div>
