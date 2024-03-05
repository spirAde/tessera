import {
  ProjectPageStructureMetaItemProps,
  ProjectPageStructureMetaProps,
  ProjectPageStructureSeoProps,
} from '../../sdk/platform/types';

export function getHelmetComponent({
  url,
  seo,
  meta,
}: {
  url: string;
  seo: ProjectPageStructureSeoProps;
  meta: ProjectPageStructureMetaProps;
}): string {
  const tags = adjustMetaTags(meta).map(
    (tag) => `<meta name="${tag.name}" content="${tag.content}" property="${tag.property}" />`,
  );

  return `
    <Helmet>
      <title>${seo.title}</title>
      <link rel="canonical" href="${url}" />
      <meta name="description" content="${seo.description}" />
      <meta name="keywords" content="${seo.keywords}" />
      ${tags}
    </Helmet>
  `;
}

function adjustMetaTags(meta: ProjectPageStructureMetaProps) {
  return (meta.items ?? []).reduce<ProjectPageStructureMetaItemProps[]>((tags, tag) => {
    if (isBotSpecificTag(tag)) {
      return [...tags, { ...tag, content: 'index,follow' }];
    }

    return isValidTag(tag) ? [...tags, tag] : tags;
  }, []);
}

function isBotSpecificTag(tag: ProjectPageStructureMetaItemProps) {
  return (tag.name === 'robots' || tag.name === 'googlebot') && !tag.content;
}

function isValidTag(tag: ProjectPageStructureMetaItemProps) {
  return tag.content || tag.name || tag.property;
}
