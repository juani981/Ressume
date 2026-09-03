import React from 'react';
import { View, Text, Link } from '@react-pdf/renderer';
import { PdfIcon } from './PdfIcons';
import { RichTextPdf } from './richTextPdf';

export const CVItemPdf = ({ item, sectionType, colors, fontSizes, spacing, isLast = false }) => {
  if (!item) return null;

  // 1. Profile Header
  if (sectionType === 'profile_header') {
    return (
      <View style={{ marginBottom: spacing.sectionGap * 0.75 }}>
        <Text style={{ fontSize: fontSizes.h1, fontWeight: 'bold', color: colors.titleColor, marginBottom: 3 }}>
          {item.name || ''}
        </Text>
        {item.subtitle ? (
          <Text style={{ fontSize: fontSizes.subtitle, color: colors.textColorLight, marginBottom: 6 }}>
            {item.subtitle}
          </Text>
        ) : null}
        
        {/* Contact Links */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
          {item.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 }}>
              <PdfIcon name="map" color={colors.textColorLight} size={fontSizes.smaller} />
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColor, marginLeft: 3 }}>
                {item.location}
              </Text>
            </View>
          ) : null}
          {item.email ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 }}>
              <PdfIcon name="envelope" color={colors.textColorLight} size={fontSizes.smaller} />
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColor, marginLeft: 3 }}>
                {item.email}
              </Text>
            </View>
          ) : null}
          {item.phone ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 }}>
              <PdfIcon name="phone" color={colors.textColorLight} size={fontSizes.smaller} />
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColor, marginLeft: 3 }}>
                {item.phone}
              </Text>
            </View>
          ) : null}
          {item.linkedin ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 }}>
              <PdfIcon name="linkedin" color={colors.textColorLight} size={fontSizes.smaller} />
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColor, marginLeft: 3 }}>
                {item.linkedin}
              </Text>
            </View>
          ) : null}
          {item.github ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 }}>
              <PdfIcon name="github" color={colors.textColorLight} size={fontSizes.smaller} />
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColor, marginLeft: 3 }}>
                {item.github}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // 2. About / Profile Summary
  if (sectionType === 'about') {
    return (
      <View style={{ marginBottom: spacing.itemGap }}>
        <RichTextPdf
          text={item.description}
          style={{ fontSize: fontSizes.body, color: colors.textColor, lineHeight: spacing.lineHeight }}
        />
      </View>
    );
  }

  // 3. Technical Skills
  if (sectionType === 'skills') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap * 0.7 }}>
        <View style={{
          width: 4.5,
          height: 4.5,
          borderRadius: 2.25,
          backgroundColor: colors.circleColor,
          marginTop: 4,
          marginRight: 6,
          flexShrink: 0
        }} />
        <Text style={{ flex: 1, fontSize: fontSizes.list, color: colors.textColor, lineHeight: spacing.lineHeight }}>
          <Text style={{ fontWeight: 'bold', color: colors.titleColor }}>{item.title}{item.title && item.description ? ': ' : ''}</Text>
          <Text>{item.description || ''}</Text>
        </Text>
      </View>
    );
  }

  // 4. Education
  if (sectionType === 'education') {
    return (
      <View style={{ flexDirection: 'row', marginBottom: spacing.itemGap }}>
        {/* Timeline Indicator */}
        <View style={{ width: 14, alignItems: 'center', marginRight: 6, position: 'relative' }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.circleColor,
            marginTop: 2
          }} />
          {!isLast && (
            <View style={{
              width: 1.5,
              flex: 1,
              backgroundColor: colors.textColorLight,
              opacity: 0.35,
              marginTop: 2
            }} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor, flex: 1 }}>
              {item.title || ''}
            </Text>
            {item.date && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginLeft: 6 }}>
                {item.date}
              </Text>
            )}
          </View>
          {item.subtitle && (
            <Text style={{ fontSize: fontSizes.small, color: colors.textColor, marginTop: 1 }}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // 5. Simple List / Bullet List
  if (sectionType === 'simple_list') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap * 0.7 }}>
        <View style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.circleColor,
          marginTop: 4,
          marginRight: 6,
          flexShrink: 0
        }} />
        <RichTextPdf
          text={item.text}
          style={{ flex: 1, fontSize: fontSizes.list, color: colors.textColor, lineHeight: spacing.lineHeight }}
        />
      </View>
    );
  }

  // 6. Languages with badge pill
  if (sectionType === 'languages') {
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.itemGap * 0.8
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 4.5,
            height: 4.5,
            borderRadius: 2.25,
            backgroundColor: colors.circleColor,
            marginRight: 6
          }} />
          <View>
            <Text style={{ fontSize: fontSizes.body, fontWeight: 'bold', color: colors.titleColor }}>
              {item.title || item.language || ''}
            </Text>
            {item.description && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginTop: 1 }}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        {(item.subtitle || item.level) && (
          <View style={{
            paddingVertical: 2,
            paddingHorizontal: 6,
            borderRadius: 8,
            backgroundColor: colors.containerColorAlt,
            borderWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.08)'
          }}>
            <Text style={{ fontSize: fontSizes.smaller, fontWeight: 'bold', color: colors.titleColor }}>
              {item.subtitle || item.level}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // 7. Certificates with Badge Icon
  if (sectionType === 'certificates') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap }}>
        <View style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.containerColorAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
          marginTop: 1
        }}>
          <PdfIcon name="badgeCheck" color={colors.titleColor} size={10} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor, flex: 1 }}>
              {item.title || ''}
            </Text>
            {item.date && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginLeft: 6 }}>
                {item.date}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: fontSizes.small, color: colors.textColor, marginTop: 1 }}>
            {item.subtitle || ''}
            {item.credentialId ? ` · ID: ${item.credentialId}` : ''}
          </Text>
          {item.link && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <PdfIcon name="externalLink" color={colors.textColorLight} size={fontSizes.smaller} />
              <Link src={item.link.startsWith('http') ? item.link : `https://${item.link}`} style={{ marginLeft: 3 }}>
                <Text style={{ fontSize: fontSizes.smaller, color: '#2563eb' }}>
                  {item.linkText || item.link}
                </Text>
              </Link>
            </View>
          )}
        </View>
      </View>
    );
  }

  // 8. Awards with Trophy Icon
  if (sectionType === 'awards') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap }}>
        <View style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.containerColorAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
          marginTop: 1
        }}>
          <PdfIcon name="trophy" color={colors.titleColor} size={10} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor, flex: 1 }}>
              {item.title || ''}
            </Text>
            {item.date && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginLeft: 6 }}>
                {item.date}
              </Text>
            )}
          </View>
          {item.subtitle && (
            <Text style={{ fontSize: fontSizes.small, color: colors.textColor, marginTop: 1 }}>
              {item.subtitle}
            </Text>
          )}
          {item.description && (
            <RichTextPdf
              text={item.description}
              style={{ fontSize: fontSizes.body, color: colors.textColor, marginTop: 2, lineHeight: spacing.lineHeight }}
            />
          )}
        </View>
      </View>
    );
  }

  // 9. Publications with BookOpen Icon
  if (sectionType === 'publications') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap }}>
        <View style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.containerColorAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
          marginTop: 1
        }}>
          <PdfIcon name="bookOpen" color={colors.titleColor} size={10} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor, flex: 1 }}>
              {item.title || ''}
            </Text>
            {item.date && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginLeft: 6 }}>
                {item.date}
              </Text>
            )}
          </View>
          {item.subtitle && (
            <Text style={{ fontSize: fontSizes.small, color: colors.textColor, marginTop: 1 }}>
              {item.subtitle}
            </Text>
          )}
          {item.link && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <PdfIcon name="externalLink" color={colors.textColorLight} size={fontSizes.smaller} />
              <Link src={item.link.startsWith('http') ? item.link : `https://${item.link}`} style={{ marginLeft: 3 }}>
                <Text style={{ fontSize: fontSizes.smaller, color: '#2563eb' }}>
                  {item.linkText || item.link}
                </Text>
              </Link>
            </View>
          )}
          {item.description && (
            <RichTextPdf
              text={item.description}
              style={{ fontSize: fontSizes.body, color: colors.textColor, marginTop: 2, lineHeight: spacing.lineHeight }}
            />
          )}
        </View>
      </View>
    );
  }

  // 10. References with UserCheck Icon
  if (sectionType === 'references') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap }}>
        <View style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.containerColorAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
          marginTop: 1
        }}>
          <PdfIcon name="userCheck" color={colors.titleColor} size={10} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor }}>
            {item.title || item.name || ''}
          </Text>
          {item.subtitle && (
            <Text style={{ fontSize: fontSizes.small, color: colors.textColor, marginTop: 1 }}>
              {item.subtitle}
            </Text>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 }}>
            {item.email && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginRight: 8 }}>
                {item.email}
              </Text>
            )}
            {item.phone && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginRight: 8 }}>
                {item.phone}
              </Text>
            )}
            {item.relationship && (
              <Text style={{ fontSize: fontSizes.smaller, fontStyle: 'italic', color: colors.textColorLight }}>
                ({item.relationship})
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // 11. Default Timeline: 'list' (Work Experience), 'projects', 'volunteering', or custom
  const bullets = item.bullets || [];

  return (
    <View style={{ flexDirection: 'row', marginBottom: spacing.itemGap }}>
      {/* Timeline Indicator */}
      <View style={{ width: 14, alignItems: 'center', marginRight: 6, position: 'relative' }}>
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.circleColor,
          marginTop: 2
        }} />
        {!isLast && (
          <View style={{
            width: 1.5,
            flex: 1,
            backgroundColor: colors.textColorLight,
            opacity: 0.35,
            marginTop: 2
          }} />
        )}
      </View>

      {/* Content Body */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor, flex: 1 }}>
            {item.title || ''}
          </Text>
          {item.date && (
            <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginLeft: 6 }}>
              {item.date}
            </Text>
          )}
        </View>

        {item.subtitle && (
          <Text style={{ fontSize: fontSizes.small, fontWeight: 'bold', color: colors.textColor, marginTop: 1 }}>
            {item.subtitle}
          </Text>
        )}

        {item.link && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 2 }}>
            <PdfIcon name="externalLink" color={colors.textColorLight} size={fontSizes.smaller} />
            <Link src={item.link.startsWith('http') ? item.link : `https://${item.link}`} style={{ marginLeft: 3 }}>
              <Text style={{ fontSize: fontSizes.smaller, color: '#2563eb' }}>
                {item.linkText || item.link}
              </Text>
            </Link>
          </View>
        )}

        {item.description && (
          <RichTextPdf
            text={item.description}
            style={{ fontSize: fontSizes.body, color: colors.textColor, marginTop: 2, lineHeight: spacing.lineHeight }}
          />
        )}

        {bullets.length > 0 && (
          <View style={{ marginTop: 3 }}>
            {bullets.map((bullet, idx) => {
              const textStr = typeof bullet === 'string' ? bullet : (bullet?.text || '');
              return (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                  <View style={{
                    width: 3.5,
                    height: 3.5,
                    borderRadius: 1.75,
                    backgroundColor: colors.circleColor,
                    marginTop: 4,
                    marginRight: 5,
                    flexShrink: 0
                  }} />
                  <RichTextPdf
                    text={textStr}
                    style={{ flex: 1, fontSize: fontSizes.list, color: colors.textColor, lineHeight: spacing.lineHeight }}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

export default CVItemPdf;
