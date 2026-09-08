CREATE TABLE IF NOT EXISTS sales_web_service_profiles (
  organization_id UUID PRIMARY KEY REFERENCES sales_organizations(id) ON DELETE CASCADE,
  website_url TEXT,
  service_hypotheses TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ai_query_tested TEXT,
  target_appearing BOOLEAN,
  competitors_appearing TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  website_observation TEXT,
  profile_source TEXT NOT NULL DEFAULT 'ARTICLE6_OBSERVED',
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sales_web_service_profiles_services_check CHECK (
    service_hypotheses <@ ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN']::TEXT[]
  ),
  CONSTRAINT sales_web_service_profiles_source_check CHECK (
    profile_source IN ('PUBLIC_DATA','ARTICLE6_OBSERVED','CLIENT_REPORTED')
  )
);

CREATE INDEX IF NOT EXISTS sales_web_service_profiles_services_idx
  ON sales_web_service_profiles USING GIN (service_hypotheses);

-- UAE GEO sprint: 20 deliberately small, high-value B2B service prospects.
-- All begin NEW. Contacted/engaged status is only set after real outreach/replies.

INSERT INTO sales_organizations (id, name, normalized_name, domain, country, status, notes, do_not_contact, experiment, created_at, updated_at) VALUES
('91000000-0000-4000-8000-000000000001','Al Mahir Machinery','al mahir machinery','almahirmachinery.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000002','IFMEA','ifmea','ifmea.ae','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000003','Habshan Electromechanical Works','habshan electromechanical works','habshanmiddleeast.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000004','Al Warqa Electrical','al warqa electrical','alwarqaelectrical.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000005','I2ST Prime Control Systems','i2st prime control systems','i2stprime.ae','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000006','SERVOMECH UAE','servomech uae','servomechuae.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000007','Pulse Control','pulse control','pulsecontrol.ae','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000008','Quick Electric Industrial Company','quick electric industrial company','quick-electric.co','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000009','Plums and Pearls','plums and pearls','plumsnpearls.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000010','Ailtizam Equipment Repair','ailtizam equipment repair','ailtizamuae.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000011','AZ Engineering','az engineering','azengineering.ae','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000012','Target One Software Design','target one software design','targetoneuae.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000013','Epoch Technical','epoch technical','epochtechnical.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000014','Jizcon Automation Solutions','jizcon automation solutions','jizcon.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000015','TechPro Measuring & Control Systems','techpro measuring & control systems','techprotrading.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000016','CMP Automate','cmp automate','cmpautomate.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000017','Vista Automation','vista automation','vista-automation-me.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000018','CAN Gulf','can gulf','cangulf.net','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000019','Base Control Tech','base control tech','basecontroltech.com','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('91000000-0000-4000-8000-000000000020','General Tech Automation','general tech automation','generaltechautomation.ae','United Arab Emirates','NEW','UAE GEO client acquisition sprint.','false','WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT (normalized_name) DO UPDATE SET
  domain = EXCLUDED.domain,
  country = EXCLUDED.country,
  experiment = 'WEB_SERVICES',
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO sales_contacts (id, organization_id, name, title, email, phone, status, notes, created_at, updated_at) VALUES
('92000000-0000-4000-8000-000000000001',(SELECT id FROM sales_organizations WHERE normalized_name='al mahir machinery'),'Husnain Syed','Sales & Service','info@almahirmachinery.com','+971 52 951 3272','ACTIVE','WhatsApp-only number published by company.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000002',(SELECT id FROM sales_organizations WHERE normalized_name='ifmea'),'General Enquiries','Company contact','info@ifmea.ae','+971 58 915 4300','ACTIVE','Generic company contact; named buyer not yet verified.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000003',(SELECT id FROM sales_organizations WHERE normalized_name='habshan electromechanical works'),'General Enquiries','Company contact','info@habshanmiddleeast.com','+971 50 322 4828','ACTIVE','Generic company contact; named buyer not yet verified.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000004',(SELECT id FROM sales_organizations WHERE normalized_name='al warqa electrical'),'General Enquiries','Company contact','info@alwarqaelectrical.com','+971 50 421 5827','ACTIVE','Generic company contact; named buyer not yet verified.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000005',(SELECT id FROM sales_organizations WHERE normalized_name='i2st prime control systems'),'General Enquiries','Sales','sales@i2stprime.ae','+971 50 478 2174','ACTIVE','WhatsApp number published by company.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000006',(SELECT id FROM sales_organizations WHERE normalized_name='servomech uae'),'General Enquiries','Company contact','info@servomechuae.com','+971 54 409 7896','ACTIVE','WhatsApp number published by company.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000007',(SELECT id FROM sales_organizations WHERE normalized_name='pulse control'),'General Enquiries','Sales','sales@pulsecontrol.ae','+971 55 931 3489','ACTIVE','Generic sales contact; named buyer not yet verified.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000008',(SELECT id FROM sales_organizations WHERE normalized_name='quick electric industrial company'),'Roystan Kiran D''Souza','Sales','adminmgr@quick-electric.co','+971 50 631 5905','ACTIVE','Sales mobile is published as WhatsApp. Email is company administrative contact.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000009',(SELECT id FROM sales_organizations WHERE normalized_name='plums and pearls'),'General Enquiries','Sales','sales@plumsnpearls.com','+971 55 865 2898','ACTIVE','WhatsApp number published by company.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000010',(SELECT id FROM sales_organizations WHERE normalized_name='ailtizam equipment repair'),'General Enquiries','Company contact','info@ailtizamuae.com','+971 56 767 3055','ACTIVE','WhatsApp number published by company.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000011',(SELECT id FROM sales_organizations WHERE normalized_name='az engineering'),'General Enquiries','Sales','sales@azengineering.ae','+971 52 873 6592','ACTIVE','Generic sales contact; named buyer not yet verified.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000012',(SELECT id FROM sales_organizations WHERE normalized_name='target one software design'),'General Enquiries','Services','services@targetoneuae.com','+971 55 926 6082','ACTIVE','WhatsApp number published by company.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000013',(SELECT id FROM sales_organizations WHERE normalized_name='epoch technical'),'General Enquiries','Company contact','info@epochtechnical.com','+971 50 280 6646','ACTIVE','Generic company contact; named buyer not yet verified.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000014',(SELECT id FROM sales_organizations WHERE normalized_name='jizcon automation solutions'),'General Enquiries','Sales','sales@jizcon.com','+971 50 487 8609','ACTIVE','Published company sales/WhatsApp route.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000015',(SELECT id FROM sales_organizations WHERE normalized_name='techpro measuring & control systems'),'General Enquiries','Sales','sales@techprotrading.com','+971 50 470 8893','ACTIVE','Generic sales contact; named buyer not yet verified.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000016',(SELECT id FROM sales_organizations WHERE normalized_name='cmp automate'),'General Enquiries','Company contact','info@cmpautomate.com','+971 55 761 1764','ACTIVE','Generic company contact; named buyer not yet verified.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000017',(SELECT id FROM sales_organizations WHERE normalized_name='vista automation'),'General Enquiries','Company contact','info@vista-automation-me.com','+971 55 354 0948','ACTIVE','Generic company contact; named buyer not yet verified.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000018',(SELECT id FROM sales_organizations WHERE normalized_name='can gulf'),'Hafeez Ullah','Director of Engineering & Sales','marketing@cangulf.com','+971 50 192 5766','ACTIVE','Named engineering/sales director; company site uses cangulf.net while published email uses cangulf.com.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000019',(SELECT id FROM sales_organizations WHERE normalized_name='base control tech'),'General Enquiries','Company contact','info@basecontroltech.com','+971 6 557 9958','ACTIVE','Office contact; direct WhatsApp not established.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('92000000-0000-4000-8000-000000000020',(SELECT id FROM sales_organizations WHERE normalized_name='general tech automation'),'General Enquiries','Company contact','mathews@generaltechuae.com','+971 6 543 6933','ACTIVE','Published company contact; named buyer not yet verified.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT (LOWER(email)) WHERE email IS NOT NULL DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  phone = EXCLUDED.phone,
  notes = EXCLUDED.notes,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO sales_web_service_profiles (organization_id, website_url, service_hypotheses, website_observation, profile_source, last_verified_at, notes) VALUES
((SELECT id FROM sales_organizations WHERE normalized_name='al mahir machinery'),'https://almahirmachinery.com',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Relevant industrial automation capability is present, but fragmented and awkward page structure makes the company harder to understand as a clear specialist.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='ifmea'),'https://ifmea.ae',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Industrial automation is mixed with facilities management, HVAC, plumbing, sustainability and training, weakening service/entity clarity.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='habshan electromechanical works'),'https://habshanmiddleeast.com',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'PLC/VFD capability sits among a very broad electromechanical and civil-service offering, diluting specialist positioning.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='al warqa electrical'),'https://alwarqaelectrical.com',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Relevant PLC/SCADA expertise is present, but dated structure and broad repair content weaken clear buyer-facing specialization.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='i2st prime control systems'),'https://i2stprime.ae',ARRAY['GEO_VISIBILITY'],'Strong underlying control-system capability, but broad service-list positioning leaves room for clearer buyer/problem answerability.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='servomech uae'),'https://servomechuae.com',ARRAY['GEO_VISIBILITY'],'CNC, PLC, VFD, repair and spare-parts services compete for a single clear specialist identity.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='pulse control'),'https://pulsecontrol.ae',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'The site is taxonomy/product oriented rather than structured around the buyer problems and industries the company solves for.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='quick electric industrial company'),'https://quick-electric.co',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Credible project history exists, but dated architecture and weak answer-oriented content hide much of that evidence.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='plums and pearls'),'https://plumsnpearls.com',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Product catalogue content dominates, making high-value automation and service differentiation less obvious.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='ailtizam equipment repair'),'https://ailtizamuae.com',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Broad maintenance and repair positioning makes specialist industrial automation relevance harder to establish.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='az engineering'),'https://azengineering.ae',ARRAY['GEO_VISIBILITY'],'PLC/SCADA services are clear but there is limited buyer-specific differentiation and evidence depth.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='target one software design'),'https://targetoneuae.com',ARRAY['GEO_VISIBILITY'],'Good project evidence exists but is not consistently converted into pages that directly answer buyer-style service queries.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='epoch technical'),'https://epochtechnical.com',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'A broad repair and automation scope creates fuzzy specialization for search and AI systems.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='jizcon automation solutions'),'https://jizcon.com',ARRAY['GEO_VISIBILITY'],'Relatively strong automation positioning; useful as a control lead to test whether GEO visibility alone is compelling.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='techpro measuring & control systems'),'https://techprotrading.com',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Broad categories and generic claims make it harder to establish specific authority for buyer-style automation queries.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='cmp automate'),'https://cmpautomate.com',ARRAY['GEO_VISIBILITY'],'Parts, repair and surplus positioning competes with the company''s automation expertise.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='vista automation'),'https://vista-automation-me.com',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Capable company, but broad leading-provider language and dated presentation reduce specific buyer-answer clarity.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='can gulf'),'https://cangulf.net',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Strong engineering team is visible, but generic claims and inconsistent site signals weaken entity clarity and trust.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='base control tech'),'https://basecontroltech.com',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Long-standing capability is present, but buyer-facing presentation and structure are dated.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.'),
((SELECT id FROM sales_organizations WHERE normalized_name='general tech automation'),'https://generaltechautomation.ae',ARRAY['GEO_VISIBILITY','WEBSITE_REDESIGN'],'Inconsistent service pages and residual placeholder/demo-style content weaken trust and machine understanding.','ARTICLE6_OBSERVED',CURRENT_TIMESTAMP,'Initial UAE cohort.')
ON CONFLICT (organization_id) DO UPDATE SET
  website_url = EXCLUDED.website_url,
  service_hypotheses = EXCLUDED.service_hypotheses,
  website_observation = EXCLUDED.website_observation,
  profile_source = EXCLUDED.profile_source,
  last_verified_at = EXCLUDED.last_verified_at,
  notes = EXCLUDED.notes,
  updated_at = CURRENT_TIMESTAMP;
