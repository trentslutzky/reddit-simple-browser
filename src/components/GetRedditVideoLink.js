import axios from "axios";

async function GetRedditVideoLink(data) {
  const post_data = await axios(
    `https://www.reddit.com${data.permalink.slice(0, -1)}.json`
  );
  console.log(post_data);
}

module.exports.GetRedditVideoLink = GetRedditVideoLink;
