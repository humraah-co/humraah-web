-- Urdu for the content published today (fields of study, scholarships,
-- resources, guidance articles and university campus notes), matched by
-- slug (resources by their link). Names of universities, scholarships,
-- programmes and providers stay in English, as do the example programme
-- names on fields of study.
--
-- Each statement fills one cell, and only while it is still empty
-- (coalesce), so running this again never overwrites a correction made
-- later in the editor or through the review sheet. Rows added after today
-- have no Urdu here; their Urdu pages show the English until someone adds it.
--
-- docs/urdu-review.csv is exported from this file (npm run urdu:export);
-- keep one statement per cell in this form so the export can read it.

-- fields
update public.fields set name_ur = coalesce(name_ur, $ur$کاروبار اور مینجمنٹ$ur$) where slug = 'business-management';
update public.fields set summary_ur = coalesce(summary_ur, $ur$اداروں کو چلانا، پیسے اور لوگوں کا انتظام کرنا، اور یہ سمجھنا کہ بازار کیسے کام کرتے ہیں۔$ur$) where slug = 'business-management';
update public.fields set you_might_enjoy_ur = coalesce(you_might_enjoy_ur, $ur$انتظام کرنا، قیادت کرنا، لوگوں کے ساتھ کام کرنا اور کاروباری مسئلے حل کرنا$ur$) where slug = 'business-management';
update public.fields set interests_ur = coalesce(interests_ur, array[$ur$انتظام کرنا$ur$, $ur$قیادت$ur$, $ur$لوگوں کے ساتھ کام$ur$, $ur$کاروباری مسئلے$ur$]) where slug = 'business-management';
update public.fields set name_ur = coalesce(name_ur, $ur$انجینئرنگ$ur$) where slug = 'engineering';
update public.fields set summary_ur = coalesce(summary_ur, $ur$ریاضی اور سائنس کی مدد سے اپنے آس پاس کی چیزیں اور نظام ڈیزائن کرنا، بنانا اور بہتر کرنا۔$ur$) where slug = 'engineering';
update public.fields set you_might_enjoy_ur = coalesce(you_might_enjoy_ur, $ur$ریاضی، سائنس، چیزیں بنانا یا یہ سمجھنا کہ چیزیں کیسے کام کرتی ہیں$ur$) where slug = 'engineering';
update public.fields set interests_ur = coalesce(interests_ur, array[$ur$ریاضی$ur$, $ur$سائنس$ur$, $ur$چیزیں بنانا$ur$, $ur$چیزیں کیسے کام کرتی ہیں$ur$]) where slug = 'engineering';
update public.fields set name_ur = coalesce(name_ur, $ur$کمپیوٹنگ اور ٹیکنالوجی$ur$) where slug = 'computing-technology';
update public.fields set summary_ur = coalesce(summary_ur, $ur$کمپیوٹر، منطق اور ٹیکنالوجی سے مسئلے حل کرنا، ایپس بنانے سے لے کر ڈیٹا اور AI پر کام تک۔$ur$) where slug = 'computing-technology';
update public.fields set you_might_enjoy_ur = coalesce(you_might_enjoy_ur, $ur$کمپیوٹر، ٹیکنالوجی، منطق یا مسئلے حل کرنا$ur$) where slug = 'computing-technology';
update public.fields set interests_ur = coalesce(interests_ur, array[$ur$کمپیوٹر$ur$, $ur$ٹیکنالوجی$ur$, $ur$منطق$ur$, $ur$مسئلے حل کرنا$ur$]) where slug = 'computing-technology';
update public.fields set name_ur = coalesce(name_ur, $ur$طب اور صحت$ur$) where slug = 'medicine-health';
update public.fields set summary_ur = coalesce(summary_ur, $ur$لوگوں کی صحت کا خیال رکھنا، مریضوں کے علاج سے لے کر پوری کمیونٹی کو بیماریوں سے بچانے تک۔$ur$) where slug = 'medicine-health';
update public.fields set you_might_enjoy_ur = coalesce(you_might_enjoy_ur, $ur$بیالوجی، سائنس، لوگوں کی مدد اور صحت$ur$) where slug = 'medicine-health';
update public.fields set interests_ur = coalesce(interests_ur, array[$ur$بیالوجی$ur$, $ur$سائنس$ur$, $ur$لوگوں کی مدد$ur$, $ur$صحت$ur$]) where slug = 'medicine-health';
update public.fields set name_ur = coalesce(name_ur, $ur$سماجی اور رویّوں کے علوم$ur$) where slug = 'social-behavioural-sciences';
update public.fields set summary_ur = coalesce(summary_ur, $ur$یہ سمجھنا کہ لوگ کیسے سوچتے اور برتاؤ کرتے ہیں، اور معاشرے اور کمیونٹیز کیسے چلتی ہیں۔$ur$) where slug = 'social-behavioural-sciences';
update public.fields set you_might_enjoy_ur = coalesce(you_might_enjoy_ur, $ur$لوگ، معاشرہ، رشتے اور کمیونٹیز$ur$) where slug = 'social-behavioural-sciences';
update public.fields set interests_ur = coalesce(interests_ur, array[$ur$لوگ$ur$, $ur$معاشرہ$ur$, $ur$رشتے$ur$, $ur$کمیونٹیز$ur$]) where slug = 'social-behavioural-sciences';
update public.fields set name_ur = coalesce(name_ur, $ur$ہیومینٹیز اور زبانیں$ur$) where slug = 'humanities-languages';
update public.fields set summary_ur = coalesce(summary_ur, $ur$خیالات، تاریخ، ادب اور زبانوں کو جاننا، اور یہ کہ یہ ہماری زندگی کو کیسے بناتے ہیں۔$ur$) where slug = 'humanities-languages';
update public.fields set you_might_enjoy_ur = coalesce(you_might_enjoy_ur, $ur$پڑھنا، لکھنا، تاریخ، زبانیں اور بڑے خیالات$ur$) where slug = 'humanities-languages';
update public.fields set interests_ur = coalesce(interests_ur, array[$ur$پڑھنا$ur$, $ur$لکھنا$ur$, $ur$تاریخ$ur$, $ur$زبانیں$ur$, $ur$بڑے خیالات$ur$]) where slug = 'humanities-languages';
update public.fields set name_ur = coalesce(name_ur, $ur$آرٹ، ڈیزائن اور آرکیٹیکچر$ur$) where slug = 'arts-design-architecture';
update public.fields set summary_ur = coalesce(summary_ur, $ur$تخلیق اور ڈیزائن، عمارتوں اور چیزوں سے لے کر تصویروں، کپڑوں اور پرفارمنس تک۔$ur$) where slug = 'arts-design-architecture';
update public.fields set you_might_enjoy_ur = coalesce(you_might_enjoy_ur, $ur$ڈرائنگ، تخلیق، ڈیزائن اور تصویروں کے ذریعے بات کہنا$ur$) where slug = 'arts-design-architecture';
update public.fields set interests_ur = coalesce(interests_ur, array[$ur$ڈرائنگ$ur$, $ur$تخلیق$ur$, $ur$ڈیزائن$ur$, $ur$تصویروں سے بات کہنا$ur$]) where slug = 'arts-design-architecture';
update public.fields set name_ur = coalesce(name_ur, $ur$قدرتی اور اطلاقی سائنس$ur$) where slug = 'natural-applied-sciences';
update public.fields set summary_ur = coalesce(summary_ur, $ur$تجربات کے ذریعے قدرتی دنیا کو سمجھنا، اور اس علم سے اصل مسئلے حل کرنا۔$ur$) where slug = 'natural-applied-sciences';
update public.fields set you_might_enjoy_ur = coalesce(you_might_enjoy_ur, $ur$قدرتی دنیا، تجربات اور سائنسی سوالات$ur$) where slug = 'natural-applied-sciences';
update public.fields set interests_ur = coalesce(interests_ur, array[$ur$قدرتی دنیا$ur$, $ur$تجربات$ur$, $ur$سائنسی سوالات$ur$]) where slug = 'natural-applied-sciences';
update public.fields set name_ur = coalesce(name_ur, $ur$قانون$ur$) where slug = 'law';
update public.fields set summary_ur = coalesce(summary_ur, $ur$ان قوانین کو سمجھنا جن سے معاشرہ چلتا ہے، اور لوگوں کو انصاف حاصل کرنے میں مدد دینا۔$ur$) where slug = 'law';
update public.fields set you_might_enjoy_ur = coalesce(you_might_enjoy_ur, $ur$پڑھنا، دلیل دینا، گہرائی سے سوچنا اور انصاف$ur$) where slug = 'law';
update public.fields set interests_ur = coalesce(interests_ur, array[$ur$پڑھنا$ur$, $ur$دلیل$ur$, $ur$گہرائی سے سوچنا$ur$, $ur$انصاف$ur$]) where slug = 'law';
update public.fields set name_ur = coalesce(name_ur, $ur$تعلیم$ur$) where slug = 'education';
update public.fields set summary_ur = coalesce(summary_ur, $ur$دوسروں کو سکھانے میں مدد دینا، بچپن سے لے کر بڑوں کی تعلیم تک، اور پڑھانے کے طریقے بہتر بنانا۔$ur$) where slug = 'education';
update public.fields set you_might_enjoy_ur = coalesce(you_might_enjoy_ur, $ur$پڑھانا، دوسروں کو سکھانا اور نوجوانوں کے ساتھ کام کرنا$ur$) where slug = 'education';
update public.fields set interests_ur = coalesce(interests_ur, array[$ur$پڑھانا$ur$, $ur$دوسروں کو سکھانا$ur$, $ur$نوجوانوں کے ساتھ کام$ur$]) where slug = 'education';

