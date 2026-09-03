import React from 'react';
import { Text } from '@react-pdf/renderer';
import { extractAlignment } from '../../utils/richTextEngine';

/**
 * Tokenizes rich text strings containing <b>, <strong>, <i>, <em>, <br>
 * and produces properly styled nested <Text> components.
 */
export const RichTextPdf = ({ text, style = {}, align }) => {
  if (text === null || text === undefined) return null;
  const str = String(text);
  const detectedAlign = align || extractAlignment(str);
  const alignStyle = detectedAlign ? { textAlign: detectedAlign } : {};

  if (!/<[a-z][\s\S]*>/i.test(str)) {
    return (
      <Text style={[style, alignStyle]}>
        {str}
      </Text>
    );
  }

  // Replace <br> and <br/> with newline
  const normalizedStr = str.replace(/<br\s*\/?>/gi, '\n');

  const tokens = normalizedStr.split(/(<\/?(?:b|strong|i|em)>)/gi);
  let isBold = false;
  let isItalic = false;

  const children = tokens.map((token, index) => {
    const lower = token.toLowerCase();
    if (lower === '<b>' || lower === '<strong>') {
      isBold = true;
      return null;
    }
    if (lower === '</b>' || lower === '</strong>') {
      isBold = false;
      return null;
    }
    if (lower === '<i>' || lower === '<em>') {
      isItalic = true;
      return null;
    }
    if (lower === '</i>' || lower === '</em>') {
      isItalic = false;
      return null;
    }
    if (!token) return null;

    const spanStyle = {};
    if (isBold) spanStyle.fontWeight = 'bold';
    if (isItalic) spanStyle.fontStyle = 'italic';

    // Strip any remaining unexpected HTML tags
    const cleanToken = token.replace(/<[^>]*>/g, '');
    if (!cleanToken) return null;

    return (
      <Text key={index} style={spanStyle}>
        {cleanToken}
      </Text>
    );
  }).filter(Boolean);

  return (
    <Text style={[style, alignStyle]}>
      {children}
    </Text>
  );
};

export default RichTextPdf;
