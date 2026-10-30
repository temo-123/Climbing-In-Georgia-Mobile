import PageHead from './ui/PageHead';
import SectionTitle from './ui/SectionTitle';

// List pages: the website's `.cg-page-head--list.cg-art-<name>` band (pass
// `art`, same sketch as the matching website list). Without `art` (article
// blocks) it's a plain section title with the rope-and-hold underline.
export default function ArticleListHeaderText({ title, description, art, icon }) {
  if (!art) return <SectionTitle>{title}</SectionTitle>;
  return <PageHead art={art} title={title} lead={description} icon={icon} />;
}
