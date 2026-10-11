import type { PostMeta } from "@/lib/content/blog";
import { BlogSidebar } from "./blog-sidebar";
import { PostCard } from "./post-card";

export function PostList({ posts, activeCategory, activeTag }: { posts: PostMeta[]; activeCategory?: string; activeTag?: string }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_260px] lg:px-8">
      <div>
        {posts.length ? (
          <ul className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No articles yet.</p>
        )}
      </div>
      <BlogSidebar activeCategory={activeCategory} activeTag={activeTag} />
    </div>
  );
}
