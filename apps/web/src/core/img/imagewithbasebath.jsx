import React from 'react';
import { image_path } from '../../environment';

const ImageWithBasePath = (props) => {
  // Combine the base path and the provided src to create the full image source URL
  const altText = String(props.alt || '');
  const fullSrc = `${image_path}${props.src}`;
  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={altText}
      width={props.width}
      id={props.id}
    />
  );
};

export default ImageWithBasePath;
