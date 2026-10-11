import { PostList } from "@/components/blog/post-list";
import { PageHeader } from "@/components/common/page-header";
import { getAllPosts, toPostMeta } from "@/lib/content/blog";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Blog: AI in healthcare, explained for professionals",
  description:
    "Practical guides, safety advice and news on using AI tools in healthcare — written for doctors, nurses, pharmacists and hospital staff.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <>
      <PageHeader
        title="Blog"
        description="Practical guides and safety advice on using AI tools in healthcare."
        breadcrumbs={[{ name: "Blog", href: "/blog" }]}
      />
      <PostList posts={getAllPosts().map(toPostMeta)} />
    </>
  );
}
