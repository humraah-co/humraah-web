-- Day 3: the two guidance articles from the Humraah Website Content Pack
-- (draft for website team, 21 October 2026), published as the first copy.
--
-- The content pack marks both as "initial website copy after editorial
-- review and link checking". Wording is kept as supplied; the summary is
-- each article's opening paragraph and the body is the rest.
--
-- On conflict the existing row is left alone, so an article a researcher
-- has since edited in the admin portal is never overwritten.

insert into public.guidance_articles (slug, title, summary, body_markdown, sort_order, status) values
  ('finding-the-right-university', 'Finding the Right University',
   'You do not need to know which university is right for you yet. Start by exploring the subjects you want to study, then find universities that offer programmes in those areas.',
   $md$
## Step 1: Start with the subject
Think about the subjects you enjoy, the problems you like solving, and the kind of work you might want to do in the future. You do not need to have your whole career planned. Use Humraah's field categories to explore possible degree areas, then note the programmes that interest you.

## Step 2: Make a shortlist of universities
Search for universities that offer the programme you are interested in. Consider public and private institutions, location, travel or hostel needs, language of instruction, facilities and the overall cost. The examples on Humraah are starting points, not a ranking or a guarantee that a particular programme is currently offered.

## Step 3: Check recognition
Before applying or paying a fee, check the university and the specific campus on the Higher Education Commission (HEC) website. Some professional degrees also require approval or accreditation from a relevant professional council. For example, check the relevant council's current requirements for medical, dental or engineering programmes. Recognition of a university does not automatically mean every programme or campus has the approval you need.

[HEC recognised campuses](https://www.hec.gov.pk/english/universities/Pages/DAIs/HEC-recognized-Campuses.aspx)

## Step 4: Use official university sources
Search for the university's official undergraduate admissions or programme page. Look for the programme title, eligibility criteria, required subjects and grades, entry test, application deadline, fee structure, scholarship or financial-aid options, and hostel information if you need accommodation. Social media posts and messages can help you discover an opportunity, but confirm the details on an official source.

## Step 5: Compare the full cost
Do not compare universities by tuition alone. Check admission and application fees, semester fees, transport, hostel and food costs, books, equipment and other likely expenses. If the full cost feels out of reach, look for merit scholarships, need-based aid, government schemes, external scholarships and university-specific financial support. Eligibility and availability vary.

## Step 6: Keep a simple research record
For every university, write down the official programme link, eligibility requirements, entry test, deadline, estimated cost, financial-aid link and the date you checked the information. If something is unclear, contact the university's admissions or financial-aid office. Requirements can change between admission cycles, so check again before applying.

> Remember: these are examples to help you explore, not a ranking. The best option depends on your interests, eligibility, circumstances and the support available to you.
$md$, 2, 'published'),

  ('admissions-and-application-guide', 'Admissions and Application Guide for Pakistani Universities',
   'University applications can feel confusing, especially when every institution has its own deadlines and requirements. Use this checklist to organise your next steps. Always follow the current official instructions for the specific university and programme you are applying to.',
   $md$
## 1. Check the university and programme
Confirm that the institution and campus are recognised by HEC, and check whether your chosen professional programme requires approval from a relevant council. Do this before paying an application fee.

## 2. Check eligibility and entry tests
Read the current admission criteria carefully. Universities may set different minimum marks, subject prerequisites, entry tests and selection methods. Depending on the field and institution, you may need a university-specific test or a recognised external test. Do not assume one test or eligibility rule applies everywhere.

## 3. Understand how merit is calculated
Many universities combine school or college marks with an entry-test score to calculate an aggregate or merit score. The weighting is institution- and programme-specific. Use the formula published in the current admission notice or prospectus; do not rely on a general formula shared online.

## 4. Prepare your documents
Commonly requested documents may include Matric/O-Level and Intermediate/A-Level results, certificates or detailed marks sheets, CNIC or B-Form, a parent or guardian's CNIC, a recent photograph, domicile where relevant, and equivalence documents for foreign qualifications. Requirements differ, so use the university's official checklist and prepare any attestations it requests.

## 5. Submit the online application
Use the university's official admission portal. Register with an email address and phone number you can access yourself, complete the form carefully, select the correct programme and test route, upload the required documents, and review the application before submitting. Keep a copy of your application and payment receipt. Pay only through the payment methods listed by the university.

## 6. Track tests, emails and merit lists
Check your email, spam folder and admission portal regularly for test dates, admit cards, document requests, results and merit lists. If selected, follow the offer letter's instructions and deadlines for document verification, fee payment and confirming your seat. Missing a deadline may affect your admission.

## 7. Apply for financial support separately where required
Scholarship or financial-aid forms may have a separate process and deadline. Check whether you must apply during the admission process, after receiving an offer, or through a separate provider. Prepare accurate financial information and supporting documents, and never assume that admission automatically means you will receive financial aid.

## Before you submit: quick checklist
- I checked the university, campus and programme recognition.
- I meet the current eligibility criteria and subject prerequisites.
- I know which entry test is required and its deadline.
- I checked the current merit calculation method.
- My documents and equivalence certificates, if required, are ready.
- I used the official application portal and saved proof of submission and payment.
- I checked the financial-aid process and its separate deadline.

## Official starting points
- [HEC recognised campuses](https://www.hec.gov.pk/english/universities/Pages/DAIs/HEC-recognized-Campuses.aspx)
- [NUST undergraduate programmes](https://nust.edu.pk/admissions/undergraduates/list-of-ug-programmes-and-institutions/)
$md$, 3, 'published')
on conflict (slug) do nothing;
