-- Seed data from Humraah's Higher Education Guide (English edition).
--
-- Everything here is marked UNVERIFIED (last_verified_at is null). Researchers
-- must check each entry against the official website, add the source link and
-- mark it verified before launch. Fees, deadlines and hostel details are left
-- empty on purpose rather than guessed.

-- ---------------------------------------------------------------------------
-- Fields of study ("Exploring Your Options")
-- ---------------------------------------------------------------------------
insert into public.fields (slug, name, emoji, you_might_enjoy, example_programmes, sort_order, status) values
  ('business-management', 'Business & Management', '💼',
   'Organising, leading, working with people, solving business problems',
   array['Business', 'Finance', 'Economics', 'Marketing', 'Tourism & Hospitality'], 1, 'published'),
  ('engineering', 'Engineering', '⚙️',
   'Maths, science, building or figuring out how things work',
   array['Civil', 'Electrical', 'Mechanical', 'Chemical', 'Environmental'], 2, 'published'),
  ('computing-technology', 'Computing & Technology', '💻',
   'Computers, technology, logic or solving problems',
   array['Computer Science', 'AI', 'Data Science'], 3, 'published'),
  ('medicine-health', 'Medicine & Health', '🩺',
   'Biology, science, helping people, health',
   array['Medicine', 'Nursing', 'Pharmacy', 'Nutrition', 'Public Health'], 4, 'published'),
  ('social-behavioural-sciences', 'Social & Behavioural Sciences', '👥',
   'People, society, relationships, communities',
   array['Psychology', 'Sociology', 'Political Science', 'IR', 'Social Work', 'Gender Studies', 'Criminology'], 5, 'published'),
  ('humanities-languages', 'Humanities & Languages', '📚',
   'Reading, writing, history, languages, big ideas',
   array['English Literature', 'History', 'Philosophy', 'Languages', 'Pakistan Studies', 'Liberal Arts'], 6, 'published'),
  ('arts-design-architecture', 'Arts, Design & Architecture', '🎨',
   'Drawing, creating, designing, visual communication',
   array['Architecture', 'Industrial Design', 'Fine Arts', 'Graphic Design', 'Textile Design', 'Performing Arts'], 7, 'published'),
  ('natural-applied-sciences', 'Natural & Applied Sciences', '🔬',
   'Natural world, experimenting, scientific questions',
   array['Biology', 'Chemistry', 'Physics', 'Maths', 'Biotech', 'Environmental Science', 'Food Science', 'Agriculture'], 8, 'published'),
  ('law', 'Law', '⚖️',
   'Reading, argument, critical thinking, justice',
   array['LLB / Law programmes'], 9, 'published'),
  ('education', 'Education', '🎓',
   'Teaching, helping others learn, working with young people',
   array['Education', 'Educational Studies', 'Early Childhood Education', 'Special Education'], 10, 'published');

-- ---------------------------------------------------------------------------
-- Universities ("Some Pakistani universities you can explore include")
-- These are examples, not a ranking.
-- ---------------------------------------------------------------------------
insert into public.universities
  (slug, name, short_name, city, campuses_note, province, type, women_only, website_url, status)
