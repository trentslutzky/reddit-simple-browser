import { useEffect, useState, useRef } from "react";
import axios from "axios";
import styled from "styled-components";
import { useParams } from "react-router-dom";

current_time = new Date().getTime();

const spritesheet =
  "https://www.redditstatic.com/sprite-reddit.5kxTB7FXse0.png";

import PostContent from "./components/PostContent";

export function Subreddit() {
  const { subreddit } = useParams();

  const containerRef = useRef(null);

  const [posts, setPosts] = useState(null);
  const [subredditInfo, setSubredditInfo] = useState(null);
  const [bannerImage, setBannerImage] = useState("");
  const [selected, setSelected] = useState(-1);
  const [loadingMore, setLoadingMore] = useState(false);

  var url = `https://www.reddit.com/r/${subreddit}.json`;
  if (subreddit == null) {
    url = "https://www.reddit.com/hot.json";
  }

  async function getData() {
    const data = await axios({
      method: "get",
      url: url,
    });
    setPosts(data.data.data.children);
  }

  async function getSubredditInfo(){
    const data = await axios({
      method: "get",
      url: `https://www.reddit.com/r/${subreddit}/about.json`,
    });
    setSubredditInfo(data.data.data);
    setBannerImage(data.data.data.banner_background_image.split("?")[0]);
  }

  async function loadMore(){
    setLoadingMore(true);
    const new_url = `https://www.reddit.com\
${subredditInfo?subredditInfo.url.slice(0,-1):"/hot"}.json\
?count=25&after=\
${posts[posts.length-1].data.name}`
    console.log(new_url);

    const new_post_list_res = await axios(new_url);
    const new_post_list = new_post_list_res.data.data.children

    setPosts(posts.concat(new_post_list));
    setLoadingMore(false);
  }

  useEffect(() => {
    getData();
    subreddit && getSubredditInfo();
  }, []);

  if (posts === null) {
    return <p></p>;
  }

  return (
    <MainContainer>
      {subreddit && (
        <>
          <SubredditBanner backround={bannerImage} />
          <SubredditHeadingWrapper>
            <SubredditHeadingContainer>
              {subreddit && <SubredditIcon src={subredditInfo.icon_img} />}
              <SubredditHeadingTitle>
                {subreddit ? subredditInfo.title : "reddit"}
              </SubredditHeadingTitle>
            </SubredditHeadingContainer>
          </SubredditHeadingWrapper>
        </>
      )}
      <Posts>
        {posts.map((p, i) => (
          <>
            <Post
              key={i.toString()}
              index={i}
              data={p.data}
              selected={selected}
              setSelected={setSelected}
            />
          </>
        ))}
      </Posts>
      {loadingMore ?
      <p>Loading More...</p>
      :
      <LoadMoreButton
        onClick={loadMore}
      >
        Load More
      </LoadMoreButton>
      }
    </MainContainer>
  );
}

function Post({ data, index, selected, setSelected }) {
  let imageRef = useRef(null);
  let postRef = useRef(null);
  let textRef = useRef(null);

  const [mouseStartY, setMouseStartY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startWidth, setStartWidth] = useState(null);
  const [showContent, setShowContent] = useState(false);

  const time_since = current_time / 1000 - data.created_utc;
  const days_since = parseInt(time_since / (60 * 60 * 24));
  const hours_since = parseInt(time_since / (60 * 60));

  // turn this into a function, you idiot.
  const ups_rounded = data.ups > 999 ? (data.ups / 1000).toFixed(1) : data.ups;
  const num_comments_rounded =
    data.num_comments > 999
      ? (data.num_comments / 1000).toFixed(1)
      : data.num_comments;

  useEffect(() => {
    if (textRef.current == null) {
      return;
    }
    console.log(textRef);
    textRef.current.innerHTML = data.selftext_html;
  }, [textRef]);

  function handleMouseDown(e) {
    setStartWidth(parseInt(window.getComputedStyle(imageRef.current).width));
    imageRef.current.style.width = window.getComputedStyle(
      imageRef.current
    ).width;
    imageRef.current.style.maxWidth = "unset";
    imageRef.current.style.maxHeight = "unset";
    setMouseStartY(e.pageY);
    setDragging(true);
  }

  function endResize(e) {
    setDragging(false);
  }

  function handleMouseMove(e) {
    if (dragging) {
      difference = e.pageY - mouseStartY;
      imageRef.current.style.width = startWidth + difference * 1.5 + "px";
    }
  }

  function DoThumbnail() {
    if (data.thumbnail === "nsfw") {
      return <NSFWThumbnail />;
    }
    if (["default", "self", "spoiler"].includes(data.thumbnail)) {
      return <TextThumbnail />;
    }
    if (data.post_hint === "link") {
      return <LinkThumbnail />;
    } else {
      return <Thumbnail src={data.thumbnail} />;
    }
  }

  function handlePostClick() {
    setSelected(selected == index ? -1 : index);
    console.log(data);
  }

  useEffect(() => {
    if (showContent == true) {
      window.scroll({
        top: postRef.current.offsetTop - 20,
        behavior: "smooth",
      });
    }
  }, [showContent]);

  useEffect(() => {
    setShowContent(selected == index);
  }, [selected]);

  return (
    <PostContainer ref={postRef}>
      <PostLine>
        <DoThumbnail />
        <PostInfo onClick={handlePostClick}>
          <PostTitle>{data.title}</PostTitle>
          <FlexFill />
          <PostSubtitle>
            <FAIcon className="fa-solid fa-arrow-up" />
            {ups_rounded}
            {data.ups > 999 && "k"}
            <FAIcon className="fa-solid fa-clock" />
            {days_since > 0 ? `${days_since}d` : `${hours_since}h`}
            <CommentsLink href={"https://www.reddit.com" + data.permalink}>
              <FAIcon className="fa-solid fa-comment" />
              {num_comments_rounded}
              {data.num_comments > 999 && "k"}
            </CommentsLink>
            <Author>u/{data.author}</Author>
            {data.thumbnail == "nsfw" && <NSFWText>nsfw</NSFWText>}
            <FlexFill />
            <SubredditName>r/{data.subreddit}</SubredditName>
          </PostSubtitle>
        </PostInfo>
      </PostLine>
      {showContent && <PostContent data={data} />}
    </PostContainer>
  );
}