-- universities
update public.universities set campuses_note_ur = coalesce(campuses_note_ur, $ur$اسلام آباد اور دوسرے کیمپس$ur$) where slug = 'aiou';
update public.universities set campuses_note_ur = coalesce(campuses_note_ur, $ur$اسلام آباد اور دوسرے کیمپس$ur$) where slug = 'comsats';
update public.universities set campuses_note_ur = coalesce(campuses_note_ur, $ur$اسلام آباد اور دوسرے کیمپس$ur$) where slug = 'fast-nuces';
update public.universities set campuses_note_ur = coalesce(campuses_note_ur, $ur$اسلام آباد اور دوسرے کیمپس$ur$) where slug = 'nust';

-- scholarships
update public.scholarships set summary_ur = coalesce(summary_ur, $ur$شامل سرکاری یونیورسٹیوں میں انڈرگریجویٹ ڈگری کرنے والے ضرورت مند طلبہ کے لیے۔$ur$) where slug = 'benazir-undergraduate-scholarship';
update public.scholarships set who_its_for_ur = coalesce(who_its_for_ur, $ur$شامل سرکاری یونیورسٹیوں کے ضرورت مند انڈرگریجویٹ طلبہ۔ 50 فیصد اسکالرشپس طالبات کے لیے مخصوص ہیں۔$ur$) where slug = 'benazir-undergraduate-scholarship';
update public.scholarships set audience_note_ur = coalesce(audience_note_ur, $ur$50 فیصد خواتین کے لیے$ur$) where slug = 'benazir-undergraduate-scholarship';
update public.scholarships set summary_ur = coalesce(summary_ur, $ur$شامل یونیورسٹیوں میں ان طلبہ کے لیے مالی مدد جو یہ دکھا سکیں کہ انہیں مالی ضرورت ہے۔$ur$) where slug = 'hec-need-based-scholarships';
update public.scholarships set who_its_for_ur = coalesce(who_its_for_ur, $ur$شامل یونیورسٹیوں کے وہ طلبہ جو اپنی مالی ضرورت ثابت کر سکیں۔$ur$) where slug = 'hec-need-based-scholarships';
update public.scholarships set what_it_covers_ur = coalesce(what_it_covers_ur, $ur$اس مدد میں ٹیوشن فیس اور ماہانہ وظیفہ شامل ہو سکتا ہے۔$ur$) where slug = 'hec-need-based-scholarships';
update public.scholarships set covers_ur = coalesce(covers_ur, array[$ur$ٹیوشن$ur$, $ur$ماہانہ وظیفہ$ur$]) where slug = 'hec-need-based-scholarships';
update public.scholarships set summary_ur = coalesce(summary_ur, $ur$پاکستان بھر سے طلبہ اپلائی کر سکتے ہیں، اگر وہ اہلیت کی شرائط پوری کرتے ہوں۔$ur$) where slug = 'lums-nop';
update public.scholarships set who_its_for_ur = coalesce(who_its_for_ur, $ur$پاکستان بھر کے وہ طلبہ جو اہلیت کی شرائط پوری کرتے ہوں۔$ur$) where slug = 'lums-nop';
update public.scholarships set what_it_covers_ur = coalesce(what_it_covers_ur, $ur$LUMS میں داخلہ پانے والے NOP طلبہ کو ضرورت کی بنیاد پر مکمل مالی مدد مل سکتی ہے۔$ur$) where slug = 'lums-nop';
update public.scholarships set covers_ur = coalesce(covers_ur, array[$ur$ضرورت کی بنیاد پر مدد$ur$]) where slug = 'lums-nop';
update public.scholarships set summary_ur = coalesce(summary_ur, $ur$پنجاب کے ذہین اور ضرورت مند طلبہ کے لیے، بشمول انڈرگریجویٹ طلبہ۔$ur$) where slug = 'peef';
update public.scholarships set who_its_for_ur = coalesce(who_its_for_ur, $ur$پنجاب کے ذہین اور ضرورت مند طلبہ۔ یتیموں، کم گریڈ کے سرکاری ملازمین کے بچوں، طلاق یافتہ ماؤں کے بچوں، اقلیتوں اور معذور طلبہ کے لیے خصوصی کوٹے کی اسکالرشپس بھی ہیں۔$ur$) where slug = 'peef';
update public.scholarships set summary_ur = coalesce(summary_ur, $ur$کم از کم ایک انڈرگریجویٹ طالبہ کے لیے چار سالہ ڈگری کی 100 فیصد اسکالرشپ۔$ur$) where slug = 'bnu-rahimeen-ahmad-scholarship';
update public.scholarships set who_its_for_ur = coalesce(who_its_for_ur, $ur$Beaconhouse National University کی انڈرگریجویٹ طالبات۔$ur$) where slug = 'bnu-rahimeen-ahmad-scholarship';
update public.scholarships set what_it_covers_ur = coalesce(what_it_covers_ur, $ur$چار سالہ ڈگری کے لیے 100 فیصد اسکالرشپ۔$ur$) where slug = 'bnu-rahimeen-ahmad-scholarship';
update public.scholarships set audience_note_ur = coalesce(audience_note_ur, $ur$خواتین کے لیے$ur$) where slug = 'bnu-rahimeen-ahmad-scholarship';
update public.scholarships set covers_ur = coalesce(covers_ur, array[$ur$پوری ٹیوشن$ur$]) where slug = 'bnu-rahimeen-ahmad-scholarship';
update public.scholarships set summary_ur = coalesce(summary_ur, $ur$HEC سے تسلیم شدہ یونیورسٹیوں میں اہل انڈرگریجویٹ ڈگری کرنے والی پاکستانی خواتین کے لیے۔$ur$) where slug = 'scotland-pakistan-scholarships';
update public.scholarships set who_its_for_ur = coalesce(who_its_for_ur, $ur$HEC سے تسلیم شدہ یونیورسٹیوں میں اہل انڈرگریجویٹ ڈگری کرنے والی پاکستانی خواتین۔$ur$) where slug = 'scotland-pakistan-scholarships';
update public.scholarships set what_it_covers_ur = coalesce(what_it_covers_ur, $ur$اسکالرشپ کے لحاظ سے اس میں ٹیوشن فیس، ہاسٹل اور سفر کا خرچ شامل ہو سکتا ہے۔$ur$) where slug = 'scotland-pakistan-scholarships';
update public.scholarships set audience_note_ur = coalesce(audience_note_ur, $ur$خواتین کے لیے$ur$) where slug = 'scotland-pakistan-scholarships';
update public.scholarships set covers_ur = coalesce(covers_ur, array[$ur$ٹیوشن$ur$, $ur$ہاسٹل اور سفر$ur$]) where slug = 'scotland-pakistan-scholarships';
update public.scholarships set eligible_areas_ur = coalesce(eligible_areas_ur, array[$ur$تعلیم$ur$, $ur$پائیدار توانائی$ur$, $ur$غذائی تحفظ اور زراعت$ur$, $ur$صحت کے علوم$ur$, $ur$STEM$ur$, $ur$موسمیاتی تبدیلی$ur$]) where slug = 'scotland-pakistan-scholarships';

