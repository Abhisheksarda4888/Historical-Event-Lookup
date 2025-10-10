const fetch = require('node-fetch');

// This function runs securely on Vercel as the endpoint /api/get-news
module.exports = async (req, res) => {
    // CRITICAL: Get the secret key from Vercel's environment variables
    const apiKey = process.env.NEWS_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ error: "Configuration Error: NEWS_API_KEY is missing." });
    }

    // The frontend sends the query string via the request body
    const { query } = req.body;

    if (!query) {
         return res.status(400).json({ error: "No search query provided." });
    }

    // Construct the NewsAPI URL using the query and the secret key
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`;

    try {
        // Make the request to the external NewsAPI
        const newsResponse = await fetch(newsApiUrl);
        const newsData = await newsResponse.json();

        // Check for errors returned by NewsAPI itself (e.g., rate limit exceeded)
        if (newsData.status === 'error') {
            return res.status(500).json({ error: `NewsAPI Error: ${newsData.message}` });
        }

        // Return the articles array securely to the frontend
        return res.status(200).json({ articles: newsData.articles });

    } catch (error) {
        console.error("External News API Error:", error);
        return res.status(500).json({ error: "Failed to connect to NewsAPI." });
    }
};