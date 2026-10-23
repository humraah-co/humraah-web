/**
 * Database types for supabase-js. Hand-written to match
 * supabase/migrations; once the Supabase CLI is linked, replace with:
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 */

export type ContentStatus = "draft" | "published" | "archived";
export type TeamRole = "researcher" | "admin" | "owner";
export type MemberStatus = "invited" | "active" | "suspended";
export type UniversityType = "public" | "private";
export type ScholarshipScope = "pakistan" | "international";
export type ScholarshipKind = "merit" | "need" | "government" | "external" | "university";
export type ResourceCategory = "official" | "scholarships" | "tests" | "guidance";

type Audited = {
  status: ContentStatus;
  source_url: string | null;
  last_verified_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Field = Audited & {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  summary: string | null;
  you_might_enjoy: string | null;
  interests: string[];
  example_programmes: string[];
  sort_order: number;
};

export type University = Audited & {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  city: string;
  campuses_note: string | null;
  province: string | null;
  type: UniversityType | null;
  hec_recognised: boolean;
  women_only: boolean;
  has_hostel: boolean | null;
  website_url: string | null;
  admissions_url: string | null;
  overview: string | null;
  how_to_apply: string | null;
  required_documents: string[];
  fee_min_pkr: number | null;
  fee_max_pkr: number | null;
  fee_note: string | null;
  admissions_window: string | null;
  need_based_aid: boolean | null;
  admission_test: string | null;
};

export type Programme = {
  id: string;
  university_id: string;
  field_id: string | null;
  name: string;
  level: string;
  duration_years: number | null;
  entry_requirements: string | null;
  entry_test: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Scholarship = Audited & {
  id: string;
  slug: string;
  name: string;
  provider: string;
  scope: ScholarshipScope;
  kind: ScholarshipKind;
  summary: string | null;
  who_its_for: string | null;
  what_it_covers: string | null;
  eligible_areas: string[];
  women_only: boolean;
  how_to_apply: string | null;
  deadline: string | null;
  deadline_note: string | null;
  official_url: string | null;
  covers: string[];
  audience_note: string | null;
};

export type ScholarshipField = { scholarship_id: string; field_id: string };

export type Resource = Audited & {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: ResourceCategory;
  sort_order: number;
};

export type GuidanceArticle = Audited & {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body_markdown: string;
  sort_order: number;
};

export type TeamMember = {
  user_id: string;
  email: string;
  full_name: string | null;
  role: TeamRole;
  status: MemberStatus;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLogEntry = {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  created_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  handled: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      fields: Table<Field, "slug" | "name">;
      universities: Table<University, "slug" | "name" | "city">;
      programmes: Table<Programme, "university_id" | "name">;
      scholarships: Table<Scholarship, "slug" | "name" | "provider" | "kind">;
      scholarship_fields: Table<ScholarshipField, "scholarship_id" | "field_id">;
      resources: Table<Resource, "title" | "url" | "category">;
      guidance_articles: Table<GuidanceArticle, "slug" | "title">;
      team_members: Table<TeamMember, "user_id" | "email">;
      activity_log: Table<ActivityLogEntry, "action" | "entity_type">;
      contact_messages: Table<ContactMessage, "name" | "email" | "message">;
    };
    Views: Record<string, never>;
    Functions: {
      current_team_role: { Args: Record<string, never>; Returns: TeamRole | null };
      is_team_member: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_owner: { Args: Record<string, never>; Returns: boolean };
      accept_invite: { Args: { p_full_name: string }; Returns: TeamMember };
      record_invite_resent: { Args: { p_user_id: string }; Returns: undefined };
      save_university: {
        Args: {
          p_id: string | null;
          p_values: Record<string, unknown>;
          p_programmes: Record<string, unknown>[];
        };
        Returns: string;
      };
      save_scholarship: {
        Args: { p_id: string | null; p_values: Record<string, unknown>; p_field_ids: string[] };
        Returns: string;
      };
    };
    Enums: {
      content_status: ContentStatus;
      team_role: TeamRole;
      member_status: MemberStatus;
      university_type: UniversityType;
      scholarship_scope: ScholarshipScope;
      scholarship_kind: ScholarshipKind;
      resource_category: ResourceCategory;
    };
    CompositeTypes: Record<string, never>;
  };
};