-- resources
update public.resources set title_ur = coalesce(title_ur, $ur$ہائر ایجوکیشن کمیشن (HEC)$ur$) where url = 'https://www.hec.gov.pk';
update public.resources set description_ur = coalesce(description_ur, $ur$پاکستان میں یونیورسٹیوں، ڈگریوں کی تصدیق اور HEC اسکالرشپس کا آفیشل ادارہ۔$ur$) where url = 'https://www.hec.gov.pk';
update public.resources set title_ur = coalesce(title_ur, $ur$HEC سے تسلیم شدہ یونیورسٹیاں اور کیمپس$ur$) where url = 'https://www.hec.gov.pk/english/universities/pages/recognised.aspx';
update public.resources set description_ur = coalesce(description_ur, $ur$اپلائی کرنے سے پہلے دیکھ لیں کہ یونیورسٹی یا کیمپس آفیشل طور پر تسلیم شدہ ہے۔$ur$) where url = 'https://www.hec.gov.pk/english/universities/pages/recognised.aspx';

-- guidance_articles
update public.guidance_articles set title_ur = coalesce(title_ur, $ur$یونیورسٹی کے بارے میں معلومات کیسے حاصل کریں؟$ur$) where slug = 'how-to-research-a-university';
update public.guidance_articles set summary_ur = coalesce(summary_ur, $ur$آفیشل ذرائع کی مدد سے کسی یونیورسٹی کو اچھی طرح جانچنے کے پانچ قدم۔$ur$) where slug = 'how-to-research-a-university';
update public.guidance_articles set body_markdown_ur = coalesce(body_markdown_ur, $ur$
## 1. تسلیم شدہ ہونا دیکھیں اور یونیورسٹی چنیں
پاکستان میں HEC تسلیم شدہ یونیورسٹیوں اور کیمپسز کی ایک آفیشل فہرست رکھتا ہے۔ اسے استعمال کر کے اپنے علاقے کی یونیورسٹیاں تلاش کریں، اور اپلائی کرنے سے پہلے ہمیشہ دیکھ لیں کہ ادارہ یا کیمپس HEC کی ویب سائٹ پر موجود ہے۔

## 2. یونیورسٹی کو آن لائن تلاش کریں
مثال کے طور پر: "NUST undergraduate admissions" یا "University of the Punjab undergraduate"۔

## 3. یونیورسٹی کی آفیشل ویب سائٹ پر جائیں
Undergraduate Programs، Scholarships / Financial Aid، Admissions، Fees اور Eligibility جیسے حصے تلاش کریں۔

## 4. وہ پروگرام تلاش کریں جس میں آپ کی دلچسپی ہے
صفحہ غور سے پڑھیں۔ یہ باتیں دیکھیں:
- مجھے کون سے مضامین یا نمبر چاہییں؟
- اپلائی کرنے کی آخری تاریخ کیا ہے؟
- کون سے ٹیسٹ یا کاغذات ضروری ہیں؟
- اس پر کتنا خرچ آئے گا؟
- کیا کوئی اسکالرشپ یا مالی مدد مل سکتی ہے؟

## 5. جو معلوم ہو، لکھ لیں
صرف ٹک ٹاک، انسٹاگرام، واٹس ایپ پیغامات یا کسی بھی ویب سائٹ پر بھروسہ نہ کریں۔ آخری جواب کے لیے یونیورسٹی کی آفیشل ویب سائٹ دیکھیں۔
$ur$) where slug = 'how-to-research-a-university';
update public.guidance_articles set title_ur = coalesce(title_ur, $ur$صحیح یونیورسٹی کی تلاش$ur$) where slug = 'finding-the-right-university';
update public.guidance_articles set summary_ur = coalesce(summary_ur, $ur$ابھی یہ جاننا ضروری نہیں کہ کون سی یونیورسٹی آپ کے لیے صحیح ہے۔ پہلے وہ مضامین دیکھیں جو آپ پڑھنا چاہتی ہیں، پھر وہ یونیورسٹیاں تلاش کریں جو ان شعبوں میں پروگرام پیش کرتی ہیں۔$ur$) where slug = 'finding-the-right-university';
update public.guidance_articles set body_markdown_ur = coalesce(body_markdown_ur, $ur$
## قدم 1: مضمون سے شروع کریں
سوچیں کہ آپ کو کون سے مضامین اچھے لگتے ہیں، کون سے مسئلے حل کرنا پسند ہے، اور آگے چل کر آپ کس طرح کا کام کرنا چاہیں گی۔ پورے کیریئر کا منصوبہ ابھی سے بنانا ضروری نہیں۔ ممکنہ ڈگریوں کے شعبے دیکھنے کے لیے ہمراہ کے شعبے استعمال کریں، اور جو پروگرام آپ کو دلچسپ لگیں انہیں نوٹ کر لیں۔

## قدم 2: یونیورسٹیوں کی مختصر فہرست بنائیں
وہ یونیورسٹیاں تلاش کریں جو آپ کی پسند کا پروگرام پیش کرتی ہیں۔ سرکاری اور نجی ادارے، جگہ، سفر یا ہاسٹل کی ضرورت، پڑھائی کی زبان، سہولیات اور کُل خرچ، سب پر غور کریں۔ ہمراہ پر دی گئی مثالیں صرف شروعات ہیں؛ یہ نہ کوئی درجہ بندی ہے اور نہ اس بات کی ضمانت کہ کوئی پروگرام اس وقت پیش کیا جا رہا ہے۔

## قدم 3: تسلیم شدہ ہونا دیکھیں
اپلائی کرنے یا کوئی فیس دینے سے پہلے ہائر ایجوکیشن کمیشن (HEC) کی ویب سائٹ پر یونیورسٹی اور اس کا خاص کیمپس ضرور دیکھیں۔ کچھ پیشہ ورانہ ڈگریوں کے لیے متعلقہ پروفیشنل کونسل کی منظوری بھی ضروری ہوتی ہے۔ مثلاً میڈیکل، ڈینٹل یا انجینئرنگ پروگراموں کے لیے متعلقہ کونسل کی موجودہ شرائط دیکھیں۔ یونیورسٹی کا تسلیم شدہ ہونا اس بات کی ضمانت نہیں کہ ہر پروگرام یا کیمپس کے پاس وہ منظوری ہے جو آپ کو چاہیے۔

[HEC سے تسلیم شدہ کیمپس](https://www.hec.gov.pk/english/universities/Pages/DAIs/HEC-recognized-Campuses.aspx)

## قدم 4: یونیورسٹی کے آفیشل ذرائع استعمال کریں
یونیورسٹی کا آفیشل انڈرگریجویٹ داخلے یا پروگرام کا صفحہ تلاش کریں۔ اس میں پروگرام کا نام، اہلیت کی شرائط، ضروری مضامین اور نمبر، داخلہ ٹیسٹ، آخری تاریخ، فیس کا ڈھانچہ، اسکالرشپ یا مالی مدد کے طریقے، اور اگر رہائش چاہیے تو ہاسٹل کی معلومات دیکھیں۔ سوشل میڈیا کی پوسٹس اور پیغامات سے کسی موقع کا پتا چل سکتا ہے، لیکن تفصیلات کسی آفیشل ذریعے سے ہی تصدیق کریں۔

## قدم 5: پورا خرچ ملا کر دیکھیں
یونیورسٹیوں کا موازنہ صرف ٹیوشن فیس سے نہ کریں۔ داخلے اور درخواست کی فیس، سمسٹر فیس، آنے جانے کا خرچ، ہاسٹل اور کھانے کا خرچ، کتابیں، سامان اور دوسرے ممکنہ اخراجات بھی دیکھیں۔ اگر پورا خرچ پہنچ سے باہر لگے تو میرٹ اسکالرشپس، ضرورت کی بنیاد پر مدد، سرکاری اسکیمیں، بیرونی اسکالرشپس اور یونیورسٹی کی اپنی مالی مدد تلاش کریں۔ اہلیت اور دستیابی الگ الگ ہوتی ہے۔

## قدم 6: اپنی تحقیق کا آسان ریکارڈ رکھیں
ہر یونیورسٹی کے لیے آفیشل پروگرام کا لنک، اہلیت کی شرائط، داخلہ ٹیسٹ، آخری تاریخ، اندازاً خرچ، مالی مدد کا لنک اور وہ تاریخ لکھ لیں جب آپ نے یہ معلومات دیکھیں۔ اگر کوئی بات واضح نہ ہو تو یونیورسٹی کے داخلہ یا مالی مدد کے دفتر سے رابطہ کریں۔ شرائط ہر داخلے کے سال بدل سکتی ہیں، اس لیے اپلائی کرنے سے پہلے دوبارہ دیکھ لیں۔

> یاد رکھیں: یہ مثالیں آپ کو راستے دکھانے کے لیے ہیں، کوئی درجہ بندی نہیں۔ آپ کے لیے بہترین راستہ آپ کی دلچسپیوں، اہلیت، حالات اور آپ کو ملنے والی مدد پر منحصر ہے۔
$ur$) where slug = 'finding-the-right-university';
update public.guidance_articles set title_ur = coalesce(title_ur, $ur$پاکستانی یونیورسٹیوں میں داخلے اور درخواست کی گائیڈ$ur$) where slug = 'admissions-and-application-guide';
update public.guidance_articles set summary_ur = coalesce(summary_ur, $ur$یونیورسٹی میں اپلائی کرنا الجھا ہوا لگ سکتا ہے، خاص طور پر جب ہر ادارے کی اپنی آخری تاریخیں اور شرائط ہوں۔ اپنے اگلے قدم ترتیب دینے کے لیے یہ چیک لسٹ استعمال کریں۔ جس یونیورسٹی اور پروگرام میں آپ اپلائی کر رہی ہیں، ہمیشہ اس کی موجودہ آفیشل ہدایات پر عمل کریں۔$ur$) where slug = 'admissions-and-application-guide';
update public.guidance_articles set body_markdown_ur = coalesce(body_markdown_ur, $ur$
## 1. یونیورسٹی اور پروگرام کو جانچیں
تصدیق کریں کہ ادارہ اور کیمپس HEC سے تسلیم شدہ ہیں، اور یہ بھی دیکھیں کہ آپ کے چنے ہوئے پیشہ ورانہ پروگرام کو کسی متعلقہ کونسل کی منظوری چاہیے یا نہیں۔ یہ کام درخواست کی فیس دینے سے پہلے کریں۔

## 2. اہلیت اور داخلہ ٹیسٹ دیکھیں
داخلے کی موجودہ شرائط غور سے پڑھیں۔ یونیورسٹیاں کم از کم نمبر، ضروری مضامین، داخلہ ٹیسٹ اور انتخاب کے طریقے الگ الگ رکھ سکتی ہیں۔ شعبے اور ادارے کے لحاظ سے آپ کو یونیورسٹی کا اپنا ٹیسٹ یا کوئی تسلیم شدہ بیرونی ٹیسٹ دینا پڑ سکتا ہے۔ یہ نہ سمجھیں کہ ایک ہی ٹیسٹ یا ایک ہی شرط ہر جگہ لاگو ہوتی ہے۔

## 3. سمجھیں کہ میرٹ کیسے بنتا ہے
بہت سی یونیورسٹیاں اسکول یا کالج کے نمبروں کو داخلہ ٹیسٹ کے اسکور کے ساتھ ملا کر ایگریگیٹ یا میرٹ اسکور بناتی ہیں۔ کس چیز کا کتنا وزن ہے، یہ ہر ادارے اور پروگرام کا الگ ہوتا ہے۔ موجودہ داخلہ نوٹس یا پراسپیکٹس میں دیا گیا فارمولا استعمال کریں؛ آن لائن شیئر کیے گئے کسی عام فارمولے پر بھروسہ نہ کریں۔

## 4. اپنے کاغذات تیار کریں
عام طور پر مانگے جانے والے کاغذات میں میٹرک/O-Level اور انٹرمیڈیٹ/A-Level کے رزلٹ، سرٹیفکیٹ یا تفصیلی مارک شیٹس، CNIC یا B-Form، والدین یا سرپرست کا CNIC، حالیہ تصویر، ضرورت ہو تو ڈومیسائل، اور غیر ملکی تعلیم کے لیے مساوی ہونے (equivalence) کے کاغذات شامل ہو سکتے ہیں۔ شرائط الگ الگ ہوتی ہیں، اس لیے یونیورسٹی کی آفیشل چیک لسٹ استعمال کریں اور جو تصدیقیں (attestation) مانگی جائیں وہ تیار رکھیں۔

## 5. آن لائن درخواست جمع کروائیں
یونیورسٹی کا آفیشل داخلہ پورٹل استعمال کریں۔ ایسے ای میل اور فون نمبر سے رجسٹر کریں جن تک آپ کی خود رسائی ہو، فارم احتیاط سے بھریں، صحیح پروگرام اور ٹیسٹ کا راستہ چنیں، ضروری کاغذات اپ لوڈ کریں، اور جمع کروانے سے پہلے درخواست ایک بار پھر دیکھ لیں۔ اپنی درخواست اور ادائیگی کی رسید کی کاپی رکھیں۔ ادائیگی صرف انہی طریقوں سے کریں جو یونیورسٹی نے بتائے ہوں۔

## 6. ٹیسٹ، ای میلز اور میرٹ لسٹوں پر نظر رکھیں
ٹیسٹ کی تاریخوں، ایڈمٹ کارڈ، کاغذات کی درخواستوں، رزلٹ اور میرٹ لسٹوں کے لیے اپنا ای میل، اسپیم فولڈر اور داخلہ پورٹل باقاعدگی سے دیکھتی رہیں۔ اگر آپ کا انتخاب ہو جائے تو کاغذات کی تصدیق، فیس کی ادائیگی اور سیٹ پکی کرنے کے لیے آفر لیٹر کی ہدایات اور آخری تاریخوں پر عمل کریں۔ کوئی آخری تاریخ گزر جائے تو آپ کا داخلہ متاثر ہو سکتا ہے۔

## 7. جہاں ضروری ہو، مالی مدد کے لیے الگ سے اپلائی کریں
اسکالرشپ یا مالی مدد کے فارم کا طریقہ اور آخری تاریخ الگ ہو سکتی ہے۔ دیکھیں کہ آپ کو داخلے کے دوران اپلائی کرنا ہے، آفر ملنے کے بعد، یا کسی الگ ادارے کے ذریعے۔ درست مالی معلومات اور ان کے ثبوت تیار رکھیں، اور یہ کبھی نہ سمجھیں کہ داخلہ ملنے کا مطلب ہے کہ مالی مدد بھی ضرور ملے گی۔

## جمع کروانے سے پہلے: مختصر چیک لسٹ
- میں نے یونیورسٹی، کیمپس اور پروگرام کا تسلیم شدہ ہونا دیکھ لیا ہے۔
- میں اہلیت کی موجودہ شرائط اور ضروری مضامین پوری کرتی ہوں۔
- مجھے معلوم ہے کہ کون سا داخلہ ٹیسٹ ضروری ہے اور اس کی آخری تاریخ کیا ہے۔
- میں نے میرٹ بنانے کا موجودہ طریقہ دیکھ لیا ہے۔
- میرے کاغذات، اور ضرورت ہو تو مساوی ہونے کے سرٹیفکیٹ، تیار ہیں۔
- میں نے آفیشل درخواست پورٹل استعمال کیا اور جمع کروانے اور ادائیگی کا ثبوت محفوظ کر لیا۔
- میں نے مالی مدد کا طریقہ اور اس کی الگ آخری تاریخ دیکھ لی ہے۔

## آفیشل ذرائع سے شروعات
- [HEC سے تسلیم شدہ کیمپس](https://www.hec.gov.pk/english/universities/Pages/DAIs/HEC-recognized-Campuses.aspx)
- [NUST کے انڈرگریجویٹ پروگرام](https://nust.edu.pk/admissions/undergraduates/list-of-ug-programmes-and-institutions/)
$ur$) where slug = 'admissions-and-application-guide';
