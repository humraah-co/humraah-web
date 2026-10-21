-- Day 2: columns the Discover pages (Home, Explore, Universities) need.
--
--   fields.interests          chips under "You might enjoy this if you like"
--   universities.need_based_aid   "Financial aid" chip and filter
--   universities.admission_test   quick fact on the university profile
--   scholarships.covers       "Covers" chips on scholarship cards
--   scholarships.audience_note    e.g. "50% for women"
--
-- Existing table grants cover new columns, and row-level security is per row,
-- so no access-rule changes are needed.

alter table public.fields
  add column interests text[] not null default '{}';

alter table public.universities
  add column need_based_aid boolean,
  add column admission_test text;

alter table public.scholarships
  add column covers text[] not null default '{}',
  add column audience_note text;

-- Wording from the Figma designs for the ten starter fields. On a fresh
-- database these match nothing (seed.sql runs afterwards and already has the
-- new wording); on an existing database they bring the seed rows up to date.
update public.fields as f
set summary = v.summary,
    you_might_enjoy = v.enjoy,
    interests = v.interests,
    example_programmes = v.programmes
from (values
  ('business-management',
   'Running organisations, managing money and people, and understanding how markets work.',
   'organising, leading, working with people and solving business problems',
   array['Organising', 'Leading', 'Working with people', 'Business problems'],
   array['Business', 'Finance', 'Economics', 'Marketing', 'Tourism & Hospitality']),
  ('engineering',
   'Using maths and science to design, build and improve the things and systems around us.',
   'maths, science, building or figuring out how things work',
   array['Maths', 'Science', 'Building things', 'How things work'],
   array['Civil', 'Electrical', 'Mechanical', 'Chemical', 'Environmental']),
  ('computing-technology',
   'Using computers, logic and technology to solve problems, from building apps to working with data and AI.',
   'computers, technology, logic or solving problems',
   array['Computers', 'Technology', 'Logic', 'Solving problems'],
   array['Computer Science', 'AI', 'Data Science']),
  ('medicine-health',
   'Caring for people''s health, from treating patients to preventing illness in whole communities.',
   'biology, science, helping people and health',
   array['Biology', 'Science', 'Helping people', 'Health'],
   array['Medicine', 'Nursing', 'Pharmacy', 'Nutrition', 'Public Health']),
  ('social-behavioural-sciences',
   'Understanding how people think and behave, and how societies and communities work.',
   'people, society, relationships and communities',
   array['People', 'Society', 'Relationships', 'Communities'],
   array['Psychology', 'Sociology', 'Political Science', 'IR', 'Social Work', 'Gender Studies', 'Criminology']),
  ('humanities-languages',
   'Exploring ideas, history, literature and languages, and how they shape the way we live.',
   'reading, writing, history, languages and big ideas',
   array['Reading', 'Writing', 'History', 'Languages', 'Big ideas'],
   array['English Literature', 'History', 'Philosophy', 'Languages', 'Pakistan Studies', 'Liberal Arts']),
  ('arts-design-architecture',
   'Creating and designing, from buildings and products to images, fabrics and performances.',
   'drawing, creating, designing and visual communication',
   array['Drawing', 'Creating', 'Designing', 'Visual communication'],
   array['Architecture', 'Industrial Design', 'Fine Arts', 'Graphic Design', 'Textile Design', 'Performing Arts']),
  ('natural-applied-sciences',
   'Studying the natural world through experiments, and using that knowledge to solve real problems.',
   'the natural world, experimenting and scientific questions',
   array['The natural world', 'Experimenting', 'Scientific questions'],
   array['Biology', 'Chemistry', 'Physics', 'Maths', 'Biotech', 'Environmental Science', 'Food Science', 'Agriculture']),
  ('law',
   'Understanding the rules that govern society, and helping people use them to find justice.',
   'reading, argument, critical thinking and justice',
   array['Reading', 'Argument', 'Critical thinking', 'Justice'],
   array['LLB and law programmes']),
  ('education',
   'Helping others learn, from early childhood to adult education, and shaping how teaching works.',
   'teaching, helping others learn and working with young people',
   array['Teaching', 'Helping others learn', 'Working with young people'],
   array['Education', 'Educational Studies', 'Early Childhood Education', 'Special Education'])
) as v(slug, summary, enjoy, interests, programmes)
where f.slug = v.slug;

update public.universities
set campuses_note = replace(campuses_note, ' & other campuses', ' and other campuses')
where campuses_note like '% & other campuses';

update public.scholarships as s
set covers = v.covers, audience_note = v.audience
from (values
  ('benazir-undergraduate-scholarship', array[]::text[], '50% for women'),
  ('scotland-pakistan-scholarships', array['Tuition', 'Hostel and travel'], 'For women'),
  ('hec-need-based-scholarships', array['Tuition', 'Stipend'], null),
  ('bnu-rahimeen-ahmad-scholarship', array['Full tuition'], 'For women'),
  ('lums-nop', array['Need-based support'], null)
) as v(slug, covers, audience)
where s.slug = v.slug;
