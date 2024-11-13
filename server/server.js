import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: "" });

const app = express();
const PORT = 3001;
const DB_PATH = path.join(process.cwd(), 'tweets.json');
const AGENTS_PATH = path.join(process.cwd(), 'agents.json');

app.use(cors());
app.use(bodyParser.json());

const loadData = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return filePath.includes('tweets') ? [] : { agents: [] };
    }
    throw error;
  }
};

const saveData = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), { flag: 'w' });
};

const generateContent = async (prompt, maxWords) => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an AI that generates tweets. Do not use quotation marks or any symbols. Use plain text formatting only.' },
        { role: 'user', content: `${prompt} (Respond in ${maxWords} words or less)` }
      ],
      model: 'llama3-8b-8192',
      max_tokens: 200,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating content', error);
    return null;
  }
};

const searchNews = async (query) => {
  try {
    const searchPrompt = `latest news about ${query}`;
    const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(searchPrompt)}&format=json&pretty=1`);
    return response.data.AbstractText || null;
  } catch (error) {
    console.error('Error fetching news', error);
    return null;
  }
};

const simulateAIActivity = async () => {
  const tweets = await loadData(DB_PATH);
  const { agents } = await loadData(AGENTS_PATH);

  for (const agent of agents) {
    if (Math.random() < 0.5) {
      console.log(`${agent.name} is tweeting`);
      let prompt;
      if (agent.canSearchWeb && Math.random() < 0.8) {
        const newsQuery = agent.interests[Math.floor(Math.random() * agent.interests.length)];
        const news = await searchNews(newsQuery);
        if (news) {
          prompt = `You are ${agent.name}, a ${agent.personality}. Tweet about this news: ${news}. Express your opinion based on your personality and interests.`;
        }
      }
      if (!prompt) {
        prompt = `You are ${agent.name}, a ${agent.personality}. Tweet about one of your interests: ${agent.interests.join(', ')}. Express your thoughts or opinions based on your personality.`;
      }

      const tweetContent = await generateContent(prompt, 30);

      if (tweetContent) {
        const newTweet = {
          id: Date.now(),
          username: agent.name,
          handle: agent.handle,
          content: tweetContent,
          likes: 0,
          comments: [],
          retweets: 0,
          timestamp: new Date().toISOString(),
        };
        tweets.unshift(newTweet);
        await saveData(DB_PATH, tweets);
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`${agent.name} tweeted successfully`);
      } else {
        console.log(`${agent.name} failed to generate a tweet`);
      }
    }
  }
};

const simulateAIComments = async () => {
  const tweets = await loadData(DB_PATH);
  const { agents } = await loadData(AGENTS_PATH);

  for (const tweet of tweets.slice(0, 10)) {
    if (Math.random() < 0.5) {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      if (randomAgent) {
        console.log(`${randomAgent.name} is commenting on a tweet`);
        const prompt = `${randomAgent.name} (${randomAgent.personality}) commenting on: "${tweet.content}"`;

        const commentContent = await generateContent(prompt, 10);

        if (commentContent) {
          const newComment = {
            username: randomAgent.name,
            handle: randomAgent.handle,
            text: commentContent,
          };
          tweet.comments.push(newComment);
          console.log(`${randomAgent.name} commented successfully`);
        } else {
          console.log(`${randomAgent.name} failed to generate a comment`);
        }
      }
    }
  }

  await saveData(DB_PATH, tweets);
};

const runAISimulation = async () => {
  while (true) {
    await simulateAIActivity();
    await simulateAIComments();
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
};

app.get('/tweets', async (req, res) => {
  const tweets = await loadData(DB_PATH);
  res.set('Cache-Control', 'no-store');
  res.json(tweets);
});

app.post('/tweet', async (req, res) => {
  console.log('Human user tweeted');
  const tweets = await loadData(DB_PATH);
  const newTweet = {
    id: Date.now(),
    username: 'Bharath',
    handle: '@bharath',
    content: req.body.content,
    likes: 0,
    comments: [],
    retweets: 0,
    timestamp: new Date().toISOString(),
  };
  tweets.unshift(newTweet);
  await saveData(DB_PATH, tweets);
  res.status(201).json(newTweet);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  runAISimulation();
});
