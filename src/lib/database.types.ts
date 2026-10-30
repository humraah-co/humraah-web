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
  // Urdu (20261025000001_urdu_content.sql); null until translated.
  name_ur: string | null;
  summary_ur: string | null;
  you_might_enjoy_ur: string | null;
  interests_ur: string[] | null;
  example_programmes_ur: string[] | null;
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
  // Urdu; null until translated. Most university names stay in English.
  name_ur: string | null;
  campuses_note_ur: string | null;
  overview_ur: string | null;
  how_to_apply_ur: string | null;
  required_documents_ur: string[] | null;
  fee_note_ur: string | null;
  admissions_window_ur: string | null;
  admission_test_ur: string | null;
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
  entry_requirements_ur: string | null;
  entry_test_ur: string | null;
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
  // Urdu; null until translated. Names and providers stay in English.
  summary_ur: string | null;
  who_its_for_ur: string | null;
  what_it_covers_ur: string | null;
  how_to_apply_ur: string | null;
  audience_note_ur: string | null;
  deadline_note_ur: string | null;
  covers_ur: string[] | null;
  eligible_areas_ur: string[] | null;
};

export type ScholarshipField = { scholarship_id: string; field_id: string };

export type Resource = Audited & {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: ResourceCategory;
  sort_order: number;
  title_ur: string | null;
  description_ur: string | null;
};

export type GuidanceArticle = Audited & {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body_markdown: string;
  sort_order: number;
  title_ur: string | null;
  summary_ur: string | null;
  body_markdown_ur: string | null;
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
  /** No longer used: read_at and archived_at say where a message stands (20261026000002). */
  handled: boolean;
  created_at: string;
  read_at: string | null;
  read_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
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
      check_contact_rate: {
        Args: { p_ip_hash: string; p_limit?: number; p_window?: string };
        Returns: boolean;
      };
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
      save_field: { Args: { p_id: string | null; p_values: Record<string, unknown> }; Returns: string };
      save_resource: { Args: { p_id: string | null; p_values: Record<string, unknown> }; Returns: string };
      save_guidance_article: {
        Args: { p_id: string | null; p_values: Record<string, unknown> };
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
