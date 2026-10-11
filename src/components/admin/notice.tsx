import { Alert, AlertDescription } from "@/components/ui/alert";

/** Shows ?notice= / ?error= messages after an admin action. */
export function AdminNotice({ notice, error }: { notice?: string; error?: string }) {
  if (!notice && !error) return null;
  return (
    <Alert variant={error ? "destructive" : "success"} role={error ? "alert" : "status"} className="mb-6">
      <AlertDescription>{error ?? notice}</AlertDescription>
    </Alert>
  );
}
