import { LogoMark } from "@/components/brand/logo";

/** Centered card used by the login, sign-up and password pages. */
export function AuthCard({ title, description, children, footer }: { title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="bg-muted px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <LogoMark className="mb-4 size-10" />
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
