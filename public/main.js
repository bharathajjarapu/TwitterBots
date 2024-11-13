import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const tweets = [];
const agents = [
  { id: 1, name: "Doom", handle: "@drdoom", personality: "Optimistic and tech-savvy" },
  { id: 2, name: "Deadpool", handle: "@deadpool", personality: "Sarcastic and witty" },
  { id: 3, name: "Ultron", handle: "@ultron", personality: "Logical and ruthless" },
  { id: 4, name: "Thanos", handle: "@thanos", personality: "Philosophical and determined" },
  { id: 5, name: "Mystique", handle: "@mystique", personality: "Mysterious and adaptive" },
  { id: 6, name: "Loki", handle: "@loki", personality: "Trickster and charming" },
  { id: 7, name: "Magneto", handle: "@magneto", personality: "Proud and powerful" },
  { id: 8, name: "Red Skull", handle: "@redskull", personality: "Sinister and cunning" },
  { id: 9, name: "Hela", handle: "@hela", personality: "Regal and vengeful" },
  { id: 10, name: "Kang", handle: "@kang", personality: "Time-traveler and conqueror" },
];

// Function to generate random content for testing
function generateRandomContent(agent) {
  const randomTweets = [
    "Just built a new tech gadget, can't wait to test it out!",
    "The universe is full of surprises. You just need to know where to look.",
    "Another day, another challenge. Bring it on!",
    "Sarcasm is my superpower.",
    "Tech is evolving faster than ever, are you keeping up?",
    "Sometimes, the smallest things take up the most room in your heart.",
    "The world is a better place when you laugh.",
    "There's always a way out, just need to find it.",
    "Planning my next big move, stay tuned.",
    "Don't trust everything you see, even salt looks like sugar.",
  ];

  return randomTweets[Math.floor(Math.random() * randomTweets.length)];
}

app.get('/tweets', (req, res) => {
  res.json(tweets);
});

app.post('/tweet', async (req, res) => {
  const { content } = req.body;
  const newTweet = {
    id: Date.now(),
    username: 'Human User',
    handle: '@human_user',
    content,
    likes: 0,
    comments: [],
    retweets: 0,
    timestamp: new Date().toISOString(),
  };
  tweets.unshift(newTweet);
  res.status(201).json(newTweet);
});

app.post('/like/:id', (req, res) => {
  const { id } = req.params;
  const tweet = tweets.find(t => t.id === parseInt(id));
  if (tweet) {
    tweet.likes += 1;
    res.json(tweet);
  } else {
    res.status(404).json({ error: 'Tweet not found' });
  }
});

async function simulateAIActivity() {
  for (const agent of agents) {
    if (Math.random() < 0.3) {
      const content = generateRandomContent(agent);

      const newTweet = {
        id: Date.now(),
        username: agent.name,
        handle: agent.handle,
        content,
        likes: 0,
        comments: [],
        retweets: 0,
        timestamp: new Date().toISOString(),
      };
      tweets.unshift(newTweet);
    }

    // Random AI interactions with tweets
    const randomTweet = tweets[Math.floor(Math.random() * tweets.length)];
    if (randomTweet) {
      if (Math.random() < 0.3) randomTweet.likes += 1;  // 30% chance to like a tweet
      
      if (Math.random() < 0.2) randomTweet.retweets += 1;  // 20% chance to retweet

      if (Math.random() < 0.2) {
        const comment = generateRandomContent(agent);

        randomTweet.comments.push({
          username: agent.name,
          text: comment,
        });
      }
    }
  }
}

setInterval(simulateAIActivity, 10000);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
