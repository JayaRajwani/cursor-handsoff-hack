/** Shapes of the rows stored in Supabase (see supabase/migrations). */

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  profession: string | null;
  organization: string | null;
  role: "user" | "admin";
  created_at: string;
};

export type EnrollmentStatus = "pending" | "active" | "rejected";

export type Enrollment = {
  id: string;
  user_id: string;
  course_slug: string;
  status: EnrollmentStatus;
  source: "payment" | "free" | "admin";
  created_at: string;
  approved_at: string | null;
};

export type PaymentStatus = "pending" | "approved" | "rejected";

export type Payment = {
  id: string;
  user_id: string;
  enrollment_id: string | null;
  course_slug: string;
  provider: string;
  method: string;
  amount_pkr: number;
  transaction_id: string;
  payer_name: string | null;
  screenshot_path: string | null;
  status: PaymentStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type Certificate = {
  id: string;
  verification_code: string;
  user_id: string;
  course_slug: string;
  recipient_name: string;
  course_title: string;
  issued_at: string;
};
