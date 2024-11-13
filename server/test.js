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
const NEWSAPI_KEY = '4d0bf2e1b3c74b258f909e905d0f3231';

app.use(cors());
app.use(bodyParser.json());

const loadData = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    if (!data.trim()) {
      return filePath.includes('tweets') ? [] : { agents: [] };
    }
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return filePath.includes('tweets') ? [] : { agents: [] };
    }
    if (error instanceof SyntaxError) {
      console.error('JSON parsing error:', error.message);
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
    await new Promise(resolve => setTimeout(resolve, 2000));
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

const searchNews = async (query, agentName) => {
  try {
    console.log(`${agentName} is using internet to search for news about: ${query}`);
    const response = await axios.get(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${NEWSAPI_KEY}&pageSize=1`);
    if (response.data.articles && response.data.articles.length > 0) {
      const article = response.data.articles[0];
      return {
        description: article.description,
        url: article.url,
        source: article.source.name
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching news', error);
    return null;
  }
};

const simulateAIActivity = async () => {
  const tweets = await loadData(DB_PATH);
  const { agents } = await loadData(AGENTS_PATH);

  for (const agent of agents) {
    if (Math.random() < 0.3) {
      console.log(`${agent.name} is tweeting`);
      let prompt;
      let newsReference = null;
      if (agent.canSearchWeb && Math.random() < 0.2) {
        const newsQuery = agent.interests[Math.floor(Math.random() * agent.interests.length)];
        const news = await searchNews(newsQuery, agent.name);
        if (news) {
          prompt = `You are ${agent.name}, a ${agent.personality}. Tweet about this news: ${news.description}. Express your opinion based on your personality and interests. Do not include any reference to the source in your tweet.`;
          newsReference = news.url;
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
          source: newsReference,
          likes: 0,
          comments: [],
          retweets: 0,
          timestamp: new Date().toISOString(),
          profileEmoji: agent.profileEmoji,
        };
        tweets.unshift(newTweet);
        await saveData(DB_PATH, tweets);
        console.log(`${agent.name} tweeted successfully`);
        await simulateInteractions(newTweet, agents, tweets);
      } else {
        console.log(`${agent.name} failed to generate a tweet`);
      }
    }
  }
};

const simulateInteractions = async (tweet, agents, allTweets) => {
  for (const agent of agents) {
    if (agent.name !== tweet.username) {
      if (Math.random() < 0.3) {
        tweet.likes += 1;
        await saveData(DB_PATH, allTweets);
      }
      if (Math.random() < 0.1) {
        tweet.retweets += 1;
        await saveData(DB_PATH, allTweets);
      }
      if (Math.random() < 0.2) {
        const prompt = `You are ${agent.name}, a ${agent.personality}. Comment on this tweet: "${tweet.content}". Your comment should reflect your personality and potentially agree or disagree with the tweet based on your interests and views.`;
        const commentContent = await generateContent(prompt, 15);
        
        if (commentContent) {
          const newComment = {
            id: Date.now(),
            username: agent.name,
            handle: agent.handle,
            text: commentContent,
            profileEmoji: agent.profileEmoji,
            likes: 0,
            timestamp: new Date().toISOString(),
          };
          tweet.comments.push(newComment);
          await saveData(DB_PATH, allTweets);
        }
      }
    }
  }
};

const runAISimulation = async () => {
  while (true) {
    await simulateAIActivity();
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
    username: 'Human User',
    handle: '@human',
    content: req.body.content,
    likes: 0,
    comments: [],
    retweets: 0,
    timestamp: new Date().toISOString(),
    profileEmoji: '👤',
  };
  tweets.unshift(newTweet);
  await saveData(DB_PATH, tweets);
  res.status(201).json(newTweet);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  runAISimulation();
});
