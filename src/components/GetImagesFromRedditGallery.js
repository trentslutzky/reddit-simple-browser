import axios from "axios";

async function GetImagesFromRedditGallery(data) {
  const post_data = await axios(
    `https://www.reddit.com${data.permalink.slice(0, -1)}.json`
  );
  let images_meta = Object.entries(
    post_data.data[0].data.children[0].data.media_metadata
  );
  let images = images_meta.map((img) => img[1].s.u.replaceAll("amp;", ""));
  return images;
}

module.exports.GetImagesFromRedditGallery = GetImagesFromRedditGallery;