values
  ('aiou', 'Allama Iqbal Open University', 'AIOU', 'Islamabad', 'Islamabad & other campuses',
   'Islamabad Capital Territory', 'public', false, 'https://www.aiou.edu.pk', 'published'),
  ('qau', 'Quaid-i-Azam University', 'QAU', 'Islamabad', null,
   'Islamabad Capital Territory', 'public', false, 'https://qau.edu.pk', 'published'),
  ('comsats', 'COMSATS University Islamabad', 'COMSATS', 'Islamabad', 'Islamabad & other campuses',
   'Islamabad Capital Territory', 'public', false, 'https://www.comsats.edu.pk', 'published'),
  ('punjab-university', 'University of the Punjab', 'PU', 'Lahore', null,
   'Punjab', 'public', false, 'https://pu.edu.pk', 'published'),
  ('lcwu', 'Lahore College for Women University', 'LCWU', 'Lahore', null,
   'Punjab', 'public', true, 'https://lcwu.edu.pk', 'published'),
  ('uet-lahore', 'University of Engineering & Technology, Lahore', 'UET', 'Lahore', null,
   'Punjab', 'public', false, 'https://www.uet.edu.pk', 'published'),
  ('fast-nuces', 'FAST National University of Computer and Emerging Sciences', 'FAST-NUCES', 'Islamabad',
   'Islamabad & other campuses', 'Islamabad Capital Territory', 'private', false, 'https://www.nu.edu.pk', 'published'),
  ('iba-karachi', 'Institute of Business Administration, Karachi', 'IBA', 'Karachi', null,
   'Sindh', 'public', false, 'https://www.iba.edu.pk', 'published'),
  ('lums', 'Lahore University of Management Sciences', 'LUMS', 'Lahore', null,
   'Punjab', 'private', false, 'https://lums.edu.pk', 'published'),
  ('aku', 'Aga Khan University', 'AKU', 'Karachi', null,
   'Sindh', 'private', false, 'https://www.aku.edu', 'published'),
  ('nust', 'National University of Sciences & Technology', 'NUST', 'Islamabad', 'Islamabad & other campuses',
   'Islamabad Capital Territory', 'public', false, 'https://nust.edu.pk', 'published');

-- A few well-known programmes per university so field ↔ university links work.
-- Researchers complete and verify the full lists in the admin portal.
insert into public.programmes (university_id, field_id, name, sort_order)
select u.id, f.id, p.name, p.ord
from (values
  ('nust', 'computing-technology', 'BS Computer Science', 1),
  ('nust', 'engineering', 'BE Electrical Engineering', 2),
  ('nust', 'business-management', 'BBA', 3),
  ('qau', 'computing-technology', 'BS Computer Science', 1),
  ('qau', 'natural-applied-sciences', 'BS Mathematics', 2),
  ('comsats', 'computing-technology', 'BS Computer Science', 1),
  ('comsats', 'business-management', 'BBA', 2),
  ('punjab-university', 'computing-technology', 'BS Computer Science', 1),
  ('punjab-university', 'law', 'LLB', 2),
  ('lcwu', 'computing-technology', 'BS Computer Science', 1),
  ('lcwu', 'humanities-languages', 'BS English', 2),
  ('uet-lahore', 'engineering', 'BSc Civil Engineering', 1),
  ('uet-lahore', 'engineering', 'BSc Electrical Engineering', 2),
  ('fast-nuces', 'computing-technology', 'BS Computer Science', 1),
  ('fast-nuces', 'computing-technology', 'BS Artificial Intelligence', 2),
  ('iba-karachi', 'business-management', 'BBA', 1),
  ('iba-karachi', 'business-management', 'BS Economics', 2),
  ('lums', 'computing-technology', 'BS Computer Science', 1),
  ('lums', 'business-management', 'BSc Economics', 2),
  ('lums', 'law', 'BA-LL.B', 3),
  ('aku', 'medicine-health', 'MBBS', 1),
  ('aku', 'medicine-health', 'BScN (Nursing)', 2),
  ('aiou', 'education', 'B.Ed', 1)
) as p(uni, field, name, ord)
join public.universities u on u.slug = p.uni
join public.fields f on f.slug = p.field;

-- ---------------------------------------------------------------------------
-- Scholarships ("Some examples you can explore include")
-- ---------------------------------------------------------------------------
insert into public.scholarships
  (slug, name, provider, scope, kind, summary, who_its_for, what_it_covers, eligible_areas, women_only, official_url, status)
