import React from 'react';
import { image_path } from '../../environment';
import { NO_PRODUCT_IMAGE, resolveMediaUrl } from '../utils/mediaUrl';

const ImageWithBasePath = (props) => {
  const altText = String(props.alt || '');
  const rawSrc = props.src;

  let fullSrc = NO_PRODUCT_IMAGE;
  if (rawSrc && typeof rawSrc === 'string' && rawSrc.trim()) {
    const trimmed = rawSrc.trim();
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('/uploads/')
    ) {
      fullSrc = resolveMediaUrl(trimmed);
    } else if (trimmed.startsWith('/')) {
      fullSrc = trimmed;
    } else {
      fullSrc = `${image_path}${trimmed}`;
    }
  }

  const handleError = (e) => {
    if (e.currentTarget.src !== NO_PRODUCT_IMAGE && !e.currentTarget.src.endsWith(NO_PRODUCT_IMAGE)) {
      e.currentTarget.src = NO_PRODUCT_IMAGE;
    }
    if (props.onError) {
      props.onError(e);
    }
  };

  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={altText}
      width={props.width}
      id={props.id}
      style={props.style}
      onError={handleError}
    />
  );
};

export default ImageWithBasePath;
