import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ReactMarkdown from 'react-markdown';

import { GetImagesFromRedditGallery } from "./GetImagesFromRedditGallery";
import { GetRedditVideoLink } from "./GetRedditVideoLink";

const debug_data = false;

export default function PostContent({ data }) {
  const [computed, setComputed] = useState("idk");

  const imageContainerRef = useRef(null);

  const [mouseStartY, setMouseStartY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startWidth, setStartWidth] = useState(null);
  const [startHeight, setStartHeight] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [images, setImages] = useState([]);
  const [moved, setMoved] = useState(false);

  const [imageMax, setImageMax] = useState(["100%", "50vh", "95vw"]);

  function handleMouseDown(e) {
    if (e.button != 0) {
      return;
    }
    setStartWidth(
      parseInt(window.getComputedStyle(imageContainerRef.current).width)
    );
    setStartHeight(
      parseInt(window.getComputedStyle(imageContainerRef.current).height)
    );
    imageContainerRef.current.style.width = window.getComputedStyle(
      imageContainerRef.current
    ).width;
    imageContainerRef.current.style.height = window.getComputedStyle(
      imageContainerRef.current
    ).height;
    imageContainerRef.current.style.maxWidth = "unset";
    setImageMax(["unset", "unset"]);
    setMouseStartY(e.pageY);
    setDragging(true);
  }

  function endResize(e) {
    setDragging(false);
    if (e.type != "mouseup") {
      return;
    }
    if (moved) {
      setMoved(false);
    } else {
      //imageContainerRef.current.style.height = "50vh";
    }
  }

  function handleMouseMove(e) {
    if (dragging) {
      setMoved(true);
      difference = e.pageY - mouseStartY;
      imageContainerRef.current.style.height =
        startHeight + difference * 1.5 + "px";
    }
  }

  async function calculateContentType() {
    if (data.is_video == true) {
      setComputed("video");
      const video_link = await GetRedditVideoLink(data);
      return;
    }
    if (data.is_gallery == true) {
      setComputed("reddit gallery");
      const gallery_images = await GetImagesFromRedditGallery(data);
      setImages(gallery_images);
      return;
    }
    if (data.is_self == true) {
      setComputed("self");
      return;
    }
    if (data.post_hint == "link" && data.domain == "imgur.com") {
      setComputed("imgur gallery");
      return;
    }
    if (data.post_hint == "image" && data.is_gallery != true) {
      setComputed("image");
      setImages([data.url]);
      return;
    }
  }

  useEffect(() => {
    calculateContentType();
  }, []);

  return (
    <>
      {debug_data && (
        <>
          <DataLine>post_hint: {data.post_hint}</DataLine>
          <DataLine>is_self: {data.is_self.toString()}</DataLine>
          <DataLine>is_video: {data.is_video.toString()}</DataLine>
          <DataLine>
            is_gallery: {data.is_gallery ? data.is_gallery.toString() : "false"}
          </DataLine>
          <DataLine>num_images: {images.length}</DataLine>
          <DataLine>domain: {data.domain}</DataLine>
          <DataLine>
            thumbnail: <a href={data.thumbnail}>{data.thumbnail}</a>
          </DataLine>
          <DataLine>
            url: <a href={data.url}>{data.url}</a>
          </DataLine>
          <h3>Computed: {computed}</h3>
        </>
      )}
    {["image","reddit gallery"].includes(computed) &&
      <ContentContainer>
        {images.length == 0 && <p>loading</p>}
        {images.length > 1 && (
          <GalleryButtons>
            <GalleryButton
              onClick={() => {
                setSelectedImage(
                  selectedImage == 0 ? images.length - 1 : selectedImage - 1
                );
              }}
            >
              <i class="fa-regular fa-arrow-left"></i>
            </GalleryButton>
            {selectedImage + 1}/{images.length}
            <GalleryButton
              onClick={() => {
                setSelectedImage(
                  selectedImage == images.length - 1 ? 0 : selectedImage + 1
                );
              }}
            >
              <i class="fa-regular fa-arrow-right"></i>
            </GalleryButton>
          </GalleryButtons>
        )}
        <ImageContainer ref={imageContainerRef}>
          {images.map((img_url, i) => {
            return (
              <PostContentImage
                src={img_url}
                visible={i == selectedImage}
                imageMax={imageMax}
                alt="no image"
                draggable="false"
                onMouseDown={handleMouseDown}
                onMouseUp={endResize}
                onMouseMove={handleMouseMove}
                onMouseLeave={endResize}
              />
            );
          })}
        </ImageContainer>
      </ContentContainer>
      }
      {computed == "self" &&
        <ReactMarkdown 
          children={data.selftext}
          components={{
            code:({node, ...props}) => <span 
              style={{
                background:'#214860',
                padding:'1.5px',
                borderRadius:'3px',
                paddingInline:'10px',
                fontSize:'14px',
              }} {...props}
            />,
            pre:({node, ...props}) => <pre 
              {...props} style={{
                background:'#214860',
                padding:'10px',
                overflowX:'scroll',
                overflowY:'hidden',
              }}
            />,
          }}
        />
      }
    {["idk","video"].includes(computed) &&
      <PostText>
        Post type not supported yet: {computed}
      </PostText>
      }
    </>
  );
}

const DataLine = styled.p`
  margin: 0;
  padding: 0;
  white-space: nowrap;
  overflow: hidden;
`;

const PostContentImage = styled.img`
  height: 100%;
  width: ${(props) => props.imageMax[2]};
  max-width: ${(props) => props.imageMax[0]};
  max-height: ${(props) => props.imageMax[1]};
  display: ${(props) => (props.visible ? "" : "none")};
  object-fit: contain;
`;

const ImageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const ContentContainer = styled.div`
  padding-inline: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom:20px;
`;

const GalleryButtons = styled.div`
  margin-bottom: 20px;
`;

const GalleryButton = styled.button`
  background: #61acef;
  opacity: 0.8;
  width: 50px;
  margin-inline: 10px;
  border: none;
  &:hover {
    opacity: 1;
  }
`;

const PostText = styled.div`
  background:#333;
  padding:15px;
  font-size:13px;
  margin-bottom:20px;
  white-space: break-spaces;
`;
