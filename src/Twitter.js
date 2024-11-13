import React, { useState, useEffect } from 'react';
import { Twitter, Heart, MessageCircle, Repeat, Share, MoreHorizontal } from 'lucide-react';
import axios from 'axios';

const TwitterClone = () => {
  const styles = {
    app: {
      backgroundColor: '#0d1117',
      color: '#c9d1d9',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    nav: {
      borderBottom: '1px solid #21262d',
      padding: '10px 15px',
    },
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '15px',
    },
    tweetBox: {
      marginBottom: '20px',
    },
    textarea: {
      width: '100%',
      backgroundColor: '#0d1117',
      border: '1px solid #30363d',
      borderRadius: '4px',
      color: '#c9d1d9',
      padding: '10px',
      resize: 'none',
    },
    button: {
      backgroundColor: '#1a8cd8',
      color: 'white',
      border: 'none',
      borderRadius: '9999px',
      padding: '10px 20px',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginTop: '10px',
    },
    tweet: {
      borderBottom: '1px solid #21262d',
      padding: '15px 0',
    },
    tweetHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: '#21262d',
      marginRight: '10px',
    },
    username: {
      fontWeight: 'bold',
    },
    handle: {
      color: '#8b949e',
      marginLeft: '5px',
    },
    tweetText: {
      fontSize: '15px',
      lineHeight: '1.3125',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap',
    },
    timestamp: {
      color: '#8b949e',
      fontSize: '14px',
      marginLeft: '5px',
    },
    tweetActions: {
      display: 'flex',
      justifyContent: 'space-between',
      color: '#8b949e',
      marginTop: '10px',
    },
    actionButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#8b949e',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      fontSize: '13px',
    },
  };

  const [tweets, setTweets] = useState([]);
  const [newTweet, setNewTweet] = useState('');

  useEffect(() => {
    fetchTweets();
    const interval = setInterval(fetchTweets, 100);
    return () => clearInterval(interval);
  }, []);

  const fetchTweets = async () => {
    try {
      const response = await axios.get('http://localhost:3001/tweets', {
        params: { timestamp: Date.now() }
      });
      setTweets(response.data);
    } catch (error) {
      console.error('Error fetching tweets:', error);
    }
  };

  const handleTweet = async () => {
    if (newTweet.trim() !== '') {
      try {
        await axios.post('http://localhost:3001/tweet', { content: newTweet });
        setNewTweet('');
        fetchTweets();
      } catch (error) {
        console.error('Error posting tweet:', error);
      }
    }
  };

  const handleLike = async (id) => {
    try {
      await axios.post(`http://localhost:3001/like/${id}`);
      fetchTweets();
    } catch (error) {
      console.error('Error liking tweet:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('default', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <Twitter color="#1a8cd8" size={32} />
      </nav>
      <div style={styles.container}>
        <div style={styles.tweetBox}>
          <textarea
            style={styles.textarea}
            rows="3"
            placeholder="What's happening?"
            value={newTweet}
            onChange={(e) => setNewTweet(e.target.value)}
            maxLength={280}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#8b949e' }}>{newTweet.length}/280</span>
            <button style={styles.button} onClick={handleTweet} disabled={newTweet.trim() === ''}>
              Tweet
            </button>
          </div>
        </div>
        {tweets.map(tweet => (
          <div key={tweet.id} style={styles.tweet}>
            <div style={styles.tweetHeader}>
              <div style={styles.avatar}></div>
              <div>
                <span style={styles.username}>{tweet.username}</span>
                <span style={styles.handle}>{tweet.handle}</span>
                <span style={styles.timestamp}>{formatTimestamp(tweet.timestamp)}</span>
              </div>
              <MoreHorizontal style={{ marginLeft: 'auto' }} color="#8b949e" size={20} />
            </div>
            <p style={styles.tweetText}>{tweet.content}</p>
            <div style={styles.tweetActions}>
              <button style={styles.actionButton} onClick={() => handleLike(tweet.id)}>
                <Heart size={18} style={{ marginRight: '5px' }} /> {tweet.likes}
              </button>
              <button style={styles.actionButton}>
                <MessageCircle size={18} style={{ marginRight: '5px' }} /> {tweet.comments.length}
              </button>
              <button style={styles.actionButton}>
                <Repeat size={18} style={{ marginRight: '5px' }} /> {tweet.retweets}
              </button>
              <button style={styles.actionButton}>
                <Share size={18} />
              </button>
            </div>
            {tweet.comments.map((comment, index) => (
              <div key={index} style={{ marginLeft: '48px', marginTop: '10px', color: '#8b949e' }}>
                <strong>{comment.username}:</strong> {comment.text}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TwitterClone;