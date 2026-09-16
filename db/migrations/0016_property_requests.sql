-- Transport jobs become property requests: a seeker posts what they are
-- looking for, and owners and agents answer it.

delete from transport_jobs;

alter table transport_jobs rename to property_requests;
alter index transport_jobs_seq_idx rename to property_requests_seq_idx;
alter index transport_jobs_moderation_status_idx
  rename to property_requests_moderation_status_idx;
alter index transport_jobs_owner_user_id_idx
  rename to property_requests_owner_user_id_idx;

alter table property_requests
  drop column item,
  drop column from_location,
  drop column to_location,
  drop column distance_km,
  drop column weight,
  drop column desired_date,
  drop column reward,
  add column title text not null,
  add column deal text not null,
  add column category text not null,
  add column layout text,
  add column prefecture text not null,
  add column city text not null,
  add column budget integer not null,
  add column move_in_date text not null;

create index property_requests_category_idx on property_requests (category);