values
  ('benazir-undergraduate-scholarship', 'Benazir Undergraduate Scholarship', 'Higher Education Commission (HEC)',
   'pakistan', 'government',
   'For financially deserving students pursuing undergraduate degrees at participating public universities.',
   'Financially deserving undergraduate students at participating public universities. 50% of scholarships are reserved for female students.',
   null, '{}', false, 'https://www.hec.gov.pk', 'published'),
  ('scotland-pakistan-scholarships', 'Scotland Pakistan Scholarships for Young Women & Girls', 'Scottish Government and British Council',
   'pakistan', 'external',
   'For Pakistani women pursuing eligible undergraduate degrees at HEC-recognised universities.',
   'Pakistani women studying eligible undergraduate degrees at HEC-recognised universities.',
   'Depending on the award, support can include tuition fees, hostel costs and travel.',
   array['Education', 'Sustainable Energy', 'Food Security & Agriculture', 'Health Sciences', 'STEM', 'Climate'],
   true, 'https://www.britishcouncil.pk', 'published'),
  ('hec-need-based-scholarships', 'HEC Need-Based Scholarships', 'Higher Education Commission (HEC)',
   'pakistan', 'need',
   'Financial support for students who demonstrate financial need at participating universities.',
   'Students who demonstrate financial need at participating universities.',
   'Support can include tuition and a stipend.', '{}', false, 'https://www.hec.gov.pk', 'published'),
  ('peef', 'Punjab Educational Endowment Fund (PEEF)', 'Punjab Educational Endowment Fund',
   'pakistan', 'government',
   'For talented and financially deserving students, including undergraduate students in Punjab.',
   'Talented and financially deserving students in Punjab. Special-quota scholarships for orphans, children of low-grade government employees, children of divorced mothers, minorities and students with disabilities.',
   null, '{}', false, 'https://www.peef.org.pk', 'published'),
  ('bnu-rahimeen-ahmad-scholarship', 'Rahimeen Ahmad Scholarship Fund', 'Beaconhouse National University',
   'pakistan', 'university',
   'A 100% scholarship for at least one female undergraduate student for a four-year degree.',
   'Female undergraduate students at Beaconhouse National University.',
   '100% scholarship for a four-year degree.', '{}', true, 'https://www.bnu.edu.pk', 'published'),
  ('lums-nop', 'LUMS Financial Aid and National Outreach Programme (NOP)', 'LUMS',
   'pakistan', 'university',
   'Students from across Pakistan can apply if they meet the eligibility criteria.',
   'Students from across Pakistan who meet the eligibility criteria.',
   'NOP students admitted to LUMS can receive fully funded financial support based on need.',
   '{}', false, 'https://lums.edu.pk', 'published');

-- Scotland Pakistan eligible areas mapped to fields of study.
insert into public.scholarship_fields (scholarship_id, field_id)
select s.id, f.id
from public.scholarships s
join public.fields f on f.slug in ('education', 'medicine-health', 'engineering', 'computing-technology', 'natural-applied-sciences')
where s.slug = 'scotland-pakistan-scholarships';

-- ---------------------------------------------------------------------------
-- Resources
-- ---------------------------------------------------------------------------
insert into public.resources (title, description, url, category, sort_order, status) values
  ('Higher Education Commission (HEC)', 'Pakistan''s official body for universities, degree recognition and HEC scholarships.',
   'https://www.hec.gov.pk', 'official', 1, 'published'),
  ('HEC recognised universities and campuses', 'Check that a university or campus is officially recognised before you apply.',
   'https://www.hec.gov.pk/english/universities/pages/recognised.aspx', 'official', 2, 'published');

-- ---------------------------------------------------------------------------
-- Guidance ("How do I research a university?")
-- ---------------------------------------------------------------------------
insert into public.guidance_articles (slug, title, summary, body_markdown, sort_order, status) values
  ('how-to-research-a-university', 'How do I research a university?',
   'Five steps to check a university properly, using official sources.',
   $md$
## 1. Check recognition and choose a university
In Pakistan, HEC keeps an official list of recognised universities and campuses. Use it to find universities in your area, and always check that the institution or campus is on the HEC website before applying.

## 2. Search for the university online
For example: "NUST undergraduate admissions" or "University of the Punjab undergraduate".

## 3. Go to the university's official website
Look for sections such as Undergraduate Programs, Scholarships / Financial Aid, Admissions, Fees and Eligibility.

## 4. Find the programme you are interested in
Read the page carefully. Look for:
- What subjects or grades do I need?
- What is the application deadline?
- What tests or documents are needed?
- How much does it cost?
- Are any scholarships or financial aid available?

## 5. Write down what you find
Don't rely only on TikTok, Instagram, WhatsApp messages or random websites. Use the university's official website for the final answer.
$md$, 1, 'published');