const Posts = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const PostContainer = styled.div`
  background: #222222;
  max-width: 800px;
  width: 100%;
  margin: 10px;
  margin-bottom: 20px;
  box-shadow: 0px 0px 10px 5px rgba(0, 0, 0, 0.1);
  padding: 20px;
  padding-bottom:0px;
  transition: height 1s;
`;

const PostLine = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;
  margin-bottom:20px;
  background: #ffffff08;
  &:hover {
    background: #ffffff15;
  }
`;

const Thumbnail = styled.div`
  width: 70px;
  height: 60px;
  background-image: url(${(props) => props.src});
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
`;

const IconThubnail = styled(Thumbnail)`
  background-image: url(${spritesheet});
  background-size: 64px;
`;

const LinkThumbnail = styled(IconThubnail)`
  background-position: 3px -201px;
`;
const TextThumbnail = styled(IconThubnail)`
  background-position: 3px -402px;
`;
const NSFWThumbnail = styled(IconThubnail)`
  background-position: 3px -270px;
`;

const PostInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding-inline: 20px;
  width: 100%;
`;

const PostTitle = styled.h1`
  font-size: 18px;
  margin: 0;
  padding: 5px;
  width: 100%;
  font-weight:normal;
`;

const PostSubtitle = styled.div`
  width: 100%;
  padding: 0;
  padding-inline: 5px;
  margin: 0;
  display: flex;
  flex-direction: row;
  font-size: 14px;
  align-items: center;
  color: #bbbbbb;
`;

const Author = styled.span`
  padding: 0;
  margin: 0;
  margin-left: 0.5em;
  color: #69c7ff;
  font-size: 16px;
`;

const SubredditName = styled.span`
  padding: 0;
  margin: 0;
  margin-left: 0.5em;
  color: #69c7ff;
  font-size: 16px;
`;

const FlexFill = styled.div`
  margin: 0;
  padding: 0;
  flex-grow: 1;
`;

const SubredditBanner = styled.div`
  background-image: url(${(props) => props.backround});
  height: 300px;
  width: 100%;
  background-size: cover;
  background-position-x: center;
  background-position-y: top;
`;

const SubredditHeadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: -50px;
  margin-bottom: 30px;
`;

const SubredditHeadingContainer = styled.div`
  width: 100%;
  padding: 20px;
  max-width: 1300px;
  background: #222222;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const SubredditHeadingTitle = styled.h1`
  color: #69c7ff;
  margin: 0;
  padding: 0;
`;

const SubredditIcon = styled.img`
  margin-right: 20px;
  height: 100px;
`;

const MainContainer = styled.div`
  margin: 0;
  margin-bottom: 50vh;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PostText = styled.div`
  white-space: pre-wrap;
  margin-top: 20px;
  background: #ffffff08;
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
`;

const LinkButton = styled.button`
  width: 100%;
  margin-top: 20px;
  font-family: Space Mono;
  color: black;
  background: #ffffffdd;
  border: none;
  font-size: 18px;
  border-radius: 8px;
  &:hover {
    background: #ffffffaa;
  }
  cursor: pointer;
`;

const CommentsLink = styled.a`
  margin-left: 0.5em;
  text-decoration:none;
  color: inherit;
`;

const FAIcon = styled.i`
  margin-right: 0.5em;
  margin-left: 0.5em;
`;

const LoadMoreButton = styled.button`
  width: 840px;
  height: 30px;
  border-radius: 0;
  border: none;
  color: #69c7ff;
  background: #444444;
  &:hover {
    background: #555555;
  }
`;

const NSFWText = styled.span`
  color:#222222;
  padding-inline:0.5em;
  border-radius:3px;
  background:#d76767;
  margin-left:0.5em;
`;
