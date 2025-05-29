// levels.js
export const levelsConfig = [
    { // Level 1 Data (index 0)
        levelNumber: 1, numScreens: 4, passThreshold: 7,
        instructions: "Lvl 1: Arrows: Move. Space: Jump. Hit '?'. Jump on 👾! Reach Portal!",
        questions: [
            {
                id: "block-1", worldX: 200, worldY: 150,
                q: "You quote exact words from page 57 of a two-author book. Which in-text citation is correct?",
                opts: [
                    "(Lee & Zhou, 2022)",
                    "(Lee & Zhou, 2022, p. 57)",
                    "Lee and Zhou (2022)",
                    "(Lee et al., 2022, p. 57)"
                ],
                ans: 1
            },
            {
                id: "block-2", worldX: 450, worldY: 150,
                q: "True or False: “If you re-write a sentence in your own words you can skip the citation.”",
                opts: [ "True", "False" ],
                ans: 1
            },
            { // THIS QUESTION IS UPDATED
                    id: "block-3", worldX: 850, worldY: 180,
                    q: "Pick the best reason to learn APA7 early:",
                    opts: [
                        "It prevents losing marks for referencing errors",
                        "It guarantees you'll get an A",
                        "It means you won’t need feedback",
                        "It’s the hardest referencing style to master"
                    ],
                    ans: 0 // Correct answer is now the first option
                },
    
            {
                id: "block-4", worldX: 1150, worldY: 150,
                q: "APA 7 is…",
                opts: [
                    "A handwriting font",
                    "A referencing style published by the American Psychological Association",
                    "A plagiarism-detection app",
                    "The 7th Avengers movie"
                ],
                ans: 1
            },
            {
                id: "block-5", worldX: 1550, worldY: 150,
                q: "True or False: In APA 7, you no longer need to include \"Retrieved from\" before a URL for most online sources, unless a retrieval date is also needed.",
                opts: [
                    "True",
                    "False"
                ],
                ans: 0
            },
            {
                id: "block-6", worldX: 1850, worldY: 180,
                q: "In APA 7, titles of journal articles are written in…",
                opts: [ "Title Case", "ALL CAPS", "Sentence case", "Bold italics" ],
                ans: 2
            },
            {
                id: "block-7", worldX: 2250, worldY: 150,
                q: "You are paraphrasing an idea from a source with three authors (Smith, Jones, and Davis) published in 2022. What is the correct parenthetical in-text citation for the first time you cite this source?",
                opts: [
                    "(Smith, Jones, Davis, 2022)",
                    "(Smith et al., 2022)",
                    "(Smith, Jones, & Davis, 2022)",
                    "(Smith and colleagues, 2022)"
                ],
                ans: 1
            },
            {
                id: "block-8", worldX: 2500, worldY: 150,
                q: "If a journal article has a DOI (Digital Object Identifier), how should it be formatted in the reference list according to APA7?",
                opts: [
                    "DOI: xxxxxx",
                    "Retrieved from https://doi.org/xxxxxx",
                    "https://doi.org/xxxxxx",
                    "Just the numbers: xxxxxx"
                ],
                ans: 2
            }
        ],
        enemies: [
            { htmlId: "enemy-1", worldX: 600, speed: 1.5, dir: -1, range: 150 },
            { htmlId: "enemy-2", worldX: 1450, speed: 2, dir: 1, range: 200 },
            { htmlId: "enemy-3", worldX: 1950, speed: 1.2, dir: -1, range: 100 }
        ],
        portalText: "Portal"
    },
    { // Level 2 Data (index 1)
        levelNumber: 2, numScreens: 4, passThreshold: 6,
        instructions: "Lvl 2: Intense Comets & More Enemies! Watch the sky and the ground!",
        questions: [
            {
                id: "block-1", worldX: 250, worldY: 160,
                q: "You found an amazing quote in a book by Jones (2020), but Jones was actually quoting another author, Smith (1995). You haven't read Smith's original work. How do you cite this in-text?",
                opts: ["(Smith, 1995)", "(Jones, 2020)", "(Smith, 1995, as cited in Jones, 2020)", "(Jones, 2020, quoting Smith, 1995)"],
                ans: 2
            },
            {
                id: "block-2", worldX: 500, worldY: 150,
                q: "The first time you cite a report by the Australian Bureau of Statistics (ABS) in parentheses, what’s the correct format?",
                opts: ["(ABS, 2024)", "(Australian Bureau of Statistics, 2024)", "(Australian Bureau of Statistics [ABS], 2024)", "(Australian Bureau of Statistics, 2024 [ABS])"],
                ans: 2
            },
            {
                id: "block-3", worldX: 900, worldY: 170,
                q: "You’re citing an undated web page by Khan Academy. What should the parenthetical citation look like?",
                opts: ["(Khan Academy, n.d.)", "(Khan Academy, 0000)", "(Khan Academy, date unknown)", "(Khan Academy n.d.)"],
                ans: 0
            },
            {
                id: "block-4", worldX: 1200, worldY: 160,
                q: "You read about Smith’s 1984 theory in Garcia’s 2022 book and can’t access Smith directly. Which in-text citation is correct?",
                opts: ["(Smith & Garcia, 1984 & 2022)", "(Smith, 1984, as cited in Garcia, 2022)", "(Garcia, 2022, citing Smith, 1984)", "(Garcia et al., 2022)"],
                ans: 1
            },
            {
                id: "block-5", worldX: 1600, worldY: 150,
                q: "How should the title of the book Thinking, Fast and Slow appear in your reference list entry?",
                opts: ["Thinking, Fast and Slow", "Thinking, fast and slow", "THINKING, FAST AND SLOW", "Thinking, Fast And Slow"],
                ans: 1
            },
            {
                id: "block-6", worldX: 1900, worldY: 170,
                q: "You are quoting from page 15 of a chapter written by Brown (2019) in an edited book by Davis (2019). Which is the correct parenthetical in-text citation?",
                opts: ["(Davis, 2019, p. 15)", "(Brown, 2019, p. 15)", "(Brown, in Davis, 2019, p. 15)", "(Davis & Brown, 2019, p. 15)"],
                ans: 1
            },
            {
                id: "block-7", worldX: 2300, worldY: 160,
                q: "You need to cite two different authors with the same surname (Kim, 2018; Kim, 2021). How do you avoid confusion?",
                opts: ["Include their initials: (S. Kim, 2018; J. Kim, 2021)", "Add first names in full", "Use et al. for one of them", "Alphabetise by first name only"],
                ans: 0
            },
            {
                id: "block-8", worldX: 2550, worldY: 150,
                q: "How should you cite a personal email received from Dr Lopez on 14 Jan 2025?",
                opts: ["(Lopez, personal communication)", "(Lopez, personal communication, January 14, 2025)", "(Lopez, 2025)", "do not cite personal emails"],
                ans: 1
            }
        ],
        enemies: [
            { htmlId: "enemy-1", worldX: 300, speed: 2.5, dir: 1, range: 200 },
            { htmlId: "enemy-2", worldX: 700, speed: 1.8, dir: -1, range: 180 },
            { htmlId: "enemy-3", worldX: 1100, speed: 2.2, dir: 1, range: 150 },
            { htmlId: "enemy-4", worldX: 1500, speed: 2.0, dir: -1, range: 220 },
            { htmlId: "enemy-5", worldX: 1900, speed: 1.6, dir: 1, range: 100 },
            { htmlId: "enemy-6", worldX: 2300, speed: 2.8, dir: -1, range: 250 }
        ],
        portalText: "Finish!",
        cometParams: {
            maxActive: 4,
            spawnIntervalMin: 1500,
            spawnIntervalMax: 3500,
            speedMin: 3,
            speedMax: 6.5
        }
    }
];